import { PrismaClient } from "@prisma/client";
import { GuildMember, PartialGuildMember } from "discord.js";

export const guildMemberRemoveService = async (
  prisma: PrismaClient,
  member: GuildMember | PartialGuildMember
) => {
  console.log(`[EventGuild] EventGuild.guildMemberRemove`);

  try {
    const userToRemove = await prisma.user.findFirst({
      where: {
        userId: member.user.id,
        guildId: member.guild.id,
      },
      include: {
        channel: true,
      },
    });

    if (userToRemove) {
      await member.guild.channels.fetch();
      const channelToRemove = member.guild.channels.cache.find(
        (r) => r.id === userToRemove.channel?.channelId
      );

      if (channelToRemove) {
        await channelToRemove?.delete("User has left the guild");
      }
    }
  } catch (e) {
    console.log(e);
  }

  console.log("".padEnd(100, "="));
};
