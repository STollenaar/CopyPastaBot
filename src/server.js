'use strict';

const dotenv = require('dotenv');
dotenv.config();
const { Client, RichEmbed } = require('discord.js');
const database = require('./database');
const commands = require('./commands.json');
const { discord } = require('./config');

// eslint-disable-next-line security/detect-non-literal-require
const handlers = commands.map((c) => require(`./commands/${c.HandlerFile}`));
const client = new Client();

const main = async () => {
	client.login(discord.AuthTkn);
	// eslint-disable-next-line new-cap
	const data = { RichEmbed, database, commands, client };
	handlers.forEach((x) => {
		if (x.init) {
			x.init(data);
		}
	});
};

client.on('ready', async () => {
	console.log('Connected');
});

// Reacting on certain commands
client.on('message', async (message) => {
	if (message.author.id === client.user.id) {
		return;
	}
	if (await database.getConfigValue('Debug') && message.guild.id !== await database.getConfigValue('DebugServer')) {
		return;
	}

	if (message.isMentioned(client.user.id)) {
		let args = message.content.split(' ');

		const cmd = args[1];
		args = args.slice(2, args.length);

		if (cmd === 'ping') {
			message.reply('pong');
		}
		else if (cmd === 'censormode') {
			// eslint-disable-next-line no-case-declarations
			const opposite = !await database.getConfigValue('CensorMode');
			if (opposite) {
				message.reply('I am now respecting your censoring values');
			}
			else {
				message.reply('I am no longer respecting your censorsing.');
			}
			database.setConfigValue('CensorMode', opposite);
		}

		else {
			// Finding the command in the config
			const command = commands.findIndex((x) => x.Command === cmd);

			// if command not found sets it to the help command
			if (command < 0) {
				return;
			}
			// handling the command
			handlers[command].commandHandler(message, cmd, args);
		}
	}
	else if (message.content.substring(0, 2) === '$!') {
		let args = message.content.split(' ');
		args[0] = args[0].replace('$!', '');
		if (args[0] === '') {
			args = args.slice(1);
		}

		const command = commands.findIndex((x) => x.Command === 'voice');
		handlers[command].commandHandler(message, 'voice', args);
	}
});

main();
