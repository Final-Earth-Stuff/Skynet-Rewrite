import yargs from "yargs";

export const parser = yargs(process.argv.slice(2))
    .usage("Usage: $0 <command> [options]")
    .help("h")
    .alias("h", "help")
    .options({
        t: {
            alias: "tracing",
            type: "boolean",
            default: false,
            desc: "Enable OTEL tracing",
        },
    })
    .command("bot", "Run the bot", (yargs) =>
        yargs.options({
            n: {
                alias: "no-jobs",
                type: "boolean",
                default: false,
                desc: "Don't start cron jobs",
            },
        })
    )
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
