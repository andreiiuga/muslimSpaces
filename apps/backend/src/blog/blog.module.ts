import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MediaModule } from "../media/media.module";
import { BlogPostEntity } from "./entities/blog-post.entity";
import { BlogService } from "./blog.service";
import { BlogController } from "./blog.controller";

@Module({
  imports: [TypeOrmModule.forFeature([BlogPostEntity]), MediaModule],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}
