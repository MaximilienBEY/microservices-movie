import { CommonModule } from "@app/common"
import { RmqModule } from "@app/common/rmq/rmq.module"
import { Module } from "@nestjs/common"
import { MulterModule } from "@nestjs/platform-express"
import { ServeStaticModule } from "@nestjs/serve-static"

import { MovieController } from "./movie.controller"
import { MovieService } from "./movie.service"

@Module({
  imports: [
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
