import type { Request, Response } from "express";
import { AuthenticateUserUseCase } from "../../use-cases/authentication.js";

export class AuthController {
  constructor(private readonly authenticateUser: AuthenticateUserUseCase) {}

  handle = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      res.status(400).json({ error: "Email e senha são obrigatorios" });
      return;
    }

    try {
      const tokens = await this.authenticateUser.execute(email, password);
      res.status(200).json(tokens);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };
}
