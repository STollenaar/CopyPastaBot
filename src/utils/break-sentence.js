/* eslint-disable linebreak-style */
'use strict';

module.exports = (word, limit) => {
	const queue = word.split(' ');
	const list = [];

	while (queue.length) {
		const currentWord = queue.shift();

		if (currentWord.length >= limit) {
			list.push(currentWord);
		}
		else {
			let words = currentWord;

			while (!(
				!queue.length
				|| words.length > limit
				|| words.length + queue[0].length + 1 > limit
			)) {
				words += ` ${queue.shift()}`;
			}

			list.push(words);
		}
	}

	return list;
};
