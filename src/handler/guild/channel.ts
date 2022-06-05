import { SlashCommandBuilder } from "@discordjs/builders";
import { ChannelType } from "discord-api-types/v10";
import { CommandInteraction, MessageEmbed, Permissions } from "discord.js";

import { CommandHandler, SubCommand, CommandData } from "../../decorators";
import { BotError } from "../../error";

import { AppDataSource } from "../..";
import { Guild as GuildEntity } from "../../entity/Guild";
import { Color } from "../../service/util/constants";

@CommandHandler({ name: "channel" })
export class Channel {
    @CommandData({ type: "guild" })
    readonly data = new SlashCommandBuilder()
        .setName("channel")
        .setDescription("Configure channels")
        .setDefaultMemberPermissions(Permissions.FLAGS.MANAGE_ROLES)
        .addSubcommand((subcommand) =>
            subcommand
                .setName("add")
                .setDescription("Add new channel")
                .addStringOption((option) =>
                    option
                        .setName("type")
                        .setDescription("Which type of channel to configure")
                        .setRequired(true)
                        .addChoices(
                            { name: "Log", value: "log" },
                            { name: "Verify", value: "verify" },
                            {
                                name: "Troop Movements",
                                value: "troop_movement",
                            },
                            {
                                name: "Facility Updates",
                                value: "land_facility",
                            },
                            { name: "Command", value: "command" }
                        )
                )
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("Which channel to use")
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("remove")
                .setDescription("Unset a configured channel")
                .addStringOption((option) =>
                    option
                        .setName("type")
                        .setDescription("Which type of channel to unset")
                        .setRequired(true)
                        .addChoices(
                            { name: "Log", value: "log" },
                            { name: "Verify", value: "verify" },
                            {
                                name: "Troop Movements",
                                value: "troop_movement",
                            },
                            {
                                name: "Facility Updates",
                                value: "land_facility",
                            },
                            { name: "Command", value: "command" }
                        )
                )
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("Which channel to use")
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("info")
                .setDescription("List configured channels")
        )
        .toJSON();

    @SubCommand({ name: "add" })
    async channelAdd(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        const channel = interaction.options.getChannel("channel", true);
        const type = interaction.options.getString("type", true);

        const guildRepository = AppDataSource.getRepository(GuildEntity);

        await guildRepository.update(interaction.guildId ?? "", {
            [`${type}_channel`]: channel.id,
        });

        const success = new MessageEmbed()
            .setDescription(
                `Successfully set ${type} channel to <#${channel.id}>!`
            )
            .setColor(Color.GREEN);

        await interaction.editReply({ embeds: [success] });
    }

    @SubCommand({ name: "remove" })
    async channelRemove(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();

        const type = interaction.options.getString("type", true);

        const guildRepository = AppDataSource.getRepository(GuildEntity);

        await guildRepository.update(interaction.guildId ?? "", {
            [`${type}_channel`]: null,
        });

        const success = new MessageEmbed()
            .setDescription(`Successfully unset ${type} channel!`)
            .setColor(Color.GREEN);

        await interaction.editReply({ embeds: [success] });
    }

    @SubCommand({ name: "info" })
    async channelInfo(interaction: CommandInteraction): Promise<void> {
        const guildRepository = AppDataSource.getRepository(GuildEntity);
        const guild = await guildRepository.findOneOrFail({
            where: { guild_id: interaction.guildId ?? "" },
        });

        const embed = new MessageEmbed()
            .setTitle("Channels")
            .addField(
                "Verify",
                guild.verify_channel
                    ? `<#${guild.verify_channel}>`
                    : "Not configured",
                true
            )
            .addField(
                "Troop Movements",
                guild.troop_movement_channel
                    ? `<#${guild.troop_movement_channel}>`
                    : "Not configured",
                true
            )
            .addField(
                "Facility Updates",
                guild.land_facility_channel
                    ? `<#${guild.land_facility_channel}>`
                    : "Not configured",
                true
            )
            .addField(
                "Log",
                guild.log_channel
                    ? `<#${guild.log_channel}>`
                    : "Not configured",
                true
            )
            .setColor(Color.BLUE);

        await interaction.reply({ embeds: [embed] });
    }
}
