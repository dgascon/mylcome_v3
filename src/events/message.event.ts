import { GuildMember, MessageReaction, PartialMessageReaction, PartialUser, PermissionFlagsBits, User } from "discord.js";
import type { ArgsOf } from "discordx";
import { Discord, On } from "discordx";
import { getChannelCacheByGuildId } from "../helpers/channelCache.helper.js";
import { prisma } from "../main.js";
import { RoleNotFound } from "../errors/roleNotFound.error.js";
import { ICheckMessageReaction, checkMessageReaction } from "../helpers/messageReaction.helper.js";

@Discord()
export class EventMessage {
    @On("messageCreate")
    public async onMessageCreate([message]: ArgsOf<"messageCreate">): Promise<void> {
        const isCachedChannel = await getChannelCacheByGuildId(message.guildId!, message.channelId);

        if (isCachedChannel) {
            let content = message.content;

            if (message.embeds.length > 0) {
                content += `\n${message.embeds.map(r => r.description).join('\n')}`
            }

            await prisma.message.create({
                data: {
                    messageId: message.id,
                    content,
                    user: {
                        connectOrCreate: {
                            create: {
                                userId: message.author.id,
                                username: message.author.username,
                                avatarUrl: message.author.avatarURL({ extension: "jpg" }) ?? message.author.defaultAvatarURL,
                                guildId: message.guildId!,
                                tag: message.author.tag,
                            },
                            where: {
                                userId_guildId: {
                                    guildId: message.guildId!,
                                    userId: message.author.id
                                }
                            }
                        }
                    },
                    channel: {
                        connect: {
                            channelId_guildId: {
                                channelId: message.channelId,
                                guildId: message.guildId!
                            }
                        }
                    }
                },
            })
        }
    }

    @On("messageUpdate")
    public async onMessageUpdate([oldMessage, newMessage]: ArgsOf<"messageUpdate">): Promise<void> {
        const isCachedChannel = await getChannelCacheByGuildId(oldMessage.guildId!, newMessage.channelId);

        if (isCachedChannel) {
            const channel = await prisma.channel.findFirst({
                where: {
                    channelId: isCachedChannel.channelId,
                    guildId: isCachedChannel.guildId
                }
            })

            await prisma.message.update({
                data: {
                    messageId: newMessage.id,
                    content: newMessage.content ?? oldMessage.content ?? ""
                },
                where: {
                    messageId_channelId: {
                        messageId: oldMessage.id,
                        channelId: channel?.id!
                    }
                }
            });
        }
    }

    @On("messageReactionAdd")
    public async onMessageReactionAdd([messageReaction, user]: ArgsOf<"messageReactionAdd">): Promise<void> {
        try {
            const data: ICheckMessageReaction | null = await checkMessageReaction(messageReaction, user);

            if (data) {
                const targetMember = messageReaction.message.guild!.members.cache.get(data.channel.user.userId);
                await messageReaction.message.guild!.roles.fetch();

                if (data.reacts.rule === 'close') {
                    if (data.channel.config.roles.length > 0) {
                        await targetMember?.roles.remove(data.channel.config.roles.filter(r => r.toRemove === true).map(r => r.roleId), `${user.username} closed channel.`)
                    }
                    await messageReaction.message.channel.delete(`${user.username} closed channel.`);
                } else {

                    if (targetMember) {
                        await targetMember.roles.add(data.reacts.rule, `${user.username} give a role`)
                            .catch(e => {
                                throw new RoleNotFound(messageReaction.message.guildId!, data.reacts.rule);
                            })
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }
    }

    @On("messageReactionRemove")
    public async onMessageReactionRemove([messageReaction, user]: ArgsOf<"messageReactionRemove">): Promise<void> {
        try {
            const data: ICheckMessageReaction | null = await checkMessageReaction(messageReaction, user);

            if (data) {
                if (data.reacts.rule !== 'close') {
                    const targetMember = messageReaction.message.guild!.members.cache.get(data.channel.user.userId);

                    if (targetMember) {
                        await messageReaction.message.guild!.roles.fetch();
                        await targetMember.roles.remove(data.reacts.rule, `${user.username} remove a role`)
                            .catch(e => {
                                throw new RoleNotFound(messageReaction.message.guildId!, data.reacts.rule);
                            })
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }
    }


}