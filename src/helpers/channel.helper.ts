import { Config } from "@prisma/client";
import {
  CategoryChannel,
  ChannelType,
  Guild,
  GuildMember,
  Message,
  PermissionsBitField,
  TextChannel,
} from "discord.js";
import { prisma } from "../main.js";
import { splitToSubstrings } from "./string.helper.js";
import { generatingText } from "./templatingGenerator.helper.js";

export const sendMessageToChannel = async (
  channelToSendMessage: TextChannel,
  message: string,
  nSplit: number = 1999
): Promise<Message<boolean>[]> => {
  const splittedMessage = splitToSubstrings(message, nSplit);
  const messagesSended: Message<boolean>[] = [];

  for (const message of splittedMessage) {
    messagesSended.push(
      await channelToSendMessage.send({
        embeds: [
          {
            description: message,
            color: 0x0099ff,
          },
        ],
      })
    );
  }

  return messagesSended;
};

export const findOrCreateGuildCategory = async (
  guild: Guild,
  config: Config
): Promise<CategoryChannel> => {
  let categoryChannel: CategoryChannel | undefined = guild.channels.cache.find(
    (r) => {
      return r.id === config.parentId && r.type === ChannelType.GuildCategory;
    }
  ) as CategoryChannel;

  if (!categoryChannel) {
    categoryChannel = await guild.channels.create({
      name: process.env.DEFAULT_NAME_CATEGORY ?? "Welcome",
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
      ],
    });

    await prisma.config.update({
      where: {
        id: config.id,
      },
      data: {
        parentId: categoryChannel.id,
      },
    });
  }

  return categoryChannel;
};

export const createGuildChannelText = async (
  member: GuildMember,
  config: Config
): Promise<TextChannel> => {
  const categoryChannel: CategoryChannel = await findOrCreateGuildCategory(
    member.guild,
    config
  );

  const channelText: TextChannel = await member.guild.channels.create({
    name: generatingText(config.channelName, { member }),
    type: ChannelType.GuildText,
    parent: categoryChannel.id,
  });

  await prisma.channel
    .create({
      data: {
        channelId: channelText.id,
        config: {
          connect: {
            id: config.id,
          },
        },
        guild: {
          connect: {
            id: member.guild.id,
          },
        },
        user: {
          connectOrCreate: {
            create: {
              userId: member.user.id,
              username: member.user.username,
              avatarUrl:
                member.user.avatarURL({ extension: "jpg" }) ??
                member.user.defaultAvatarURL,
              tag: member.user.tag,
              guildId: member.guild.id,
            },
            where: {
              userId_guildId: {
                userId: member.user.id,
                guildId: member.guild.id,
              },
            },
          },
        },
      },
    })
    .catch((e) => {
      channelText.delete("Error on bot. Unsignifiant");
      throw e;
    });

  return channelText;
};
