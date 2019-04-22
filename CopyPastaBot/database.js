
let sqlite = require('sqlite3').verbose();

let db = new sqlite.Database('./COPY_DB.db');

module.exports = {

    checkPost(postID) {
        return new Promise(function (resolve, reject) {
            db.serialize(function () {
                db.get(`SELECT * FROM submissions WHERE ID='${postID}';`, (err, row) => { resolve(row); });
            });
        });
    },

    addPost(postID) {
        db.serialize(function () {
            db.run(`INSERT INTO submissions ('ID') VALUES ('${postID}');`);
        });
    },

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
                    'MinUpvotes': rows.MinUpvotes,
                    'PostLimit': rows.PostLimit
                });
                let json = JSON.stringify(object);
                fs.writeFile('./config.json', json, 'utf8', callback);
            });
        });
    }
};