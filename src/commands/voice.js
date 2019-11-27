'use strict';

// eslint-disable-next-line node/no-missing-require
const AWS = require('aws-sdk');
const config = require('../config');
const Stream = require('stream');

// Configure AWS SDK
AWS.config.update(config.amazon.credentials);

// const vision = require('@google-cloud/vision');

// Create an Polly client
const Polly = new AWS.Polly({
	signatureVersion: 'v4',
	region: 'us-east-1',
});

// const visionClient = new vision.ImageAnnotatorClient();
const {breakSentence, isImage, isVideo, article, ssmlValidate, urlExtraction, censorText} = require('../utils');
const defaultTTS = {languageCode: 'en-US', voiceId: 'Matthew'};
const settingsTTS = {languageCode: defaultTTS.languageCode, voiceId: defaultTTS.voiceId};

const leavers = new Map();
const dispatchers = new Map();
const languageCodes = new Map();

let database;
let r;
let RichEmbed;
let client;
let queued = [];

module.exports = {
	async init(data) {
		database = data.database;
		r = data.r;
		client = data.client;
		RichEmbed = data.RichEmbed;

		// Creates a client
		const voices = (await Polly.describeVoices().promise()).Voices;
		const codes = voices.map((x) => x.LanguageCode).flat()
			.reduce((array, item) => { return array.includes(item) ? array : [...array, item]; }, []);

		for (const code of codes) {
			languageCodes.set(code, voices.filter((v) => v.LanguageCode === code)
				.map((e) => ({Id: e.Id, Gender: e.Gender})).flat());
		}

		setInterval(() => {
			const FIVE_MIN = 5 * 60 * 1000;
			const current = new Date();
			leavers.forEach((date, guild) => {
				if ((current - date) > FIVE_MIN) {
					client.voiceConnections.get(guild).channel.leave();
					leavers.delete(guild);
				}
			});
		}, 60000);
	},

	async commandHandler(message, cmd, args) {
		const vc = message.author.lastMessage.member.voiceChannelID;

		if (vc === null || vc === undefined) {
			message.reply('You have to be in a voice channel to suffer my pain!!');
			return;
		}

		// stop and skip commands
		if (cmd === 'stop' || cmd === 'skip') {
			// eslint-disable-next-line no-param-reassign
			args = [cmd];
		}

		let sub;
		let text = '';
		switch (args[0]) {
			case 'post':
				sub = await r.getSubmission(args[1]);
				text = await sub.selftext;
				// some edge case filtering
				if (text.length === 0) {
					text = await sub.title;
					const url = await sub.url;
					if (url.length !== 0 && !isVideo(url)) {
						if (isImage(url)) {
							// const [results] = await visionClient.textDetection(url);
							// const detections = results.textAnnotations;
							// console.log(detections);
							// text = detections.join('\n');
						}
						else {
							text = await article(url, 'text');
						}
					}
				}

				if (await database.checkPost(args[1]) === undefined) {
					database.addPost(args[1], await sub.title);
				}
				break;
			case 'comment':
				text = await r.getComment(args[1]).body;
				break;

			case 'set':
				// checking and validating the config settings of the ssmlgender and languageCode
				if (args[1] === undefined || (args[1] !== 'default' && settingsTTS[args[1]] === undefined)) {
					message.reply('setting voice settings has an issue, use languageCode/default');
				}
				else if (args[1] === 'default') {
					settingsTTS.languageCode = defaultTTS.languageCode;
					settingsTTS.voiceId = defaultTTS.voiceId;
				}
				else if (args[2] === undefined || args[3] === undefined || args[2] === '' || args[3] === '') {
					this.supportedVoices(message);
				}
				else if (args[1] === 'languageCode' && (languageCodes.get(args[2]) === undefined
					|| !languageCodes.get(args[2]).map((e) => e.Id).includes(args[3]))) {
					this.supportedVoices(message);
				}
				else {
					settingsTTS.languageCode = args[2];
					settingsTTS.voiceId = args[3];
					message.reply(`OK, now set to ${args[2]} ${args[3]}`);
				}

				return;
			case 'url':
				text = await article(args[1], 'text');
				if (text.length === 0) {
					text = await urlExtraction(args[1]);
				}
				break;
			case 'stop':
				queued = [];
				if (client.voiceConnections.get(message.guild.id) !== undefined
					&& dispatchers.get(message.guild.id) !== undefined && leavers.get(message.guild.id) === undefined) {
					dispatchers.get(message.guild.id).end();
					dispatchers.delete(message.guild.id);
					leavers.set(message.guild.id, new Date());
					queued = [];
				}
				return;
			case 'skip':
				if (client.voiceConnections.get(message.guild.id) !== undefined
					&& dispatchers.get(message.guild.id) !== undefined && leavers.get(message.guild.id) === undefined) {
					dispatchers.get(message.guild.id).end();
					if (queued.length > 0) {
						const next = queued.shift();
						this.playText(next.text, next.vc);
					}
					else {
						leavers.set(message.guild.id, new Date());
						dispatchers.delete(message.guild.id);
					}
				}
				return;
			case 'text':
			default:
				text = args.join(' ');
				break;
		}

		if (await database.getConfigValue('CensorMode')) {
			text = await censorText(text, true);
		}

		// complying with maximum value of google text-to-speech and breaking up the text
		const words = breakSentence(text, 2950);
		if (client.voiceConnections.get(message.guild.id) === undefined
			|| leavers.get(message.guild.id) !== undefined) {
			this.playText(words[0], vc);
			words.slice(1).forEach((value) => queued.push({value, vc}));
		}
		else {
			words.forEach((value) => queued.push({value, vc}));
		}
	},

	async playText(text, vc) {
		const channel = client.channels.find((c) => c.id === vc);

		leavers.delete(channel.guild.id);
		// Creates a client

		// Construct the request
		const request = {
			Text: ssmlValidate(text),
			TextType: 'ssml',
			// Select the language and SSML Voice Gender (optional)
			LanguageCode: settingsTTS.languageCode,
			VoiceId: settingsTTS.voiceId,
			// Select the type of audio encoding
			OutputFormat: 'ogg_vorbis',
		};

		// Performs the Text-to-Speech request
		const data = await Polly.synthesizeSpeech(request).promise();

		try {
			let connection;
			if (client.voiceConnections.get(channel.guild.id) === undefined
				|| client.voiceConnections.get(channel.guild.id).channel.id !== vc) {
				connection = await channel.join();
			}
			else {
				connection = client.voiceConnections.get(channel.guild.id);
			}

			const bufferStream = new Stream.PassThrough();
			bufferStream.end(data.AudioStream);

			const dispatcher = connection.playStream(bufferStream);
			dispatchers.set(channel.guild.id, dispatcher);
			dispatcher.on('end', () => {
				if (queued.length === 0) {
					leavers.set(channel.guild.id, new Date());
					dispatchers.delete(channel.guild.id);
					dispatcher.end();
				}
				else {
					const next = queued.shift();
					this.playText(next.value, next.vc);
				}
			});
		}
		catch (error) {
			console.log(error);
		}
	},

	async supportedVoices(message) {
		const embed = new RichEmbed();
		this.embedBuilder(embed, 1);

		const filter = (reaction, user) => {
			return ['🔙', '◀', '▶'].includes(reaction.emoji.name) && user.id === message.author.id;
		};

		// scrolling through language codes
		const embedMessage = await message.reply(embed);
		await embedMessage.react('🔙');
		await embedMessage.react('◀');
		await embedMessage.react('▶');

		let page = 1;
		const collector = embedMessage.createReactionCollector(filter, {time: 3600000});

		collector.on('collect', async (reaction) => {
			const editEmbed = new RichEmbed();

			// switching correctly
			switch (reaction.emoji.name) {
				case '🔙':
					page = 1;
					break;
				case '◀':
					if (page > 1) {
						page -= 1;
					}
					break;
				case '▶':
					if (page < Math.ceil(languageCodes.size / 24)) {
						page++;
					}
					break;
				default:
					break;
			}
			this.embedBuilder(editEmbed, page);
			// completing edit
			embedMessage.edit(editEmbed);
		});
	},

	embedBuilder(embed, page) {
		embed.setTitle('Supported Voices by languageCode:');
		const array = Array.from(languageCodes.keys());

		languageCodes.forEach((voices, code) => {
			if (array.findIndex((e) => e === code) > (page - 1) * 25 && embed.fields.length < 25) {
				embed.addField(code, voices.map((e) => `[voiceId: ${e.Id}, Gender: ${e.Gender}]`).join(', '));
			}
		});
		return embed;
	},
};
