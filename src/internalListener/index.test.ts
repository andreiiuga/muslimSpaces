import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SECRET = 'test-secret';
const PORT = 8123; // fixed rather than ephemeral: listen() only exposes the InternalListener contract, not the raw Server

// Typed from the module's actual default export, mirroring messenger/index.test.ts.
let internalListener: typeof import('./index.js')['default'];

beforeEach(async () => {
  // Fresh module registry per test so the singleton's registered handler
  // doesn't leak between tests, matching messenger/index.test.ts.
  vi.resetModules();
  ({ default: internalListener } = await import('./index.js'));
});

afterEach(() => {
  internalListener.close();
});

describe('weekly-digest trigger', () => {
  it('rejects requests with no secret header', async () => {
    const onTrigger = vi.fn();
    internalListener.addWeeklyDigestHandler(onTrigger);
    await internalListener.listen(PORT, SECRET);

    const res = await fetch(`http://localhost:${PORT}/weekly-digest`, { method: 'POST' });

    expect(res.status).toBe(401);
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('rejects requests with the wrong secret', async () => {
    const onTrigger = vi.fn();
    internalListener.addWeeklyDigestHandler(onTrigger);
    await internalListener.listen(PORT, SECRET);

    const res = await fetch(`http://localhost:${PORT}/weekly-digest`, {
      method: 'POST',
      headers: { 'x-internal-secret': 'wrong' },
    });

    expect(res.status).toBe(401);
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('triggers the registered handler and returns its count when the secret matches', async () => {
    const onTrigger = vi.fn().mockResolvedValue({ sent: 4 });
    internalListener.addWeeklyDigestHandler(onTrigger);
    await internalListener.listen(PORT, SECRET);

    const res = await fetch(`http://localhost:${PORT}/weekly-digest`, {
      method: 'POST',
      headers: { 'x-internal-secret': SECRET },
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ sent: 4 });
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('returns 503 when no handler has been registered yet', async () => {
    await internalListener.listen(PORT, SECRET);

    const res = await fetch(`http://localhost:${PORT}/weekly-digest`, {
      method: 'POST',
      headers: { 'x-internal-secret': SECRET },
    });

    expect(res.status).toBe(503);
  });

  it('returns 404 for any other route or method', async () => {
    const onTrigger = vi.fn();
    internalListener.addWeeklyDigestHandler(onTrigger);
    await internalListener.listen(PORT, SECRET);

    const res = await fetch(`http://localhost:${PORT}/weekly-digest`, {
      method: 'GET',
      headers: { 'x-internal-secret': SECRET },
    });

    expect(res.status).toBe(404);
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('returns 500 without leaking details when the handler throws', async () => {
    const onTrigger = vi.fn().mockRejectedValue(new Error('db down'));
    internalListener.addWeeklyDigestHandler(onTrigger);
    await internalListener.listen(PORT, SECRET);

    const res = await fetch(`http://localhost:${PORT}/weekly-digest`, {
      method: 'POST',
      headers: { 'x-internal-secret': SECRET },
    });

    expect(res.status).toBe(500);
    const body = await res.text();
    expect(body).not.toContain('db down');
  });
});
