/* eslint-disable linebreak-style */
'use strict';

const mysql = require('mysql');

const db = mysql.createPool({
	host: 'databases',
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
};
