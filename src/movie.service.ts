import { PrismaService } from "@app/common"
import { SceanceType } from "@app/common/schemas/cinema/types"
import {
  MovieCreateType,
  MovieListQueryType,
  MovieType,
  MovieUpdateType,
} from "@app/common/schemas/movie/types"
import { ReservationCreateType, ReservationType } from "@app/common/schemas/reservation/types"
import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common"
import { ClientProxy } from "@nestjs/microservices"
import { randomUUID } from "crypto"
import { rename } from "fs/promises"
import { join } from "path"
import { catchError, lastValueFrom, throwError } from "rxjs"

@Injectable()
export class MovieService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject("RESERVATION") private reservationClient: ClientProxy,
  ) {}

  private async saveFile(file: Express.Multer.File, movieUid: string) {
    if (!file.mimetype.startsWith("image/")) throw new Error("Invalid file type")

    const uid = randomUUID()
    const extension = file.originalname.split(".").pop()
    const fileName = `${uid}.${extension}`

    const filePath = join("./apps/movie/posters", fileName)
    await rename(file.path, filePath)

    await this.prisma.poster.deleteMany({ where: { movieUid } })
    await this.prisma.poster.create({
      data: { uid, url: `/posters/${fileName}`, movie: { connect: { uid: movieUid } } },
    })
  }
  private formatMovie = (movie: {
    uid: string
    name: string
    description: string
    rate: number
    duration: number
    createdAt: Date
    updatedAt: Date
    sceances?: SceanceType[]
  }): MovieType => {
    const { sceances, ...rest } = movie
    return { ...rest, hasReservationAvailable: !!sceances?.length }
  }

  async create({ categories, ...data }: MovieCreateType, file?: Express.Multer.File) {
    const movie = await this.prisma.movie.create({
      data: {
        ...data,
        categories: {
          connectOrCreate: categories?.map(name => ({
            where: { name },
            create: { name },
          })),
        },
      },
      include: { categories: true },
    })

    if (file) {
      await this.saveFile(file, movie.uid)
      return this.findOne(movie.uid)
    } else return movie
  }

  async findAll({ limit: _limit, page: _page, query }: MovieListQueryType): Promise<MovieType[]> {
    // const total = await this.prisma.movie.count({
    //   ...(query && {
    //     where: {
    //       OR: [{ name: { contains: query } }, { description: { contains: query } }],
    //     },
    //   }),
    // })
    // const items = await this.prisma.movie.findMany({
    //   take: limit,
    //   skip: (page - 1) * limit,
    //   ...(query && {
    //     where: {
    //       OR: [{ name: { contains: query } }, { description: { contains: query } }],
    //     },
    //   }),
    // })
    const items = await this.prisma.movie.findMany({
      include: { sceances: true },
      ...(query && {
        where: {
          OR: [{ name: { contains: query } }, { description: { contains: query } }],
        },
      }),
    })
    return items.map(item => this.formatMovie(item))
    // return {
    //   items,
    //   total,
    //   limit,
    //   page,
    //   _links: {
    //     self: `http://localhost:8888/movies?limit=${limit}&page=${page}`,
    //     ...(page > 1 && {
    //       prev: `http://localhost:8888/movies?limit=${limit}&page=${page - 1}`,
    //     }),
    //     ...(page * limit < total && {
    //       next: `http://localhost:8888/movies?limit=${limit}&page=${page + 1}`,
    //     }),
    //   },
    // }
  }

  async findOne(uid: string): Promise<MovieType> {
    const movie = await this.prisma.movie
      .findUniqueOrThrow({
        where: { uid },
        include: { categories: true, poster: true, sceances: true },
      })
      .then(movie => this.formatMovie(movie))
      .catch(() => {
        throw new NotFoundException("Movie not found")
      })

    return movie
  }

  async update(uid: string, { categories, ...data }: MovieUpdateType, file?: Express.Multer.File) {
    const movie = await this.prisma.movie
      .update({
        where: { uid },
        data: {
          ...data,
          categories: {
            connectOrCreate: categories?.map(name => ({
              where: { name },
              create: { name },
            })),
          },
        },
      })
      .catch(() => {
        throw new NotFoundException("Movie not found")
      })
    if (file) await this.saveFile(file, movie.uid)
    return this.findOne(movie.uid)
  }

  async delete(uid: string) {
    await this.prisma.movie.delete({ where: { uid } }).catch(() => {
      throw new NotFoundException("Movie not found")
    })
  }

  findAllCategories() {
    return this.prisma.category.findMany()
  }
  findAllByCategory(uid: string) {
    return this.prisma.movie.findMany({
      where: { categories: { some: { uid } } },
    })
  }

  async getAllReservationsByMovie(movieId: string) {
    const reservations: ReservationType[] = await lastValueFrom(
      this.reservationClient
        .send("reservation.movie.list", { movieId })
        .pipe(catchError(() => throwError(() => new NotFoundException()))),
    )

    return reservations
  }
  async getAllReservationsBySceance(movieId: string, sceanceId: string) {
    const reservations: ReservationType[] = await lastValueFrom(
      this.reservationClient
        .send("reservation.sceance.list", { movieId, sceanceId })
        .pipe(catchError(() => throwError(() => new NotFoundException()))),
    )

    return reservations
  }
  async createReservation(movieId: string, userId: string, data: ReservationCreateType) {
    const response = await new Promise<
      { type: "error"; message: string } | { type: "success"; data: unknown } | null
    >((resolve, reject) => {
      const correlationId = randomUUID()
      const replyTo = "amq.rabbitmq.reply-to"

      this.reservationClient
        .send("reservation.create", { movieId, userId, data, correlationId, replyTo })
        .subscribe({
          next: response => resolve(response),
          error: error => reject(error),
        })
    })
    if (response?.type !== "success") throw new BadRequestException(response?.message)

    return response
  }
}
