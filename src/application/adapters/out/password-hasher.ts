import type { IPasswordHasher } from '../../ports/password-hasher.js';
import bcrypt from 'bcrypt';

export class BcryptPasswordAdapter implements IPasswordHasher {
    private readonly saltRounds = 10;
  
    // Método que será chamado no momento de CADASTRAR o usuário
    async hash(plainText: string): Promise<string> {
      return await bcrypt.hash(plainText, this.saltRounds);
    }
  
    // Método que será chamado no momento de AUTENTICAR (Login) o usuário
    async compare(plainText: string, hashed: string): Promise<boolean> {
      return await bcrypt.compare(plainText, hashed);
    }
  }