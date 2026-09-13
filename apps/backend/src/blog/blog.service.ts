import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type {
  BlogPost,
  CreateBlogPostPayload,
  SetBlogPostStatusPayload,
  UpdateBlogPostPayload,
} from "@muslimspaces/shared";
import { MediaService } from "../media/media.service";
import { BlogPostEntity, BlogPostStatus } from "./entities/blog-post.entity";

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPostEntity)
    private readonly blogPostsRepository: Repository<BlogPostEntity>,
    private readonly mediaService: MediaService,
  ) {}

  async listPublished(): Promise<BlogPost[]> {
    const rows = await this.blogPostsRepository.find({
      where: { status: BlogPostStatus.PUBLISHED },
      order: { publishedAt: "DESC" },
    });
    return rows.map((r) => this.toDto(r));
  }

  async getPublishedBySlug(slug: string): Promise<BlogPost> {
    const row = await this.blogPostsRepository.findOne({
      where: { slug, status: BlogPostStatus.PUBLISHED },
    });
    if (!row) throw new NotFoundException("Post not found");
    return this.toDto(row);
  }

  async create(payload: CreateBlogPostPayload, authorId: string): Promise<BlogPost> {
    const post = this.blogPostsRepository.create({
      ...payload,
      coverImageKey: payload.coverImageKey ?? null,
      authorId,
    });
    const saved = await this.blogPostsRepository.save(post);
    return this.toDto(saved);
  }

  async update(id: string, payload: UpdateBlogPostPayload): Promise<BlogPost> {
    const post = await this.findOrThrow(id);
    if (payload.slug !== undefined) post.slug = payload.slug;
    if (payload.title !== undefined) post.title = payload.title;
    if (payload.excerpt !== undefined) post.excerpt = payload.excerpt;
    if (payload.content !== undefined) post.content = payload.content;
    if (payload.coverImageKey !== undefined) post.coverImageKey = payload.coverImageKey ?? null;
    const saved = await this.blogPostsRepository.save(post);
    return this.toDto(saved);
  }

  async setStatus(id: string, payload: SetBlogPostStatusPayload): Promise<BlogPost> {
    const post = await this.findOrThrow(id);
    post.status = payload.status === "published" ? BlogPostStatus.PUBLISHED : BlogPostStatus.DRAFT;
    if (post.status === BlogPostStatus.PUBLISHED && !post.publishedAt) {
      post.publishedAt = new Date();
    }
    const saved = await this.blogPostsRepository.save(post);
    return this.toDto(saved);
  }

  async remove(id: string): Promise<void> {
    const result = await this.blogPostsRepository.delete({ id });
    if (result.affected === 0) throw new NotFoundException("Post not found");
  }

  private async findOrThrow(id: string): Promise<BlogPostEntity> {
    const post = await this.blogPostsRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException("Post not found");
    return post;
  }

  private toDto(entity: BlogPostEntity): BlogPost {
    return {
      id: entity.id,
      slug: entity.slug,
      title: entity.title,
      excerpt: entity.excerpt,
      content: entity.content,
      coverImageKey: entity.coverImageKey ?? undefined,
      coverImageUrl: entity.coverImageKey
        ? this.mediaService.urlsForKey(entity.coverImageKey).url
        : undefined,
      authorId: entity.authorId,
      status: entity.status,
      publishedAt: entity.publishedAt ? entity.publishedAt.toISOString() : null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
