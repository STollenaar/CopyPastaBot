/* eslint-disable linebreak-style */
'use strict';

// eslint-disable-next-line node/no-missing-require
const mysql = require('mysql');

const db = mysql.createPool({
	host: 'localhost',
	user: 'copypasta',
	password: 'copypasta',
	database: 'COPY_DB',
});

module.exports = {

	// Checks if the post exists in the db
	checkPost(postID) {
		return new Promise((resolve, reject) => {
			try {
				db.getConnection((_error, connection) => {
					connection.query(`SELECT * FROM submissions WHERE id='${postID}';`,
						(_err, results) => resolve(results[0]));
					connection.release();
				});
			}
			catch (err) {
				reject(err);
			}
		});
	},

	// Adds the post in the db
	addPost(postID, title) {
		db.getConnection((_error, connection) => {
			connection.query(`INSERT INTO submissions (id, title) VALUES ('${postID}', ${db.escape(title)});`);
			connection.release();
		});
	},

	// Gets the submissions from the db
	getSubmissions() {
		return new Promise((resolve) => {
			db.getConnection((_error, connection) => {
				connection.query('SELECT * FROM submissions;', (_err, results) => resolve(results));
				connection.release();
			});
		});
	},

	removePost(postID) {
		db.query(`DELETE FROM submissions WHERE id='${postID}';`);
	},

	getConfigValue(field) {
		return new Promise((resolve) => {
			db.getConnection((_error, connection) => {
				connection.query(`SELECT ${field} FROM config;`, (_err, results) => {
					let result = results.map((r) => r[field]).join();
					if (field === 'Debug' || field === 'CensorMode') {
					// eslint-disable-next-line eqeqeq
						result = result != 0;
					}
					connection.release();
					resolve(result);
				});
			});
		});
	},

	setConfigValue(field, value) {
		if (field === 'Debug' || field === 'CensorMode') {
			// eslint-disable-next-line eqeqeq
			// eslint-disable-next-line no-param-reassign
			value = value ? 1 : 0;
		}
		db.getConnection((_error, connection) => {
			connection.query(`UPDATE config SET ${field}='${value}';`);
			connection.release();
		});
	},
};
