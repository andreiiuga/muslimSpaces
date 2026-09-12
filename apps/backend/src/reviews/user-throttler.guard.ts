import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

/**
 * Rate-limits by authenticated user id, not IP — "open to everyone but
 * rate limited" means limiting the account doing the posting, since
 * submitting a review already requires auth. Must run AFTER JwtAuthGuard
 * in the guard chain so req.user is populated.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.userId ?? req.ip;
  }
}
