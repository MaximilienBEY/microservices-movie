import { movieListQuerySchema } from "@app/common/schemas/movie/schema"
import { createZodDto } from "nestjs-zod"

export class ListMovieDto extends createZodDto(movieListQuerySchema) {}
