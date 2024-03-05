import { CommonInterceptor } from "@app/common"
import { NestFactory } from "@nestjs/core"

import { MovieModule } from "./movie.module"

async function bootstrap() {
  const app = await NestFactory.create(MovieModule)
  app.useGlobalInterceptors(new CommonInterceptor())
  await app.listen(3000)
}
bootstrap()
