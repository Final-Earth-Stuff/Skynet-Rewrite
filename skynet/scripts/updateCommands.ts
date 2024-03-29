import { REST } from "@discordjs/rest";
import {
    Routes,
    APIApplication,
    APIApplicationCommand,
} from "discord-api-types/v10";

import { AppDataSource } from "../index.js";
import { config } from "../config.js";
import { makeLogger } from "../logger.js";
import { loadHandlers } from "../decorators/index.js";

import { Guild } from "../entity/Guild.js";
import { CommandRepository } from "../repository/CommandRepository.js";

const logger = makeLogger(import.meta);

const rest = new REST({ version: "10" }).setToken(config.botToken);

export async function updateCommands(globalsToGuilds: boolean) {
    try {
        logger.info("Loading handlers...");
        const handlers = await loadHandlers();

        logger.info("Updating application commands...");
        const app = (await rest.get(
            Routes.oauth2CurrentApplication()
        )) as APIApplication;
        if (!globalsToGuilds) {
            await rest.put(Routes.applicationCommands(app.id), {
                body: handlers.globalData,
            });
        }

        const guildCommands = [...handlers.guildData];
        if (globalsToGuilds) {
            logger.info("Will write global commands to guilds instead...");
            guildCommands.push(...handlers.globalData);
        }

        const guilds = await AppDataSource.getRepository(Guild).find({
            select: { guild_id: true },
        });

        await Promise.all(
            guilds.map(async (guild) => {
                const commands = (await rest.put(
                    Routes.applicationGuildCommands(app.id, guild.guild_id),
                    { body: guildCommands }
                )) as APIApplicationCommand[];

                await CommandRepository.replaceGuildCommands(
                    commands,
                    guild.guild_id
                );
            })
        );
        logger.info("Success!");
    } catch (e) {
        logger.error("An occured while updating application commands: %O", e);
    }
}
