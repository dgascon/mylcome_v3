import {
  Channel,
  Config,
  Reaction,
  Role,
  User as PrismaUser,
} from "@prisma/client";
import {
  GuildMember,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  PermissionFlagsBits,
  User,
} from "discord.js";
import { prisma } from "../main.js";

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

export const checkMessageReaction = async (
  messageReaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
): Promise<ICheckMessageReaction | null> => {
  const channel = await prisma.channel.findFirst({
    where: {
      guildId: messageReaction.message.guildId!,
      channelId: messageReaction.message.channelId,
    },
    include: {
      user: true,
      config: {
        include: {
          roles: true,
        },
      },
    },
  });

  if (channel && !user.bot) {
    await messageReaction.message.guild!.members.fetch();

    const member = messageReaction.message.guild?.members.cache.get(user.id);

    const reacts = await prisma.reaction.findFirst({
      where: {
        config: {
          id: channel.config.id,
        },
        emoji: messageReaction.emoji.name!,
      },
    });

    if (!reacts || !member?.permissions.has(PermissionFlagsBits.KickMembers)) {
      await messageReaction.users.remove(user as User);
      return null;
    }

    return {
      reacts,
      channel,
      member,
    };
  }

  return null;
};
