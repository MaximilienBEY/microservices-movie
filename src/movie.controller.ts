import { Admin, Public } from "@app/common/auth/user.decorator"
import { movieListResponseSchema, movieSchema } from "@app/common/schemas/movie/schema"
import { MovieType } from "@app/common/schemas/movie/types"
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { ApiOkResponse, ApiQuery } from "@nestjs/swagger"
import { HealthCheck, HealthCheckService } from "@nestjs/terminus"
import { zodToOpenAPI } from "nestjs-zod"

import { CreateMovieDto } from "./dto/create-movie.dto"
import { CreateReservationDto } from "./dto/create-reservation.dto"
import { ListMovieDto } from "./dto/list-movie.dto"
import { UpdateMovieDto } from "./dto/update-movie.dto"
import { MovieService } from "./movie.service"

@Controller("movies")
export class MovieController {
  constructor(
    private readonly movieService: MovieService,
    private readonly health: HealthCheckService,
  ) {}

  @Public()
  @Get("health")
  @HealthCheck()
  check() {
    return this.health.check([])
  }

  @Get("categories")
  findAllCategories() {
    return this.movieService.findAllCategories()
  }

  @Get("categories/:id")
  findMoviesByCategory(@Param("id") id: string) {
    return this.movieService.findAllByCategory(id)
  }

  @Admin()
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @UseInterceptors(FileInterceptor("poster", { limits: { fileSize: 1024 * 1024 * 10 } }))
  @ApiOkResponse({ schema: zodToOpenAPI(movieSchema) })
  create(@Body() data: CreateMovieDto, @UploadedFile() poster: Express.Multer.File) {
    return this.movieService.create(data, poster)
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  // @ApiQuery({
  //   name: "limit",
  //   required: false,
  //   schema: { type: "number", minimum: 1, maximum: 100, default: 10 },
  // })
  // @ApiQuery({ name: "page", required: false, schema: { type: "number", minimum: 1, default: 1 } })
  @ApiQuery({ name: "query", required: false, schema: { type: "string" } })
  @ApiOkResponse({ schema: zodToOpenAPI(movieListResponseSchema) })
  async findAll(@Query() query: ListMovieDto): Promise<MovieType[] | null> {
    const movies = await this.movieService.findAll(query)
    return movies.length ? movies : null
  }

  @Get(":id")
  @ApiOkResponse({ schema: zodToOpenAPI(movieSchema) })
  findOne(@Param("id") id: string) {
    return this.movieService.findOne(id)
  }

  @Admin()
  @Put(":id")
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

  @Post(":id/reservations")
  @ApiOkResponse()
  createReservation(@Param("id") id: string, @Body() body: CreateReservationDto) {
    return this.movieService.createReservation(id, body)
  }
}
