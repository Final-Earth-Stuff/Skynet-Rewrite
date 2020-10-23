function scanningModule() {
    const discordConfig = require('../config_files/discord');
    const secure = require('../../secure.json');
    
    const messageBuilder = require('../common/messageBuilder');
    const vectorCalculator = require('../common/vectors');
    const countryInfo = require('../common/countryInfo');

    const earthScan = require('../connectors/earthScan');
    const dbConnect = require('../connectors/dbConnect');

    const discord = require('discord.js');
    const client = new discord.Client();
    client.login(secure.discord.token);

    const cron = require('node-cron');
    cron.schedule('* * * * *', function () {
        try {
            scanEarth();
        } catch (err) {
            console.log(err);
        }
    });

    return {
        execute,
    };

    async function execute(pCommand, fullMsg, xMsg) {
        if (xMsg.channel.id != discordConfig.channels.dev) {
            return;
        }
        if (pCommand == 'init') {
            return initialiseEarth(fullMsg, xMsg);
        }
        if (pCommand == 'scan') {
            return scanEarth(fullMsg, xMsg);
        }
    }

    async function initialiseEarth(fullMsg, xMsg) {
        messageBuilder.rawChannelSend(xMsg, `Initialising, please wait...`);
        let timer = new Object();
        timer.start = Date.now();

        let data = await earthScan.getEarth();
        let countries = data.arr1;
        let travel = data.travel;

        let purgeEarthMeta = await dbConnect.purgeEarthMeta();

        let regions = ['Antarctica', 'Europe', 'Middle East', 'North America', 'South America', 'Africa', 'Asia', 'Australasia', 'Caribbean'];
        let countryMeta, values;
        for (let country in countries) {
            countryMeta = new Object();
            countryMeta.id = countries[country].id;
            countryMeta.name = countries[country].name;
            countryMeta.country_code = country.toLowerCase();
            countryMeta.latitude = travel[countryMeta.id].latLng[0];
            countryMeta.longitude = travel[countryMeta.id].latLng[1];
            countryMeta.continent_id = regions.indexOf(countries[country].region);
            countryMeta.island = travel[countryMeta.id].island;
            countryMeta.coastline = countries[country].coastline;
            values = new Array();
            for (let key in countryMeta) {
                values.push(countryMeta[key]);
            }
            let response = await dbConnect.initialiseEarth(values);
        }
        let viewEarthMeta = await dbConnect.viewEarthMeta();
        timer.end = Date.now();
        timer.elapsed = (timer.end - timer.start) / 1000;
        messageBuilder.rawChannelSend(xMsg, `${viewEarthMeta.length} countries were initialised in ${timer.elapsed} seconds.`);
    }

    async function scanEarth(fullMsg, xMsg) {
        // messageBuilder.rawChannelSend(xMsg, `Scanning, please wait...`)
        // let timer = new Object; timer.start = Date.now()

        let data = await earthScan.getEarth();
        let countries = data.arr1;

        let viewEarthActive = await dbConnect.viewEarthActive();

        //	let purgeEarthActive = await dbConnect.purgeEarthActive();

        let countryActive, values;
        //		for (let country in countries) {
        for (var i = 0, len = Object.keys(countries).length; i < len; i++) {
            try {
                let country = Object.keys(countries)[i];
                let countryid = countries[country].id;

                countryActive = new Object();
                countryActive.id = countries[country].id;
                countryActive.team = countries[country].team;
                countryActive.control = countries[country].control;
                countryActive.land = countries[country].land;
                countryActive.oilrigs = countries[country].oilrigs;
                countryActive.factories = Math.round(countries[country].factorys);
                countryActive.mines = Math.round(countries[country].mines);
                countryActive.adefence = countries[country].adefence;
                countryActive.gdefence = countries[country].gdefence;
                countryActive.allUnits = countries[country].allUnits;
                countryActive.axUnits = countries[country].axUnits;
                countryActive.allChg = countryActive.allUnits - viewEarthActive[countryid].allUnits;
                countryActive.axChg = countryActive.axUnits - viewEarthActive[countryid].axUnits;
                countryActive.adChg = countryActive.adefence - viewEarthActive[countryid].adefence;
                countryActive.gdChg = countryActive.gdefence - viewEarthActive[countryid].gdefence;
                countryActive.facChg = Math.round(countryActive.factories - viewEarthActive[countryid].factories);
                countryActive.mineChg = Math.round(countryActive.mines - viewEarthActive[countryid].mines);

                values = new Array();
                for (let key in countryActive) {
                    values.push(countryActive[key]);
                }
                dbConnect.insertActiveEarth(values);
                dbConnect.updateActiveEarth(values);
            } catch (err) {
                console.log(err);
            }
        }

        activeDevelopments(viewEarthActive, xMsg);
    }

    async function activeDevelopments(oldIntel, xMsg) {
        let co1s = await dbConnect.viewEarthActive();
        let changes = new Array(),
            activity = new Array();
        let i, x, co1, co2, from, to;

        for (i = 0, len = Object.keys(co1s).length; i < len; i++) {
            let co1 = co1s[Object.keys(co1s)[i]];
            if (co1.axChg != 0 || co1.allChg != 0 || co1.adChg != 0 || co1.gdChg != 0 || co1.facChg != 0 || co1.mineChg != 0) {
                changes.push(co1);
            }
        }

        for (i = 0; i < changes.length; i++) {
            co1 = changes[i];
            // check travel
            for (x = 0; x < changes.length; x++) {
                co2 = changes[x];
                if (co1.axChg == co2.axChg * -1 && co1.axChg != 0 && co1.id != co2.id) {
                    (from = co2.id), (to = co1.id);
                    if (co1.axChg < 0) {
                        (from = co1.id), (to = co2.id);
                    }
                    activity.push({ id: co1.id, type: 'movement', co1: co1, co2: co2, active: changes[x], destination: [from, to] });
                    (changes[x].axUnits = changes[x].axUnits + co1.axChg), (changes[x].axChg = 0), (changes[i].axChg = 0);
                }
                if (co1.allChg == co2.allChg * -1 && co1.allChg != 0 && co1.id != co2.id) {
                    (from = co2.id), (to = co1.id);
                    if (co1.allChg < 0) {
                        (from = co1.id), (to = co2.id);
                    }
                    activity.push({ id: co1.id, type: 'movement', co1: co1, co2: co2, destination: [from, to] });
                    (changes[x].allUnits = changes[x].allUnits + co1.allChg), (changes[x].allChg = 0), (changes[i].allChg = 0);
                }
            }
            // otherwise post unit changes
            if (co1.allChg != 0 || co1.axChg != 0) {
                activity.push({ id: co1.id, type: 'unitChg', co1: co1 });
            }
            if (co1.adChg != 0 || co1.gdChg != 0 || co1.facChg != 0 || co1.mineChg != 0) {
                activity.push({ id: co1.id, type: 'facilityChg', co1: co1 });
            }
        }

        let regions = ['Antarctica', 'Europe', 'Middle East', 'North America', 'South America', 'Africa', 'Asia', 'Australasia', 'Caribbean'];
        let em,
            em1,
            em2,
            ea1,
            ea2,
            embedMessage,
            haversine,
            max,
            min,
            units = new Object();

        for (i = 0; i < activity.length; i++) {
            log = activity[i];
            if (log.type == 'unitChg') {
                em = await dbConnect.viewEarthMeta(log.id);
                countryName = await countryInfo.control(log.id);
                embedMessage = new discord.MessageEmbed()
                    .setColor('0099ff')
                    .setTitle(`${countryName.text} [${regions[em[log.id].continent_id]}]`)
                    .setDescription(`Change in unit count detected:`)
                    .addFields(
                        { name: 'Allied forces', value: `${log.co1.allUnits} (${log.co1.allChg})`, inline: true },
                        { name: 'Axis forces', value: `${log.co1.axUnits} (${log.co1.axChg})`, inline: true }
                    );
                client.channels.fetch(discordConfig.channels.units).then((channel) => channel.send(embedMessage));
            }
            if (log.type == 'facilityChg') {
                em = await dbConnect.viewEarthMeta(log.id);
                countryName = await countryInfo.control(em[log.id].id);
                embedMessage = new discord.MessageEmbed()
                    .setColor('0099ff')
                    .setTitle(`${countryName.text} [${regions[em[log.id].continent_id]}]`)
                    .setDescription(`Change in facility count detected:`)
                    .addFields(
                        { name: 'Ground defences', value: `${log.co1.gdefence} (${log.co1.gdChg})`, inline: true },
                        { name: 'Air defences ', value: `${log.co1.adefence} (${log.co1.adChg})`, inline: true },
                        { name: 'Factories ', value: `${log.co1.factories} (${log.co1.facChg})`, inline: true },
                        { name: 'Mines ', value: `${log.co1.mines} (${log.co1.mineChg})`, inline: true }
                    );
                client.channels.fetch(discordConfig.channels.facilities).then((channel) => channel.send(embedMessage));
            }
            if (log.type == 'movement') {
                (co2 = log.destination[0]), (co1 = log.destination[1]);
                (em1 = await dbConnect.viewEarthMeta(co1)), (em2 = await dbConnect.viewEarthMeta(co2));
                (ea1 = await dbConnect.viewEarthActive(co1)), (ea2 = await dbConnect.viewEarthActive(co2));

                (units.axis = ea1[co1].axUnits), (units.axChg = ea1[co1].axChg), (units.allies = ea1[co1].allUnits), (units.allChg = ea1[co1].allChg);

                haversine = await vectorCalculator.haversine([em1[co1].latitude, em1[co1].longitude], [em2[co2].latitude, em2[co2].longitude], 0);
                (max = Math.round(haversine.eta)), (min = Math.round(haversine.eta * 0.75));

                let team;
                if (units.axChg > 0) {
                    (team = 'Axis'), (color = 'FF0000');
                }
                if (units.allChg > 0) {
                    (team = 'Allied'), (color = '008000');
                }

                cname1 = await countryInfo.control(em1[co1].id);
                cname2 = await countryInfo.control(em2[co2].id);

                embedMessage = new discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(`${cname1.text} [${regions[em1[co1].continent_id]}]`)
                    .setDescription(`${team} units have arrived from ${cname2.text} (${min}-${max}mins)`)
                    .addFields(
                        { name: 'Allied forces', value: `${units.allies} (${units.allChg})`, inline: true },
                        { name: 'Axis forces', value: `${units.axis} (${units.axChg})`, inline: true }
                    );
                client.channels.fetch(discordConfig.channels.units).then((channel) => channel.send(embedMessage));
            }
        }
    }
}

module.exports = scanningModule();
