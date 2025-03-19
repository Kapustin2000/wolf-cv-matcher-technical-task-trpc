import { initTRPC } from '@trpc/server';
import { transformer } from '../shared/transformer.js';
import { errorHandler } from './middleware/errorHandler.js';

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.create({
  transformer,
  errorFormatter(opts) {
    const { shape, error } = opts;
    errorHandler.handleError(error);
    return shape;
  },
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const baseProcedure = t.procedure;