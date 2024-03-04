import { movieUpdateSchema } from "@app/common/schemas/movie/schema"
import { createZodDto } from "nestjs-zod"

export class UpdateMovieDto extends createZodDto(movieUpdateSchema) {}
