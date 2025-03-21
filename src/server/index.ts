/**
 * This a minimal tRPC server
 */
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { router } from './trpc.js';
import { matchRouter } from './routers/match.js';
import { config } from './config/index.js';

export const appRouter = router({
  match: matchRouter,
});

// Export type router type signature, this is used by the client.
export type AppRouter = typeof appRouter;

const server = createHTTPServer({
  router: appRouter,
});

server.listen(config.PORT);