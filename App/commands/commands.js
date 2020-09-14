function Commands() {
    const List = require('./list');

    return {
        getPrimaryCommand,
        getCommandType,
    };

    function getPrimaryCommand(receivedMessage) {
        if (receivedMessage.webhookID) {
            let msg = receivedMessage.content;
            let splitCommand = ['autoverify', msg];
            let primaryCommand = 'autoverify';
            let result = { pCommand: primaryCommand, fullMsg: splitCommand };
            return result;
        }
        if (receivedMessage.content.charAt(0) == '!') {
            let fullCommand = receivedMessage.content.replace('!', '');
            let splitCommand = fullCommand.toLowerCase().replace(/\s\s+/g, ' ').split(' ');
            let primaryCommand = splitCommand[0];
            let result = { pCommand: primaryCommand, fullMsg: splitCommand };
            return result;
        }
    }

    function getCommandType(cmds) {
        if (cmds != undefined) {
            for (i = 0; i < Object.keys(List.types).length; i++) {
                let x = Object.keys(List.types)[i];
                if (List.types[x].indexOf(cmds.pCommand) > -1) {
                    return x;
                }
            }
        } else {
            return;
        }
    }
}

module.exports = Commands();
