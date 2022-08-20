import { Prisma } from "@prisma/client";
import { Message, MessageReaction } from "discord.js";
import type { ArgsOf } from "discordx";
import { Discord, On } from "discordx";
import 'dotenv/config';
import { ConfigNotFound } from "../errors/configNotFound.error.js";
import { createGuildChannelText, sendMessageToChannel } from "../helpers/channel.helper.js";
import { generatingText } from '../helpers/templatingGenerator.helper.js';
import { prisma } from "../main.js";

@Discord()
export class EventGuild {
    @On("guildCreate")
    public async onGuildCreate([guild]: ArgsOf<"guildCreate">): Promise<void> {
        try {
            await prisma.guild.create({
                data: {
                    id: guild.id,
                    configs: {
                        create: [{}]
                    }
                }
            });
        } catch (e) {
            console.log(e)
        }
    }

    @On("guildDelete")
    public async onGuildDelete([guild]: ArgsOf<"guildDelete">): Promise<void> {
        try {
            await prisma.guild.delete({
                where: {
                    id: guild.id
                }
            });
        } catch (e) {
            console.log(e)
        }
    }

    @On("guildMemberAdd")
    public async onGuildMemberAdd([member]: ArgsOf<"guildMemberAdd">): Promise<void> {
        try {
            const config = await prisma.config.findFirstOrThrow({
                where: {
                    guildId: member.guild.id,
                },
                orderBy: {
                    createdAt: Prisma.SortOrder.desc
                },
                include: {
                    roles: {
                        where: {
                            toRemove: false,
                        }
                    },
                    reactions: true,
                },
            }).catch(() => {
                throw new ConfigNotFound(member.guild.id)
            })

            const channelText = await createGuildChannelText(member, config);

            await channelText.permissionOverwrites.edit(member.id, {
                ViewChannel: true
            });

            if (config.roles && config.roles.length > 0) {
                await member.roles.add(config.roles.map(r => r.roleId), "New User")
            }

            const messagesSended: Message<boolean>[] = await sendMessageToChannel(
                channelText,
                generatingText(config.presentation, { member })
            );

            const lastSendedMessage: Message<boolean> = messagesSended[messagesSended.length - 1];

            if (config.reactions && config.reactions.length > 0) {
                const listMessageReactions: Promise<MessageReaction>[] = [];

                for (const mention of config.reactions) {
                    listMessageReactions.push(lastSendedMessage.react(mention.emoji));
                }

                await Promise.all(listMessageReactions);
            }
        } catch (e) {
            console.log(e);
        }
    }

    @On("guildMemberRemove")
    public async onGuildMemberRemove([member]: ArgsOf<"guildMemberRemove">): Promise<void> {
        try {
            const userToRemove = await prisma.user.findFirst({
                where: {
                    userId: member.user.id,
                    guildId: member.guild.id
                },
                include: {
                    channel: true,
                }
            });

            if (userToRemove) {
                await member.guild.channels.fetch();
                const channelToRemove = member.guild.channels.cache.find(r => r.id === userToRemove.channel?.channelId);

                if (channelToRemove) {
                    await channelToRemove?.delete("User has left the guild");
                }
            }
        } catch (e) {
            console.log(e);
        }
    }
}
