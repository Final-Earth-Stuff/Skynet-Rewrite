import { EntityRepository, Repository } from "typeorm";

import { Collection, ApplicationCommand, Snowflake } from "discord.js";

import { Command } from "../entity/Command";

@EntityRepository(Command)
export class CommandRepository extends Repository<Command> {
    async getGuildCommandIdByName(
        name: string,
        guildId: string
    ): Promise<Command | undefined> {
        return await this.manager.findOne(Command, {
            where: {
                guild_id: guildId,
                command_name: name,
            },
            select: ["command_id"],
        });
    }

    async replaceGuildCommands(
        commands: Collection<Snowflake, ApplicationCommand>,
        guildId: string
    ): Promise<void> {
        await this.manager.transaction(async (manager) => {
            await manager.delete(Command, {
                guild_id: guildId,
            });

            manager.insert(
                Command,
                commands.map((command, id) => ({
                    command_id: id,
                    command_name: command.name,
                    guild_id: guildId,
                }))
            );
        });
    }
}
