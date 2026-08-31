import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { Modality } from "@prisma/client";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: "A senha precisa ter pelo menos 8 caracteres." })
  password!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsBoolean()
  consent!: boolean;

  /** ONLINE (padrão) = consultoria com contratação; PRESENCIAL = acesso livre, cobranças fora da plataforma. */
  @IsOptional()
  @IsEnum(Modality)
  modality?: Modality;
}
