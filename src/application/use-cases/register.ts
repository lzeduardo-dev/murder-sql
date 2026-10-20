import type { IUserRepository } from "../ports/user.repository.js";
import type { IPasswordHasher } from "../ports/password-hasher.js";
import { User } from "../core/user.entity.js";

export class RegisterUserUseCase{
    constructor(private readonly userRepository: IUserRepository, private readonly passwordHasher: IPasswordHasher){}

    async execute(name: string, email: string, passwordPlain: string): Promise<User> {
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) throw new Error("User already signed")

        const hashedPassword = await this.passwordHasher.hash(passwordPlain);

        const user = new User(
            crypto.randomUUID(),
            name,
            email,
            hashedPassword
        )

        await this.userRepository.save(user);
        return user;
    }

}

