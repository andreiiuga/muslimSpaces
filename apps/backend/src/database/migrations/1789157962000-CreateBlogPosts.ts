import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBlogPosts1789157962000 implements MigrationInterface {
  name = "CreateBlogPosts1789157962000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "blog_posts_status_enum" AS ENUM ('draft', 'published');
    `);

    await queryRunner.query(`
      CREATE TABLE "blog_posts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "slug" varchar NOT NULL,
        "title" jsonb NOT NULL,
        "excerpt" jsonb NOT NULL,
        "content" jsonb NOT NULL,
        "cover_image_key" varchar,
        "author_id" uuid NOT NULL,
        "status" "blog_posts_status_enum" NOT NULL DEFAULT 'draft',
        "published_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_blog_posts_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_blog_posts_author" FOREIGN KEY ("author_id")
          REFERENCES "users" ("id") ON DELETE RESTRICT
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "blog_posts";`);
    await queryRunner.query(`DROP TYPE "blog_posts_status_enum";`);
  }
}
