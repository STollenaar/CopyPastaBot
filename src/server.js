'use strict';

const dotenv = require('dotenv');
dotenv.config();
const {Client} = require('discord.js');
const database = require('./database');
const {discord} = require('./config');

const client = new Client();
const commands = require('./commands');

const main = async () => {
	await require('./commands').init({client});
	client.login(discord.AuthTkn);
};

async function doMarkov() {
	const message = await commands.markov.command();
	// Posting in the appropriate channels
	client.channels.forEach(async (c) => {
		// breaks on the first if
		if ((await database.getConfigValue('Debug')
			&& c.guild.id === await database.getConfigValue('DebugServer'))
			|| !await database.getConfigValue('Debug')) {
			if (c.name.includes('copypasta')) {
				c.send(message);
			}
		}
	});
}

client.on('ready', async () => {
	console.log('Connected');
	setInterval(async () => {
		doMarkov();
	}, await database.getConfigValue('IntervalTimeInSeconds') * 1000);
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

		else if (commands[cmd]) {
			commands[cmd].commandHandler(message, cmd, args);
		}
	}
	else if (message.content.substring(0, 2) === '$!') {
		let args = message.content.split(' ');
		args[0] = args[0].replace('$!', '');
		if (args[0] === '') {
			args = args.slice(1);
		}

		commands.voice.commandHandler(message, 'voice', args);
	}
});

main();
