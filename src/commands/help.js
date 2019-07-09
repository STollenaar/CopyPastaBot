/* eslint-disable linebreak-style */
'use strict';

const {RichEmbed} = require('discord.js');

const commands = require('../commands.json');

module.exports = {
	init() {
	},

	// Simple help handler
	commandHandler(message) {
		const embed = new RichEmbed();
		embed.setTitle('Commands:');

		commands.forEach((x) => {
			embed.addField(x.Command, x.Description);
		});

		message.reply(embed);
	},
};
