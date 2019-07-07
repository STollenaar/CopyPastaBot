'use strict';

const {RichEmbed} = require('discord.js');

let commands;

module.exports = {
	init(data) {
		RichEmbed = data.RichEmbed;
		commands = data.commands;
	},

	// Simple help handler
	CommandHandler(message) {
		const embed = new RichEmbed();
		embed.setTitle('Commands:');

		commands.forEach((x) => {
			embed.addField(x.Command, x.Description);
		});

		message.reply(embed);
	},
};
