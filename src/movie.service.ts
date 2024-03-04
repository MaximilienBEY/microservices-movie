import { PrismaService } from "@app/common"
import {
  MovieCreateType,
  MovieListQueryType,
  MovieListResponseType,
  MovieUpdateType,
} from "@app/common/schemas/movie/types"
import { Injectable, NotFoundException } from "@nestjs/common"
import { randomUUID } from "crypto"
import { rename } from "fs/promises"
import { join } from "path"

@Injectable()
export class MovieService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findAll({ limit, page, query }: MovieListQueryType): Promise<MovieListResponseType> {
    const total = await this.prisma.movie.count({
      ...(query && {
        where: {
          OR: [{ name: { contains: query } }, { description: { contains: query } }],
        },
      }),
    })
    const items = await this.prisma.movie.findMany({
      take: limit,
      skip: (page - 1) * limit,
      ...(query && {
        where: {
          OR: [{ name: { contains: query } }, { description: { contains: query } }],
        },
      }),
    })
    return {
      items,
      total,
      limit,
      page,
      _links: {
        self: `http://localhost:8888/movies?limit=${limit}&page=${page}`,
        ...(page > 1 && {
          prev: `http://localhost:8888/movies?limit=${limit}&page=${page - 1}`,
        }),
        ...(page * limit < total && {
          next: `http://localhost:8888/movies?limit=${limit}&page=${page + 1}`,
        }),
      },
    }
  }

  async findOne(uid: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { uid },
      include: { categories: true, poster: true },
    })
    if (!movie) throw new NotFoundException("Movie not found")

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

  delete(uid: string) {
    return this.prisma.movie.delete({ where: { uid } }).catch(() => {
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
}
