/* eslint-disable linebreak-style */
'use strict';

const {isImage, isVideo} = require('../utils');

let RichEmbed;
let r;

module.exports = {

	init(data) {
		RichEmbed = data.RichEmbed;
		r = data.r;
	},

	// doing the list command
	async commandHandler(message, cmd, args) {
		const embed = new RichEmbed();
		const subs = args[0] === undefined ? await r.getSubreddit('all').getHot()
			: await r.getSubreddit(args[0]).getHot();

		if (subs.length === 0) {
			message.reply('No submissions available.. GO AND MAKE SOME PASTA!');
			return;
		}

		// building the embedded message
		await this.embedBuilder(embed, 1, subs);

		const filter = (reaction, user) => {
			return ['⏪', '⏩', '◀', '▶'].includes(reaction.emoji.name) && user.id === message.author.id;
		};

		// scrolling through map timeline
		const embedMessage = await message.reply(embed);
		await embedMessage.react('⏪');
		await embedMessage.react('◀');
		await embedMessage.react('▶');
		await embedMessage.react('⏩');

		let page = 1;
		const collector = embedMessage.createReactionCollector(filter, {time: 3600000});

		collector.on('collect', async (reaction) => {
			const editEmbed = new RichEmbed();

			// switching correctly
			switch (reaction.emoji.name) {
				case '⏪':
					page = 1;
					break;
				case '◀':
					if (page > 1) {
						page -= 1;
					}
					break;
				case '▶':
					if (page < Math.ceil(subs.length / 1)) {
						// eslint-disable-next-line require-atomic-updates
						page += 1;
					}
					break;
				case '⏩':
					page = Math.ceil(subs.length / 1);
					break;
				default:
					break;
			}
			await this.embedBuilder(editEmbed, page, subs);
			// completing edit
			embedMessage.edit(editEmbed);
		});
	},

	// building the embedded message
	embedBuilder(embed, page, subs) {
		return new Promise((resolve) => {
			const sub = subs[page];

			embed.setTitle(sub.title);
			embed.setURL(`https://www.reddit.com${sub.permalink}`);

			// setting the author
			embed.setAuthor(sub.author.name, sub.thumbnail.includes('http')
				? sub.thumbnail : 'https://www.reddit.com/static/noimage.png'
			, `https://www.reddit.com/u/${sub.author.name}`);

			const text = sub.selftext;
			// Edge case filtering
			if (text.length === 0) {
				const url = sub.url;
				// sending image instead
				if (url.length !== 0) {
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
							break;
					}
				}
			}
			else {
				embed.setDescription(text);
			}
			embed.addField('found on', `https://www.reddit.com/${sub.subreddit_name_prefixed}`, true);
			resolve(embed);
		});
	},
};
