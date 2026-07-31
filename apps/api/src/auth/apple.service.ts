import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

const APPLE_AUTH_URL = "https://appleid.apple.com/auth/authorize";
const APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token";

export interface AppleProfile {
  appleId: string;
  email: string;
  name?: string;
}

/**
 * Sign in with Apple (fluxo web "Services ID" — o mesmo usado pelo app via Capacitor).
 *
 * Diferente do Google (passport-google-oauth20), a Apple não tem uma strategy do Passport
 * bem mantida e exige um `client_secret` que é um JWT ES256 assinado com a chave .p8 e que
 * expira (máx. 6 meses) — por isso é gerado sob demanda aqui em vez de vir do .env.
 *
 * Mesma filosofia do GoogleStrategy (escopo.md §13.0): sem credenciais reais, nada quebra no
 * boot — só falha explicitamente quando alguém tenta de fato usar o login com Apple.
 */
@Injectable()
export class AppleService {
  constructor(private jwt: JwtService) {}

  /** Services ID criado no portal da Apple (ex.: br.com.couthealth.signin) — é o "client_id". */
  private get clientId() {
    return process.env.APPLE_CLIENT_ID;
  }

  private get teamId() {
    return process.env.APPLE_TEAM_ID;
  }

  private get keyId() {
    return process.env.APPLE_KEY_ID;
  }

  /** Conteúdo do .p8 baixado do portal da Apple. No .env as quebras de linha vêm como \n literais. */
  private get privateKey() {
    return process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  }

  private get callbackUrl() {
    return process.env.APPLE_CALLBACK_URL ?? "https://api.localhost/auth/apple/callback";
  }

  get isConfigured() {
    return Boolean(this.clientId && this.teamId && this.keyId && this.privateKey);
  }

  private assertConfigured() {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException(
        "Login com Apple não configurado (APPLE_CLIENT_ID/APPLE_TEAM_ID/APPLE_KEY_ID/APPLE_PRIVATE_KEY ausentes)."
      );
    }
  }

  /** URL para onde redirecionamos o usuário. `response_mode=form_post` é exigido quando pedimos escopo. */
  buildAuthorizeUrl(state: string) {
    this.assertConfigured();
    const params = new URLSearchParams({
      client_id: this.clientId!,
      redirect_uri: this.callbackUrl,
      response_type: "code id_token",
      scope: "name email",
      response_mode: "form_post",
      state,
    });
    return `${APPLE_AUTH_URL}?${params.toString()}`;
  }

  /**
   * O client_secret da Apple é um JWT ES256 assinado com a chave .p8, válido por no máximo
   * 6 meses. Geramos um curto (5 min) a cada troca de code — não há motivo para reaproveitar.
   */
  private generateClientSecret() {
    const now = Math.floor(Date.now() / 1000);
    return this.jwt.sign(
      { iss: this.teamId, iat: now, exp: now + 300, aud: "https://appleid.apple.com", sub: this.clientId },
      { algorithm: "ES256", privateKey: this.privateKey!, keyid: this.keyId! }
    );
  }

  /**
   * Troca o `code` pelo id_token e extrai o perfil.
   *
   * O id_token vem direto do endpoint da Apple sobre TLS e autenticado pelo nosso client_secret,
   * então é confiável sem revalidar a assinatura contra o JWKS público (que só faria sentido se
   * o token tivesse chegado por um caminho não confiável, como o corpo do form_post do browser).
   */
  async exchangeCode(code: string, userPayload?: string): Promise<AppleProfile> {
    this.assertConfigured();

    const res = await fetch(APPLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId!,
        client_secret: this.generateClientSecret(),
        code,
        grant_type: "authorization_code",
        redirect_uri: this.callbackUrl,
      }).toString(),
    });

    const tokens = await res.json();
    if (!res.ok || !tokens.id_token) {
      throw new ServiceUnavailableException(`Falha ao autenticar com a Apple: ${JSON.stringify(tokens)}`);
    }

    const claims = this.jwt.decode(tokens.id_token) as { sub?: string; email?: string } | null;
    if (!claims?.sub) {
      throw new ServiceUnavailableException("id_token da Apple sem identificador de usuário.");
    }

    return {
      appleId: claims.sub,
      // Apple permite "ocultar meu e-mail": nesse caso vem um relay @privaterelay.appleid.com,
      // que funciona normalmente para envio. Se nem isso vier, geramos um placeholder estável.
      email: claims.email ?? `${claims.sub}@privaterelay.appleid.com`,
      name: this.parseName(userPayload),
    };
  }

  /**
   * A Apple só manda o nome UMA vez — no form_post da primeira autorização, num campo `user`
   * com JSON à parte (nunca no id_token). Se o usuário já autorizou antes, não vem nada.
   */
  private parseName(userPayload?: string) {
    if (!userPayload) return undefined;
    try {
      const parsed = JSON.parse(userPayload);
      const first = parsed?.name?.firstName ?? "";
      const last = parsed?.name?.lastName ?? "";
      const full = `${first} ${last}`.trim();
      return full || undefined;
    } catch {
      return undefined;
    }
  }
}
