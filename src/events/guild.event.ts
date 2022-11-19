import type { ArgsOf } from "discordx";
import { Discord, On } from "discordx";
import "dotenv/config";
import { prisma } from "../main.js";
import { GuildMemberAddService } from "../services/guildMemberAdd.js";
import { guildMemberRemoveService } from "../services/guildMemberRemove.js";

@Discord()
export class EventGuild {
  @On("guildCreate")
  public async onGuildCreate([guild]: ArgsOf<"guildCreate">): Promise<void> {
    console.log(`[EventGuild] EventGuild.onGuildCreate`);

    try {
      await prisma.guild.create({
        data: {
          id: guild.id,
          configs: {
            create: [{}],
          },
        },
      });
    } catch (e) {
      console.log(e);
    }
    console.log("".padEnd(100, "="));
  }

  @On("guildDelete")
  public async onGuildDelete([guild]: ArgsOf<"guildDelete">): Promise<void> {
    console.log(`[EventGuild] EventGuild.onGuildDelete`);

    try {
      await prisma.guild.delete({
        where: {
          id: guild.id,
        },
      });
    } catch (e) {
      console.log(e);
    }
    console.log("".padEnd(100, "="));
  }

  @On("guildMemberAdd")
  public async onGuildMemberAdd([
    member,
  ]: ArgsOf<"guildMemberAdd">): Promise<void> {
    await GuildMemberAddService(prisma, member);
  }

  @On("guildMemberRemove")
  public async onGuildMemberRemove([
    member,
  ]: ArgsOf<"guildMemberRemove">): Promise<void> {
    await guildMemberRemoveService(prisma, member);
  }
}
