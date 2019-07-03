'use strict';

const fs = require('fs-extra');
const sqlite = require('sqlite3').verbose();

const db = new sqlite.Database('./COPY_DB.db');

module.exports = {
	// Checks if the post exists in the db
	checkPost(postID) {
		return new Promise((resolve, reject) => {
			db.serialize(async () => {
				try {
					const row = await db.get(`SELECT * FROM submissions WHERE ID='${postID}';`);
					resolve(row);
				}
				catch (err) {
					reject(err);
				}
			});
		});
	},

	// Adds the post in the db
	addPost(postID, title) {
		db.serialize(() => {
			db.run('INSERT INTO submissions (\'ID\', \'Title\') VALUES (?, ?);', postID, title);
		});
	},

	// Gets the submissions from the db
	getSubmissions() {
		return new Promise((resolve, reject) => {
			db.serialize(async () => {
				try {
					const row = await db.all('SELECT * FROM submissions;');
					resolve(row);
				}
				catch (err) {
					reject(err);
				}
			});
		});
	},

	removePost(postID) {
		db.serialize(() => {
			db.run(`DELETE FROM submissions WHERE ID='${postID}';`);
		});
	},

	// Creating the default config
	defaultConfig() {
		return new Promise((resolve, reject) => {
			db.serialize(async () => {
				const rows = await db.get('SELECT * FROM config;');
				const object = {
					AuthTkn: rows.AuthTkn,
					Debug: rows.Debug,
					DebugServer: rows.DebugServer,
					IntervalTimeInSeconds: rows.IntervalTimeInSeconds,
					/* eslint-disable camelcase */
					User_Agent: rows.User_Agent,
					Client_Id: rows.Client_Id,
					Client_Secret: rows.Client_Secret,
					/* eslint-enable camelcase */
					Username: rows.Username,
					Password: rows.Password,
					MinUpvotes: rows.MinUpvotes,
					PostLimit: rows.PostLimit,
				};
				const json = JSON.stringify(object);
				try {
					await fs.writeFile('./config.json', json, 'utf8');
					resolve();
				}
				catch (err) {
					reject(err);
				}
			});
		});
	},
};
