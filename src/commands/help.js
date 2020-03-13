/* eslint-disable no-unused-vars */
/* eslint-disable no-invalid-this */
'use strict';

const {RichEmbed} = require('discord.js');
let commands;

module.exports = {
	description: 'Gives the help command',


	init(command) {
		commands = command;
	},
	// Simple help handler
	commandHandler(message) {
		const embed = new RichEmbed();
		embed.setTitle('Commands:');

		for (const cmd in commands) {
			if(commands[cmd].description){
				embed.addField(cmd, commands[cmd].description);
			}
		}

		message.reply(embed);
	},
};
