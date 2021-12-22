import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Guild, MessageEmbed } from "discord.js";
import { getCustomRepository } from "typeorm";

import { Command, CommandData, AfterJoin } from "../../decorators";
import { BotError } from "../../error";

import { CommandRepository } from "../../repository/CommandRepository";
import { PermissionRepository } from "../../repository/PermissionRepository";
import { PermissionType, Permission } from "../../entity/Permission";

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

    @Command({ name: "role" })
    async role(interaction: CommandInteraction): Promise<void> {
        const subCommand = interaction.options.getSubcommand(true);

        switch (subCommand) {
            case "add":
                await this.roleAdd(interaction);
                break;
            default:
                throw new BotError("Not implemented");
        }
    }

    async roleAdd(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        const role = interaction.options.getRole("role", true);

        switch (interaction.options.getString("type")) {
            case "admin":
                {
                    const commandRepository =
                        getCustomRepository(CommandRepository);
                    const commandId =
                        await commandRepository.getGuildCommandIdByName(
                            "role",
                            interaction.guildId
                        );
                    if (!commandId) return;

                    await interaction.guild?.commands.permissions.add({
                        command: commandId,
                        permissions: [
                            {
                                type: "ROLE",
                                id: role.id,
                                permission: true,
                            },
                        ],
                    });
                    const permissionRepository =
                        getCustomRepository(PermissionRepository);

                    // repository upsert is broken
                    await permissionRepository
                        .createQueryBuilder()
                        .insert()
                        .into(Permission)
                        .values({
                            id: role.id,
                            type: PermissionType.ROLE,
                            command: { command_id: commandId },
                        })
                        .orUpdate(["id", "command_id"], ["id"])
                        .execute();
                }
                break;
            default:
                throw new BotError("Not implemented");
        }

        const success = new MessageEmbed()
            .setDescription("Success!")
            .setColor("DARK_GREEN");
        await interaction.editReply({ embeds: [success] });
    }

    @AfterJoin()
    async setPermission(guild: Guild) {
        const commandRepository = getCustomRepository(CommandRepository);

        const commandId = await commandRepository.getGuildCommandIdByName(
            "role",
            guild.id
        );
        if (!commandId) return; /* This shouldn't happen */

        await guild.commands.permissions.add({
            command: commandId,
            permissions: [
                {
                    type: "USER",
                    id: guild.ownerId,
                    permission: true,
                },
            ],
        });

        const permissionRepository = getCustomRepository(PermissionRepository);

        await permissionRepository.insert({
            id: guild.ownerId,
            type: PermissionType.USER,
            command: { command_id: commandId },
        });
    }
}
