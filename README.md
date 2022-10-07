# Skynet-Rewrite

A rewrite of the original Skynet Discord bot for the browser game [Final Earth](https://www.finalearth.com)

The rewrite is intended to make maintaining and adding new features easier.

## Running the Bot Locally

A quick guide to setting up the bot to run locally for development purposes.

### Setup Bot

Go to https://discord.com/developers/applications to create a new Discord bot

Invite the bot to server for testing

Find the bot token and populate in your .env file

### Setup rust toolchain

The steps for installing oon your platform can be found [here](https://rustup.rs)

### Setup Database

Install PostgreSQL database

```bash
sudo apt install postgresql postgresql-contrib
```

Start the server

```bash
sudo service postgresql start
```

Open Psql terminal

```bash
sudo -u postgres psql
```

Create a user and database and then enter those values into your .env file

### Configuration

Create a .env file with the following info:

```env
BOT_TOKEN=xxxxx
API_KEY=xxxxx
DATABASE_NAME=xxxxx
DATABASE_USER=xxxxx
DATABASE_PASSWORD=xxxxx
```

### Run

Make sure you are using Node version 16 and up

Install dependencies

```bash
yarn install
```

Transpile the code

```bash
yarn build
```

Before first usage, you have to generate static assets and update the bot's application commands

```bash
yarn prod update_resources && yarn prod update_commands
```

To bot can then be run

```bash
yarn prod bot
```

### Tracing

If you wish to enable tracing, make sure that the OTEL grpc collector is listening on the default port and pass the `--tracing` flag to the binary, e.g.

```bash
yarn prod bot --tracing
```
