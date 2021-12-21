import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Guild } from "discord.js";

import { Command, CommandData, AfterJoin } from "../../decorators";
import { BotError } from "../../error";

export class Role {
    @CommandData({ type: "guild" })
    roleData() {
        return new SlashCommandBuilder()
            .setName("role")
            .setDescription("Configure roles")
            .setDefaultPermission(false)
            .addSubcommand((subcommand) =>
                subcommand
                    .setName("add")
                    .setDescription("Add new role")
                    .addStringOption((option) =>
                        option
                            .setName("type")
                            .setDescription("Which type of role to configure")
                            .setRequired(true)
                            .addChoices([
                                ["Allies", "allies"],
                                ["Axis", "axis"],
                                ["Spectator", "spectator"],
                                ["Bot admin", "admin"],
                            ])
                    )
                    .addRoleOption((option) =>
                        option
                            .setName("role")
                            .setDescription("Which role to use")
                            .setRequired(true)
                    )
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName("unset")
                    .setDescription("Unset a configured role")
                    .addStringOption((option) =>
                        option
                            .setName("type")
                            .setDescription("Which type of role to configure")
                            .setRequired(true)
                            .addChoices([
                                ["Allies", "allies"],
                                ["Axis", "axis"],
                                ["Spectator", "spectator"],
                                ["Bot admin", "admin"],
                            ])
                    )
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName("info")
                    .setDescription("List configured roles")
            )
            .toJSON();
    }

    @AfterJoin()
    async setPermission(guild: Guild) {}
}
