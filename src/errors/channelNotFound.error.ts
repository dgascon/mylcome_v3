export class ChannelNotFound extends Error {
    constructor(guildId: string, channelId: string) {
        super(`Channel ${channelId} not found for guild id ${guildId}`);

        Object.setPrototypeOf(this, ChannelNotFound.prototype);
    }
}