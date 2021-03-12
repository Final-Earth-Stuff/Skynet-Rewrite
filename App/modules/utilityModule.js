function utilityModule() {
    const discordConfig = require('../config_files/discord');

    const messageBuilder = require('../common/messageBuilder');
    const vectorCalculator = require('../common/vectors');
    const resolveIdentity = require('../common/identity');
    const discordProcessHandler = require('../common/discordProcessHandler');

    const dbConnect = require('../connectors/dbConnect');
    const discordVerify = require('../connectors/discordVerify');

    const discord = require('discord.js');

    return {
        execute,
    };

    async function execute(pCommand, fullMsg, xMsg) {
        if (
            xMsg.channel.id != discordConfig.channels.dev &&
            xMsg.channel.id != discordConfig.channels.webhook &&
            xMsg.channel.id != discordConfig.channels.lobby &&
            xMsg.channel.id != discordConfig.channels.allies &&
            xMsg.channel.id != discordConfig.channels.axis
        ) {
            return;
        }
        if (pCommand == 'remind') {
            return createReminder(fullMsg, xMsg);
        }
        if (pCommand == 'route') {
            return routeFinder(fullMsg, xMsg);
        }
        if (pCommand == 'dis' || pCommand == 'distance') {
            return distanceCalculator(fullMsg, xMsg);
        }
        if (pCommand == 'verify') {
            return verification(fullMsg, xMsg);
        }
        if (pCommand == 'autoverify') {
            return verification(fullMsg, xMsg);
        }
    }

    async function verification(fullMsg, xMsg) {
        let teams = ['Allies', 'Axis', 'Auto'],
            team = 'Spectator',
            whois,
            guildMember;
        if (fullMsg[0] == 'verify') {
            let user = await resolveIdentity.resolveSingleUser(fullMsg, xMsg);
            if (user[1] != 'discordid') {
                return 'Please use this command on a valid discord user.';
            }
            whois = await discordVerify.getUser(user[0], xMsg);
            if (whois.error != undefined) {
                return 'Please visit <https://www.finalearth.com/discord> and authorize!';
            }
        }
        if (fullMsg[0] == 'autoverify' && xMsg.channel.id == discordConfig.channels.webhook) {
            whois = JSON.parse(fullMsg[1]);
            if (whois.error != undefined) {
                return;
            }
        }
        if (whois.discord_id > 0) {
            guildMember = await xMsg.guild.members.fetch(whois.discord_id);
            if (teams.indexOf(whois.team) > -1) {
                team = teams[teams.indexOf(whois.team)];
            }
            await discordProcessHandler.removeUserRole(xMsg, guildMember, ['Allies', 'Axis', 'Auto', 'Spectator'], null);
            await discordProcessHandler.addUserRole(xMsg, guildMember, [team, 'Verified'], null);
            await guildMember.setNickname(whois.name).catch();
        }
    }

    async function createReminder(fullMsg, xMsg) {
        if (fullMsg[1] > 0) {
            let ms = fullMsg[1] * 60000,
                msg,
                resp = `You will be pinged in ${fullMsg[1]} min(s)`;
            if (fullMsg[2] != undefined) {
                msg = fullMsg.slice(2, fullMsg.length).toString().replace(/,/g, ' ');
                resp = resp + ` to ${msg}`;
            }
            messageBuilder.rawChannelSend(xMsg, resp);
            let reminder = setTimeout(() => {
                if (msg != undefined) {
                    xMsg.reply(`Here is your reminder to ${msg}`);
                } else {
                    xMsg.reply(`ping!`);
                }
            }, ms);
        }
    }

    async function routeFinder(fullMsg, xMsg) {
        let em = await dbConnect.viewEarthMeta(),
            route = new Array(),
            bonus = 0,
            co1,
            co2;
        for (let country in em) {
            if (em[country].name.toLowerCase() == fullMsg[1] || em[country].country_code.toLowerCase() == fullMsg[1]) {
                co1 = em[country];
            }
            if (em[country].name.toLowerCase() == fullMsg[2] || em[country].country_code.toLowerCase() == fullMsg[2]) {
                co2 = em[country];
            }
        }
        if (co1 == undefined || co2 == undefined || co1 == co2) {
            return `error`;
        }
        if (fullMsg[3] != undefined) {
            bonus = fullMsg[3].replace('%', '');
        }
        let a2c = await vectorCalculator.haversine([co1.latitude, co1.longitude], [co2.latitude, co2.longitude], bonus);

        route.push(co2);
        let node = await routeFinderAdvanced(co1, co2, bonus, em),
            i = 0;
        route.push(node);
        do {
            node = await routeFinderAdvanced(co1, route[route.length - 1], bonus, em);
            route.push(node);
        } while (route[route.length - 1] != undefined && route[route.length - 1].id != co1.id && route.length < 10);

        if (route.length > 9) {
            route = [];
        }

        route[route.length - 1] = co1;
        if (route.length > 2 && route[route.length - 2] != undefined) {
            let embedMessage = new discord.MessageEmbed()
                .setColor('0099ff')
                .setTitle(`Route planner`)
                .setDescription(`Plotting a route from ${co1.name} to ${co2.name} with a ${bonus}% travel bonus:`)
                .addField(`Direct (${a2c.eta} mins)`, `1. ${co1.name} to ${co2.name} (${a2c.eta})`, true);

            let indirectMessage = ``,
                stageeta = 0,
                totaleta = 0;
            for (var x = 0; x <= route.length + 2; x++) {
                let step = x + 1;
                try {
                    let haversine = await vectorCalculator.haversine(
                        [route[route.length - 1].latitude, route[route.length - 1].longitude],
                        [route[route.length - 2].latitude, route[route.length - 2].longitude],
                        bonus
                    );
                    stageeta = haversine.eta;
                    totaleta = totaleta + stageeta;
                    indirectMessage = indirectMessage + `${step}. ${route[route.length - 1].name} to ${route[route.length - 2].name} (${stageeta})\n`;
                    route.pop();
                } catch (err) {
                    console.log(err);
                }
            }
            embedMessage.addField(`Indirect (${totaleta} mins)`, indirectMessage, true);
            embedMessage.setFooter(`Please note this function is in BETA mode. Please report anything weird to Aurum.`);
            messageBuilder.rawChannelSend(xMsg, embedMessage);
        } else {
            let embedMessage = `No indirect route found`;
            messageBuilder.rawChannelSend(xMsg, embedMessage);
        }
    }

    async function routeFinderAdvanced(co1, co2, bonus, em) {
        let path = new Array(),
            min,
            tot = 9999,
            route;
        let a2c = await vectorCalculator.haversine([co1.latitude, co1.longitude], [co2.latitude, co2.longitude], bonus);
        for (let country in em) {
            let a2b = await vectorCalculator.haversine([co1.latitude, co1.longitude], [em[country].latitude, em[country].longitude], bonus);
            let b2c = await vectorCalculator.haversine([em[country].latitude, em[country].longitude], [co2.latitude, co2.longitude], bonus);
            let x = a2b.eta + b2c.eta;
            let exist = path.map((e) => {
                return e.id;
            });
            if (x < a2c.eta * 1.25 && co1.id != em[country].id && co2.id != em[country].id && exist.indexOf(em[country].id) == -1 && em[country].id != 0) {
                em[country].path = [a2b.eta, b2c.eta];
                path.push(em[country]);
            }
            if (co1.id == em[country].id) {
                (min = co1), (tot = b2c.eta);
                min.path = [0, a2c.eta];
            }
        }
        if (path.length > 1) {
            path = path.filter((obj) => obj.id !== co2.id);
            for (x = 0; x < path.length; x++) {
                country = path[x];
                let a2b = await vectorCalculator.haversine([co1.latitude, co1.longitude], [country.latitude, country.longitude], bonus);
                let b2c = await vectorCalculator.haversine([country.latitude, country.longitude], [co2.latitude, co2.longitude], bonus);
                if (min == undefined || (a2b.eta < min.path[1] && b2c.eta < min.path[1])) {
                    min = country;
                }
            }
        }
        if (path.length == 1) {
            min = path[0];
        }
        if (path.length == 0) {
            min = undefined;
        }
        return min;
    }

    async function distanceCalculator(fullMsg, xMsg) {
        let em = await dbConnect.viewEarthMeta(),
            co1 = new Object(),
            co2 = new Object(),
            bonus = 0;
        for (let country in em) {
            if (em[country].name.toLowerCase() == fullMsg[1] || em[country].country_code.toLowerCase() == fullMsg[1]) {
                co1 = em[country];
            }
            if (em[country].name.toLowerCase() == fullMsg[2] || em[country].country_code.toLowerCase() == fullMsg[2]) {
                co2 = em[country];
            }
        }
        if (fullMsg[3] != undefined) {
            bonus = fullMsg[3].replace('%', '');
        }
        let haversine = await vectorCalculator.haversine([co1.latitude, co1.longitude], [co2.latitude, co2.longitude], bonus);
        let embedMessage = new discord.MessageEmbed()
            .setColor('0099ff')
            .setTitle(`Countries: ${co1.name} & ${co2.name}`)
            .setDescription(`From ${co1.name} to ${co2.name} with a ${bonus}% travel bonus:`)
            .addFields({ name: 'Distance', value: `${haversine.dist} km`, inline: true }, { name: 'Duration', value: `${haversine.eta} mins`, inline: true });
        messageBuilder.rawChannelSend(xMsg, embedMessage);
    }
}

module.exports = utilityModule();
