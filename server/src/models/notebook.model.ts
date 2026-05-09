import mongoose, { Schema, Document } from 'mongoose';

export type NotebookKind = 'pattern' | 'sample' | 'stat' | 'match' | 'rectify' | 'freeform';

export interface INotebookEntry {
  kind: NotebookKind;
  title: string;
  body: string;
  payload?: any;
  tags: string[];
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotebookEntryDoc extends INotebookEntry, Document {}

const NotebookEntrySchema = new Schema<INotebookEntryDoc>({
  kind: { type: String, required: true, index: true },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  payload: Schema.Types.Mixed,
  tags: { type: [String], default: [] },
  pinned: { type: Boolean, default: false, index: true },
}, { timestamps: true });

export const NotebookEntry = mongoose.model<INotebookEntryDoc>('NotebookEntry', NotebookEntrySchema);
