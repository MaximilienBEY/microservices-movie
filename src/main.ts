import { XmlInterceptor } from "@app/common/xml/xml.interceptor"
import { NestFactory } from "@nestjs/core"

import { MovieModule } from "./movie.module"

async function bootstrap() {
  const app = await NestFactory.create(MovieModule)
  app.useGlobalInterceptors(new XmlInterceptor())
  await app.listen(3000)
}
bootstrap()
