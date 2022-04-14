import { ButtonInteraction, MessageEmbed } from "discord.js";

import { BotError } from "../error";
import { makeLogger } from "../logger";

import { buttons } from "./data";

import { Color } from "../service/util/constants";

const logger = makeLogger(module);

export interface ButtonOptions {
    customId: string;
}

export type ButtonHandler = (interaction: ButtonInteraction) => Promise<void>;

export const Button =
    (options: ButtonOptions) =>
    (
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        target: any,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<ButtonHandler>
    ) => {
        const shared = target.shared ?? new target.constructor();
        if (!target.shared) {
            target.shared = shared;
        }
        let handler = descriptor.value;
        if (handler) {
            handler = handler.bind(shared);
            const wrapped = async (interaction: ButtonInteraction) => {
                try {
                    await handler?.(interaction);
                } catch (e) {
                    if (e instanceof BotError) {
                        const embed = new MessageEmbed()
                            .setColor(Color.BRIGHT_RED)
                            .setDescription(e.message);
                        await interaction.followUp({
                            embeds: [embed],
                            ephemeral: e.ephemeral,
                        });
                        logger.info(
                            "Caught 'BotError: %s' while processing button '%s'",
                            e.message,
                            options.customId
                        );
                        if (e.source) {
                            logger.debug("Source: %O", e.source);
                        }
                    } else {
                        logger.error(
                            "Encountered unexpected error while processing button '%s': %O",
                            options.customId,
                            e
                        );
                    }
                }
            };
            buttons.set(options.customId, wrapped);
        }
    };
