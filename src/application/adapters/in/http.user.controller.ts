import { RegisterUserUseCase } from "../../use-cases/register.js";
import type { Request, Response } from "express";

export class UserController {
  constructor(private readonly register: RegisterUserUseCase) {}

  async handle(req: Request, res: Response) {
    const { name, email, password } = req.body ?? {};

    if (!name || !email || !password) {
      res.status(400).json({ error: "Nome, email e senha são obrigatorios" });
      return;
    }

    try {
      const user = await this.register.execute(name, email, password);
      const { passwordHash, ...safeUser } = user;
      res.status(200).json(safeUser);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
