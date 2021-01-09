function FinalEarth() {
    const secure = require('../../../fe_secure.json');
    const handler = require('./commands/commands');
    const messageBuilder = require('./common/messageBuilder');

    const scanningModule = require('./modules/scanningModule');
    const utilityModule = require('./modules/utilityModule');
    const reportModule = require('./modules/reportModule');
    const adminModule = require('./modules/adminModule')

    const moment = require('moment');
    const discord = require('discord.js');

    const client = new discord.Client();
    client.login(secure.discord.token);
    client.on('ready', () => {
        console.log(`[${moment().format('LTS')}] > FinalEarth discordapp has been successfully loaded!`);
    });

    client.on('message', (message) => {
        if (message.author == client.user) {
            return;
        }
        processCommand(message);
    });

    async function processCommand(xMsg) {
        let commands = handler.getPrimaryCommand(xMsg);
        let commandType = handler.getCommandType(commands);
        if (commandType === 'scanning') {
            let msg = await scanningModule.execute(commands.pCommand, commands.fullMsg, xMsg);
            messageBuilder.rawChannelSend(xMsg, msg);
            return;
        }
        if (commandType === 'report') {
            let msg = await reportModule.execute(commands.pCommand, commands.fullMsg, xMsg);
            messageBuilder.rawChannelSend(xMsg, msg);
            return;
        }
        if (commandType === 'utility') {
            let msg = await utilityModule.execute(commands.pCommand, commands.fullMsg, xMsg);
            messageBuilder.rawChannelSend(xMsg, msg);
            return;
        }
        if (commandType === 'admin') {
            let msg = await adminModule.execute(commands.pCommand, commands.fullMsg, xMsg);
            messageBuilder.rawChannelSend(xMsg, msg);
            return;
        }
    }
}

module.exports = FinalEarth();
