/* eslint-disable no-process-env */
'use strict';

module.exports = {
	amazon: {
		credentials: {
			accessKeyID: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		},
	},
};
