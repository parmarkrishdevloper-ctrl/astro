import { NextFunction, Request, Response } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[error]', err);
  res.status(500).json({
    ok: false,
    error: err.message ?? 'Internal Server Error',
  });
}
