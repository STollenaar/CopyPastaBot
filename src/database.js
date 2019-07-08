'use strict';

const fs = require('fs-extra');
const mysql = require('mysql');

const db = mysql.createConnection({
	host: 'localhost',
	user: 'copypasta',
	password: 'copypasta',
	database: 'COPY_DB'
});

db.connect();

module.exports = {
	// Checks if the post exists in the db
	checkPost(postID) {
		return new Promise((resolve, reject) => {
			try {
				db.query(`SELECT * FROM submissions WHERE ID='${postID}';`, (err, results, fields) => resolve(results[0]));
			}
			catch (err) {
				reject(err);
			}
		});
	},

	// Adds the post in the db
	addPost(postID, title) {
		db.query(`INSERT INTO submissions (ID, Title) VALUES ('${postID}', ${db.escape(title)});`);
	},

	// Gets the submissions from the db
	getSubmissions() {
		return new Promise((resolve) => {
			db.query('SELECT * FROM submissions;', (err, results, fields) => resolve(results));
		});
	},

	removePost(postID) {
		db.query(`DELETE FROM submissions WHERE ID='${postID}';`);
	},

	getConfigValue(field) {
		return new Promise(resolve => {
			db.query(`SELECT ${field} FROM config;`, (err, results, fields) => {
				results = results.map(r => r[field]).join();
				if(field === "Debug"){
					results = results == 0 ? false : true;
				}
				resolve(results)});
		});
	},

	setConfigValue(field, value) {
		db.query(`UPDATE config SET ${field}='${value}';`);
	}
};
