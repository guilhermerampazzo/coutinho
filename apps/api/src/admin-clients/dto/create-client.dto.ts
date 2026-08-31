import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { Modality } from "@prisma/client";

/** Cadastro manual de cliente pelo admin (recepção) — o profissional define a senha inicial e repassa. */
export class CreateClientDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @MinLength(6)
  @IsString()
  password!: string;

  /** Presencial = acesso livre à área do cliente, sem cobrança pela plataforma. */
  @IsOptional()
  @IsEnum(Modality)
  modality?: Modality;
}
