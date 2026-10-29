import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import type { RefreshTokenRecord } from "../ports/refresh-token.repository.js";
import { RefreshSessionUseCase } from "./refresh-token.use-case.js";
import { FakeTokenGenerator, InMemoryRefreshTokenRepository } from "./test-doubles.js";

const DAY = 24 * 60 * 60 * 1000;
const t0 = new Date("2026-10-23T12:00:00Z");
const userId = "00000000-0000-4000-8000-000000000001";

function setup() {
  const repository = new InMemoryRefreshTokenRepository();
  const tokens = new FakeTokenGenerator();
  const useCase = new RefreshSessionUseCase(tokens, repository);
  return { repository, tokens, useCase };
}

function record(overrides: Partial<RefreshTokenRecord> = {}): RefreshTokenRecord {
  return {
    userId,
    token: "refresh-antigo",
    expiresAt: new Date(t0.getTime() + 7 * DAY),
    ...overrides,
  };
}

beforeEach(() => mock.timers.enable({ apis: ["Date"], now: t0 }));
afterEach(() => mock.timers.reset());

describe("RefreshSessionUseCase", () => {
  it("gera um novo par de tokens para o usuário do refresh token", async () => {
    const { repository, tokens, useCase } = setup();
    await repository.save(record());

    const result = await useCase.execute("refresh-antigo");

    assert.deepEqual(result, { accessToken: "access-1", refreshToken: "refresh-1" });
    assert.deepEqual(tokens.payloads, [{ id: userId }, { id: userId }]);
  });

  it("invalida o refresh token usado (rotação)", async () => {
    const { repository, useCase } = setup();
    await repository.save(record());

    await useCase.execute("refresh-antigo");

    assert.equal(await repository.findByToken("refresh-antigo"), null);
    await assert.rejects(useCase.execute("refresh-antigo"), /inválido ou não encontrado/);
  });

  it("salva o novo refresh token com validade de 7 dias", async () => {
    const { repository, useCase } = setup();
    await repository.save(record());

    await useCase.execute("refresh-antigo");

    assert.deepEqual(await repository.findByToken("refresh-1"), {
      userId,
      token: "refresh-1",
      expiresAt: new Date(t0.getTime() + 7 * DAY),
    });
  });

  it("aceita o novo refresh token na renovação seguinte", async () => {
    const { repository, useCase } = setup();
    await repository.save(record());

    const first = await useCase.execute("refresh-antigo");
    const second = await useCase.execute(first.refreshToken);

    assert.deepEqual(second, { accessToken: "access-2", refreshToken: "refresh-2" });
  });

  it("recusa refresh token inexistente sem gerar tokens", async () => {
    const { repository, tokens, useCase } = setup();

    await assert.rejects(useCase.execute("nao-existe"), /inválido ou não encontrado/);

    assert.equal(tokens.payloads.length, 0);
    assert.equal(repository.records.size, 0);
  });

  it("recusa refresh token expirado e remove do banco", async () => {
    const { repository, tokens, useCase } = setup();
    await repository.save(record({ expiresAt: new Date(t0.getTime() - 1) }));

    await assert.rejects(useCase.execute("refresh-antigo"), /expirado/);

    assert.equal(repository.records.size, 0);
    assert.equal(tokens.payloads.length, 0);
  });

  it("não deixa o mesmo refresh token ser usado em duas renovações simultâneas", async () => {
    const { repository, useCase } = setup();
    await repository.save(record());

    const results = await Promise.allSettled([
      useCase.execute("refresh-antigo"),
      useCase.execute("refresh-antigo"),
    ]);

    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  });
});
