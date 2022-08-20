import { Channel, Reaction, User as PrismaUser, Config, Role } from "@prisma/client";
import { GuildMember, MessageReaction, PartialMessageReaction, PartialUser, PermissionFlagsBits, User } from "discord.js";
import { prisma } from "../main.js";
import { ChannelNotFound } from "../errors/channelNotFound.error.js";
import { getChannelCacheByGuildId } from "./channelCache.helper.js";

export interface ICheckMessageReaction {
    reacts: Reaction;
    channel: Channel & {
        user: PrismaUser;
        config: Config & {
            roles: Role[];
        };
    };
    member: GuildMember;
}

export const checkMessageReaction = async (messageReaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): Promise<ICheckMessageReaction | null> => {
    const isCachedChannel = await getChannelCacheByGuildId(messageReaction.message.guildId!, messageReaction.message.channelId);

    if (isCachedChannel && !user.bot) {
        await messageReaction.message.guild!.members.fetch();

        const member = messageReaction.message.guild?.members.cache.get(user.id);

        const channel = await prisma.channel.findFirst({
            where: {
                guildId: isCachedChannel.guildId,
                channelId: isCachedChannel.channelId
            },
            include: {
                user: true,
                config: {
                    include: {
                        roles: true
                    }
                },
            }
        });

        if (!channel) {
            throw new ChannelNotFound(messageReaction.message.guildId!, isCachedChannel.channelId);
        }

        const reacts = await prisma.reaction.findFirst({
            where: {
                config: {
                    id: channel.config.id
                },
                emoji: messageReaction.emoji.name!
            }
        });

        if (!reacts || !member?.permissions.has(PermissionFlagsBits.KickMembers)) {
            await messageReaction.users.remove(user as User);
            return null;
        }

        return {
            reacts,
            channel,
            member
        };
    }

    return null;
}