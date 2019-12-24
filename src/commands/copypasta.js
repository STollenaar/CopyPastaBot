'use strict';

const { breakSentence, isImage, isVideo, article, censorText, getSubmission } = require('../utils');

let database;
let RichEmbed;

module.exports = {
	init(data) {
		database = data.database;
		RichEmbed = data.RichEmbed;
	},

	async commandHandler(message, cmd, args) {
		const inDB = await database.checkPost(args[0]);
		let sub = args[0] !== undefined ? await getSubmission(args[0])
			: undefined;

		if (sub === undefined) {
			message.reply('Unkown post...');
			return;
		}

		if (inDB === undefined) {
			database.addPost(sub.id, sub.title);
		}

		let text = sub.selftext;
		if (await database.getConfigValue('CensorMode')) {
			text = await censorText(text, false);
		}
		// Edge case filtering
		if (text.length === 0) {
			text = sub.title;

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
				embed.addField('found on', `https://www.reddit.com/${sub.subreddit_name_prefixed}`, true);
				embed.setFooter(`PostID: ${sub.id}`);
				// eslint-disable-next-line require-unicode-regexp
				if (args[1] !== undefined && message.guild.members.get(args[1].replace(/[<@!>]/g, ''))) {
					message.channel.send(args[1], embed);
				}
				else {
					message.reply(embed);
				}
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

		// eslint-disable-next-line require-unicode-regexp
		if (args[1] !== undefined && message.guild.members.get(args[1].replace(/[<@!>]/g, ''))) {
			message.channel.send(args[1], embed);
		}
		else {
			message.reply(embed);
		}

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
