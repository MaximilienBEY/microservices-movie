import { reservationCreateSchema } from "@app/common/schemas/reservation/schema"
import { createZodDto } from "nestjs-zod"

export class CreateReservationDto extends createZodDto(reservationCreateSchema) {}
