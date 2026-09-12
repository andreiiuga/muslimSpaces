import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import multipart from "@fastify/multipart";
import { AppModule } from "./app.module";
import { QueryFailedFilter } from "./common/filters/query-failed.filter";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // 8MB cap: uploads are resized/converted server-side anyway (see
  // MediaService), no reason to accept originals larger than that.
  await app.register(multipart, { limits: { fileSize: 8 * 1024 * 1024 } });

  app.useGlobalFilters(new QueryFailedFilter());
  app.enableCors();

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port, "0.0.0.0");
}

bootstrap();
