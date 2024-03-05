import { CommonModule } from "@app/common"
import { RmqModule } from "@app/common/rmq/rmq.module"
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
        JWT_SECRET: joi.string().required(),
        RABBIT_MQ_URL: joi.string().required(),
      }),
      envFilePath: "./apps/movie/.env",
    }),
    MulterModule.register({ dest: "./apps/movie/posters" }),
    ServeStaticModule.forRoot({
      rootPath: "./apps/movie/posters",
      serveRoot: "/posters",
    }),
    RmqModule.register({ name: "RESERVATION" }),
    CommonModule,
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
