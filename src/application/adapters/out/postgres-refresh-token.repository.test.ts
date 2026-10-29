import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, beforeEach, describe, it } from "node:test";
import { Pool } from "pg";
import type { RefreshTokenRecord } from "../../ports/refresh-token.repository.js";
import { PostgresRefreshTokenRepository } from "./postgres-refresh-token.repository.js";

// Teste de integração: precisa de um Postgres com o schema do db/init.sql, por exemplo
// TEST_DATABASE_URL=postgres://postgres:senha@localhost:5439/murdersql npm test
// Só cria e apaga as linhas do usuário de teste abaixo.
const databaseUrl = process.env.TEST_DATABASE_URL;
const userId = randomUUID();
const DAY = 24 * 60 * 60 * 1000;

function record(overrides: Partial<RefreshTokenRecord> = {}): RefreshTokenRecord {
  return {
    userId,
    token: randomUUID(),
    expiresAt: new Date(Date.now() + 7 * DAY),
    ...overrides,
  };
}

describe("PostgresRefreshTokenRepository", { skip: databaseUrl ? false : "defina TEST_DATABASE_URL para rodar" }, () => {
  let pool: Pool;
  let repository: PostgresRefreshTokenRepository;

  before(() => {
    pool = new Pool({ connectionString: databaseUrl });
    repository = new PostgresRefreshTokenRepository(pool);
  });

  beforeEach(async () => {
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    await pool.query("INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4)", [
      userId,
      "Teste Refresh",
      `refresh-${userId}@teste.com`,
      "hash",
    ]);
  });

  after(async () => {
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    await pool.end();
  });

  it("salva e encontra o refresh token", async () => {
    const saved = record();

    await repository.save(saved);

    assert.deepEqual(await repository.findByToken(saved.token), saved);
  });

  it("consume devolve o registro uma única vez", async () => {
    const saved = record();
    await repository.save(saved);

    assert.deepEqual(await repository.consume(saved.token), saved);
    assert.equal(await repository.consume(saved.token), null);
    assert.equal(await repository.findByToken(saved.token), null);
  });

  it("consume simultâneo entrega o token para uma só requisição", async () => {
    const saved = record();
    await repository.save(saved);

    const results = await Promise.all(Array.from({ length: 10 }, () => repository.consume(saved.token)));

    assert.equal(results.filter(Boolean).length, 1);
  });

  it("deleteByToken remove o refresh token", async () => {
    const saved = record();
    await repository.save(saved);

    await repository.deleteByToken(saved.token);

    assert.equal(await repository.findByToken(saved.token), null);
  });

  it("recusa refresh token de usuário inexistente", async () => {
    await assert.rejects(repository.save(record({ userId: randomUUID() })), /foreign key/);
  });

  it("apaga os refresh tokens junto com o usuário", async () => {
    const saved = record();
    await repository.save(saved);

    await pool.query("DELETE FROM users WHERE id = $1", [userId]);

    assert.equal(await repository.findByToken(saved.token), null);
  });
});
