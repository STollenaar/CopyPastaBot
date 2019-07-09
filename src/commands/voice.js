/* eslint-disable linebreak-style */
'use strict';

const textToSpeech = require('@google-cloud/text-to-speech');
// const http = require('http');
const streamifier = require('streamifier');
const prism = require('prism-media');

let database;
let r;
let client;
let queued = [];

module.exports = {
	init(data) {
		database = data.database;
		r = data.r;
		client = data.client;
	},

	async commandHandler(message, cmd, args) {
		const vc = message.author.lastMessage.member.voiceChannelID;

		if (vc === null || vc === undefined) {
			message.reply('You have to be in a voice channel to suffer my pain!!', {tts: true});
			return;
		}

		// stop and skip commands
		if (cmd === 'stop') {
			queued = [];
			if (client.voiceConnections.get(message.guild.id) !== undefined) {
				client.voiceConnections.get(message.guild.id).disconnect();
			}
			return;
		}
		else if (cmd === 'skip') {
			if (client.voiceConnections.get(message.guild.id) !== undefined) {
				client.voiceConnections.get(message.guild.id).disconnect();
				if (queued.length !== 0) {
					const next = queued.pop();
					this.playText(next.text, next.vc);
				}
			}
			return;
		}

		// doing database checks

		let exit = false;
		let sub;
		let text;
		switch (args[0]) {
			case 'post':
				sub = await r.getSubmission(args[1]);
				text = await sub.selftext;
				// some edge case filtering
				if (text.length === 0) {
					text = await sub.title;
				}

				if (await database.checkPost(args[1]) === undefined) {
					database.addPost(args[1], await sub.title);
				}
				break;
			case 'comment':
				text = await r.getComment(args[1]).body;
				break;
			default:
				message.reply("Your command has an issue, I can't suffer now", {tts: true});
				exit = true;
				break;
		}
		if (exit) {
			return;
		}
		if (client.voiceConnections.get(message.guild.id) === undefined) {
			this.playText(text, vc);
		}
		else {
			queued.push({text, vc});
		}
	},

	/* 	playTextTest(text, vc) {
		http.get('http://127.0.0.1:8080/speech?text="hello%20World"&encoding=opus', async (err) => {
			if (err) {
				console.log(err);
			}
			else {
				// Performs the Text-to-Speech request
				const [response] = await c.synthesizeSpeech(request);
				const strm = streamifier.createReadStream(response.audioContent);
				const audio = strm.pipe(new prism.opus.OggDemuxer());

				const channel = client.channels.find((c) => c.id === vc);
				await channel.join().then(async (connection) => {
					connection.playOpusStream(audio).on('end', () => {
						if (queued.length !== 0) {
							const next = queued.pop();
							module.exports.playText(next.text, next.vc);
						}
						else {
							channel.leave();
						}
					});
				}).catch((err) => console.log(err));
			}
		});
	}, */

	async playText(text, vc) {
		// Creates a client
		const ttsClient = new textToSpeech.TextToSpeechClient();

		// Construct the request
		const request = {
			input: {text},
			// Select the language and SSML Voice Gender (optional)
			voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
			// Select the type of audio encoding
			audioConfig: {audioEncoding: 'OGG_OPUS'},
		};

		// Performs the Text-to-Speech request
		const [response] = await ttsClient.synthesizeSpeech(request);
		const strm = streamifier.createReadStream(response.audioContent);
		const audio = strm.pipe(new prism.opus.OggDemuxer());

		const channel = client.channels.find((c) => c.id === vc);
		try {
			const connection = await channel.join();
			connection.playOpusStream(audio).on('end', () => {
				if (queued.length === 0) {
					channel.leave();
				}
				else {
					const next = queued.pop();
					module.exports.playText(next.text, next.vc);
				}
			});
		}
		catch (err) {
			console.log(err);
		}
	},
};
