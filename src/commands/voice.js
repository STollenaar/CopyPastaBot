/* eslint-disable node/no-missing-require */
/* eslint-disable linebreak-style */
'use strict';

const AWS = require('aws-sdk');
const config = require('../config');
const awsConfig = config.amazon;

// Configure AWS SDK
AWS.config.update(awsConfig.credentials);
const Stream = require('stream');
// const vision = require('@google-cloud/vision');

// Create an Polly client
const Polly = new AWS.Polly({
	signatureVersion: 'v4',
	region: 'us-east-1',
});

// const visionClient = new vision.ImageAnnotatorClient();
const { breakSentence, isImage, isVideo, article, ssmlValidate, urlExtraction, censorText } = require('../utils');
const defaultTTS = { languageCode: 'en-US', ssmlGender: 'Matthew' };
const settingsTTS = { languageCode: defaultTTS.languageCode, ssmlGender: defaultTTS.ssmlGender };
const leavers = new Map();
const dispatchers = new Map();

let languageCodes;

let database;
let r;
let client;
let queued = [];

module.exports = {
	async init(data) {
		database = data.database;
		r = data.r;
		client = data.client;

		// Creates a client

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
					message.reply('setting voice settings has an issue, use languageCode/ssmlGender/default');
				}
				else if (args[1] === 'default') {
					settingsTTS.languageCode = defaultTTS.languageCode;
					settingsTTS.ssmlGender = defaultTTS.ssmlGender;
				}
				else if (args[2] === undefined || args[2] === '') {
					message.reply('value is unknown. supported voices: https://cloud.google.com/text-to-speech/docs/voices');
				}
				else if (args[1] === 'ssmlGender' && !['MALE', 'FEMALE', 'NEUTRAL'].includes(args[2])) {
					message.reply('genders supported: MALE ,FEMALE and NEUTRAL. For more information visit: https://cloud.google.com/text-to-speech/docs/voices');
				}
				else if (args[1] === 'languageCode' && !languageCodes.includes(args[2])) {
					message.reply(`languageCodes supported: ${languageCodes.join(', ')}. For more information visit: https://cloud.google.com/text-to-speech/docs/voices`);
				}
				else {
					settingsTTS[args[1]] = args[2];
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
			words.slice(1).forEach((value) => queued.push({ value, vc }));
		}
		else {
			words.forEach((value) => queued.push({ value, vc }));
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
			VoiceId: settingsTTS.ssmlGender,
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
};
