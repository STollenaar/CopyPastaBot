'use strict';

module.exports = (text) => {
	const words = text.split(' ');

	if (words[0] !== '<speak>') {
		words.unshift('<speak>');
	}
	if (words[words.length - 1] !== '</speak>') {
		words.push('</speak>');
	}

	return words.join(' ');
};
