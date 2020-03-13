/* eslint-disable no-invalid-this */
/* eslint-disable no-unused-vars */
'use strict';

let markov;
const Markov = require('markov-strings').default;
const {initMarkov} = require('../utils');
const database = require('../database');

module.exports = {
	description: 'Let him speak',

	async init() {
		await initMarkov();
		markov = new Markov(await database.getSentences(), {stateSize: 2});
		return new Promise((resolve) => {
			console.log('Building Dataset');
			markov.buildCorpus();
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

	commandHandler(message) {
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
		const result = markov.generate(options);

		message.reply(result.string);
	},
};