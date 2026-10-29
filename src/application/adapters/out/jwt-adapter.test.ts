import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import jwt from "jsonwebtoken";
import type { ITokenGenerator } from "../../ports/token-generator.js";
import { JwtAdapter } from "./jwt-adapter.js";

process.env.JWT_SECRET = "segredo-de-acesso-teste";
process.env.JWT_REFRESH_SECRET = "segredo-de-refresh-teste";

const userId = "00000000-0000-4000-8000-000000000001";
const adapter = (): ITokenGenerator => new JwtAdapter();

afterEach(() => mock.timers.reset());

describe("JwtAdapter (refresh token)", () => {
  it("assina o refresh token com JWT_REFRESH_SECRET e validade de 7 dias", () => {
    const token = adapter().generateRefresh({ id: userId });

    const payload = jwt.verify(token, "segredo-de-refresh-teste") as jwt.JwtPayload;
    assert.equal(payload.id, userId);
    assert.equal(payload.exp! - payload.iat!, 7 * 24 * 60 * 60);
  });

  it("não aceita refresh token como access token", () => {
    const tokens = adapter();
    const refreshToken = tokens.generateRefresh({ id: userId });

    assert.throws(() => tokens.compare(refreshToken), /invalid signature/);
  });

  it("gera access token com validade de 15 minutos", () => {
    const tokens = adapter();
    const accessToken = tokens.generateAccess({ id: userId });

    const payload = tokens.compare(accessToken) as jwt.JwtPayload;
    assert.equal(payload.id, userId);
    assert.equal(payload.exp! - payload.iat!, 15 * 60);
  });

  it("exige JWT_REFRESH_SECRET ao criar o adapter", () => {
    const secret = process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_REFRESH_SECRET;

    try {
      assert.throws(() => new JwtAdapter(), /JWT_REFRESH_SECRET/);
    } finally {
      process.env.JWT_REFRESH_SECRET = secret;
    }
  });

  it("gera refresh tokens diferentes mesmo no mesmo segundo", () => {
    mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-23T12:00:00Z") });
    const tokens = adapter();

    const first = tokens.generateRefresh({ id: userId });
    const second = tokens.generateRefresh({ id: userId });

    assert.notEqual(first, second);
  });
});
