import "reflect-metadata";

import dotenv from "dotenv";

import { Client, Intents } from "discord.js";

dotenv.config();
//this is a test
const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
});

client.on("ready", async (client) => {
    const guilds = await client.guilds.fetch();
    for (const partialGuild of guilds.values()) {
        const guild = await partialGuild.fetch();
        await guild.systemChannel?.send("Hello World!");
    }
});

client.login(process.env.BOT_TOKEN);
