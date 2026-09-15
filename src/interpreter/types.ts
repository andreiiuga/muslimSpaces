/**
 * Public contract for the Interpreter module.
 */

/** A submission of a salawat count, extracted from free-form text. */
export type SalawatCommand = { type: 'salawat'; count: number };

/** Request for the group's all-time, day-of-week distribution stats (ascii graph). */
export type StatsCommand = { type: 'stats' };

/** Request for a private message listing the sender's own submissions. */
export type MeCommand = { type: 'me' };

/** Request for the list of available commands and a short explanation of how salawat counting works. */
export type HelpCommand = { type: 'help' };

/** Request for a randomized (not ranked) list of everyone who has submitted at least once. */
export type AwliaCommand = { type: 'awlia' };

/** Opts the sender into the weekly salawat digest DM. */
export type SubscribeCommand = { type: 'subscribe' };

/** Opts the sender out of the weekly salawat digest DM. */
export type UnsubscribeCommand = { type: 'unsubscribe' };

/**
 * Sets the group's shared submission goal. Deliberately undocumented: not
 * listed in /help, not in the natural-language classifier, fast-path only.
 */
export type UpdateGoalCommand = { type: 'update-goal'; goal: number };

export type Command =
  | SalawatCommand
  | StatsCommand
  | MeCommand
  | HelpCommand
  | AwliaCommand
  | UpdateGoalCommand
  | SubscribeCommand
  | UnsubscribeCommand;

export interface InterpreterInterface {
  /** Extract a salawat count from a message, if present. */
  extractSalawatCount(text: string): Promise<number | null>;
  /** Detect the sender's intent (salawat submission, /stats, /me) from an incoming message. */
  processMessage(message: string): Promise<Command | null>;
}
