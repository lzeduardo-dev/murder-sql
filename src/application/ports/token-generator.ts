import type { User } from "../core/user.entity.js";

export interface ITokenGenerator {
    generateAccess(payload: any): string;
    generateRefresh(payload: any): string;
    compare(token: string): any;
}

