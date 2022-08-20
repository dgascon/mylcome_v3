import "reflect-metadata";

import { dirname, importx } from "@discordx/importer";
import { IntentsBitField, Message, Partials } from "discord.js";
import { Client } from "discordx";

import 'dotenv/config'
import { PrismaClient } from "@prisma/client";

import { ICachedMessage, loadChannelCache } from './helpers/channelCache.helper.js';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export const prisma = new PrismaClient();

export const bot = new Client({
  // To only use global commands (use @Guild for specific guild command), comment this line
  botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],

  // Discord intents
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction], // Necessary to receive reactions for uncached messages
  // Debug logs are disabled in silent mode
  silent: false,
});

export const cachedChannelIds: ICachedMessage[] = [];

bot.once("ready", async () => {
  await bot.guilds.fetch();

  await loadChannelCache();

  console.log("Bot started");
});

bot.on("interactionCreate", (interaction) => {
  bot.executeInteraction(interaction);
});

async function run() {
  await importx(dirname(import.meta.url) + "/{events,commands}/**/*.{ts,js}");

  // Let's start the bot
  if (!process.env.BOT_TOKEN) {
    throw Error("Could not find BOT_TOKEN in your environment");
  }

  // Log in with your bot token
  await bot.login(process.env.BOT_TOKEN);
}

run();
