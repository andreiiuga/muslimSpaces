import { ArgumentsHost, BadRequestException, Catch, ConflictException, ExceptionFilter } from "@nestjs/common";
import { QueryFailedError } from "typeorm";
import type { FastifyReply } from "fastify";

// Postgres error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
const INVALID_TEXT_REPRESENTATION = "22P02"; // e.g. malformed UUID in a route param
const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

/**
 * Safety net for services that don't explicitly catch QueryFailedError
 * themselves (PoisService and FavoritesService already do, for their own
 * specific messages) — without this, a malformed :id param bubbles up as
 * a raw Postgres error and an unhandled 500 instead of a clean 4xx.
 */
@Catch(QueryFailedError)
export class QueryFailedFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    const code = (exception as unknown as { code?: string }).code;

    if (code === INVALID_TEXT_REPRESENTATION) {
      reply.status(400).send(new BadRequestException("Malformed identifier").getResponse());
      return;
    }
    if (code === UNIQUE_VIOLATION) {
      reply.status(409).send(new ConflictException("Already exists").getResponse());
      return;
    }
    if (code === FOREIGN_KEY_VIOLATION) {
      reply.status(400).send(new BadRequestException("Invalid reference").getResponse());
      return;
    }

    reply.status(500).send({ statusCode: 500, message: "Internal server error" });
  }
}
