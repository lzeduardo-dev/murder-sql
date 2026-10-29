import express from "express";

import { JwtAdapter } from "./application/adapters/out/jwt-adapter.js";
import { BcryptPasswordAdapter } from "./application/adapters/out/password-hasher.js";
import { setupRoutes } from "./application/adapters/in/http.routes.js";
import { PostgresRepository } from "./application/adapters/out/postgres.user.repository.js";
import { AuthenticateUserUseCase } from "./application/use-cases/authentication.js";
import { AuthController } from "./application/adapters/in/http.auth.controller.js";
import { RegisterController } from "./application/adapters/in/http.register.controller.js";
import { RegisterUserUseCase } from "./application/use-cases/register.js";
import { createPostgresPool } from "./application/adapters/out/postgres.connection.js";
import { PostgresRefreshTokenRepository } from "./application/adapters/out/postgres-refresh-token.repository.js";
import { RefreshSessionUseCase } from "./application/use-cases/refresh-token.use-case.js";
import { RefreshTokenController } from "./application/adapters/in/http.refresh.controller.js";

async function bootstrap() {
    const app = express();
    app.use(express.json()); // Habilita o parse de JSON no body

    // 1. ADAPTADORES DE SAÍDA (Infraestrutura)
    const jwtAdapter = new JwtAdapter();

    const pool = createPostgresPool();
    const userRepository = new PostgresRepository(pool);
    const refreshTokenRepository = new PostgresRefreshTokenRepository(pool);
    const passwordHasher = new BcryptPasswordAdapter();

    // 2. CASOS DE USO (Core)
    const authenticateUser = new AuthenticateUserUseCase(userRepository, passwordHasher, jwtAdapter, refreshTokenRepository);
    const refreshSession = new RefreshSessionUseCase(jwtAdapter, refreshTokenRepository);
    const registerUser = new RegisterUserUseCase(userRepository, passwordHasher);

    // 3. ADAPTADORES DE ENTRADA (Infraestrutura)
    const authController = new AuthController(authenticateUser);
    const registerController = new RegisterController(registerUser);
    const refreshController = new RefreshTokenController(refreshSession);

    
   
    const router = setupRoutes(
        registerController, 
        authController, 
        refreshController
    );
    app.use("/api", router); // Todas as rotas ficarão sob o prefixo /api
    

    // 5. INICIALIZAÇÃO
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}

bootstrap().catch(console.error);