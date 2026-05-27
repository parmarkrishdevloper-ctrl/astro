// Mongoose-style compatibility layer over sql.js so the rest of the codebase
// (routes/services) can keep using `Model.find().sort().lean()`,
// `Model.findById(id).lean()`, etc. without rewriting every call site.
//
// Each Repo binds to a single table and a row<->doc serialisation pair.
// Top-level field columns + JSON blob columns let us store nested arrays
// (e.g. chart.lifeEvents) inside a single row without losing query-ability
// on top-level fields.

import { randomUUID } from 'node:crypto';
import { all, get, run } from './sqlite';

export interface RepoOpts<TDoc, TRow> {
  table: string;
  /** Convert a SQL row → public Doc (parse JSON, coerce booleans, etc.). */
  rowToDoc: (row: TRow) => TDoc;
  /** Convert a public Doc → SQL row (stringify JSON, coerce booleans). */
  docToRow: (doc: any) => Record<string, any>;
  /** Default fields applied on insert (schema defaults). */
  defaults?: Partial<any>;
}

/** Awaitable, mongoose-flavoured query builder for `find`. */
class FindQuery<T> implements PromiseLike<T[]> {
  private _sort: string | null = null;
  private _limit: number | null = null;
  private _lean = false;
  constructor(
    private table: string,
    private where: string,
    private params: any[],
    private rowToDoc: (r: any) => T,
  ) {}
  sort(spec: Record<string, 1 | -1 | 'asc' | 'desc'>): this {
    const parts: string[] = [];
    for (const [field, dir] of Object.entries(spec)) {
      const col = camelToSnake(field);
      const ord = dir === 1 || dir === 'asc' ? 'ASC' : 'DESC';
      parts.push(`${col} ${ord}`);
    }
    this._sort = parts.join(', ');
    return this;
  }
  limit(n: number): this { this._limit = n; return this; }
  lean(): this { this._lean = true; return this; }
  async exec(): Promise<T[]> {
    let sql = `SELECT * FROM ${this.table} ${this.where ? 'WHERE ' + this.where : ''}`;
    if (this._sort)  sql += ` ORDER BY ${this._sort}`;
    if (this._limit) sql += ` LIMIT ${this._limit}`;
    const rows = all<any>(sql, this.params);
    return rows.map(this.rowToDoc);
  }
  then<R1 = T[], R2 = never>(
    onFulfilled?: ((v: T[]) => R1 | PromiseLike<R1>) | null,
    onRejected?: ((r: any) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.exec().then(onFulfilled, onRejected) as PromiseLike<R1 | R2>;
  }
}

class FindByIdQuery<T> implements PromiseLike<T | null> {
  private _lean = false;
  constructor(private table: string, private id: string, private rowToDoc: (r: any) => T) {}
  lean(): this { this._lean = true; return this; }
  async exec(): Promise<T | null> {
    const row = get<any>(`SELECT * FROM ${this.table} WHERE _id = ?`, [this.id]);
    return row ? this.rowToDoc(row) : null;
  }
  then<R1 = T | null, R2 = never>(
    onFulfilled?: ((v: T | null) => R1 | PromiseLike<R1>) | null,
    onRejected?: ((r: any) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.exec().then(onFulfilled, onRejected) as PromiseLike<R1 | R2>;
  }
}

/** A Mongoose-flavoured Repo bound to one table. */
export class Repo<TDoc> {
  constructor(private opts: RepoOpts<TDoc, any>) {}

  // Mongo: Model.create(doc) — returns the saved doc. Auto-fills _id + ts.
  async create(input: any): Promise<TDoc> {
    const now = new Date().toISOString();
    const doc = {
      _id: input._id || randomUUID(),
      ...this.opts.defaults,
      ...input,
      createdAt: input.createdAt ?? now,
      updatedAt: now,
    };
    const row = this.opts.docToRow(doc);
    const cols = Object.keys(row);
    const placeholders = cols.map(() => '?').join(', ');
    run(`INSERT INTO ${this.opts.table} (${cols.join(', ')}) VALUES (${placeholders})`,
      cols.map((c) => row[c]));
    return this.opts.rowToDoc(row);
  }

  find(filter: Record<string, any> = {}): FindQuery<TDoc> {
    const { where, params } = whereFromFilter(filter);
    return new FindQuery<TDoc>(this.opts.table, where, params, this.opts.rowToDoc);
  }

