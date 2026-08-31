import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { Modality, Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private issueTokens(user: { id: string; email: string; role: Role }): AuthTokens {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwt.sign(payload, { secret: process.env.JWT_SECRET, expiresIn: "15m" }),
      refreshToken: this.jwt.sign(payload, { secret: process.env.JWT_REFRESH_SECRET, expiresIn: "30d" }),
    };
  }

  /** Assinatura ativa só existe depois do pagamento aprovado (ver PaymentsService.checkout).
   *  Cliente PRESENCIAL tem acesso livre à área dele (cobranças tratadas fora da plataforma). */
  private async publicUser(user: { id: string; email: string; name: string; role: Role; modality: Modality }) {
    const [activeSubscription, anySubscription] = await Promise.all([
      this.prisma.subscription.findFirst({
        where: { userId: user.id, status: "ACTIVE" },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.subscription.findFirst({ where: { userId: user.id } }),
    ]);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      modality: user.modality,
      hasActiveSubscription: Boolean(activeSubscription) || user.modality === Modality.PRESENCIAL,
      activePlanName:
        activeSubscription?.plan.name ?? (user.modality === Modality.PRESENCIAL ? "Atendimento presencial" : undefined),
      // Distingue "nunca assinou" (tela de boas-vindas) de "assinou e expirou/cancelou" (tela de renovação).
      hadSubscription: Boolean(anySubscription),
    };
  }

  async register(dto: RegisterDto) {
    if (!dto.consent) {
      throw new ConflictException("É necessário aceitar o consentimento de tratamento de dados (LGPD).");
    }
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException("Já existe uma conta com este e-mail.");

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        consentedAt: new Date(),
        modality: dto.modality ?? Modality.ONLINE,
      },
    });

    return { user: await this.publicUser(user), tokens: this.issueTokens(user) };
  }

  /**
   * Escolha de atendimento pós-cadastro ("Online ou presencial?").
   * Só permite ONLINE → PRESENCIAL (quem contrata plano online mantém o fluxo pago;
   * presencial nunca é revogado automaticamente).
   */
  async chooseModality(userId: string, modality: Modality) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.role !== Role.CLIENT) throw new ConflictException("Apenas clientes escolhem modalidade de atendimento.");
    if (user.modality === modality) return this.publicUser(user);
    if (user.modality !== Modality.ONLINE || modality !== Modality.PRESENCIAL) {
      throw new ConflictException("Esta conta já possui uma modalidade de atendimento.");
    }
    const updated = await this.prisma.user.update({ where: { id: userId }, data: { modality } });
    return this.publicUser(updated);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.passwordHash) throw new UnauthorizedException("E-mail ou senha inválidos.");

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException("E-mail ou senha inválidos.");

    return { user: await this.publicUser(user), tokens: this.issueTokens(user) };
  }

  async loginWithGoogle(profile: { googleId: string; email: string; name: string }) {
    let user = await this.prisma.user.findUnique({ where: { googleId: profile.googleId } });
    if (!user) {
      user = await this.prisma.user.findUnique({ where: { email: profile.email } });
      if (user) {
        user = await this.prisma.user.update({ where: { id: user.id }, data: { googleId: profile.googleId } });
      } else {
        user = await this.prisma.user.create({
          data: { email: profile.email, name: profile.name, googleId: profile.googleId, consentedAt: new Date() },
        });
      }
    }
    return { user: await this.publicUser(user), tokens: this.issueTokens(user) };
  }

  async loginWithApple(profile: { appleId: string; email: string; name?: string }) {
    let user = await this.prisma.user.findUnique({ where: { appleId: profile.appleId } });
    if (!user) {
      user = await this.prisma.user.findUnique({ where: { email: profile.email } });
      if (user) {
        // Mesma pessoa que já entrou por e-mail/senha ou Google — vincula a conta Apple.
        user = await this.prisma.user.update({ where: { id: user.id }, data: { appleId: profile.appleId } });
      } else {
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            // A Apple só envia o nome na primeira autorização; sem ele, usamos um rótulo
            // editável no perfil em vez de bloquear o cadastro.
            name: profile.name ?? "Usuário Apple",
            appleId: profile.appleId,
            consentedAt: new Date(),
          },
        });
      }
    }
    return { user: await this.publicUser(user), tokens: this.issueTokens(user) };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      return { tokens: this.issueTokens(user) };
    } catch {
      throw new UnauthorizedException("Refresh token inválido ou expirado.");
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.publicUser(user);
  }
}
