import { Pool } from 'pg';
import { User } from '../../core/user.entity.js';
import type { IUserRepository } from '../../ports/user.repository.js';

type UserRow = {
    id: string;
    name: string;
    email: string;
    password_hash: string;
};


export class PostgresRepository implements IUserRepository {
    constructor(private readonly pool: Pool){}

    async save(user:User){
        await this.pool.query(
            "INSERT INTO users (id,name, email, password_hash) VALUES ($1, $2, $3, $4)",
            [user.id, user.name, user.email, user.passwordHash]
        )
    }

    async findByEmail(email: string): Promise<User | null> {
        const result = await this.pool.query<UserRow>(
            "SELECT id, name, email, password_hash FROM users WHERE email = $1",
            [email]
        )

        const row = result.rows[0];
        if (!row) return null;

        return new User(row.id, row.name, row.email, row.password_hash);
    }
}