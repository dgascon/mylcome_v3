export class RoleNotFound extends Error {
    constructor(guildId: string, roleId: string) {
        super(`Role ${roleId} not found for guild id ${guildId}`);

        Object.setPrototypeOf(this, RoleNotFound.prototype);
    }
}