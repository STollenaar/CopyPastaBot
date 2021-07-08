/* eslint-disable no-invalid-this */
/* eslint-disable no-unused-vars */
'use strict';

const Markov = require('markov-strings').default;
const markov = new Markov({ stateSize: 3 });

const { initMarkov } = require('../utils');
const database = require('../database');

module.exports = {
	description: 'Let him speak',

	async init() {
		await initMarkov();
		const sentences = await database.getSentences();
		markov.addData(sentences);

		console.log(markov.export());
		return new Promise((resolve) => {
			console.log('Done Startup');
			resolve(this);
		});
	},

	command() {
		// Build the Markov generator
		return new Promise((resolve) => {
			const options = {
				maxTries: 20, // Give up if I don't have a sentence after 20 tries (default is 10)
				prng: Math.random, // An external Pseudo Random Number Generator if you want to get seeded results
				filter: (result) => {
					return result.string.split(' ').length >= 5 // At least 5 words
						&& result.string.endsWith('.'); // End sentences with a dot.
				},
			};

			// Generate a sentence
			const result = markov.generate(options);

			resolve(result.string);
		});
	},

	async commandHandler(message) {
		await message.channel.startTyping();
		// Build the Markov generator
		const options = {
			maxTries: 20, // Give up if I don't have a sentence after 20 tries (default is 10)
			prng: Math.random, // An external Pseudo Random Number Generator if you want to get seeded results
			filter: (result) => {
				return result.string.split(' ').length >= 5 // At least 5 words
					&& result.string.endsWith('.'); // End sentences with a dot.
			},
		};

		// Generate a sentence
		const result = await markov.generateAsync(options);
		message.reply(result.string);
		await message.channel.stopTyping();
	},
};
