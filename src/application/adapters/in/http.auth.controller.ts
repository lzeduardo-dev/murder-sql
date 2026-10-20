import type { Request, Response } from "express";
import { AuthenticateUserUseCase } from "../../use-cases/authentication.js";

export class AuthController {
  constructor(private readonly authenticateUser: AuthenticateUserUseCase) {}

  async handle(req: Request, res: Response) {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      res.status(400).json({ error: "Email e senha são obrigatorios" });
      return;
    }

    try {
      const { token } = await this.authenticateUser.execute(email, password);
      res.status(200).json({ token });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }
}
