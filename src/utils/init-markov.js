'use strict';

const { reddit } = require('../config');
const database = require('../database');

module.exports = async () => {
	const lastPost = await database.lastPost();
	const sub = await reddit.getSubreddit('copypasta');
	const hot = await (await sub.getHot({ after: lastPost })).fetchAll();
	for (const post of hot) {
		const id = post.id;
		const text = await post.selftext;
		const sentences = text.match(/[^\.!\?]+[\.!\?]+/g);
		// eslint-disable-next-line require-unicode-regexp
		if (sentences !== null) {
			for (const sentence of sentences.join('\n').split(/\r?\n/)) {
				if (sentence.length > 2) {
					database.addSentence(id, sentence, await post.created_utc);
				}
			}
		}
	}
	return new Promise((resolve) => {
		console.log('Done indexing');
		resolve();
	});
};
