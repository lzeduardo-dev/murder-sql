// src/application/adapters/in/http.routes.ts

import { Router } from "express";

// Importando as tipagens dos controllers e middleware que você já criou
import type { AuthController } from "./http.auth.controller.js";
import type { RefreshTokenController } from "./http.refresh.controller.js";
import type { RegisterController } from "./http.register.controller.js";

/**
 * Função que recebe as instâncias já montadas (Injeção de Dependências)
 * e retorna o roteador configurado.
 */
export function setupRoutes(
    registerController: RegisterController,
    authController: AuthController,
    refreshController: RefreshTokenController
): Router {
    const router = Router();

    // ==========================================
    // ROTAS PÚBLICAS (Não exigem token)
    // ==========================================
    
    router.post("/register", registerController.handle);
    router.post("/login", authController.handle);
    router.post("/refresh", refreshController.handle);

    return router;
}