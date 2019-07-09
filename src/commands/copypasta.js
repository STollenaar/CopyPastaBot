/* eslint-disable linebreak-style */
'use strict';

const {breakSentence} = require('../utils');
const images = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif'];

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
		const inDB = await database.checkPost(args[0]);
		const sub = await (await r.getSubmission(args[0])).fetch();

		if (inDB === undefined) {
			database.addPost(sub.id, sub.title);
		}

		let text = sub.selftext;
		// Edge case filtering
		if (text.length === 0) {
			text = sub.title;

			const url = sub.url;
			// sending image instead
			if (url.length !== 0) {
				const embed = new RichEmbed();
				embed.setTitle(text);

				// filtering between images
				if (images.findIndex((i) => url.includes(i)) === -1) {
					embed.setUrl(url);
				}
				else {
					embed.setImage(url.replace('.gifv', '.gif'));
				}
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
