export class User {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly email: string,
        public readonly passwordHash: string
    ){
        if (!email.includes("@")) {
            throw new Error("Email must be in a valid state");
        }
    }
}