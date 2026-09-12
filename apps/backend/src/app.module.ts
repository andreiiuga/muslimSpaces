import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { dataSourceOptions } from "./database/data-source";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { CategoriesModule } from "./categories/categories.module";
import { CitiesModule } from "./cities/cities.module";
import { PoisModule } from "./pois/pois.module";
import { MediaModule } from "./media/media.module";
import { FavoritesModule } from "./favorites/favorites.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { BlogModule } from "./blog/blog.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dataSourceOptions),
    // Default limit is generous — only the review-submission endpoint sets
    // a tighter @Throttle() override (see PoiReviewsController).
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 100 }]),
    UsersModule,
    AuthModule,
    CategoriesModule,
    CitiesModule,
    PoisModule,
    MediaModule,
    FavoritesModule,
    ReviewsModule,
    BlogModule,
  ],
})
export class AppModule {}
