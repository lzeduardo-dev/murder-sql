export interface IPasswordHasher {
    hash(text: string): Promise<string>;
    compare(plainText: string, hashed: string): Promise<Boolean>;
}