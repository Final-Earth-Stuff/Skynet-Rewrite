function adminModule() {

    const discordConfig = require('../config_files/discord')
    const discordProcessHandler = require('../common/discordProcessHandler')

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
        let guildMembers = xGld.members.cache;
        let roles = [discordConfig.roles.allies, discordConfig.roles.axis];
        let roleNames = ['Allies', 'Axis']
        roles.forEach(async (role) => {
            let xRle = await discordProcessHandler.resolveRoleID(roleNames[roles.indexOf(role)], xGld)
            guildMembers.forEach(async (guildMember) => {
                if (guildMember.roles.cache.has(xRle)) {
                    await discordProcessHandler.removeUserRole(xMsg, guildMember, roleNames[roles.indexOf(role)], undefined)
                    await discordProcessHandler.addUserRole(xMsg, guildMember, 'Spectator', undefined)
                }
            });
        });
        return `Purged!`
    }
}

module.exports = adminModule();
