import { baseProcedure, router } from '../trpc.js';
import {v4 as uuidv4} from 'uuid';
import FileService from '../services/FileService.js';
import { zfd } from 'zod-form-data';
import PDFService from '../services/PDFService.js';
import MatcherService from '../services/MatcherService.js';
import { Media } from '../interfaces/Media.js';
import { logger } from '../utils/logger.js';
import { TRPCError } from '@trpc/server';
import { RateLimiterError } from '../services/RateLimiter.js';

export const matchRouter = router({
    analyzePdfs: baseProcedure.input(zfd.formData({
      vacancyPdf: zfd.file().refine((file) => file.type === "application/pdf", {
        message: "Only PDF files are allowed",
      }),
      cvPdf: zfd.file().refine((file) => file.type === "application/pdf", {
        message: "Only PDF files are allowed",
      }),
    })).mutation(async ({ input }) => {
  
      const matchRequestId = uuidv4();
      let uploadedFiles: Media[] = [];

      try {
        logger.info('Starting match request', { matchRequestId });

        // Upload files concurrently
        uploadedFiles = await Promise.all([
          FileService.upload(input.cvPdf, `cv.pdf`, matchRequestId),
          FileService.upload(input.vacancyPdf, `vacancy.pdf`, matchRequestId),
        ]);

        const [cvText, vacancyText] = await Promise.all([
          PDFService.extractText(uploadedFiles[0].path),
          PDFService.extractText(uploadedFiles[1].path),
        ]);

        const result = await MatcherService.match(
          cvText,
          vacancyText
        );

        logger.info('Match request completed successfully', { matchRequestId });

        return {
          success: true,
          matchRequestId,
          result
        };
      } catch (error) {
        logger.error('Match request failed', {
          matchRequestId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Cleanup uploaded files
        await Promise.all(
          uploadedFiles.map(file => FileService.cleanup(file.path))
        );

        // Handle rate limit errors specifically
        if (error instanceof RateLimiterError) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: error.message
          });
        }

        throw error;
      } finally {
        // Cleanup files regardless of success or failure
        try {
          await Promise.all(
            uploadedFiles.map(file => FileService.cleanup(file.path))
          );
          logger.info('Cleanup completed', { matchRequestId });
        } catch (error) {
          logger.error('Cleanup failed', {
            matchRequestId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    })
  });