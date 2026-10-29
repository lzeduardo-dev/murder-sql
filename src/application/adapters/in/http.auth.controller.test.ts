import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Request, Response } from "express";
import type { AuthenticateUserUseCase } from "../../use-cases/authentication.js";
import { AuthController } from "./http.auth.controller.js";
import { mockResponse } from "./test-doubles.js";

type Tokens = { accessToken: string; refreshToken: string };

function setup(execute: (email: string, password: string) => Promise<Tokens>) {
  const calls: [string, string][] = [];
  const useCase = {
    execute: (email: string, password: string) => {
      calls.push([email, password]);
      return execute(email, password);
    },
  };

  // handle desestruturado de propósito: é assim que o router recebe o método
  const { handle } = new AuthController(useCase as unknown as AuthenticateUserUseCase);

  const post = async (body: unknown) => {
    const res = mockResponse();
    await handle({ body } as Request, res as unknown as Response);
    return res;
  };

  return { calls, post };
}

const tokens: Tokens = { accessToken: "novo-access", refreshToken: "novo-refresh" };

describe("AuthController", () => {
  it("responde 200 com access e refresh token", async () => {
    const { calls, post } = setup(async () => tokens);

    const res = await post({ email: "luiz@teste.com", password: "123456" });

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, tokens);
    assert.deepEqual(calls, [["luiz@teste.com", "123456"]]);
  });

  it("responde 400 quando email ou senha não são enviados", async () => {
    const { calls, post } = setup(async () => tokens);

    const res = await post({ email: "luiz@teste.com" });

    assert.equal(res.statusCode, 400);
    assert.equal(calls.length, 0);
  });

  it("responde 400 quando a requisição chega sem body", async () => {
    const { calls, post } = setup(async () => tokens);

    const res = await post(undefined);

    assert.equal(res.statusCode, 400);
    assert.equal(calls.length, 0);
  });

  it("responde 401 com a mensagem do caso de uso quando as credenciais são recusadas", async () => {
    const { post } = setup(async () => {
      throw new Error("Senha incorreta");
    });

    const res = await post({ email: "luiz@teste.com", password: "errada" });

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { error: "Senha incorreta" });
  });
});
