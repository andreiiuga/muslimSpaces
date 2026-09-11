import type { Command } from '../interpreter/types.js';
import type { MessageSender } from '../messenger/types.js';

/** Minimal user info the Presenter needs to address/attribute a response. */
export type DispatchedUser = {
  id: number;
  name: string | null;
  phoneNumber: string;
};

/** One weekday's aggregated count, summed across every submission ever recorded. */
export type DayCount = {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  count: number;
};

/** A salawat count was recorded for the sender. */
export type SalawatResponse = {
  type: 'salawat';
  user: DispatchedUser;
  count: number;
  /** Group-wide running total, summed from all submissions in the DB. */
  total: number;
  goal: number;
};

/** The sender's own submission history. */
export type MeResponse = {
  type: 'me';
  user: DispatchedUser;
  submissions: { count: number; submittedAt: Date }[];
  total: number;
};

/** The group's all-time submission distribution, broken down by day of week. */
export type StatsResponse = {
  type: 'stats';
  distribution: DayCount[];
  total: number;
};

/** The list of available commands plus a short explanation of how salawat counting works. */
export type HelpResponse = {
  type: 'help';
  /** The group's shared submission goal, mentioned in the "how it works" blurb. */
  goal: number;
};

/** A randomized (not ranked) roster of everyone who has submitted at least once. */
export type AwliaResponse = {
  type: 'awlia';
  users: { name: string | null; phoneNumber: string }[];
};

/** Uniform response shape the Presenter switches on to pick a message format. */
export type DispatchResponse = SalawatResponse | MeResponse | StatsResponse | HelpResponse | AwliaResponse;

/**
 * Public contract for the Dispatcher module.
 */
export interface DispatcherInterface {
  /** Execute an interpreted command on behalf of a sender, producing a uniform response for the Presenter. */
  processCommand(command: Command, sender: MessageSender): Promise<DispatchResponse>;
}
