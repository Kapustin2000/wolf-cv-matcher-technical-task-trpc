import { baseProcedure, router } from '../trpc.js';
import {v4 as uuidv4} from 'uuid';
import { matchQueue, startWorkers } from '../lib/queue.js';
import File from '../classes/File.js';
import { zfd } from 'zod-form-data';

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
    
      for (const [name, file] of Object.entries({ cv: input.vacancyPdf, vacancy: input.cvPdf })) {
        await File.upload(file, `${name}.pdf`, matchRequestId)
      } 
  
      await matchQueue.add('matchQueue', { matchRequestId });
  
      return { success: true, message: 'Files saved successfully! I am running match analyse! Get your analyse later using "matchRequestId".', matchRequestId };
    })
  });