import "reflect-metadata";

import { dirname, importx } from "@discordx/importer";
import { IntentsBitField, Message, Partials } from "discord.js";
import { Client } from "discordx";

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export const prisma = new PrismaClient({
  errorFormat: "pretty",
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "stdout",
      level: "error",
    },
    {
      emit: "stdout",
      level: "info",
    },
    {
      emit: "stdout",
      level: "warn",
    },
  ],
});

prisma.$on("query", (e) => {
  console.log("Query: " + e.query);
  console.log("Params: " + e.params);
  console.log("Duration: " + e.duration + "ms");
});

export const bot = new Client({
  // To only use global commands (use @Guild for specific guild command), comment this line
  botGuilds: ["839149273576505384"],

  // Discord intents
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction], // Necessary to receive reactions for uncached messages
  // Debug logs are disabled in silent mode
  silent: false,
});

bot.once("ready", async () => {
  await bot.initApplicationCommands();
  await bot.guilds.fetch();

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