  findOne(filter: Record<string, any> = {}): FindByIdQuery<TDoc> {
    // Reuse FindByIdQuery for single-row return; build SQL inline.
    const { where, params } = whereFromFilter(filter);
    const q = new FindByIdQuery<TDoc>(this.opts.table, '', this.opts.rowToDoc);
    (q as any).exec = async () => {
      const row = get<any>(
        `SELECT * FROM ${this.opts.table} ${where ? 'WHERE ' + where : ''} LIMIT 1`,
        params,
      );
      return row ? this.opts.rowToDoc(row) : null;
    };
    return q;
  }

  findById(id: string): FindByIdQuery<TDoc> {
    return new FindByIdQuery<TDoc>(this.opts.table, id, this.opts.rowToDoc);
  }

  /** Mongo: Model.findByIdAndUpdate(id, $set or patch, { new: true }). */
  async findByIdAndUpdate(
    id: string,
    update: Record<string, any>,
    _opts?: { new?: boolean },
  ): Promise<TDoc | null> {
    const patch = unwrapMongoPatch(update);
    const existing = get<any>(`SELECT * FROM ${this.opts.table} WHERE _id = ?`, [id]);
    if (!existing) return null;
    const merged = { ...this.opts.rowToDoc(existing), ...patch, updatedAt: new Date().toISOString() };
    const row = this.opts.docToRow(merged);
    const sets = Object.keys(row).filter((c) => c !== '_id').map((c) => `${c} = ?`).join(', ');
    const params = Object.keys(row).filter((c) => c !== '_id').map((c) => row[c]);
    run(`UPDATE ${this.opts.table} SET ${sets} WHERE _id = ?`, [...params, id]);
    return this.opts.rowToDoc(row);
  }

  async findByIdAndDelete(id: string): Promise<TDoc | null> {
    const existing = get<any>(`SELECT * FROM ${this.opts.table} WHERE _id = ?`, [id]);
    if (!existing) return null;
    run(`DELETE FROM ${this.opts.table} WHERE _id = ?`, [id]);
    return this.opts.rowToDoc(existing);
  }

  async deleteMany(filter: Record<string, any> = {}): Promise<{ deletedCount: number }> {
    const { where, params } = whereFromFilter(filter);
    // sql.js doesn't expose a row-count easily; do a SELECT first.
    const before = get<any>(
      `SELECT COUNT(*) AS n FROM ${this.opts.table} ${where ? 'WHERE ' + where : ''}`,
      params,
    );
    run(`DELETE FROM ${this.opts.table} ${where ? 'WHERE ' + where : ''}`, params);
    return { deletedCount: Number(before?.n ?? 0) };
  }

  /** Update by raw row (used for "save" pattern after mutating sub-docs). */
  async saveDoc(doc: any): Promise<TDoc> {
    const merged = { ...doc, updatedAt: new Date().toISOString() };
    const row = this.opts.docToRow(merged);
    const cols = Object.keys(row).filter((c) => c !== '_id');
    const sets = cols.map((c) => `${c} = ?`).join(', ');
    const params = cols.map((c) => row[c]);
    run(`UPDATE ${this.opts.table} SET ${sets} WHERE _id = ?`, [...params, doc._id]);
    return this.opts.rowToDoc(row);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/** camelCase → snake_case. Used to map Mongoose-style field names → SQL columns. */
export function camelToSnake(s: string): string {
  return s.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/** snake_case → camelCase (for converting query results back to JS-style). */
export function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/** Build a parameterised WHERE clause from a Mongo-style filter. */
export function whereFromFilter(f: Record<string, any>): { where: string; params: any[] } {
  const parts: string[] = [];
  const params: any[] = [];
  for (const [k, v] of Object.entries(f)) {
    const col = camelToSnake(k);
    if (v == null) continue;
    if (Array.isArray(v)) {
      const ph = v.map(() => '?').join(', ');
      parts.push(`${col} IN (${ph})`);
      params.push(...v);
    } else if (typeof v === 'object' && '$in' in v) {
      const arr = (v as any).$in as any[];
      const ph = arr.map(() => '?').join(', ');
      parts.push(`${col} IN (${ph})`);
      params.push(...arr);
    } else {
      parts.push(`${col} = ?`);
      params.push(typeof v === 'boolean' ? (v ? 1 : 0) : v);
    }
  }
  return { where: parts.join(' AND '), params };
}

/** Unwrap `{ $set: {...} }` into the inner object; pass through plain objects. */
export function unwrapMongoPatch(p: Record<string, any>): Record<string, any> {
  if (p && typeof p === 'object' && '$set' in p) return (p as any).$set;
  return p;
}
