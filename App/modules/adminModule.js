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
        let guildMembers = xGld.members.fetch();
        let xRle = await discordProcessHandler.resolveRoleID(['Verified'], xGld);
        guildMembers.forEach(async (guildMember, guildIndex) => {
            console.log(`${guildMember.id} => ${guildMember.roles.cache.has(xRle)}`);
            if (guildMember.roles.cache.has(xRle)) {
                setTimeout(async () => {
                    await discordProcessHandler.setUserRole(xMsg, guildMember, ['Spectator', 'Verified'], undefined);
                }, 250 * roleIndex * guildIndex);
            }
        });
        return `Purged!`;
    }
}

module.exports = adminModule();
