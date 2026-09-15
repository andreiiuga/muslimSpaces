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

/** Confirms the group's shared submission goal was updated. Hidden - not listed in /help. */
export type UpdateGoalResponse = {
  type: 'update-goal';
  goal: number;
};

/** Confirms the sender is opted in to the weekly salawat digest DM. */
export type SubscribeResponse = {
  type: 'subscribe';
};

/** Confirms the sender is opted out of the weekly salawat digest DM. */
export type UnsubscribeResponse = {
  type: 'unsubscribe';
};

/** One recipient's weekly salawat digest DM - their own count and day-of-week distribution, rolling last 7 days. */
export type WeeklyDigestResponse = {
  type: 'weekly-digest';
  user: DispatchedUser;
  total: number;
  distribution: DayCount[];
};

/** Greets a member who just joined the group. Not triggered by a Command - fired directly off a join event. */
export type WelcomeResponse = {
  type: 'welcome';
  /** The joiner's display name, if we already have one on file; null greets them generically. */
  name: string | null;
  /** Group-wide running total at the moment they joined. */
  total: number;
  goal: number;
};

/** Uniform response shape the Presenter switches on to pick a message format. */
export type DispatchResponse =
  | SalawatResponse
  | MeResponse
  | StatsResponse
  | HelpResponse
  | AwliaResponse
  | UpdateGoalResponse
  | WelcomeResponse
  | SubscribeResponse
  | UnsubscribeResponse
  | WeeklyDigestResponse;

/**
 * Public contract for the Dispatcher module.
 */
export interface DispatcherInterface {
  /** Execute an interpreted command on behalf of a sender, producing a uniform response for the Presenter. */
  processCommand(command: Command, sender: MessageSender): Promise<DispatchResponse>;

  /** Build a welcome response for someone who just joined the group (not driven by a Command). */
  handleGroupJoin(sender: MessageSender): Promise<DispatchResponse>;

  /**
   * Build one weekly-digest response per subscribed user who has salawat
   * submissions in the last 7 days and hasn't already been sent a digest
   * within that same rolling window. Not driven by a Command - triggered by
   * the internal weekly-digest endpoint.
   */
  buildWeeklyDigests(): Promise<WeeklyDigestResponse[]>;

  /** Marks a user as having just been sent their weekly digest, so a re-trigger within 7 days skips them. */
  markWeeklyDigestSent(userId: number): Promise<void>;
}
