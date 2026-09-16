/** Resolves once every eligible recipient has been sent (or skipped) their weekly digest DM. */
export type WeeklyDigestHandler = () => Promise<{ sent: number }>;

/**
 * Public contract for the InternalListener module.
 *
 * The HTTP-side counterpart to Messenger: where Messenger listens for
 * WhatsApp events and hands them to registered handlers, this listens for
 * authenticated calls on Railway's private network and hands them to
 * registered handlers - one per internal trigger kind, the same way
 * Messenger has a distinct addMessageHandler/addGroupJoinHandler per event
 * kind rather than one generic router.
 */
export interface InternalListener {
  /** Start listening on the given port. Every request must carry the shared secret as x-internal-secret. */
  listen(port: number, secret: string): Promise<void>;

  /** Stop listening. */
  close(): void;

  /** Register the handler invoked on POST /weekly-digest. */
  addWeeklyDigestHandler(handler: WeeklyDigestHandler): void;
}
