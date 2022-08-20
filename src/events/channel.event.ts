import { Prisma } from "@prisma/client";
import { GuildChannel } from "discord.js";
import type { ArgsOf } from "discordx";
import { Discord, On } from "discordx";
import 'dotenv/config';
import { getChannelCacheByGuildId, removeChannelCache } from "../helpers/channelCache.helper.js";
import { generateLog } from "../helpers/generateLogs.helper.js";
import { prisma } from '../main.js';

@Discord()
export class EventChannel {

    @On("channelDelete")
    public async onChannelDelete([channel]: ArgsOf<"channelDelete">): Promise<void> {
        try {
            if (channel instanceof GuildChannel) {
                const isCachedChannel = await getChannelCacheByGuildId(channel.guildId!, channel.id);

                if (isCachedChannel) {
                    await removeChannelCache({
                        channelId: isCachedChannel.channelId,
                        guildId: isCachedChannel.guildId,
                    });

                    const channelDeleted = await prisma.channel.findFirst({
                        where: {
                            channelId: channel.id,
                            guildId: channel.guildId
                        },
                        include: {
                            guild: true,
                            user: true,
                        }
                    });

                    await generateLog(channel.guild, {
                        channelId: channel.id,
                        channelName: channel.name,
                        logChannelId: channelDeleted?.guild.logChannelId ?? null
                    });

                    await prisma.user.delete({
                        where: {
                            userId_guildId: {
                                userId: channelDeleted!.user.userId,
                                guildId: channelDeleted!.guild.id
                            }
                        },
                        include: {
                            channel: true,
                        }
                    }).catch((e) => {
                        if (e instanceof Prisma.PrismaClientKnownRequestError) {
                            if (e.code !== 'P2025') {
                                throw e;
                            }
                        } else {
                            throw e;
                        }
                    })
                }
            }
        } catch (e) {
            console.log(e);
        }
    }
}