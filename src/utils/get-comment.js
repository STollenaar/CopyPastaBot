'use strict';

const { reddit } = require('../config');

module.exports = (comment) => {
	return new Promise((resolve) => {
		reddit.getComment(comment).fetch().then((value) => {
			resolve(value);
		}).catch(() => {
			resolve(undefined);
		});
	});
};
