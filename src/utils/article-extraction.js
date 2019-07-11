'use strict';

const agent = require('superagent');
const extractor = require('node-article-extractor');

module.exports = async (url, field = 'description') => {
	// eslint-disable-next-line no-async-promise-executor
	return new Promise(async (resolve) => {
		const data = extractor((await agent.get(url)).text);
		resolve(data[field].substring(0, 2000));
	});
};
