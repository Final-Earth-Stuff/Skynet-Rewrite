function adminModule() {
    const discordConfig = require('../config_files/discord');
    const discordProcessHandler = require('../common/discordProcessHandler');

    return {
        execute,
    };

    async function execute(pCommand, fullMsg, xMsg) {
        if (xMsg.author.id != '188266209207255041') {
            return;
        }
        if (pCommand == 'newround') {
            return newRound(fullMsg, xMsg);
        }
    }

    async function newRound(fullMsg, xMsg) {
        let xGld = await xMsg.guild.fetch();
        let xRle = await discordProcessHandler.resolveRoleID('Verified', xGld);
        let guildMembers = await xMsg.guild.members.fetch()
        let x = 1
        guildMembers.forEach(async (guildMember) => {
            if (guildMember.roles.cache.has(xRle)) {
                setTimeout(async () => {
                    await discordProcessHandler.setUserRole(xMsg, guildMember, ['Spectator', 'Verified'], undefined);
                }, 500 * x);
            } else {
                setTimeout(async () => {
                    await discordProcessHandler.setUserRole(xMsg, guildMember, [], undefined);
                }, 500 * x);
            }
            x++
        });
        return `Purged!`;
    }
}

module.exports = adminModule();
