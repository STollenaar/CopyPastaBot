/* eslint-disable node/no-missing-require */
/* eslint-disable linebreak-style */
'use strict';

const snoowrap = require('snoowrap');
const {Client, RichEmbed} = require('discord.js');

const {breakSentence} = require('./utils');
const database = require('./database');
const commands = require('./commands.json');

// eslint-disable-next-line security/detect-non-literal-require
const handlers = commands.map((c) => require(`./commands/${c.HandlerFile}`));
const input = process.openStdin();
const client = new Client();

let randomMessage;
let r;
let lastCheck = 0;

const main = async () => {
	randomMessage = await database.getConfigValue('LogOffMessages');

	client.login(await database.getConfigValue('AuthTkn'));
	// eslint-disable-next-line new-cap
	r = new snoowrap({
		userAgent: await database.getConfigValue('User_Agent'),
		clientId: await database.getConfigValue('Client_Id'),
		clientSecret: await database.getConfigValue('Client_Secret'),
		username: await database.getConfigValue('Username'),
		password: await database.getConfigValue('Password'),
	});
	const data = {RichEmbed, database, commands, r, client};
	handlers.forEach((x) => {
		if (x.init) {
			x.init(data);
		}
	});
};

async function checkHot() {
	let posts = 0;
	// Getting the posts on the subreddit
	const listing = await r.getSubreddit('copypasta').getHot({after: lastCheck});
	for (let sub in listing) {
		if (posts === await database.getConfigValue('PostLimit')) {
			break;
		}

		sub = listing[sub];
		// Filtering the different things
		if (sub !== null && sub.id !== undefined && sub.ups >= await database.getConfigValue('MinUpvotes')) {
			const inDB = await database.checkPost(sub.id);
			// Check if this is a new post
			if (inDB === undefined) {
				database.addPost(sub.id, await sub.title);
				posts++;
				// Posting in the appropriate channels
				client.channels.forEach(async (c) => {
					// breaks on the first if
					if ((await database.getConfigValue('Debug')
                            && c.guild.id === await database.getConfigValue('DebugServer'))
                        || !await database.getConfigValue('Debug')) {
						if (c.name.includes('copypasta')) {
							const words = breakSentence(sub.selftext, await database.getConfigValue('MessageLimit'));
							for (let w in words) {
								w = words[w];
								if (w.length !== 0) {
									c.send(w);
								}
							}
						}
					}
				});
			}
		}
	}
	// Updating the lastcheck timestamp
	// eslint-disable-next-line require-atomic-updates
	lastCheck = new Date(new Date().toUTCString()).getTime();
}

// simple config operations so you don't have to reload everytime...
async function configOperations(args) {
	if (args[1] === undefined) {
		console.log('Argument is undefined... please define an action [set/add/dump/view]');
	}
	else if (args[1].toLowerCase() === 'set') {
		if (args[2] === undefined) {
			console.log('config field undefined.. please define a field');
		}
		else if (args[3] === undefined) {
			console.log('field value undefined.. please define a field value');
		}
		else {
			try {
				database.setConfigValue([args[2]], JSON.parse(args.slice(3).join('')));
			}
			catch (e) {
				database.setConfigValue([args[2]], args.slice(3).join(''));
			}
		}
	}
	else if (args[1].toLowerCase() === 'add') {
		if (args[2] === undefined) {
			console.log('config field undefined.. please define a field');
		}
		else if (!Array.isArray(await database.getConfigValue(args[2]))) {
			console.log('config field is not an array... please set it as an array');
		}
		else if (args[3] === undefined) {
			console.log('field value undefined.. please define a field value');
		}
		else {
			try {
				const array = await database.getConfigValue(args[2]);
				array.push(JSON.parse(args.slice(3).join('')));
				database.setConfigValue(args[2], array);
			}
			catch (e) {
				const array = await database.getConfigValue(args[2]);
				array.push(args.slice(3).join(''));
				database.setConfigValue(args[2], array);
			}
		}
	}
	else if (args[1].toLowerCase() === 'dump') {
		console.log('///CONFIG DUMP\\\\');
	}
	else if (args[1].toLowerCase() === 'view') {
		if (args[2] === undefined) {
			console.log('config field undefined.. please define a field');
		}
		else {
			try {
				console.log(await database.getConfigValue(args[2]));
			}
			catch (e) {
				console.log('Unknown field');
			}
		}
	}
	else {
		console.log('unknown argument...  please define an action [set/add/dump/view]');
	}
}

client.on('ready', async () => {
	console.log('Connected');

	setInterval(async () => {
		checkHot();
	}, await database.getConfigValue('IntervalTimeInSeconds') * 1000);
});

input.addListener('data', async (rawData) => {
	const data = rawData.toString().trim().split(' ');

	if (data[0] === 'hot') {
		checkHot();
	}
	else if (data[0] === 'manual') {
		if (data.length === 3) {
			if (data[1] === 'add' && await database.checkPost(data[2]) === undefined) {
				const sub = await r.getSubmission(data[2]);
				if (sub !== undefined) {
					database.addPost(data[2], await sub.title);
				}
			}
			else if (data[1] === 'remove' && await database.checkPost(data[2]) !== undefined) {
				console.log(`removing postID: ${data[2]}`);
				database.removePost(data[2]);
			}
		}
	}
	else if (data[0] === 'config') {
		configOperations(data);
	}
});

process.on('SIGTERM', () => {
	try {
		client.channels.forEach((c) => {
			if (c.name.includes('bot-spam')) {
				c.send(randomMessage[Math.floor(Math.random() * Math.floor(randomMessage.length))]);
			}
		});
		client.destroy();
	}
	catch (err) {
		console.error(err);
	}
});

// Reacting on certain commands
client.on('message', async (message) => {
	if (message.isMentioned(client.user.id) || message.content.slice(0, 2) === '$$') {
		let args = message.isMentioned(client.user.id) ? message.content.split(' ')
		 : message.content.slice(2).split(' ');

		const cmd = args[1];
		args = args.slice(2, args.length);

		if (cmd === 'ping') {
			message.reply('pong');
		}
		else {
			// Finding the command in the config
			let command = commands.findIndex((x) => x.Command === cmd);

			// if command not found sets it to the help command
			command = command < 0 ? commands.findIndex((x) => x.Command === 'help') : command;

			// handling the command
			handlers[command].commandHandler(message, cmd, args);
		}
	}
});

main();
