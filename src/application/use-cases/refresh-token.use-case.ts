import type { ITokenGenerator } from "../ports/token-generator.js";
import type { IRefreshTokenRepository } from "../ports/refresh-token.repository.js";

const REFRESH_TOKEN_TTL_DAYS = 7;

// Validade do refresh token no banco (a mesma do JWT gerado pelo adapter)
export function refreshTokenExpiration(from: Date = new Date()): Date {
  const expiresAt = new Date(from);
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return expiresAt;
}

export class RefreshSessionUseCase {
  constructor(
    private readonly tokenGenerator: ITokenGenerator,
    private readonly refreshTokenRepository: IRefreshTokenRepository
  ) {}

  async execute(oldRefreshToken: string) {
    // Consome o token antigo (busca e remove de uma vez): na rotação ele só pode
    // ser usado uma vez, mesmo com duas requisições simultâneas
    const record = await this.refreshTokenRepository.consume(oldRefreshToken);

    if (!record) {
      throw new Error(
        "Refresh token inválido ou não encontrado. Faça login novamente."
      );
    }

    // Verifica se o token já expirou (o consume já removeu ele do banco)
    if (new Date() > record.expiresAt) {
      throw new Error("Refresh token expirado. Faça login novamente.");
    }

    // 4. Gera o novo par de tokens usando o ID do usuário que estava atrelado no banco
    const payload = { id: record.userId };
    const newAccessToken = this.tokenGenerator.generateAccess(payload);
    const newRefreshToken = this.tokenGenerator.generateRefresh(payload);

    // Calcula a nova data de expiração para o novo Refresh Token (+7 dias)
    const expiresAt = refreshTokenExpiration();

    // Salva o novo refresh token no banco de dados
    await this.refreshTokenRepository.save({
      userId: record.userId,
      token: newRefreshToken,
      expiresAt,
    });

    // Retorna para o Controller
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
