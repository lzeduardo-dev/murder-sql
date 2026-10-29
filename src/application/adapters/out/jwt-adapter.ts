import jwt from "jsonwebtoken";
import type { User } from "../../core/user.entity.js";
import type { ITokenGenerator } from "../../ports/token-generator.js";
import { requireEnv } from "../../../config/env.js";

export class JwtAdapter implements ITokenGenerator {
  private readonly secret = requireEnv("JWT_SECRET");
  private readonly refreshSecret = requireEnv("JWT_REFRESH_SECRET");

  generateAccess(payload: any): string {
    return jwt.sign(payload, this.secret, { expiresIn: "15m" });
  }

  generateRefresh(payload: any): string {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: "7d",
      jwtid: crypto.randomUUID(),
    });
  }
  compare(token: string): any {
    return jwt.verify(token, this.secret);
  }
}
