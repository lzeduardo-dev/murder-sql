import type { Request, Response } from "express";
import type { RefreshSessionUseCase } from "../../use-cases/refresh-token.use-case.js";

export class RefreshTokenController {
    constructor(private readonly refreshSession: RefreshSessionUseCase) {}

    handle = async (req: Request, res: Response): Promise<void> => {
        const { refreshToken } = req.body ?? {};
        if (!refreshToken) {
            res.status(400).json({ error: "Refresh token obrigatório." });
            return;
        }

        try {
            const tokens = await this.refreshSession.execute(refreshToken);
            res.status(200).json(tokens);
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    }
}