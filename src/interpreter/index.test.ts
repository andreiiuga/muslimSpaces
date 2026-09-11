import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: mockCreate };
  },
}));

import interpreter from './index.js';

function respondWith(json: object): void {
  mockCreate.mockResolvedValue({ content: [{ type: 'text', text: JSON.stringify(json) }] });
}

beforeEach(() => {
  mockCreate.mockReset();
});

describe('fast paths (no API call)', () => {
  it('detects /stats literally', async () => {
    await expect(interpreter.processMessage('/stats')).resolves.toEqual({ type: 'stats' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('detects /me literally', async () => {
    await expect(interpreter.processMessage('/me')).resolves.toEqual({ type: 'me' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('detects /help literally', async () => {
    await expect(interpreter.processMessage('/help')).resolves.toEqual({ type: 'help' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('is case-insensitive for slash commands', async () => {
    await expect(interpreter.processMessage('/STATS')).resolves.toEqual({ type: 'stats' });
  });

  it('extracts a bare number as a salawat count', async () => {
    await expect(interpreter.processMessage('50')).resolves.toEqual({ type: 'salawat', count: 50 });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('extracts a +prefixed number as a salawat count', async () => {
    await expect(interpreter.processMessage('+30')).resolves.toEqual({ type: 'salawat', count: 30 });
  });

  it('returns null for empty/whitespace input without calling the API', async () => {
    await expect(interpreter.processMessage('   ')).resolves.toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('skips the API call entirely for messages with no relevant hint', async () => {
    await expect(interpreter.processMessage('good morning everyone')).resolves.toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe('Claude-classified intents', () => {
  it('classifies natural-language stats requests', async () => {
    respondWith({ intent: 'stats', count: null });
    await expect(interpreter.processMessage("I'd like to see the statistics please")).resolves.toEqual({
      type: 'stats',
    });
  });

  it('classifies natural-language help requests', async () => {
    respondWith({ intent: 'help', count: null });
    await expect(interpreter.processMessage('what commands can I use here?')).resolves.toEqual({ type: 'help' });
  });

  it('classifies natural-language salawat submissions with a count', async () => {
    respondWith({ intent: 'salawat', count: 75 });
    await expect(interpreter.processMessage('sent 75 salawat today, alhamdulillah')).resolves.toEqual({
      type: 'salawat',
      count: 75,
    });
  });

  it('rejects a salawat intent with a non-positive count', async () => {
    respondWith({ intent: 'salawat', count: 0 });
    await expect(interpreter.processMessage('salawat count is zero')).resolves.toBeNull();
  });

  it('returns null for "none" intent', async () => {
    respondWith({ intent: 'none', count: null });
    await expect(interpreter.processMessage('salawat is a beautiful practice')).resolves.toBeNull();
  });

  it('strips markdown code fences from the model response', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '```json\n{"intent":"stats","count":null}\n```' }],
    });
    await expect(interpreter.processMessage('show me the stats graph')).resolves.toEqual({ type: 'stats' });
  });

  it('falls back to regex extraction if the API call throws', async () => {
    mockCreate.mockRejectedValue(new Error('network error'));
    await expect(interpreter.processMessage('did 42 salawat today')).resolves.toEqual({
      type: 'salawat',
      count: 42,
    });
  });

  it('returns null if the API throws and the fallback regex finds nothing', async () => {
    mockCreate.mockRejectedValue(new Error('network error'));
    await expect(interpreter.processMessage('mashaAllah keep up the salawat')).resolves.toBeNull();
  });
});
