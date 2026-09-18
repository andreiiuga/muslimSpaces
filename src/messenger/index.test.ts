import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IncomingMessage } from './types.js';

const { mockOn, mockSendMessage, mockEnd, mockMakeWASocket, mockUseMultiFileAuthState, mockQrGenerate, mockRm } =
  vi.hoisted(() => ({
    mockOn: vi.fn(),
    mockSendMessage: vi.fn(),
    mockEnd: vi.fn(),
    mockMakeWASocket: vi.fn(),
    mockUseMultiFileAuthState: vi.fn(),
    mockQrGenerate: vi.fn(),
    mockRm: vi.fn(),
  }));

vi.mock('@whiskeysockets/baileys', () => ({
  default: mockMakeWASocket,
  useMultiFileAuthState: mockUseMultiFileAuthState,
  DisconnectReason: { loggedOut: 401 },
}));

vi.mock('pino', () => ({ default: vi.fn(() => ({})) }));

vi.mock('qrcode-terminal', () => ({ default: { generate: mockQrGenerate } }));

vi.mock('node:fs/promises', () => ({ rm: mockRm }));

type RawMessageOverrides = Partial<{
  remoteJid: string;
  participant: string | null;
  id: string;
  fromMe: boolean;
  pushName: string | null;
  text: string | null;
  timestampSeconds: number;
}>;

function buildRawMessage(overrides: RawMessageOverrides = {}) {
  const {
    remoteJid = 'group123@g.us',
    participant = 'sender1@s.whatsapp.net',
    id = 'MSG1',
    fromMe = false,
    pushName = 'Amina',
    text = 'hello',
    timestampSeconds = 1_700_000_000,
  } = overrides;

  return {
    key: { remoteJid, participant, id, fromMe },
    pushName,
    message: text === null ? undefined : { conversation: text },
    messageTimestamp: timestampSeconds,
  };
}

// Grabs the callback BaileysMessenger registered for a given Baileys event via socket.ev.on(...).
function getHandler(eventName: string): (...args: any[]) => unknown {
  const call = mockOn.mock.calls.find(([name]) => name === eventName);
  if (!call) throw new Error(`no handler registered for "${eventName}"`);
  return call[1];
}

