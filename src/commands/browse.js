/* eslint-disable linebreak-style */
'use strict';

const {isImage, isVideo, article} = require('../utils');

let RichEmbed;
let r;
let database;

module.exports = {

	init(data) {
		RichEmbed = data.RichEmbed;
		r = data.r;
		database = data.database;
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
			return ['🔙', '💾', '◀', '▶'].includes(reaction.emoji.name) && user.id === message.author.id;
		};

		// scrolling through map timeline
		const embedMessage = await message.reply(embed);
		await embedMessage.react('🔙');
		await embedMessage.react('◀');
		await embedMessage.react('▶');
		await embedMessage.react('💾');

		let page = 1;
		const collector = embedMessage.createReactionCollector(filter, {time: 3600000});

		collector.on('collect', async (reaction) => {
			const editEmbed = new RichEmbed();

			// switching correctly
			switch (reaction.emoji.name) {
				case '🔙':
					page = 1;
					break;
				case '◀':
					if (page > 1) {
						page -= 1;
					}
					break;
				case '▶':
					if (page < Math.ceil(subs.length / 1)) {
						page++;
					}
					break;
				case '💾':
					require('./copypasta').commandHandler(message, cmd, [subs[page].id]);
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
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve) => {
			const sub = subs[page];
			embed.setTitle(sub.title.substr(0, 255));
			embed.setURL(`https://www.reddit.com${sub.permalink}`);

			// setting the author
			embed.setAuthor(sub.author.name, sub.thumbnail.includes('http')
				? sub.thumbnail : 'https://www.reddit.com/static/noimage.png'
			, `https://www.reddit.com/u/${sub.author.name}`);

			const text = sub.selftext;
			// Edge case filtering
			if (text.length === 0) {
				// sending image instead
				if (sub.url.length !== 0) {
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
				}
			}
			else {
				embed.setDescription(text.slice(0, await database.getConfigValue('MessageLimit')));
			}
			embed.addField('found on', `https://www.reddit.com/${sub.subreddit_name_prefixed}`, true);
			embed.setFooter(`PostID: ${sub.id}`);
			resolve(embed);
		});
	},
};
