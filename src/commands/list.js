'use strict';

let database;
let RichEmbed;

module.exports = {

	init(data) {
		database = data.database;
		RichEmbed = data.RichEmbed;
	},

	// doing the list command
	async CommandHandler(message, cmd, args) {
		const embed = new RichEmbed();
		const subs = await database.getSubmissions();

		if (subs.length === 0) {
			message.edit('No submissions available.. GO AND MAKE SOME PASTA!');
			return;
		}

		// building the embedded message
		this.embedBuilder(embed, 1, subs);

		const filter = (reaction, user) => {
			return ['⏪', '⏩', '◀', '▶', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
		};

		// scrolling through map timeline
		let embedMessage = await message.reply(embed);
		await embedMessage.react('⏪');
		await embedMessage.react('◀');
		await embedMessage.react('▶');
		await embedMessage.react('⏩');

		let page = 1;
		const collector = embedMessage.createReactionCollector(filter, { time: 180000 });

		collector.on('collect',async (reaction) => {
			let editEmbed = new RichEmbed();

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
					if (page < Math.ceil(subs.length / (await database.getConfigValue('PageSize')))) {
						page += 1;
					}
					break;
				case '⏩':
					page = Math.ceil(subs.length / (await database.getConfigValue('PageSize')));
					break;
				default:
					break;
			}
			this.embedBuilder(editEmbed, page, subs);
			// completing edit
			embedMessage.edit(editEmbed);
		});
	},

	// building the embedded message
	async embedBuilder(embed, page, subs) {
		embed.setTitle(`Available copypasta's page ${page}/${Math.ceil(subs.length / (await database.getConfigValue('PageSize')))}:`);
		for (let sub in subs) {
			sub = parseInt(sub, 10) + (page - 1) * await database.getConfigValue('PageSize');
			sub = subs[sub];
			if (embed.fields.length === (await database.getConfigValue('PageSize')) || sub === undefined) {
				break;
			}

			embed.addField(sub.ID, sub.Title);
		}
	},
};
