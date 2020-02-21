/* eslint-disable linebreak-style */
'use strict';

const mysql = require('mysql');
const {database} = require('./config');

const db = mysql.createPool(database.credentials);

module.exports = {

	// Checks if the post exists in the db
	checkPost(postID) {
		return new Promise((resolve, reject) => {
			try {
				db.getConnection((_error, connection) => {
					connection.query('SELECT * FROM submissions WHERE id=?;', [postID],
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
			connection.query('INSERT INTO submissions (id, title) VALUES (?,?);', [postID, title]);
			connection.release();
		});
	},

	checkSentencePost(postID) {
		return new Promise((resolve) => {
			db.getConnection((_error, connection) => {
				connection.query('SELECT COUNT(*) FROM sentences WHERE postID=?;', [postID], (_err, results) => {
					resolve(results[0]);
				});
				connection.release();
			});
		});
	},

	lastPost() {
		return new Promise((resolve) => {
			db.getConnection((_error, connection) => {
				connection.query('SELECT Date FROM sentences ORDER BY Date DESC LIMIT 1;', (_err, results) => {
					resolve(results === undefined ? '' : results[0]);
				});
				connection.release();
			});
		});
	},

	addSentence(postID, sentence, date) {
		db.getConnection((_error, connection) => {
			connection.query('INSERT INTO sentences (Post_id, Sentence, Date) VALUES (?,?,?);', [postID, sentence, date]);
			connection.release();
		});
	},

	getSentences() {
		return new Promise((resolve) => {
			db.getConnection((_error, connection) => {
				connection.query('SELECT Sentence FROM sentences;', (_err, results) => {
					resolve(results.map((e) => e.Sentence).flat());
				});
				connection.release();
			});
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
		db.query('DELETE FROM submissions WHERE id=?;', [postID]);
	},

	getConfigValue(field) {
		return new Promise((resolve) => {
			db.getConnection((_error, connection) => {
				connection.query('SELECT ?? FROM config;', [field], (_err, results) => {
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
