import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SECRET = 'test-secret';
const PORT = 8123; // fixed rather than ephemeral: listen() only exposes the InternalListener contract, not the raw Server

const flushMicrotasks = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

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

  it('triggers the registered handler and acknowledges with 202 immediately, without waiting for it to finish', async () => {
    let resolveHandler!: () => void;
    const handlerDone = new Promise<void>((resolve) => {
      resolveHandler = resolve;
    });
    const onTrigger = vi.fn().mockImplementation(() => handlerDone.then(() => ({ sent: 4 })));
    internalListener.addWeeklyDigestHandler(onTrigger);
    await internalListener.listen(PORT, SECRET);

    const res = await fetch(`http://localhost:${PORT}/weekly-digest`, {
      method: 'POST',
      headers: { 'x-internal-secret': SECRET },
    });

    // The response already arrived even though the handler's own promise is
    // still pending - proves it's not awaited before acknowledging.
    expect(res.status).toBe(202);
    await expect(res.json()).resolves.toEqual({ accepted: true });
    expect(onTrigger).toHaveBeenCalledTimes(1);

    resolveHandler();
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

  it('still acknowledges with 202 and logs (rather than crashing) when the handler rejects', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onTrigger = vi.fn().mockRejectedValue(new Error('db down'));
    internalListener.addWeeklyDigestHandler(onTrigger);
    await internalListener.listen(PORT, SECRET);

    const res = await fetch(`http://localhost:${PORT}/weekly-digest`, {
      method: 'POST',
      headers: { 'x-internal-secret': SECRET },
    });

    expect(res.status).toBe(202);
    await flushMicrotasks();

    expect(consoleErrorSpy).toHaveBeenCalledWith('weekly-digest trigger failed:', 'db down');
    consoleErrorSpy.mockRestore();
  });
});
