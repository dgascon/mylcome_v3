import { Prisma } from "@prisma/client";
import { prisma } from "../main.js";
import fs from 'fs';
import { Guild, TextChannel } from "discord.js";

export interface ILogMessage {
    id: string;
    createdAt: string;
    user: {
        id: string;
        username: string;
        avatarUrl: string | null;
        tag: string | null;
    };
    channel: {
        id: string | null;
        name: string;
    };
    guild: {
        id: string;
    };
    content: string | null;
}

export interface ILogParams {
    channelName: string;
    channelId: string;
    logChannelId: string | null;
}

export const generateLog = async (guild: Guild, data: ILogParams): Promise<void> => {
    try {
        if (data.logChannelId) {
            const listMessages = await prisma.message.findMany({
                where: {
                    channel: {
                        channelId: data.channelId,
                        guildId: guild.id
                    }
                },
                include: {
                    user: true,
                    channel: true,
                },
                orderBy: {
                    createdAt: Prisma.SortOrder.asc
                }
            });

            const log: ILogMessage[] = [];

            for (const message of listMessages) {
                log.push({
                    id: message.messageId,
                    createdAt: message.createdAt.toDateString(),
                    user: {
                        id: message.user.userId,
                        username: message.user.username,
                        avatarUrl: message.user.avatarUrl,
                        tag: message.user.tag,
                    },
                    channel: {
                        id: message.channel.channelId,
                        name: data.channelName
                    },
                    guild: {
                        id: message.channel.guildId
                    },
                    content: message.content
                })
            }

            const pathFile = `./generatedLogs`;
            const nameFile = `${pathFile}/logs_of_${data.channelName}.json`;

            if (!fs.existsSync(pathFile)) {
                fs.mkdirSync(pathFile, { recursive: true });
            }

            await guild.channels.fetch();
            const channelToSendLog = guild.channels.cache.get(data.logChannelId!);

            if (channelToSendLog) {
                fs.writeFile(nameFile, JSON.stringify(log, null, 4), 'utf-8', async (err) => {
                    if (err) {
                        throw err;
                    }

                    if (channelToSendLog && channelToSendLog instanceof TextChannel) {
                        await channelToSendLog.send({
                            content: `Logs of ${data.channelName}`,
                            files: [nameFile]
                        }).then(r => {
                            fs.unlinkSync(nameFile);
                        })
                    } else {
                        fs.unlinkSync(nameFile);
                    }

                })
            }
        }
    } catch (e) {
        console.log(e);
    }
}