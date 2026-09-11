import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { LocalizedText } from "../../common/localized-text";

@Entity("cities")
export class CityEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** e.g. "cluj-napoca" — used in SEO URLs like /cluj-napoca/mosques */
  @Column({ unique: true })
  slug: string;

  @Column({ type: "jsonb" })
  name: LocalizedText;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
