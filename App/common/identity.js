function identity() {
    return {
        resolveSingleUser,
    };

    async function resolveSingleUser(fullMsg, xMsg) {
        if (fullMsg[1] == undefined) {
            (guildMember = xMsg.member), (identifier = guildMember.id), (identifierType = 'discordid'), (displayName = guildMember.displayName);
        }

        if (fullMsg[1] != undefined) {
            guildMember = xMsg.mentions.users.first();
            if (!guildMember) {
                (identifier = fullMsg[1]), (identifierType = 'username'), (displayName = fullMsg[1]);
            }
            if (guildMember) {
                (identifier = guildMember.id), (identifierType = 'discordid'), (displayName = guildMember.displayName);
            }
        }

        return [identifier, identifierType, displayName];
    }
}

module.exports = identity();
