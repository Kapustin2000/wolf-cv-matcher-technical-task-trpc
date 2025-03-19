import { baseProcedure, router } from '../trpc.js';
import {v4 as uuidv4} from 'uuid';
import File from '../classes/File.js';
import { zfd } from 'zod-form-data';
import PDF from '../classes/PDF.js';
import Matcher from '../classes/Matcher.js';

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
          File.upload(input.cvPdf, `cv.pdf`, matchRequestId),
          File.upload(input.vacancyPdf, `vacancy.pdf`, matchRequestId),
       ]);

      const [cvText, vacancyText] = await Promise.all([
          PDF.extractText(uploadedCV.path),
          PDF.extractText(uploadedVacancy.path),
      ]);

      return await Matcher.match(
        cvText,
        vacancyText
      );
    })
  });