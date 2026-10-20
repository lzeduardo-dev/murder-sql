import express from 'express';

import { createPostgresPool } from "./application/adapters/out/postgres.connection.js";
import { PostgresRepository } from "./application/adapters/out/postgres.user.repository.js";
import { BcryptPasswordAdapter } from "./application/adapters/out/password-hasher.js"
import { JwtAdapter } from "./application/adapters/out/jwt-adapter.js";
import { RegisterUserUseCase } from "./application/use-cases/register.js";
import { AuthenticateUserUseCase } from "./application/use-cases/authentication.js";
import { UserController } from "./application/adapters/in/http.user.controller.js";
import { AuthController } from "./application/adapters/in/http.auth.controller.js";

const app = express();
app.use(express.json());

const pool = createPostgresPool();
const userRepository = new PostgresRepository(pool);

const passwordHasher = new BcryptPasswordAdapter()
const tokenGenerator = new JwtAdapter();

const registerUserUseCase = new RegisterUserUseCase(userRepository, passwordHasher);
const authenticateUserUseCase = new AuthenticateUserUseCase(userRepository, passwordHasher, tokenGenerator);

const userController = new UserController(registerUserUseCase);
const authController = new AuthController(authenticateUserUseCase);

app.post('/users', (req, res) => userController.handle(req, res));
app.post('/login', (req, res) => authController.handle(req, res));


app.listen(3000, () => console.log("Server is running on port 3000"));
