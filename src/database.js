/* eslint-disable linebreak-style */
'use strict';

// eslint-disable-next-line node/no-missing-require
const mysql = require('mysql');

const db = mysql.createConnection({
	host: 'localhost',
	user: 'copypasta',
	password: 'copypasta',
	database: 'COPY_DB',
});

db.connect();

module.exports = {
	// Checks if the post exists in the db
	checkPost(postID) {
		return new Promise((resolve, reject) => {
			try {
				db.query(`SELECT * FROM submissions WHERE id='${postID}';`,
					(_err, results) => resolve(results[0]));
			}
			catch (err) {
				reject(err);
			}
		});
	},

	// Adds the post in the db
	addPost(postID, title) {
		db.query(`INSERT INTO submissions (id, title) VALUES ('${postID}', ${db.escape(title)});`);
	},

	// Gets the submissions from the db
	getSubmissions() {
		return new Promise((resolve) => {
			db.query('SELECT * FROM submissions;', (_err, results) => resolve(results));
		});
	},

	removePost(postID) {
		db.query(`DELETE FROM submissions WHERE id='${postID}';`);
	},

	getConfigValue(field) {
		return new Promise((resolve) => {
			db.query(`SELECT ${field} FROM config;`, (_err, results) => {
				results = results.map((r) => r[field]).join();
				if (field === 'Debug') {
					results = results != 0;
				}
				resolve(results);
			});
		});
	},

	setConfigValue(field, value) {
		db.query(`UPDATE config SET ${field}='${value}';`);
	},
};
