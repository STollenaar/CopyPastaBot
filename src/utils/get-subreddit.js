'use strict'

const { reddit } = require('../config');

module.exports = (subreddit) => {
	return new Promise((resolve) => {
		const sub = reddit.getSubreddit(subreddit);
		sub.getHot().then((value) => {
			resolve(value.length === 0 ? undefined : sub);
		}).catch(() => resolve(undefined));
	});
}