import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { createBlogPostSchema, setBlogPostStatusSchema, updateBlogPostSchema } from "@muslimspaces/shared";
import type {
  CreateBlogPostPayload,
  SetBlogPostStatusPayload,
  UpdateBlogPostPayload,
} from "@muslimspaces/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { BlogService } from "./blog.service";

@Controller("blog")
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  list() {
    return this.blogService.listPublished();
  }

  @Get(":slug")
  get(@Param("slug") slug: string) {
    return this.blogService.getPublishedBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("moderator", "admin")
  create(
    @Body(new ZodValidationPipe(createBlogPostSchema)) body: CreateBlogPostPayload,
    @CurrentUser() user: RequestUser,
  ) {
    return this.blogService.create(body, user.userId);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("moderator", "admin")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateBlogPostSchema)) body: UpdateBlogPostPayload,
  ) {
    return this.blogService.update(id, body);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("moderator", "admin")
  setStatus(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(setBlogPostStatusSchema)) body: SetBlogPostStatusPayload,
  ) {
    return this.blogService.setStatus(id, body);
  }
}
