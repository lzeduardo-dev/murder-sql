import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { User } from "../core/user.entity.js";
import type { IPasswordHasher } from "../ports/password-hasher.js";
import type { IUserRepository } from "../ports/user.repository.js";
import { AuthenticateUserUseCase } from "./authentication.js";
import { RefreshSessionUseCase } from "./refresh-token.use-case.js";
import { FakeTokenGenerator, InMemoryRefreshTokenRepository } from "./test-doubles.js";

const DAY = 24 * 60 * 60 * 1000;
const t0 = new Date("2026-10-25T12:00:00Z");
const user = new User("00000000-0000-4000-8000-000000000001", "Luiz", "luiz@teste.com", "hash:123456");

const users: IUserRepository = {
  save: async () => {},
  findByEmail: async (email) => (email === user.email ? user : null),
};

const hasher: IPasswordHasher = {
  hash: async (text) => `hash:${text}`,
  compare: async (plain, hashed) => hashed === `hash:${plain}`,
};

function setup() {
  const refreshTokens = new InMemoryRefreshTokenRepository();
  const tokens = new FakeTokenGenerator();
  const login = new AuthenticateUserUseCase(users, hasher, tokens, refreshTokens);
  return { refreshTokens, tokens, login };
}

beforeEach(() => mock.timers.enable({ apis: ["Date"], now: t0 }));
afterEach(() => mock.timers.reset());

describe("AuthenticateUserUseCase", () => {
  it("devolve access e refresh token para credenciais válidas", async () => {
    const { tokens, login } = setup();

    const result = await login.execute("luiz@teste.com", "123456");

    assert.deepEqual(result, { accessToken: "access-1", refreshToken: "refresh-1" });
    assert.deepEqual(tokens.payloads, [{ id: user.id }, { id: user.id }]);
  });

  it("salva o refresh token do login com validade de 7 dias", async () => {
    const { refreshTokens, login } = setup();

    await login.execute("luiz@teste.com", "123456");

    assert.deepEqual(await refreshTokens.findByToken("refresh-1"), {
      userId: user.id,
      token: "refresh-1",
      expiresAt: new Date(t0.getTime() + 7 * DAY),
    });
  });

  it("o refresh token do login renova a sessão", async () => {
    const { refreshTokens, tokens, login } = setup();
    const refreshSession = new RefreshSessionUseCase(tokens, refreshTokens);

    const { refreshToken } = await login.execute("luiz@teste.com", "123456");
    const renewed = await refreshSession.execute(refreshToken);

    assert.deepEqual(renewed, { accessToken: "access-2", refreshToken: "refresh-2" });
  });

  it("recusa usuário inexistente sem salvar refresh token", async () => {
    const { refreshTokens, tokens, login } = setup();

    await assert.rejects(login.execute("ninguem@teste.com", "123456"), /Usuario nao encontrado/);

    assert.equal(refreshTokens.records.size, 0);
    assert.equal(tokens.payloads.length, 0);
  });

  it("recusa senha incorreta sem salvar refresh token", async () => {
    const { refreshTokens, tokens, login } = setup();

    await assert.rejects(login.execute("luiz@teste.com", "errada"), /Senha incorreta/);

    assert.equal(refreshTokens.records.size, 0);
    assert.equal(tokens.payloads.length, 0);
  });
});
