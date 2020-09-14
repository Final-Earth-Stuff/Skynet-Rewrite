function commandsHandler() {
    const commands = require('../commands/list.js');
    const discord = require('discord.js');

    return {
        rawChannelSend,
        memberSend,
    };

    function rawChannelSend(xMsg, message) {
        if (message == undefined) {
            return;
        }
        xMsg.channel.send(message).catch((err) => {
            console.log(err);
        });
    }

    function memberSend(xMsg, message) {
        if (message == undefined) {
            return;
        }
        xMsg.member.send(message).catch((err) => {
            console.log(err);
        });
    }
}

module.exports = commandsHandler();
