import type { User } from "../core/user.entity.js";

export interface ITokenGenerator {
    generate(user: User): string;
    compare(token: string): any;
}