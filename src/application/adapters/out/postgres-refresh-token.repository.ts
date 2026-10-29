import { Pool } from "pg";
import type { IRefreshTokenRepository, RefreshTokenRecord } from "../../ports/refresh-token.repository.js";


export class PostgresRefreshTokenRepository implements IRefreshTokenRepository {
    constructor(private readonly pool: Pool) {}

    // método que salva o refresh token no banco
    async save(record: RefreshTokenRecord): Promise<void> {
        await this.pool.query(
            `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
            [record.userId, record.token, record.expiresAt]
        );
    }

    
    async findByToken(token: string): Promise<RefreshTokenRecord | null> {
        const res = await this.pool.query(`SELECT * FROM refresh_tokens WHERE token = $1`, [token]);
        if (res.rows.length === 0) return null;
        
        return {
            userId: res.rows[0].user_id,
            token: res.rows[0].token,
            expiresAt: res.rows[0].expires_at
        };
    }

    async deleteByToken(token: string): Promise<void> {
        await this.pool.query(`DELETE FROM refresh_tokens WHERE token = $1`, [token]);
    }

    // DELETE ... RETURNING é atômico: em requisições simultâneas, só uma recebe a linha
    async consume(token: string): Promise<RefreshTokenRecord | null> {
        const res = await this.pool.query(
            `DELETE FROM refresh_tokens WHERE token = $1 RETURNING user_id, token, expires_at`,
            [token]
        );
        const row = res.rows[0];
        if (!row) return null;

        return {
            userId: row.user_id,
            token: row.token,
            expiresAt: row.expires_at
        };
    }
}