/**
 * This a minimal tRPC server
 */
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { zfd } from 'zod-form-data';
import { publicProcedure, router } from './trpc.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {v4 as uuidv4} from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appRouter = router({
  match: publicProcedure.input(zfd.formData({
    vacancyPdf: zfd.file().refine((file) => file.type === "application/pdf", {
      message: "Only PDF files are allowed",
    }),
    cvPdf: zfd.file().refine((file) => file.type === "application/pdf", {
      message: "Only PDF files are allowed",
    }),
  })).mutation(async ({ input }) => {

    const matchRequestId = uuidv4();

    const uploadDir = path.join(__dirname, 'uploads', matchRequestId);
  
    fs.mkdirSync(uploadDir, { recursive: true });
  
    for (const [name, file] of Object.entries({ cv: input.vacancyPdf, vacancy: input.cvPdf })) {
      const stream = fs.createWriteStream(path.join(uploadDir, `${name}.pdf`));
      stream.write(Buffer.from(await file.arrayBuffer()));
      stream.end();
    }  

    return { success: true, message: 'Files saved successfully! I am running match analyse! Get your analyse later using "matchRequestId".', matchRequestId };
  })
});

// Export type router type signature, this is used by the client.
export type AppRouter = typeof appRouter;

const server = createHTTPServer({
  router: appRouter,
});

server.listen(3000);
