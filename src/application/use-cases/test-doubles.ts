import type { IRefreshTokenRepository, RefreshTokenRecord } from "../ports/refresh-token.repository.js";
import type { ITokenGenerator } from "../ports/token-generator.js";

// Dublês das portas usados nos testes dos casos de uso

export class InMemoryRefreshTokenRepository implements IRefreshTokenRepository {
  readonly records = new Map<string, RefreshTokenRecord>();

  async save(record: RefreshTokenRecord): Promise<void> {
    this.records.set(record.token, record);
  }

  async findByToken(token: string): Promise<RefreshTokenRecord | null> {
    return this.records.get(token) ?? null;
  }

  async deleteByToken(token: string): Promise<void> {
    this.records.delete(token);
  }

  async consume(token: string): Promise<RefreshTokenRecord | null> {
    const record = this.records.get(token) ?? null;
    this.records.delete(token);
    return record;
  }
}

export class FakeTokenGenerator implements ITokenGenerator {
  readonly payloads: unknown[] = [];
  private count = 0;

  generateAccess(payload: unknown): string {
    this.payloads.push(payload);
    return `access-${++this.count}`;
  }

  generateRefresh(payload: unknown): string {
    this.payloads.push(payload);
    return `refresh-${this.count}`;
  }

  compare(): unknown {
    throw new Error("não usado nestes testes");
  }
}
