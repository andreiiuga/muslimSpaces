import prisma from '../db.js';
import type { Command } from '../interpreter/types.js';
import type { MessageSender } from '../messenger/types.js';
import type { DayCount, DispatcherInterface, DispatchResponse } from './types.js';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const; // index = Date#getDay()
const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const; // Monday-first display order
const DEFAULT_GOAL = parseInt(process.env.SALAWAT_GOAL || '100000', 10);
const SETTINGS_ID = 1; // singleton settings row

function resolvePhoneNumber(sender: MessageSender): string {
  return sender.phoneNumber ?? sender.id.split('@')[0] ?? sender.id;
}

/** Reads the shared goal from the DB, falling back to SALAWAT_GOAL until /update-goal is ever used. */
async function getGoal(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { id: SETTINGS_ID } });
  return setting?.goal ?? DEFAULT_GOAL;
}

/** Fisher-Yates shuffle - returns a new array, doesn't mutate the input. */
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}

/** Buckets every submission ever recorded by day of week (Mon-Sun), summed across all history. */
function buildDistribution(submissions: { count: number; submittedAt: Date }[]): DayCount[] {
  const days: DayCount[] = DAY_ORDER.map((day) => ({ day, count: 0 }));

  for (const submission of submissions) {
    const label = DAY_LABELS[submission.submittedAt.getDay()];
    const bucket = days.find((d) => d.day === label);
    if (bucket) bucket.count += submission.count;
  }

  return days;
}

class Dispatcher implements DispatcherInterface {
  async processCommand(command: Command, sender: MessageSender): Promise<DispatchResponse> {
    switch (command.type) {
      case 'salawat':
        return this.handleSalawat(command.count, sender);
      case 'me':
        return this.handleMe(sender);
      case 'stats':
        return this.handleStats();
      case 'help':
        return this.handleHelp();
      case 'awlia':
        return this.handleAwlia();
      case 'update-goal':
        return this.handleUpdateGoal(command.goal);
    }
  }

  private async findOrCreateUser(sender: MessageSender) {
    const phoneNumber = resolvePhoneNumber(sender);
    const existing = await prisma.user.findUnique({ where: { phoneNumber } });
    if (existing) return existing;
    return prisma.user.create({ data: { phoneNumber, name: sender.name } });
  }

  private async handleSalawat(count: number, sender: MessageSender): Promise<DispatchResponse> {
    const user = await this.findOrCreateUser(sender);
    await prisma.submission.create({
      data: { count, submittedAt: new Date(), authorId: user.id },
    });

    const { _sum } = await prisma.submission.aggregate({ _sum: { count: true } });

    return {
      type: 'salawat',
      user: { id: user.id, name: user.name, phoneNumber: user.phoneNumber },
      count,
      total: _sum.count ?? count,
      goal: await getGoal(),
    };
  }

  private async handleMe(sender: MessageSender): Promise<DispatchResponse> {
    const user = await this.findOrCreateUser(sender);
    const submissions = await prisma.submission.findMany({
      where: { authorId: user.id },
      orderBy: { submittedAt: 'desc' },
      select: { count: true, submittedAt: true },
    });

    return {
      type: 'me',
      user: { id: user.id, name: user.name, phoneNumber: user.phoneNumber },
      submissions,
      total: submissions.reduce((sum, s) => sum + s.count, 0),
    };
  }

  private async handleStats(): Promise<DispatchResponse> {
    const submissions = await prisma.submission.findMany({
      select: { count: true, submittedAt: true },
    });

    return {
      type: 'stats',
      distribution: buildDistribution(submissions),
      total: submissions.reduce((sum, s) => sum + s.count, 0),
    };
  }

  private async handleHelp(): Promise<DispatchResponse> {
    return { type: 'help', goal: await getGoal() };
  }

  private async handleAwlia(): Promise<DispatchResponse> {
    const users = await prisma.user.findMany({
      where: { submissions: { some: {} } },
      select: { name: true, phoneNumber: true },
    });

    return { type: 'awlia', users: shuffle(users) };
  }

  private async handleUpdateGoal(goal: number): Promise<DispatchResponse> {
    await prisma.setting.upsert({
      where: { id: SETTINGS_ID },
      update: { goal },
      create: { id: SETTINGS_ID, goal },
    });

    return { type: 'update-goal', goal };
  }
}

const dispatcher = new Dispatcher();
export default dispatcher;
