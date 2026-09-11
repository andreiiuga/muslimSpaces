import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MessageSender } from '../messenger/types.js';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    submission: {
      create: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../db.js', () => ({ default: mockPrisma }));

import dispatcher from './index.js';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const sender: MessageSender = { id: '123@s.whatsapp.net', name: 'Amina', phoneNumber: '123' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('salawat submissions', () => {
  it('creates a new user if none exists, records the submission, and returns the running total', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: 1, name: 'Amina', phoneNumber: '123' });
    mockPrisma.submission.aggregate.mockResolvedValue({ _sum: { count: 150 } });

    const response = await dispatcher.processCommand({ type: 'salawat', count: 50 }, sender);

    expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: { phoneNumber: '123', name: 'Amina' } });
    expect(mockPrisma.submission.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ count: 50, authorId: 1 }),
    });
    expect(response).toEqual({
      type: 'salawat',
      user: { id: 1, name: 'Amina', phoneNumber: '123' },
      count: 50,
      total: 150,
      goal: expect.any(Number),
    });
  });

  it('reuses an existing user instead of creating a new one', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 7, name: 'Amina', phoneNumber: '123' });
    mockPrisma.submission.aggregate.mockResolvedValue({ _sum: { count: 20 } });

    await dispatcher.processCommand({ type: 'salawat', count: 20 }, sender);

    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('derives the phone number from the JID when the sender has none directly (e.g. group messages)', async () => {
    const groupSender: MessageSender = { id: '999888777@s.whatsapp.net', name: 'X', phoneNumber: null };
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: 2, name: 'X', phoneNumber: '999888777' });
    mockPrisma.submission.aggregate.mockResolvedValue({ _sum: { count: 5 } });

    await dispatcher.processCommand({ type: 'salawat', count: 5 }, groupSender);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { phoneNumber: '999888777' } });
  });

  it('falls back to the submitted count as total when the DB has no aggregate sum yet', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 7, name: 'Amina', phoneNumber: '123' });
    mockPrisma.submission.aggregate.mockResolvedValue({ _sum: { count: null } });

    const response = await dispatcher.processCommand({ type: 'salawat', count: 20 }, sender);

    expect(response).toMatchObject({ total: 20 });
  });
});

describe('/me', () => {
  it('returns the sender submission history and total', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 7, name: 'Amina', phoneNumber: '123' });
    const submissions = [
      { count: 10, submittedAt: new Date(2026, 0, 1) },
      { count: 5, submittedAt: new Date(2026, 0, 2) },
    ];
    mockPrisma.submission.findMany.mockResolvedValue(submissions);

    const response = await dispatcher.processCommand({ type: 'me' }, sender);

    expect(response).toEqual({
      type: 'me',
      user: { id: 7, name: 'Amina', phoneNumber: '123' },
      submissions,
      total: 15,
    });
  });
});

describe('/stats', () => {
  it('buckets submissions by weekday, summed across all history, in Monday-first order', async () => {
    const dayA = new Date(2026, 8, 7);
    const dayASameDayLater = new Date(dayA.getFullYear(), dayA.getMonth(), dayA.getDate(), 18, 0);
    const dayB = new Date(dayA.getFullYear(), dayA.getMonth(), dayA.getDate() + 2);

    mockPrisma.submission.findMany.mockResolvedValue([
      { count: 10, submittedAt: dayA },
      { count: 5, submittedAt: dayASameDayLater },
      { count: 3, submittedAt: dayB },
    ]);

    const response = await dispatcher.processCommand({ type: 'stats' }, sender);
    if (response.type !== 'stats') throw new Error('expected a stats response');

    expect(response.total).toBe(18);
    expect(response.distribution.map((d) => d.day)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

    const dayALabel = DAY_LABELS[dayA.getDay()]!;
    const dayBLabel = DAY_LABELS[dayB.getDay()]!;
    const byDay = Object.fromEntries(response.distribution.map((d) => [d.day, d.count]));

    expect(byDay[dayALabel]).toBe(15);
    expect(byDay[dayBLabel]).toBe(3);
    const remaining = response.distribution.filter((d) => d.day !== dayALabel && d.day !== dayBLabel);
    expect(remaining.every((d) => d.count === 0)).toBe(true);
  });

  it('returns a zeroed distribution when there are no submissions', async () => {
    mockPrisma.submission.findMany.mockResolvedValue([]);

    const response = await dispatcher.processCommand({ type: 'stats' }, sender);
    if (response.type !== 'stats') throw new Error('expected a stats response');

    expect(response.total).toBe(0);
    expect(response.distribution).toHaveLength(7);
    expect(response.distribution.every((d) => d.count === 0)).toBe(true);
  });
});

describe('/help', () => {
  it('returns the configured goal without touching the DB', async () => {
    const response = await dispatcher.processCommand({ type: 'help' }, sender);

    expect(response.type).toBe('help');
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.submission.findMany).not.toHaveBeenCalled();
  });
});

describe('/awlia', () => {
  it('returns everyone who has submitted at least once', async () => {
    const users = [
      { name: 'Amina', phoneNumber: '111' },
      { name: null, phoneNumber: '222' },
      { name: 'Yusuf', phoneNumber: '333' },
    ];
    mockPrisma.user.findMany.mockResolvedValue(users);

    const response = await dispatcher.processCommand({ type: 'awlia' }, sender);
    if (response.type !== 'awlia') throw new Error('expected an awlia response');

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
      where: { submissions: { some: {} } },
      select: { name: true, phoneNumber: true },
    });
    expect(response.users).toHaveLength(users.length);
    expect(response.users).toEqual(expect.arrayContaining(users));
  });

  it('returns an empty list when nobody has submitted yet', async () => {
    mockPrisma.user.findMany.mockResolvedValue([]);

    const response = await dispatcher.processCommand({ type: 'awlia' }, sender);
    if (response.type !== 'awlia') throw new Error('expected an awlia response');

    expect(response.users).toEqual([]);
  });

  it('shuffles the roster instead of returning it in DB order', async () => {
    const users = [
      { name: 'A', phoneNumber: '1' },
      { name: 'B', phoneNumber: '2' },
      { name: 'C', phoneNumber: '3' },
    ];
    mockPrisma.user.findMany.mockResolvedValue(users);
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    try {
      const response = await dispatcher.processCommand({ type: 'awlia' }, sender);
      if (response.type !== 'awlia') throw new Error('expected an awlia response');

      // With Math.random pinned to 0, Fisher-Yates on [A,B,C] deterministically yields [B,C,A].
      expect(response.users).toEqual([users[1], users[2], users[0]]);
    } finally {
      randomSpy.mockRestore();
    }
  });
});
