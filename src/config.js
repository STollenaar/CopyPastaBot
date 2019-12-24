/* eslint-disable no-process-env */
'use strict';

const snoowrap = require('snoowrap');

module.exports = {
	amazon: {
		credentials: {
			accessKeyID: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		},
	},

	database: {
		credentials: {
			host: process.env.DATABASE_HOST,
			user: process.env.DATABASE_USER,
			password: process.env.DATABASE_PASSWORD,
			database: process.env.DATABASE_DATABASE,
		},
	},

	discord: {
		AuthTkn: process.env.DISCORD_AUTHTKN,
	},

	reddit:
		new snoowrap({
			userAgent: process.env.REDDIT_USER_AGENT,
			clientId: process.env.REDDIT_CLIENT_ID,
			clientSecret: process.env.REDDIT_CLIENT_SECRET,
			username: process.env.REDDIT_USERNAME,
			password: process.env.REDDIT_PASSWORD,
		}),
};
