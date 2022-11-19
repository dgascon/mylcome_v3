import { Prisma, PrismaClient } from "@prisma/client";
import { GuildMember, Message, MessageReaction } from "discord.js";
import { ConfigNotFound } from "../errors/configNotFound.error.js";
import {
  createGuildChannelText,
  sendMessageToChannel,
} from "../helpers/channel.helper.js";
import { generatingText } from "../helpers/templatingGenerator.helper.js";

export const GuildMemberAddService = async (
  prisma: PrismaClient,
  member: GuildMember
) => {
  console.log(`[EventGuild] EventGuild.onGuildMemberAdd`);
  try {
    const config = await prisma.config
      .findFirstOrThrow({
        where: {
          guildId: member.guild.id,
        },
        orderBy: {
          createdAt: Prisma.SortOrder.desc,
        },
        include: {
          roles: {
            where: {
              toRemove: false,
            },
          },
          reactions: true,
        },
      })
      .catch(() => {
        throw new ConfigNotFound(member.guild.id);
      });

    const channelText = await createGuildChannelText(member, config);

    await channelText.permissionOverwrites.edit(member.id, {
      ViewChannel: true,
    });

    if (config.roles && config.roles.length > 0) {
      await member.roles.add(
        config.roles.map((r) => r.roleId),
        "New User"
      );
    }

    const messagesSended: Message<boolean>[] = await sendMessageToChannel(
      channelText,
      generatingText(config.presentation, { member })
    );

    const lastSendedMessage: Message<boolean> =
      messagesSended[messagesSended.length - 1];

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
  console.log("".padEnd(100, "="));
};
