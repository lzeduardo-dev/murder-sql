import jwt from "jsonwebtoken";
import type { User } from "../../core/user.entity.js";
import type { ITokenGenerator } from "../../ports/token-generator.js";
import { requireEnv } from "../../../config/env.js";

export class JwtAdapter implements ITokenGenerator {
  private readonly secret = requireEnv("JWT_SECRET");

  generate(user: User): string {
    return jwt.sign({ email: user.email }, this.secret, {
      expiresIn: "2h",
    });
  }

  compare(token: string): any {
    return jwt.verify(token, this.secret);
  }
}
