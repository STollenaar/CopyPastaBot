'use strict';

const {RichEmbed} = require('discord.js');

let config;

module.exports = {
	init(data) {
		RichEmbed = data.RichEmbed;
		config = data.config;
	},

	// Simple help handler
	CommandHandler(message) {
		const embed = new RichEmbed();
		embed.setTitle('Commands:');

		config.Commands.forEach((x) => {
			embed.addField(x.Command, x.Description);
		});

		message.reply(embed);
	},
};
