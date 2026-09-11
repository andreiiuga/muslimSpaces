import prisma from '../db.js';
import type { Command } from '../interpreter/types.js';
import type { MessageSender } from '../messenger/types.js';
import type { DayCount, DispatcherInterface, DispatchResponse } from './types.js';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const; // index = Date#getDay()
const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const; // Monday-first display order
const GOAL = parseInt(process.env.SALAWAT_GOAL || '100000', 10);

function resolvePhoneNumber(sender: MessageSender): string {
  return sender.phoneNumber ?? sender.id.split('@')[0] ?? sender.id;
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
      goal: GOAL,
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
}

const dispatcher = new Dispatcher();
export default dispatcher;
