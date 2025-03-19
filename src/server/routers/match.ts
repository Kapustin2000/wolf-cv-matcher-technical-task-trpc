import { baseProcedure, router } from '../trpc.js';
import {v4 as uuidv4} from 'uuid';
import FileService from '../services/FileService.js';
import { zfd } from 'zod-form-data';
import PDFService from '../services/PDFService.js';
import MatcherService from '../services/MatcherService.js';

export const matchRouter = router({
    upload: baseProcedure.input(zfd.formData({
      vacancyPdf: zfd.file().refine((file) => file.type === "application/pdf", {
        message: "Only PDF files are allowed",
      }),
      cvPdf: zfd.file().refine((file) => file.type === "application/pdf", {
        message: "Only PDF files are allowed",
      }),
    })).mutation(async ({ input }) => {
  
      const matchRequestId = uuidv4();

       // Upload files concurrently
      const [uploadedCV, uploadedVacancy] = await Promise.all([
        FileService.upload(input.cvPdf, `cv.pdf`, matchRequestId),
        FileService.upload(input.vacancyPdf, `vacancy.pdf`, matchRequestId),
      ]);

      const [cvText, vacancyText] = await Promise.all([
        PDFService.extractText(uploadedCV.path),
        PDFService.extractText(uploadedVacancy.path),
      ]);

      return await MatcherService.match(
        cvText,
        vacancyText
      );
    })
  });