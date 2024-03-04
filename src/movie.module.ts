import { CommonModule } from "@app/common"
import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { MulterModule } from "@nestjs/platform-express"
import { ServeStaticModule } from "@nestjs/serve-static"
import * as joi from "joi"

import { MovieController } from "./movie.controller"
import { MovieService } from "./movie.service"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: joi.object({
        DATABASE_URL: joi.string().required(),
      }),
      envFilePath: "./apps/movie/.env",
    }),
    MulterModule.register({ dest: "./apps/movie/posters" }),
    ServeStaticModule.forRoot({
      rootPath: "./apps/movie/posters",
      serveRoot: "/posters",
    }),
    CommonModule,
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
