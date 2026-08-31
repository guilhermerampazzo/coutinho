import { randomBytes } from "node:crypto";
import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { IsEnum } from "class-validator";
import { Throttle } from "@nestjs/throttler";
import { AuthGuard } from "@nestjs/passport";
import type { Response } from "express";
import { Modality } from "@prisma/client";
import { AuthService } from "./auth.service";
import { AppleService } from "./apple.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

class ChooseModalityDto {
  @IsEnum(Modality)
  modality!: Modality;
}

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService, private appleService: AppleService) {}

  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() req: any) {
    return this.authService.me(req.user.userId);
  }

  /** "Qual atendimento você deseja?" — escolha entre consultoria online e presencial. */
  @Post("modality")
  @UseGuards(JwtAuthGuard)
  modality(@Req() req: any, @Body() dto: ChooseModalityDto) {
    return this.authService.chooseModality(req.user.userId, dto.modality);
  }

  @Get("google")
  @UseGuards(AuthGuard("google"))
  googleAuth() {
    // Redireciona ao Google — tratado pelo passport-google-oauth20.
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const { tokens } = await this.authService.loginWithGoogle(req.user);
    res.redirect(this.callbackRedirect(tokens));
  }

  /** Informa ao front se o login com Apple está configurado — evita mostrar um botão que só daria erro. */
  @Get("providers")
  providers() {
    return { google: Boolean(process.env.GOOGLE_CLIENT_ID), apple: this.appleService.isConfigured };
  }

  @Get("apple")
  appleAuth(@Res() res: Response) {
    // `state` protege contra CSRF: a Apple devolve o mesmo valor no callback e nós conferimos.
    const state = randomBytes(16).toString("hex");
    res.cookie("apple_oauth_state", state, {
      httpOnly: true,
      secure: true,
      sameSite: "none", // o callback da Apple chega como POST cross-site (form_post)
      maxAge: 10 * 60 * 1000,
    });
    res.redirect(this.appleService.buildAuthorizeUrl(state));
  }

  /**
   * A Apple responde com POST (response_mode=form_post), não GET como o Google — por isso
   * este callback é @Post. O nome do usuário só vem aqui, no campo `user`, e só na primeira
   * autorização.
   */
  @Post("apple/callback")
  async appleCallback(@Req() req: any, @Res() res: Response, @Body() body: any) {
    const expectedState = req.cookies?.apple_oauth_state;
    res.clearCookie("apple_oauth_state");
    if (!body?.code || !expectedState || body.state !== expectedState) {
      throw new UnauthorizedException("Autenticação com a Apple inválida ou expirada.");
    }

    const profile = await this.appleService.exchangeCode(body.code, body.user);
    const { tokens } = await this.authService.loginWithApple(profile);
    res.redirect(this.callbackRedirect(tokens));
  }

  private callbackRedirect(tokens: { accessToken: string; refreshToken: string }) {
    const appUrl = process.env.APP_PUBLIC_URL ?? "https://localhost";
    return `${appUrl}/auth/callback?access=${tokens.accessToken}&refresh=${tokens.refreshToken}`;
  }
}
