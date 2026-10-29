import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Request, Response } from "express";
import type { RefreshSessionUseCase } from "../../use-cases/refresh-token.use-case.js";
import { RefreshTokenController } from "./http.refresh.controller.js";
import { mockResponse } from "./test-doubles.js";

type Tokens = { accessToken: string; refreshToken: string };

function setup(execute: (token: string) => Promise<Tokens>) {
  const calls: string[] = [];
  const useCase = {
    execute: (token: string) => {
      calls.push(token);
      return execute(token);
    },
  };
  const controller = new RefreshTokenController(useCase as unknown as RefreshSessionUseCase);

  const post = async (body: unknown) => {
    const res = mockResponse();
    await controller.handle({ body } as Request, res as unknown as Response);
    return res;
  };

  return { calls, post };
}

const tokens: Tokens = { accessToken: "novo-access", refreshToken: "novo-refresh" };

describe("RefreshTokenController", () => {
  it("responde 200 com o novo par de tokens", async () => {
    const { calls, post } = setup(async () => tokens);

    const res = await post({ refreshToken: "refresh-antigo" });

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, tokens);
    assert.deepEqual(calls, ["refresh-antigo"]);
  });

  it("responde 400 quando o refreshToken não é enviado", async () => {
    const { calls, post } = setup(async () => tokens);

    const res = await post({});

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { error: "Refresh token obrigatório." });
    assert.equal(calls.length, 0);
  });

  it("responde 400 quando a requisição chega sem body", async () => {
    const { calls, post } = setup(async () => tokens);

    const res = await post(undefined);

    assert.equal(res.statusCode, 400);
    assert.equal(calls.length, 0);
  });

  it("responde 401 com a mensagem do caso de uso quando o token é recusado", async () => {
    const { post } = setup(async () => {
      throw new Error("Refresh token expirado. Faça login novamente.");
    });

    const res = await post({ refreshToken: "refresh-expirado" });

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { error: "Refresh token expirado. Faça login novamente." });
  });
});
