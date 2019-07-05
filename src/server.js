'use strict';

const snoowrap = require('snoowrap');
const {Client, RichEmbed} = require('discord.js');
const fs = require('fs-extra');

const {breakSentence} = require('./utils');
const database = require('./database');
const commands = require('./commands.json');

const handlers = commands.map((c) => require(`./commands/${c.HandlerFile}`));
const input = process.openStdin();
const client = new Client();

const main = async () => {
	let randomMessage;
	let config;
	let r;
	let lastCheck = 0;
	try {
		await fs.stat('./config.json');
		config = require('./config.json');
		randomMessage = config.LogOffMessages;
		client.login(config.AuthTkn);
		r = new snoowrap({
			userAgent: config.User_Agent,
			clientId: config.Client_Id,
			clientSecret: config.Client_Secret,
			username: config.Username,
			password: config.Password,
		});
		const data = {RichEmbed, database, r, config, client};
		handlers.forEach((x) => {
			if (x.init) {
				x.init(data);
			}
		});
	}
	catch (err) {
		if (err.code === 'ENOENT') {
			console.log('Deploying config');
			await database.defaultConfig();
			config = require('./config.json')[0];
			console.log('Stopping app to get appropriate info');
		}
		else {
			console.error(err);
		}
	}

	async function checkHot() {
		let posts = 0;
		// Getting the posts on the subreddit
		const listing = await r.getSubreddit('copypasta').getHot({ after: lastCheck });
		for (let sub in listing) {
			if (posts === config.PostLimit) {
				break;
			}

			sub = listing[sub];
			// Filtering the different things
			if (sub !== null && sub.id !== undefined && sub.ups >= config.MinUpvotes) {
				const inDB = await database.checkPost(sub.id);
				// Check if this is a new post
				if (inDB === undefined) {
					database.addPost(sub.id, await sub.title);
					posts++;
					// Posting in the appropriate channels
					client.channels.forEach((c) => {
						if ((config.Debug && c.guild.id === config.DebugServer) || !config.Debug) {
							if (c.name.includes('copypasta')) {
								const words = breakSentence(sub.selftext, config.MessageLimit);
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
		lastCheck = new Date(new Date().toUTCString()).getTime();
	}

	client.on('ready', () => {
		console.log('Connected');

		setInterval(() => {
			checkHot();
		}, config.IntervalTimeInSeconds * 1000);
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
		if (message.isMentioned(client.user.id)) {
			let args = message.content.split(' ');
			const cmd = args[1];
			args = args.slice(2, args.length);

			if (cmd === 'ping') {
				message.reply('pong');
			}
			else {
				// Finding the command in the config
				const command = commands.find((x) => x.Command === cmd);
				if (command === undefined) {
					// Sending default help command
					handlers[0].CommandHandler(message, args);
				}
				else {
					// Handling the command
					handlers[command.HandlerIndex].CommandHandler(message, cmd, args);
				}
			}
		}
	});
};

main();
