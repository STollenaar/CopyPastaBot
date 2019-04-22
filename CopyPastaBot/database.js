
let sqlite = require('sqlite3').verbose();

let db = new sqlite.Database('./COPY_DB.db');

module.exports = {

    defaultConfig(fs, callback) {
        db.serialize(function () {
            db.get(`SELECT * FROM config;`, (err, rows) => {
                let object = [];
                object.push({
                    'AuthTkn': rows.AuthTkn,
                    'Debug': rows.Debug,
                    'DebugServer': rows.DebugServer,
                    'IntervalTimeInSeconds': rows.IntervalTimeInSeconds,
                    'User_Agent': rows.User_Agent,
                    'Client_Id': rows.Client_Id,
                    'Client_Secret': rows.Client_Secret,
                    'Username': rows.Username,
                    'Password': rows.Password,
                    'MinUpvotes': rows.MinUpvotes
                });
                let json = JSON.stringify(object);
                fs.writeFile('./config.json', json, 'utf8', callback);
            });
        });
    }
};