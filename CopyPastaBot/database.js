
let sqlite = require('sqlite3').verbose();

let db = new sqlite.Database('./COPY_DB.db');

module.exports = {

    //checks if the post exists in the db
    checkPost(postID) {
        return new Promise(function (resolve, reject) {
            db.serialize(function () {
                db.get(`SELECT * FROM submissions WHERE ID='${postID}';`, (err, row) => { resolve(row); });
            });
        });
    },

    //adds the post in the db
    addPost(postID, title) {
        db.serialize(function () {
            db.run(`INSERT INTO submissions ('ID', 'Title') VALUES (?, ?);`, postID, title);
        });
    },

    //gets the submissions from the db
    getSubmissions() {
        return new Promise(function (resolve, reject) {
            db.serialize(function () {
                db.all(`SELECT * FROM submissions;`, (err, row) => { resolve(row); });
            });
        });
    },

    //creating the default config
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