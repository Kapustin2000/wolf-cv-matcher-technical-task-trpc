import { TRPCError } from '@trpc/server';
import { logger } from '../utils/logger.js';
import { BaseError } from '../utils/errors.js';

export const errorHandler = {
    handleError: (error: unknown) => {
        if (error instanceof BaseError) {
            logger.error('Application error:', {
                code: error.code,
                message: error.message,
                data: error.data,
                stack: error.stack
            });

            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: error.message,
                cause: error
            });
        }

        if (error instanceof TRPCError) {
            logger.error('TRPC error:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
            throw error;
        }

        logger.error('Unexpected error:', {
            error,
            stack: error instanceof Error ? error.stack : undefined
        });

        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
        });
    }
}; 