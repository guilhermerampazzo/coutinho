import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface UpdateProfessionalProfileDto {
  name?: string;
  title?: string;
  registration?: string;
  phone?: string;
  email?: string;
  location?: string;
}

@Injectable()
export class ProfessionalProfileService {
  constructor(private prisma: PrismaService) {}

  async get() {
    let profile = await this.prisma.professionalProfile.findFirst({ orderBy: { updatedAt: "desc" } });
    if (!profile) {
      profile = await this.prisma.professionalProfile.create({
        data: {
          name: "Rafael Coutinho",
          title: "Nutricionista",
          registration: "25106135",
          phone: "+55 24 99265 8924",
          email: "raafaelcoutinho@gmail.com",
          location: "Academia Locatelli",
        },
      });
    }
    return profile;
  }

  async update(dto: UpdateProfessionalProfileDto) {
    const current = await this.get();
    return this.prisma.professionalProfile.update({ where: { id: current.id }, data: dto });
  }
}
