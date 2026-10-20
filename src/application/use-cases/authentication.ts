import type { IUserRepository } from "../ports/user.repository.js";
import type { ITokenGenerator } from "../ports/token-generator.js";
import type { IPasswordHasher } from "../ports/password-hasher.js";

export class AuthenticateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenGenerator: ITokenGenerator
  ) {}

  async execute(email: string, password: string): Promise<{ token: string }> {
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

    const token = this.tokenGenerator.generate(user);
    return { token };
  }
}
