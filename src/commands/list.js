/* eslint-disable linebreak-style */
'use strict';

let database;
let RichEmbed;
let r;

module.exports = {

	init(data) {
		database = data.database;
		RichEmbed = data.RichEmbed;
		r = data.r;
	},

	// doing the list command
	async commandHandler(message, cmd, args) {
		const embed = new RichEmbed();
		const subs = args[0] === undefined ? await database.getSubmissions() : await r.getSubreddit(args[0]).getHot();
		const pageSize = parseInt(await database.getConfigValue('PageSize'), 10);

		if (subs.length === 0) {
			message.reply('No submissions available.. GO AND MAKE SOME PASTA!');
			return;
		}

		// building the embedded message
		await this.embedBuilder(embed, 1, subs, pageSize);

		const filter = (reaction, user) => {
			return ['⏪', '⏩', '◀', '▶', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
		};

		// scrolling through map timeline
		const embedMessage = await message.reply(embed);
		await embedMessage.react('⏪');
		await embedMessage.react('◀');
		await embedMessage.react('▶');
		await embedMessage.react('⏩');

		let page = 1;
		const collector = embedMessage.createReactionCollector(filter, {time: 180000});

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
					if (page < Math.ceil(subs.length / pageSize)) {
						// eslint-disable-next-line require-atomic-updates
						page += 1;
					}
					break;
				case '⏩':
					page = Math.ceil(subs.length / pageSize);
					break;
				default:
					break;
			}
			await this.embedBuilder(editEmbed, page, subs, pageSize);
			// completing edit
			embedMessage.edit(editEmbed);
		});
	},

	// building the embedded message
	embedBuilder(embed, page, subs, pageSize) {
		return new Promise((resolve) => {
			embed.setTitle(`Available copypasta's page ${page}/
			${Math.ceil(subs.length / pageSize)}:`);
			for (let sub in subs) {
				sub = parseInt(sub, 10) + (page - 1) * pageSize;
				sub = subs[sub];
				if (embed.fields.length === pageSize || sub === undefined) {
					resolve(embed);
					break;
				}
				embed.addField(sub.id, sub.title);
			}
			resolve(embed);
		});
	},
};
