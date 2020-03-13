'use strict';

module.exports = {
	async init(data) {
		await require('./markov').init();
		await require('./voice').init(data.client);
		await require('./help').init(this);
		return this;
	},
	browse: require('./browse'),
	copypasta: require('./copypasta'),
	help: require('./help'),
	list: require('./list'),
	markov: require('./markov'),
	random: require('./random'),
	voice: require('./voice'),
};