async function flushMicrotasks(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

// Typed from the module's actual default export (not the `Messenger` interface):
// the interface's `connect` only declares `string`, but the concrete
// implementation (and its real caller in src/index.ts) accepts `string | null`.
let messenger: typeof import('./index.js')['default'];

beforeEach(async () => {
  vi.clearAllMocks();
  mockMakeWASocket.mockReturnValue({ ev: { on: mockOn }, sendMessage: mockSendMessage, end: mockEnd });
  mockUseMultiFileAuthState.mockResolvedValue({ state: {}, saveCreds: vi.fn() });
  mockSendMessage.mockResolvedValue(undefined);
  mockRm.mockResolvedValue(undefined);
  delete process.env.RESET_AUTH;

  // Fresh module registry per test so the BaileysMessenger singleton (and its
  // handler arrays) don't leak state between tests.
  vi.resetModules();
  ({ default: messenger } = await import('./index.js'));
});

describe('connect', () => {
  it('registers a handler for every Baileys event the messenger relies on', async () => {
    await messenger.connect('group123@g.us');

    const registered = mockOn.mock.calls.map(([name]) => name);
    expect(registered).toEqual(
      expect.arrayContaining(['creds.update', 'connection.update', 'messages.upsert', 'group-participants.update']),
    );
  });

  it('displays a QR code when Baileys emits one', async () => {
    await messenger.connect('group123@g.us');
    getHandler('connection.update')({ qr: 'qr-data' });

    expect(mockQrGenerate).toHaveBeenCalledWith('qr-data', { small: true });
  });

  it('reconnects after an unexpected disconnect', async () => {
    await messenger.connect('group123@g.us');
    expect(mockMakeWASocket).toHaveBeenCalledTimes(1);

    getHandler('connection.update')({
      connection: 'close',
      lastDisconnect: { error: { output: { statusCode: 500 } } },
    });
    await flushMicrotasks();

    expect(mockMakeWASocket).toHaveBeenCalledTimes(2);
  });

  it('does not reconnect after being logged out', async () => {
    await messenger.connect('group123@g.us');
    expect(mockMakeWASocket).toHaveBeenCalledTimes(1);

    getHandler('connection.update')({
      connection: 'close',
      lastDisconnect: { error: { output: { statusCode: 401 } } },
    });
    await flushMicrotasks();

    expect(mockMakeWASocket).toHaveBeenCalledTimes(1);
  });
});

describe('RESET_AUTH', () => {
  it('clears the auth directory before connecting when RESET_AUTH=true', async () => {
    process.env.RESET_AUTH = 'true';

    await messenger.connect('group123@g.us');

    expect(mockRm).toHaveBeenCalledWith(expect.stringContaining('auth'), { recursive: true, force: true });
    expect(mockUseMultiFileAuthState).toHaveBeenCalled();
  });

  it('does not clear the auth directory when RESET_AUTH is unset', async () => {
    await messenger.connect('group123@g.us');

    expect(mockRm).not.toHaveBeenCalled();
  });

  it('only clears once per process, not on every reconnect', async () => {
    process.env.RESET_AUTH = 'true';
    await messenger.connect('group123@g.us');
    expect(mockRm).toHaveBeenCalledTimes(1);

    getHandler('connection.update')({
      connection: 'close',
      lastDisconnect: { error: { output: { statusCode: 500 } } },
    });
    await flushMicrotasks();

    expect(mockRm).toHaveBeenCalledTimes(1);
  });
});

describe('disconnect', () => {
  it('ends the underlying socket', async () => {
    await messenger.connect('group123@g.us');
    messenger.disconnect();

    expect(mockEnd).toHaveBeenCalledWith(undefined);
  });

  it('is a no-op when never connected', () => {
    expect(() => messenger.disconnect()).not.toThrow();
  });
});

describe('sendMessage', () => {
  it('throws if the messenger has not connected yet', async () => {
    await expect(messenger.sendMessage({ chatId: 'group123@g.us', text: 'hi' })).rejects.toThrow(
      'Messenger not connected',
    );
  });

  it('throws if no group was set on connect', async () => {
    await messenger.connect(null);

    await expect(messenger.sendMessage({ chatId: 'group123@g.us', text: 'hi' })).rejects.toThrow('Group Id not set');
  });

  it('forwards the text to the underlying socket', async () => {
    await messenger.connect('group123@g.us');
    await messenger.sendMessage({ chatId: 'group123@g.us', text: 'hi there' });

    expect(mockSendMessage).toHaveBeenCalledWith('group123@g.us', { text: 'hi there' });
  });
});

describe('incoming messages (messages.upsert)', () => {
  it('normalizes and forwards a group text message matching the restricted group', async () => {
    await messenger.connect('group123@g.us');
    const handler = vi.fn();
    messenger.addMessageHandler(handler);

    getHandler('messages.upsert')({ type: 'notify', messages: [buildRawMessage()] });
    await flushMicrotasks();

    expect(handler).toHaveBeenCalledTimes(1);
    const message: IncomingMessage = handler.mock.calls[0]![0];
    expect(message).toMatchObject({
      id: 'MSG1',
      chatId: 'group123@g.us',
      text: 'hello',
      isGroup: true,
      sender: { id: 'sender1@s.whatsapp.net', name: 'Amina', phoneNumber: null },
    });
    expect(message.timestamp).toEqual(new Date(1_700_000_000 * 1000));
  });

  it('ignores messages from a different chat when a group is restricted', async () => {
    await messenger.connect('group123@g.us');
    const handler = vi.fn();
    messenger.addMessageHandler(handler);

    getHandler('messages.upsert')({ type: 'notify', messages: [buildRawMessage({ remoteJid: 'other-group@g.us' })] });
    await flushMicrotasks();

    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores non-"notify" upsert batches (e.g. history sync)', async () => {
    await messenger.connect('group123@g.us');
    const handler = vi.fn();
    messenger.addMessageHandler(handler);

    getHandler('messages.upsert')({ type: 'append', messages: [buildRawMessage()] });
    await flushMicrotasks();

    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores messages sent by the bot itself', async () => {
    await messenger.connect('group123@g.us');
    const handler = vi.fn();
    messenger.addMessageHandler(handler);

    getHandler('messages.upsert')({ type: 'notify', messages: [buildRawMessage({ fromMe: true })] });
    await flushMicrotasks();

    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores media-only messages with no extractable text', async () => {
    await messenger.connect('group123@g.us');
    const handler = vi.fn();
    messenger.addMessageHandler(handler);

    getHandler('messages.upsert')({ type: 'notify', messages: [buildRawMessage({ text: null })] });
    await flushMicrotasks();

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not process messages at all when no group is restricted', async () => {
    await messenger.connect(null);
    const handler = vi.fn();
    messenger.addMessageHandler(handler);

    getHandler('messages.upsert')({ type: 'notify', messages: [buildRawMessage()] });
    await flushMicrotasks();

    expect(handler).not.toHaveBeenCalled();
  });

  it('resolves the sender directly from the chat JID for a direct (non-group) chat', async () => {
    // The restriction check only compares chatId, so pointing it at a DM JID
    // exercises the non-group branch of normalize() through the real event path.
    await messenger.connect('447000000000@s.whatsapp.net');
    const handler = vi.fn();
    messenger.addMessageHandler(handler);

    getHandler('messages.upsert')({
      type: 'notify',
      messages: [buildRawMessage({ remoteJid: '447000000000@s.whatsapp.net', participant: null })],
    });
    await flushMicrotasks();

    expect(handler).toHaveBeenCalledTimes(1);
    const message: IncomingMessage = handler.mock.calls[0]![0];
    expect(message.isGroup).toBe(false);
    expect(message.sender).toEqual({
      id: '447000000000@s.whatsapp.net',
      name: 'Amina',
      phoneNumber: '447000000000',
    });
  });
});

describe('group joins (group-participants.update)', () => {
  it('notifies join handlers when members are added to the restricted group', async () => {
    await messenger.connect('group123@g.us');
    const handler = vi.fn();
    messenger.addGroupJoinHandler(handler);

    getHandler('group-participants.update')({
      id: 'group123@g.us',
      author: 'admin@s.whatsapp.net',
      participants: ['new1@s.whatsapp.net', 'new2@s.whatsapp.net'],
      action: 'add',
    });
    await flushMicrotasks();

    expect(handler).toHaveBeenCalledWith('group123@g.us', ['new1@s.whatsapp.net', 'new2@s.whatsapp.net']);
  });

  it('ignores non-"add" actions (remove/promote/demote)', async () => {
    await messenger.connect('group123@g.us');
    const handler = vi.fn();
    messenger.addGroupJoinHandler(handler);

    getHandler('group-participants.update')({
      id: 'group123@g.us',
      author: 'admin@s.whatsapp.net',
      participants: ['x@s.whatsapp.net'],
      action: 'remove',
    });
    await flushMicrotasks();

    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores joins in a different group when a group is restricted', async () => {
    await messenger.connect('group123@g.us');
    const handler = vi.fn();
    messenger.addGroupJoinHandler(handler);

    getHandler('group-participants.update')({
      id: 'other-group@g.us',
      author: 'admin@s.whatsapp.net',
      participants: ['x@s.whatsapp.net'],
      action: 'add',
    });
    await flushMicrotasks();

    expect(handler).not.toHaveBeenCalled();
  });

  it('still notifies join handlers when no group is restricted', async () => {
    await messenger.connect(null);
    const handler = vi.fn();
    messenger.addGroupJoinHandler(handler);

    getHandler('group-participants.update')({
      id: 'any-group@g.us',
      author: 'admin@s.whatsapp.net',
      participants: ['x@s.whatsapp.net'],
      action: 'add',
    });
    await flushMicrotasks();

    expect(handler).toHaveBeenCalledWith('any-group@g.us', ['x@s.whatsapp.net']);
  });
});
