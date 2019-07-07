'use strict';

const {breakSentence} = require('../utils');

let database;
let r;

module.exports = {

	init(data) {
		database = data.database;
		r = data.r;
	},

	async CommandHandler(message) {
		// Getting the posts on the subreddit
		const listing = await r.getSubreddit('copypasta').getHot()
		const random = Math.floor(Math.random() * Math.floor(listing.length-1));
		const sub = listing[random];

		const inDB = await database.checkPost(sub.id);
		// Check if this is a new post
		if (inDB === undefined) {
			database.addPost(sub.id, await sub.title);
		}
		let text = await sub.selftext;
		// Edge case filtering
		if (text.length === 0) {
			text = await sub.title;
		}
		const words = breakSentence(text, await database.getConfigValue('MessageLimit'));
		message.reply(words[0]);
		for (let w in words) {
			w = words[w + 1];
			if (w === undefined) {
				break;
			}
			if (w.length !== 0) {
				message.channel.send(w);
			}
		}
	},
};
