import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import express from "express";
import type { AuthenticateUserUseCase } from "../../use-cases/authentication.js";
import type { RefreshSessionUseCase } from "../../use-cases/refresh-token.use-case.js";
import type { RegisterUserUseCase } from "../../use-cases/register.js";
import { AuthController } from "./http.auth.controller.js";
import { RefreshTokenController } from "./http.refresh.controller.js";
import { RegisterController } from "./http.register.controller.js";
import { setupRoutes } from "./http.routes.js";

const tokens = { accessToken: "novo-access", refreshToken: "novo-refresh" };

// Casos de uso falsos: aqui o que importa é a ligação das rotas com os controllers
const login = { execute: async () => tokens } as unknown as AuthenticateUserUseCase;
const refreshSession = { execute: async () => tokens } as unknown as RefreshSessionUseCase;
const registerUser = { execute: async () => ({}) } as unknown as RegisterUserUseCase;
let server: Server;
let baseUrl: string;

before(async () => {
  const app = express();
  app.use(express.json());
  app.use(
    "/api",
    setupRoutes(
      new RegisterController(registerUser),
      new AuthController(login),
      new RefreshTokenController(refreshSession)
    )
  );

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});

after(() => new Promise<void>((resolve) => server.close(() => resolve())));

const post = (path: string, body: unknown) =>
  fetch(baseUrl + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("rotas /api", () => {
  it("POST /login devolve access e refresh token", async () => {
    const res = await post("/login", { email: "luiz@teste.com", password: "123456" });

    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), tokens);
  });

  it("POST /refresh é público e devolve o novo par de tokens", async () => {
    const res = await post("/refresh", { refreshToken: "refresh-antigo" });

    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), tokens);
  });

  it("POST /refresh sem refreshToken responde 400", async () => {
    const res = await post("/refresh", {});

    assert.equal(res.status, 400);
  });

  it("POST /register cadastra sem exigir token", async () => {
    const res = await post("/register", { name: "Luiz", email: "luiz@teste.com", password: "123456" });

    assert.equal(res.status, 200);
  });

});
