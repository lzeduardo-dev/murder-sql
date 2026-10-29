import type { Request, Response } from "express";
import { RegisterUserUseCase } from "../../use-cases/register.js";

export class RegisterController {
  constructor(private readonly registerUser: RegisterUserUseCase) {}

  handle = async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = req.body ?? {};

    if (!name || !email || !password) {
      res.status(400).json({ error: "Nome, email e senha são obrigatórios" });
      return;
    }

    try {
      await this.registerUser.execute(name, email, password);
      res.status(200).json({ message: "Usuário criado com sucesso" });
    } catch (error: any) {
      res.status(400).json({ error: "erro ao tentar cadastrar usuario" });
    }
  };
}
