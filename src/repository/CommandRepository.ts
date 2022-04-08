import { In } from "typeorm";

import { ApplicationCommand } from "discord.js";
import { APIApplicationCommand } from "discord-api-types/v10";

import { Command } from "../entity/Command";
import { AppDataSource } from "../";

export const CommandRepository = AppDataSource.getRepository(Command).extend({
    async getGuildCommandIdsByName(
        names: string[],
        guildId: string
    ): Promise<string[]> {
        const command = await this.manager.find(Command, {
            where: {
                guild_id: guildId,
                command_name: In(names),
            },
            select: ["command_id"],
        });

        return command.map(({ command_id }) => command_id);
    },

    async replaceGuildCommands(
        commands: Iterable<ApplicationCommand | APIApplicationCommand>,
        guildId: string
    ): Promise<void> {
        await this.manager.transaction(async (manager) => {
            await manager.delete(Command, {
                guild_id: guildId,
            });

            manager.insert(
                Command,
                [...commands].map((command) => ({
                    command_id: command.id,
                    command_name: command.name,
                    guild_id: guildId,
                }))
            );
        });
    },
});
