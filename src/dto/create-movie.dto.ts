import { movieCreateSchema } from "@app/common/schemas/movie/schema"
import { createZodDto } from "nestjs-zod"

export class CreateMovieDto extends createZodDto(movieCreateSchema) {}
