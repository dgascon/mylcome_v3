import { prisma, cachedChannelIds } from '../main.js';

export interface ICachedMessage {
    channelId: string;
    guildId: string
}

export const loadChannelCache = async () => {
    const listChannelInDb = await prisma.channel.findMany({
        select: {
            channelId: true,
            guildId: true
        }
    });

    for (const channelData of listChannelInDb) {
        cachedChannelIds.push({
            channelId: channelData.channelId,
            guildId: channelData.guildId
        })
    }
}

export const getChannelCacheByGuildId = async (guildId: string, channelId: string): Promise<ICachedMessage> => {
    return new Promise((resolve, _reject) => {
        const channel = cachedChannelIds.find(r => {
            return r.guildId === guildId && r.channelId === channelId;
        });

        if (channel) {
            resolve(channel);
        }
    })
}

export const addChannelCache = async (data: ICachedMessage) => {
    cachedChannelIds.push(data);
}

export const removeChannelCache = async (dataToDeleted: ICachedMessage) => {
    cachedChannelIds.splice(cachedChannelIds.indexOf(dataToDeleted), 1);
}