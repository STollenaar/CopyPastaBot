/* eslint-disable linebreak-style */
'use strict';

const {breakSentence} = require('../utils');

let database;
let r;
let RichEmbed;

module.exports = {

	init(data) {
		database = data.database;
		r = data.r;
		RichEmbed = data.RichEmbed;
	},

	async commandHandler(message, cmd, args) {
		const subreddit = args[0] === undefined ? 'copypasta' : args[0];
		// Getting the posts on the subreddit
		const listing = await r.getSubreddit(subreddit).getHot();
		const random = Math.floor(Math.random() * Math.floor(listing.length));
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

			// sending image instead
			if (sub.url.length !== 0) {
				const embed = new RichEmbed();
				embed.setTitle(text);
				embed.setImage(sub.url);
				message.reply(embed);
				return;
			}
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
