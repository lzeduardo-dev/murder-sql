export type RefreshTokenRecord = {
    userId: string;
    token: string;
    expiresAt: Date;
}

export interface IRefreshTokenRepository {
    save(record: RefreshTokenRecord): Promise<void>;
    findByToken(token: string): Promise<RefreshTokenRecord | null>;
    deleteByToken(token: string): Promise<void>;
    // busca e remove o token numa única operação, para que ele só possa ser usado uma vez
    consume(token: string): Promise<RefreshTokenRecord | null>;
}
