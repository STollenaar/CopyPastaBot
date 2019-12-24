'use strict';

const { reddit } = require('../config');

module.exports = (post) => {
	return new Promise((resolve) => {
		reddit.getSubmission(post).fetch().then((value) => {
			resolve(value);
		}).catch(() => {
			resolve(undefined);
		});
	});
};
