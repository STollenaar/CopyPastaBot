/* eslint-disable linebreak-style */
'use strict';

const {breakSentence, isImage, isVideo, article} = require('../utils');

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
				embed.setTitle(text.substr(0, 255));

				// filtering between images
				switch (true) {
					case isImage(sub.url):
						embed.setImage(sub.url.replace('.gifv', '.gif'));
						break;
					case isVideo(sub.url):
						embed.setImage(sub.media.oembed.thumbnail_url.replace('.gifv', '.gif'));
						break;
					default:
						embed.setDescription(await article(sub.url));
						embed.setThumbnail(sub.thumbnail.includes('http')
							? sub.thumbnail : 'https://www.reddit.com/static/noimage.png'
						, `https://www.reddit.com/u/${sub.author.name}`);
						break;
				}
				message.reply(embed);
				return;
			}
		}
		const words = breakSentence(text, await database.getConfigValue('MessageLimit'));

		let embed = new RichEmbed();
		embed.setTitle(sub.title.substr(0, 255));
		embed.setURL(`https://www.reddit.com${sub.permalink}`);

		// setting the author
		embed.setAuthor(sub.author.name, sub.thumbnail.includes('http')
			? sub.thumbnail : 'https://www.reddit.com/static/noimage.png'
		, `https://www.reddit.com/u/${sub.author.name}`);
		embed.setDescription(words[0]);

		message.reply(embed);
		words.forEach((value, index) => {
			embed = new RichEmbed();
			embed.setDescription(value);
			if (index !== 0) {
			 if (index === words.length - 1) {
					embed.addField('found on', `https://www.reddit.com/${sub.subreddit_name_prefixed}`, true);
					embed.setFooter(`PostID: ${sub.id}`);
				}
				message.channel.send(embed);
			}
		});
	},
};
