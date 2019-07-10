/* eslint-disable linebreak-style */
'use strict';

const {breakSentence, isImage, isVideo} = require('../utils');

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
				switch (true) {
					case isImage(url):
						embed.setImage(url.replace('.gifv', '.gif'));
						break;
					case isVideo(url):
						embed.setImage(sub.media.oembed.thumbnail_url.replace('.gifv', '.gif'));
						break;
					default:
						embed.setURL(url);
						embed.setThumbnail(sub.thumbnail.includes('http')
						? sub.thumbnail : 'https://www.reddit.com/static/noimage.png'
					, `https://www.reddit.com/u/${sub.author.name}`);
						break;
				}
				embed.addField('found on', `https://www.reddit.com/${sub.subreddit_name_prefixed}`, true);
				embed.setFooter(`PostID: ${sub.id}`);
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
