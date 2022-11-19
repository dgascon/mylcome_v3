import { Prisma } from "@prisma/client";
import { TextChannel } from "discord.js";
import type { ArgsOf } from "discordx";
import { Discord, On } from "discordx";
import "dotenv/config";
import { generateLog } from "../helpers/generateLogs.helper.js";
import { prisma } from "../main.js";

@Discord()
export class EventChannel {
  @On("channelDelete")
  public async onChannelDelete([
    channel,
  ]: ArgsOf<"channelDelete">): Promise<void> {
    console.log(`[EventChannel] EventChannel.onChannelDelete`);
    try {
      if (channel instanceof TextChannel) {
        const channelDeleted = await prisma.channel.findFirst({
          where: {
            channelId: channel.id,
            guildId: channel.guildId,
          },
          include: {
            guild: true,
            user: true,
          },
        });

        if (channelDeleted) {
          await generateLog(channel.guild, {
            channelId: channel.id,
            channelName: channel.name,
            logChannelId: channelDeleted?.guild.logChannelId ?? null,
          });

          await prisma.user
            .delete({
              where: {
                userId_guildId: {
                  userId: channelDeleted!.user.userId,
                  guildId: channelDeleted!.guild.id,
                },
              },
              include: {
                channel: true,
              },
            })
            .catch((e) => {
              if (e instanceof Prisma.PrismaClientKnownRequestError) {
                if (e.code !== "P2025") {
                  throw e;
                }
              } else {
                throw e;
              }
            });
        }
      }
    } catch (e) {
      console.log(e);
    }
    console.log("".padEnd(100, "="));
  }
}
