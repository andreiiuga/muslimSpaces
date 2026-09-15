import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, Server } from 'node:http';

/**
 * Internal-only HTTP endpoint. Not meant to be reachable from the public
 * internet - deploy it so only Railway's private network (or localhost) can
 * reach the port, and always set INTERNAL_API_SECRET as a second layer of
 * defense. A separate, one-shot cron job calls POST /weekly-digest on a
 * schedule; this process itself never schedules anything.
 */

function isAuthorized(req: IncomingMessage, secret: string): boolean {
  const provided = req.headers['x-internal-secret'];
  if (typeof provided !== 'string' || !provided) return false;

  const providedBuf = Buffer.from(provided);
  const secretBuf = Buffer.from(secret);
  if (providedBuf.length !== secretBuf.length) return false;
  return timingSafeEqual(providedBuf, secretBuf);
}

/**
 * Starts the internal trigger server. `onWeeklyDigestTrigger` fans the
 * weekly digest out to every eligible subscriber and resolves with how many
 * were sent.
 */
export function startInternalServer(
  port: number,
  secret: string,
  onWeeklyDigestTrigger: () => Promise<{ sent: number }>
): Server {
  const server = createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/weekly-digest') {
      res.writeHead(404).end();
      return;
    }

    if (!isAuthorized(req, secret)) {
      res.writeHead(401).end();
      return;
    }

    try {
      const result = await onWeeklyDigestTrigger();
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(result));
    } catch (err) {
      console.error('weekly-digest trigger failed:', err instanceof Error ? err.message : err);
      res.writeHead(500).end();
    }
  });

  server.listen(port, () => {
    console.log(`Internal server listening on port ${port} (POST /weekly-digest)`);
  });

  return server;
}
