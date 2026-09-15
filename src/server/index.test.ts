import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { startInternalServer } from './index.js';

const SECRET = 'test-secret';
let server: Server | undefined;

function listen(onTrigger: () => Promise<{ sent: number }>): Promise<number> {
  return new Promise((resolve) => {
    const srv = startInternalServer(0, SECRET, onTrigger);
    server = srv;
    srv.on('listening', () => {
      const address = srv.address();
      resolve(typeof address === 'object' && address ? address.port : 0);
    });
  });
}

afterEach(() => {
  server?.close();
  server = undefined;
});

describe('internal weekly-digest endpoint', () => {
  it('rejects requests with no secret header', async () => {
    const onTrigger = vi.fn();
    const port = await listen(onTrigger);

    const res = await fetch(`http://localhost:${port}/weekly-digest`, { method: 'POST' });

    expect(res.status).toBe(401);
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('rejects requests with the wrong secret', async () => {
    const onTrigger = vi.fn();
    const port = await listen(onTrigger);

    const res = await fetch(`http://localhost:${port}/weekly-digest`, {
      method: 'POST',
      headers: { 'x-internal-secret': 'wrong' },
    });

    expect(res.status).toBe(401);
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('triggers the digest and returns the count when the secret matches', async () => {
    const onTrigger = vi.fn().mockResolvedValue({ sent: 4 });
    const port = await listen(onTrigger);

    const res = await fetch(`http://localhost:${port}/weekly-digest`, {
      method: 'POST',
      headers: { 'x-internal-secret': SECRET },
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ sent: 4 });
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('returns 404 for any other route or method', async () => {
    const onTrigger = vi.fn();
    const port = await listen(onTrigger);

    const res = await fetch(`http://localhost:${port}/weekly-digest`, {
      method: 'GET',
      headers: { 'x-internal-secret': SECRET },
    });

    expect(res.status).toBe(404);
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('returns 500 without leaking details when the trigger throws', async () => {
    const onTrigger = vi.fn().mockRejectedValue(new Error('db down'));
    const port = await listen(onTrigger);

    const res = await fetch(`http://localhost:${port}/weekly-digest`, {
      method: 'POST',
      headers: { 'x-internal-secret': SECRET },
    });

    expect(res.status).toBe(500);
    const body = await res.text();
    expect(body).not.toContain('db down');
  });
});
