'use strict';

const request = require('request');

module.exports = (url) => {
	return new Promise((resolve) => {
		request(url, (error, response, body) => {
			if (!error && response.statusCode === 200) {
				resolve(body);
			}
			else {
				resolve(error);
			}
		});
	});
};
