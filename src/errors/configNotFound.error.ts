export class ConfigNotFound extends Error {
    constructor(guildId: string) {
        super(`Configuration not found for guild id ${guildId}`);

        Object.setPrototypeOf(this, ConfigNotFound.prototype);
    }
}