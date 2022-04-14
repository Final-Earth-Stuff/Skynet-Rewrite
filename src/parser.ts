import yargs from "yargs";

export const parser = yargs(process.argv.slice(2))
    .usage("Usage: $0 <command> [options]")
    .help("h")
    .alias("h", "help")
    .command("bot", "Run the bot")
    .command(
        "update_commands",
        "Update the discord slash command definitions",
        (yargs) =>
            yargs.options({
                g: {
                    alias: "globals-to-guilds",
                    type: "boolean",
                    default: false,
                    desc: "Write global commands to guilds instead for debugging purposes",
                },
            })
    )
    .command("update_resources", "Update static resources")
    .demandCommand(1)
    .strict();
