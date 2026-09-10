import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ProfessionalGuard } from "../auth/professional.guard";
import { ProfessionalProfileService } from "./professional-profile.service";

class UpdateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() registration?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() location?: string;
}

@Controller()
export class ProfessionalProfileController {
  constructor(private service: ProfessionalProfileService) {}

  @Get("professional-profile")
  @UseGuards(JwtAuthGuard)
  get() {
    return this.service.get();
  }

  @Patch("admin/professional-profile")
  @UseGuards(ProfessionalGuard)
  update(@Body() dto: UpdateProfileDto) {
    return this.service.update(dto);
  }
}
