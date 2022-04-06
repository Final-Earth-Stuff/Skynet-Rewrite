# Skynet-Rewrite
A rewrite of the original Skynet Discord bot for the browser game [Final Earth](https://www.finalearth.com)

The rewrite is intended to make maintaining and adding new features easier. 

## Running the Bot Locally
A quick guide to setting up the bot to run locally for development purposes.

### Setup Bot
Go to https://discord.com/developers/applications to create a new Discord bot

Invite the bot to server for testing

Find the bot token and populate in your .env file

### Setup Database

Install PostGres database

`sudo apt install postgresql postgresql-contrib`


Start the server 

`sudo service postgresql start`


Open Psql terminal

`sudo -u postgres psql` 


Create a user and database and then enter those values into your .env file

### Configuration
Create a .env file with the following info:
```
BOT_TOKEN=xxxxx
API_KEY=xxxxx
DATABASE_NAME=xxxxx
DATABASE_USER=xxxxx
DATABASE_PASSWORD=xxxxx
```

### Run
Make sure you are using Node version 16 and up

Install dependencies 

`yarn install` 


Use one of the run commands to start the bot

`yarn run watch` `yarn run dev` 

