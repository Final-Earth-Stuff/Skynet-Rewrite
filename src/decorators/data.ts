import { Collection, ApplicationCommandData } from "discord.js";

import { CommandHandler } from "./Command";
import { ButtonHandler } from "./Button";
import { EventKey, EventHandlerType } from "./EventHandler";
import { UpdateHook } from "./AfterCommandUpdate";
import { JobBody } from "./ScheduledJob";
import { AutocompleteHandler } from "./Completion";

export const commands = new Collection<string, CommandHandler>();

export const adminCommands = new Set<string>();

export const buttons = new Collection<string, ButtonHandler>();

export const globalCommandsData = new Array<ApplicationCommandData>();
export const guildCommandsData = new Array<ApplicationCommandData>();

export const eventHandlers = {} as {
    [K in EventKey]: Set<EventHandlerType<K>>;
};

export const updateHooks = new Set<UpdateHook>();

export const jobs = new Collection<string, JobBody>();

export const completionHandlers = new Collection<
    string | undefined,
    AutocompleteHandler
>();

export const optionCompletionMap = new Collection<
    string,
    Collection<string, string>
>();
