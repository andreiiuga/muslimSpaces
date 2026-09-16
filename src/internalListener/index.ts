import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, Server } from 'node:http';
import type { InternalListener, WeeklyDigestHandler } from './types.js';

function isAuthorized(req: IncomingMessage, secret: string): boolean {
  const provided = req.headers['x-internal-secret'];
  if (typeof provided !== 'string' || !provided) return false;

  const providedBuf = Buffer.from(provided);
  const secretBuf = Buffer.from(secret);
  if (providedBuf.length !== secretBuf.length) return false;
  return timingSafeEqual(providedBuf, secretBuf);
}

/**
 * HTTP-backed InternalListener implementation. Not meant to be reachable
 * from the public internet - deploy it so only Railway's private network
 * (or localhost) can reach the port; the shared secret is a second layer of
 * defense on top of that.
 */
class HttpInternalListener implements InternalListener {
  private server: Server | null = null;
  private weeklyDigestHandler: WeeklyDigestHandler | null = null;

  listen(port: number, secret: string): Promise<void> {
    const server = createServer(async (req, res) => {
      if (req.method !== 'POST' || req.url !== '/weekly-digest') {
        res.writeHead(404).end();
        return;
      }

      if (!isAuthorized(req, secret)) {
        res.writeHead(401).end();
        return;
      }

      if (!this.weeklyDigestHandler) {
        res.writeHead(503).end();
        return;
      }

      try {
        const result = await this.weeklyDigestHandler();
        res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(result));
      } catch (err) {
        console.error('weekly-digest trigger failed:', err instanceof Error ? err.message : err);
        res.writeHead(500).end();
      }
    });

    this.server = server;
    return new Promise((resolve) => {
      server.listen(port, () => {
        console.log(`Internal listener on port ${port} (POST /weekly-digest)`);
        resolve();
      });
    });
  }

  close(): void {
    this.server?.close();
  }

  addWeeklyDigestHandler(handler: WeeklyDigestHandler): void {
    this.weeklyDigestHandler = handler;
  }
}

const internalListener = new HttpInternalListener();
export default internalListener;
