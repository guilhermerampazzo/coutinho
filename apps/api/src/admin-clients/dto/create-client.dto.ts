import { IsEmail, IsString, MinLength } from "class-validator";

/** Cadastro manual de cliente pelo admin (recepção) — o profissional define a senha inicial e repassa. */
export class CreateClientDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @MinLength(6)
  @IsString()
  password!: string;
}
