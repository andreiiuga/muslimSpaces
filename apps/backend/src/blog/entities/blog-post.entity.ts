import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { LocalizedText } from "../../common/localized-text";
import { UserEntity } from "../../users/entities/user.entity";

export enum BlogPostStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
}

@Entity("blog_posts")
export class BlogPostEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: "jsonb" })
  title: LocalizedText;

  @Column({ type: "jsonb" })
  excerpt: LocalizedText;

  // Markdown per locale — images are plain ![alt](bucket-url) references,
  // no block-based content model. See CLAUDE.md practices.
  @Column({ type: "jsonb" })
  content: LocalizedText;

  @Column({ name: "cover_image_key", type: "varchar", nullable: true })
  coverImageKey: string | null;

  @Column({ name: "author_id" })
  authorId: string;

  @ManyToOne(() => UserEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "author_id" })
  author: UserEntity;

  @Column({ type: "enum", enum: BlogPostStatus, default: BlogPostStatus.DRAFT })
  status: BlogPostStatus;

  @Column({ name: "published_at", type: "timestamptz", nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
