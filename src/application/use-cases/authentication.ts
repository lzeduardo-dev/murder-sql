import type { IUserRepository } from "../ports/user.repository.js";
import type { ITokenGenerator } from "../ports/token-generator.js";
import type { IPasswordHasher } from "../ports/password-hasher.js";
import type { IRefreshTokenRepository } from "../ports/refresh-token.repository.js";
import { refreshTokenExpiration } from "./refresh-token.use-case.js";

export class AuthenticateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly refreshTokenRepository: IRefreshTokenRepository
  ) {}

  async execute(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error("Usuario nao encontrado");
    }

    const isPasswordValid = await this.passwordHasher.compare(
      password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new Error("Senha incorreta");
    }

    const payload = { id: user.id };
    const accessToken = this.tokenGenerator.generateAccess(payload);
    const refreshToken = this.tokenGenerator.generateRefresh(payload);

    // Salva o refresh token para que ele possa ser trocado em /refresh
    await this.refreshTokenRepository.save({
      userId: user.id,
      token: refreshToken,
      expiresAt: refreshTokenExpiration(),
    });

    return { accessToken, refreshToken };
  }
}
