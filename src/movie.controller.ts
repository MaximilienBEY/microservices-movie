import { Admin } from "@app/common/auth/user.decorator"
import { movieListResponseSchema, movieSchema } from "@app/common/schemas/movie/schema"
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { ApiOkResponse, ApiQuery } from "@nestjs/swagger"
import { zodToOpenAPI } from "nestjs-zod"

import { CreateMovieDto } from "./dto/create-movie.dto"
import { ListMovieDto } from "./dto/list-movie.dto"
import { UpdateMovieDto } from "./dto/update-movie.dto"
import { MovieService } from "./movie.service"

@Controller("movies")
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Admin()
  @HttpCode(201)
  @Post()
  @UseInterceptors(FileInterceptor("poster", { limits: { fileSize: 1024 * 1024 * 10 } }))
  @ApiOkResponse({ schema: zodToOpenAPI(movieSchema) })
  create(@Body() data: CreateMovieDto, @UploadedFile() poster: Express.Multer.File) {
    return this.movieService.create(data, poster)
  }

  @Get()
  @ApiQuery({
    name: "limit",
    required: false,
    schema: { type: "number", minimum: 1, maximum: 100, default: 10 },
  })
  @ApiQuery({ name: "page", required: false, schema: { type: "number", minimum: 1, default: 1 } })
  @ApiQuery({ name: "query", required: false, schema: { type: "string" } })
  @ApiOkResponse({ schema: zodToOpenAPI(movieListResponseSchema) })
  findAll(@Query() query: ListMovieDto) {
    return this.movieService.findAll(query)
  }

  @Get("categories")
  findAllCategories() {
    return this.movieService.findAllCategories()
  }

  @Get("categories/:id")
  findMoviesByCategory(@Param("id") id: string) {
    return this.movieService.findAllByCategory(id)
  }

  @Get(":id")
  @ApiOkResponse({ schema: zodToOpenAPI(movieSchema) })
  findOne(@Param("id") id: string) {
    return this.movieService.findOne(id)
  }

  @Admin()
  @Patch(":id")
  @UseInterceptors(FileInterceptor("poster", { limits: { fileSize: 1024 * 1024 * 10 } }))
  @ApiOkResponse({ schema: zodToOpenAPI(movieSchema) })
  update(
    @Param("id") id: string,
    @Body() body: UpdateMovieDto,
    @UploadedFile() poster: Express.Multer.File,
  ) {
    return this.movieService.update(id, body, poster)
  }

  @Admin()
  @Delete(":id")
  @ApiOkResponse()
  remove(@Param("id") id: string) {
    return this.movieService.delete(id)
  }
}
