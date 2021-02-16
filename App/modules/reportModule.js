function reportModule() {
    const discordConfig = require('../config_files/discord');

    const messageBuilder = require('../common/messageBuilder');
    const vectorCalculator = require('../common/vectors');
    const countryInfo = require('../common/countryInfo');

    const dbConnect = require('../connectors/dbConnect');

    const discord = require('discord.js');

    const teams = ['neutral', 'allies', 'axis'];
    const factory$ = 1500000,
        mine$ = 500000,
        rig$ = 100000000;
    const regions = ['Antarctica', 'Europe', 'Middle East', 'North America', 'South America', 'Africa', 'Asia', 'Australasia', 'Caribbean'];
    const shortRegions = ['ant', 'europe', 'middle', 'north', 'south', 'africa', 'asia', 'aust', 'carib'];

    return {
        execute,
    };

    async function execute(pCommand, fullMsg, xMsg) {
        if (
            xMsg.channel.id != discordConfig.channels.dev &&
            xMsg.channel.id != discordConfig.channels.allies &&
            xMsg.channel.id != discordConfig.channels.axis
        ) {
            return;
        }
        if (shortRegions.includes(pCommand)) {
            return continentMessageBuilder(fullMsg, shortRegions.indexOf(pCommand), xMsg);
        }
        if (pCommand == 'totals') {
            return teamTotals(fullMsg, xMsg);
        }
        if (pCommand == 'prox' || pCommand == 'proximity') {
            return proximityAlert(fullMsg, xMsg);
        }
        if (pCommand == 'oil') {
            return facilityFinder(fullMsg, xMsg);
        }
        if (pCommand == 'factories' || pCommand == 'facs') {
            return facilityFinder(fullMsg, xMsg);
        }
    }

    async function proximityAlert(fullMsg, xMsg) {
        let em = await dbConnect.viewEarthMeta(),
            ea = await dbConnect.viewEarthActive(),
            time = 0,
            bonus = 0,
            hotspots = new Array(),
            co1 = new Object();
        let totals = {
            allies: { units: 0, factories: 0, mines: 0, rigs: 0, capped: 0, control: 0, income: 0 },
            axis: { units: 0, factories: 0, mines: 0, rigs: 0, capped: 0, control: 0, income: 0 },
        };

        for (let country in em) {
            if (em[country].name.toLowerCase() == fullMsg[1] || em[country].country_code.toLowerCase() == fullMsg[1]) {
                co1 = em[country];
                co1.name = await countryInfo.control(em[country].id);
                break;
            }
        }

        if (fullMsg[2] != undefined) {
            time = fullMsg[2];
        }
        if (fullMsg[3] != undefined) {
            bonus = fullMsg[3].replace('%', '');
        }

        for (let country in em) {
            let co2 = ea[country],
                haversine = await vectorCalculator.haversine([em[country].latitude, em[country].longitude], [co1.latitude, co1.longitude], bonus);
            if (haversine.eta < time && co1.id != co2.id && co2.allUnits > 0 && xMsg.channel.id != discordConfig.channels.allies) {
                hotspots.push([country, haversine]),
                    (totals.axis.units = totals.axis.units + co2.axUnits),
                    (totals.allies.units = totals.allies.units + co2.allUnits);
            }
            if (haversine.eta < time && co1.id != co2.id && co2.axUnits > 0 && xMsg.channel.id != discordConfig.channels.axis) {
                hotspots.push([country, haversine]),
                    (totals.axis.units = totals.axis.units + co2.axUnits),
                    (totals.allies.units = totals.allies.units + co2.allUnits);
            }
        }

        let embedMessage = new discord.MessageEmbed()
            .setColor('0099ff')
            .setTitle(`Scanning proximity for ${xMsg.channel.id == discordConfig.channels.axis ? `Allied` : `Axis`} units`)
            .setDescription(`Allies vs Axis within ${time} min(s) [${bonus}% bonus] of ${co1.name.text}:`)
            .addField(`Units`, `${totals.allies.units} vs ${totals.axis.units}`, true);

        for (var i = 0, len = hotspots.length; i < len; i++) {
            (hotspot = hotspots[i][0]), (active = ea[hotspot]), (meta = em[hotspot]);
            let countryName = await countryInfo.control(meta.id);
            embedMessage.addField('\u200b', `${countryName.text} - ${active.allUnits} vs ${active.axUnits} [${hotspots[i][1].eta} min(s)]`, false);
        }

        messageBuilder.rawChannelSend(xMsg, embedMessage);
    }

    async function continentMessageBuilder(fullMsg, continentID, xMsg) {
        let team = fullMsg[1] || 'neutral',
            colors = ['0099ff', '008000', 'FF0000'];
        let color = colors[teams.indexOf(team)];
        let totals = {
            allies: { units: 0, factories: 0, mines: 0, rigs: 0, capped: 0, control: 0, income: 0 },
            axis: { units: 0, factories: 0, mines: 0, rigs: 0, capped: 0, control: 0, income: 0 },
        };
        let cm = await dbConnect.viewEarthMeta(),
            ca = await dbConnect.viewEarthActive(),
            hotspots = [];
        for (var i = 0; i < Object.keys(ca).length; i++) {
            try {
                let country = ca[Object.keys(ca)[i]],
                    key = teams[country.team],
                    cont = cm[Object.keys(ca)[i]].continent_id,
                    units = country.allUnits + country.axUnits;
                if (cont == continentID) {
                    if (country.team != 0 && (country.control == 0 || country.control == 100)) {
                        totals[key].factories = totals[key].factories + Math.round(country.factories);
                        totals[key].mines = totals[key].mines + Math.round(country.mines);
                        totals[key].rigs = totals[key].rigs + Math.round(country.oilrigs);
                        totals[key].capped = totals[key].capped + 1;
                        totals[key].income =
                            totals[key].income +
                            (Math.round(country.factories) * factory$ + Math.round(country.mines) * mine$ + Math.round(country.oilrigs) * rig$);
                    }
                    if (country.control != 50) {
                        totals[key].control = totals[key].control + 1;
                    }
                    if ((units > 0 && team == 'neutral') || (country.allUnits > 0 && team == 'allies') || (country.axUnits > 0 && team == 'axis')) {
                        hotspots.push(Object.keys(ca)[i]);
                    }
                    (totals.axis.units = totals.axis.units + country.axUnits), (totals.allies.units = totals.allies.units + country.allUnits);
                }
            } catch {}
        }
        (totals.axis.income = Math.round(totals.axis.income / 100000000) / 10), (totals.allies.income = Math.round(totals.allies.income / 100000000) / 10);
        let embedMessage = new discord.MessageEmbed()
            .setColor(color)
            .setTitle(`${regions[continentID]} overview`)
            .setDescription(`Displaying Allies vs Axis for the continent:`)
            .addFields(
                {
                    name: `Capped/Uncapped`,
                    value: `${totals.allies.capped}/${totals.allies.control} vs ${totals.axis.capped}/${totals.axis.control}`,
                    inline: true,
                },
                { name: `Units`, value: `${totals.allies.units} vs ${totals.axis.units}`, inline: true },
                { name: `Factories`, value: `${totals.allies.factories} vs ${totals.axis.factories}`, inline: true },
                { name: `Oil Rigs`, value: `${totals.allies.rigs} vs ${totals.axis.rigs}`, inline: true },
                { name: `Mines`, value: `${totals.allies.mines} vs ${totals.axis.mines}`, inline: true },
                { name: `Income`, value: `${totals.allies.income}B vs ${totals.axis.income}B`, inline: true }
            );
        let Msg = '\n',
            alMsg = '\n',
            axMsg = '\n';
        for (var i = 0, len = hotspots.length; i < len; i++) {
            (hotspot = hotspots[i]), (active = ca[hotspot]), (meta = cm[hotspot]);
            let controlInfo = await countryInfo.control(meta.id);
            if (controlInfo.team == 0) {
                Msg += `${controlInfo.text} - ${active.allUnits} vs ${active.axUnits}\n`;
            }
            if (controlInfo.team == 1) {
                alMsg += `${controlInfo.text} - ${active.allUnits} vs ${active.axUnits}\n`;
            }
            if (controlInfo.team == 2) {
                axMsg += `${controlInfo.text} - ${active.allUnits} vs ${active.axUnits}\n`;
            }
        }
        if (alMsg != '\n') {
            embedMessage.addField('Allies', alMsg, false);
        }
        if (axMsg != '\n') {
            embedMessage.addField('Axis', axMsg, false);
        }
        messageBuilder.rawChannelSend(xMsg, embedMessage);
    }

    async function teamTotals(fullMsg, xMsg) {
        let em = await dbConnect.viewEarthMeta(),
            ea = await dbConnect.viewEarthActive();
        let totals = {
            allies: { units: 0, factories: 0, mines: 0, rigs: 0, capped: 0, control: 0, income: 0 },
            axis: { units: 0, factories: 0, mines: 0, rigs: 0, capped: 0, control: 0, income: 0 },
        };
        for (var i = 0; i < Object.keys(ea).length; i++) {
            let country = ea[Object.keys(ea)[i]],
                team = country.team,
                key = teams[team];
            if (team != 0 && (country.control == 0 || country.control == 100)) {
                totals[key].factories = totals[key].factories + Math.round(country.factories);
                totals[key].mines = totals[key].mines + Math.round(country.mines);
                totals[key].rigs = totals[key].rigs + Math.round(country.oilrigs);
                totals[key].capped = totals[key].capped + 1;
                totals[key].income =
                    totals[key].income + (Math.round(country.factories) * factory$ + Math.round(country.mines) * mine$ + Math.round(country.oilrigs) * rig$);
            }
            if (country.control != 50) {
                totals[key].control = totals[key].control + 1;
            }
            (totals.axis.units = totals.axis.units + country.axUnits), (totals.allies.units = totals.allies.units + country.allUnits);
        }
        (totals.axis.income = Math.round(totals.axis.income / 100000000) / 10), (totals.allies.income = Math.round(totals.allies.income / 100000000) / 10);
        let embedMessage = new discord.MessageEmbed()
            .setColor('0099ff')
            .setTitle(`World overview`)
            .setDescription(`Displaying Allies vs Axis for the world:`)
            .addFields(
                {
                    name: `Capped/Uncapped`,
                    value: `${totals.allies.capped}/${totals.allies.control} vs ${totals.axis.capped}/${totals.axis.control}`,
                    inline: true,
                },
                { name: `Units`, value: `${totals.allies.units} vs ${totals.axis.units}`, inline: true },
                { name: `Factories`, value: `${totals.allies.factories} vs ${totals.axis.factories}`, inline: true },
                { name: `Oil Rigs`, value: `${totals.allies.rigs} vs ${totals.axis.rigs}`, inline: true },
                { name: `Mines`, value: `${totals.allies.mines} vs ${totals.axis.mines}`, inline: true },
                { name: `Income`, value: `${totals.allies.income}B vs ${totals.axis.income}B`, inline: true }
            );
        messageBuilder.rawChannelSend(xMsg, embedMessage);
    }

    async function facilityFinder(fullMsg, xMsg) {
        if (fullMsg[0] == 'oil') {
            let ea = await dbConnect.viewEarthActive(),
                pct;
            let eaXrigs = await worldSort(ea, 'oilrigs');
            let oilProducers = {
                axis: new Array(),
                allies: new Array(),
            };
            let totals = {
                allies: { rigs: 0, income: 0 },
                axis: { rigs: 0, income: 0 },
            };
            for (var x = 0; x < eaXrigs.length; x++) {
                let country = ea[eaXrigs[x]],
                    team = country.team,
                    key = teams[team];
                if ((country.control == 0 || country.control == 100) && country.oilrigs > 0) {
                    totals[key].rigs = totals[key].rigs + Math.round(country.oilrigs);
                    totals[key].income = totals[key].income + Math.round(country.oilrigs) * rig$;
                    oilProducers[key].push(eaXrigs[x]);
                }
            }
            (totals.axis.income = Math.round(totals.axis.income / 100000000) / 10), (totals.allies.income = Math.round(totals.allies.income / 100000000) / 10);
            let alliesOil = `Count: ${totals['allies'].rigs} ($${totals['allies'].income}B)\n\n`,
                axisOil = `Count: ${totals['axis'].rigs} ($${totals['axis'].income}B)\n\n`;
            for (let x = 0; x < oilProducers['allies'].length; x++) {
                (producer = oilProducers['allies'][x]), (pct = ea[producer].oilrigs / totals['allies'].rigs);
                if (pct > 0.01) {
                    country = await countryInfo.control(producer);
                    alliesOil = alliesOil + `${country.text} - ${Math.round(ea[producer].oilrigs)}\n`;
                }
            }
            for (let x = 0; x < oilProducers['axis'].length; x++) {
                (producer = oilProducers['axis'][x]), (pct = ea[producer].oilrigs / totals['axis'].rigs);
                if (pct > 0.01) {
                    country = await countryInfo.control(producer);
                    axisOil = axisOil + `${country.text} - ${Math.round(ea[producer].oilrigs)}\n`;
                }
            }
            let embedMessage = new discord.MessageEmbed()
                .setColor('0099ff')
                .setTitle(`Income calculator`)
                .setDescription(`**Oil Rig** income generating countries (displaying >1% of team total):`)
                .addField(`Allies`, alliesOil, true)
                .addField(`Axis`, axisOil, true);
            messageBuilder.rawChannelSend(xMsg, embedMessage);
        }
        if (fullMsg[0] == 'factories') {
            let ea = await dbConnect.viewEarthActive(),
                pct;
            let eaXfacs = await worldSort(ea, 'factories');
            let facProducers = {
                axis: new Array(),
                allies: new Array(),
            };
            let totals = {
                allies: { factories: 0, income: 0 },
                axis: { factories: 0, income: 0 },
            };
            for (var x = 0; x < eaXfacs.length; x++) {
                let country = ea[eaXfacs[x]],
                    team = country.team,
                    key = teams[team];
                if ((country.control == 0 || country.control == 100) && country.factories > 0) {
                    totals[key].factories = totals[key].factories + Math.round(country.factories);
                    totals[key].income = totals[key].income + Math.round(country.factories) * factory$;
                    facProducers[key].push(eaXfacs[x]);
                }
            }
            (totals.axis.income = Math.round(totals.axis.income / 100000000) / 10), (totals.allies.income = Math.round(totals.allies.income / 100000000) / 10);
            let alliesFac = `Count: ${totals['allies'].factories} ($${totals['allies'].income}B)\n\n`,
                axisFac = `Count: ${totals['axis'].factories} ($${totals['axis'].income}B)\n\n`;
            for (let x = 0; x < facProducers['allies'].length; x++) {
                (producer = facProducers['allies'][x]), (pct = ea[producer].factories / totals['allies'].factories);
                if (pct > 0.01) {
                    country = await countryInfo.control(producer);
                    alliesFac = alliesFac + `${country.text} - ${Math.round(ea[producer].factories)}\n`;
                }
            }
            for (let x = 0; x < facProducers['axis'].length; x++) {
                (producer = facProducers['axis'][x]), (pct = ea[producer].factories / totals['axis'].factories);
                if (pct > 0.01) {
                    country = await countryInfo.control(producer);
                    axisFac = axisFac + `${country.text} - ${Math.round(ea[producer].factories)}\n`;
                }
            }
            let embedMessage = new discord.MessageEmbed()
                .setColor('0099ff')
                .setTitle(`Income calculator`)
                .setDescription(`**Factory** income generating countries (displaying >1% of team total):`)
                .addField(`Allies`, alliesFac, true)
                .addField(`Axis`, axisFac, true);
            messageBuilder.rawChannelSend(xMsg, embedMessage);
        }
    }

    async function worldSort(worldObject, value) {
        return Object.entries(worldObject)
            .sort((a, b) => b[1][value] - a[1][value])
            .map((el) => el[0]);
    }
}

module.exports = reportModule();
