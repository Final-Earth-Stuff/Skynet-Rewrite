function dbConnect() {
    const secure = require('../../secure.json');
    const mysql = require('mysql');
    const db = require('../config_files/db');

    var pool = mysql.createPool({
        connectionLimit: 10,
        host: db.host,
        user: db.user,
        password: secure.database.password,
        database: db.database,
    });

    pool.on('error', function (err) {
        console.log(err.code);
    });

    pool.getConnection((err, connection) => {
        if (err) {
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                console.error('Database connection was closed.');
            }
            if (err.code === 'ER_CON_COUNT_ERROR') {
                console.error('Database has too many connections.');
            }
            if (err.code === 'ECONNREFUSED') {
                console.error('Database connection was refused.');
            }
        }
    });

    return {
        purgeEarthMeta,
        purgeEarthActive,
        initialiseEarth,
        insertActiveEarth,
        updateActiveEarth,
        viewEarthMeta,
        viewEarthActive,
        viewContinentMeta,
        viewContinentActive,
        viewEarthOil,
    };

    async function purgeEarthMeta() {
        let sql = `delete from countryMeta`;
        let res = await execute(sql);
        return res;
    }

    async function purgeEarthActive() {
        let sql = `delete from countryActive`;
        let res = await execute(sql);
        return res;
    }

    async function initialiseEarth(values) {
        let sql = `insert into countryMeta 
	(id, name, country_code, latitude, longitude, continent_id, island, coastline) values (?, ?, ?, ?, ?, ?, ?, ?)`;
        let res = await execute(sql, values);
        return res;
    }

    async function insertActiveEarth(values) {
        let sql = `insert ignore into countryActive (id, team, control, land, oilrigs, factories, mines, adefence, gdefence, allUnits, axUnits, allChg, axChg, adChg, gdChg, facChg, mineChg) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        let res = await execute(sql, values);
        return res;
    }

    async function updateActiveEarth(values) {
        let sql = `update countryActive set team = ${mysql.escape(values[1])}, control = ${mysql.escape(values[2])}, land = ${mysql.escape(
            values[3]
        )}, oilrigs = ${mysql.escape(values[4])}, 	factories = ${mysql.escape(values[5])}, 	mines = ${mysql.escape(values[6])}, 	adefence = ${mysql.escape(
            values[7]
        )}, 	gdefence = ${mysql.escape(values[8])}, 	allUnits = ${mysql.escape(values[9])}, axUnits = ${mysql.escape(values[10])}, 	allChg = ${mysql.escape(
            values[11]
        )}, 	axChg = ${mysql.escape(values[12])}, 	adChg = ${mysql.escape(values[13])},	gdChg = ${mysql.escape(values[14])},	facChg = ${mysql.escape(
            values[15]
        )},	mineChg = ${mysql.escape(values[16])} where id = ${mysql.escape(values[0])}`;
        let res = await execute(sql, values);
        return res;
    }

    async function viewEarthMeta(values) {
        let sql = `select * from countryMeta`;
        if (values != undefined && values > 0) {
            sql += ` where id = ?`;
        }
        let res = await execute(sql, values);
        return res;
    }

    async function viewEarthActive(values) {
        let sql = `select * from countryActive`;
        if (values != undefined && values > 0) {
            sql += ` where id = ?`;
        }
        let res = await execute(sql, values);
        return res;
    }

    async function viewContinentMeta(values) {
        let sql = `select * from countryMeta`;
        if (values != undefined && values > 0) {
            sql += ` where id = ?`;
        }
        let res = await execute(sql, values);
        return res;
    }

    async function viewContinentActive(values) {
        let sql = `select * from countryActive`;
        if (values != undefined && values > 0) {
            sql += ` where id = ?`;
        }
        let res = await execute(sql, values);
        return res;
    }

    async function viewEarthOil(values) {
        let sql = `select * from countryActive where oilrigs > 0 order by oilrigs desc`;
        if (values != undefined && values > 0) {
            sql += ` where id = ?`;
        }
        let res = await execute(sql, values);
        return res;
    }

    async function execute(sql, values) {
        let res = new Promise((resolve, reject) => {
            pool.query(sql, values, (err, result) => {
                if (err) {
                    console.log(err);
                }
                try {
                    if (result != undefined) {
                        let response = new Object();
                        for (var i = 0; i < result.length; i++) {
                            response[result[i].id] = result[i];
                        }
                        resolve(response);
                    }
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            });
        });
        return res;
    }
}

module.exports = dbConnect();
