/* eslint-disable no-param-reassign */
'use strict';

const fs = require('fs');
const ignore = ['.git', 'LICENSE', 'README.md', 'USERS.md'];
const dir = '/usr/src/app/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/';

// TODO fixe false positves

module.exports = async (text) => {
	let censor = text.toLowerCase().replace('@', 'a').replace('[5$]', 's').replace('0', 'o');

	await new Promise((resolve) => {
		// eslint-disable-next-line consistent-return
		fs.readdir(dir, (err, files) => {
		// handling error
			if (err) {
				return console.log(`Unable to scan directory: ${err}`);
			}
			// listing all files using forEach
			const total = files.length - ignore.length;
			let tries = 0;
			const ignoreIn = [];
			files.forEach((file) => {
			// Do whatever you want to do with the file
				if (!ignore.includes(file)) {
					fs.readFile(dir.concat(file), 'utf8', (_err, data) => {
						data.split('\n').filter((x) => x !== '').forEach((w) => {
							if (censor.includes(w) && !ignoreIn.includes(censor.indexOf(w))) {
								const position = censor.indexOf(w);
								const endPos = position + w.length + '<say-as interpret-as="expletive">'.length;

								// updating the censoring text
								censor = [censor.slice(0, position), '<say-as interpret-as="expletive">',
									censor.slice(position)].join('');
								censor = [censor.slice(0, endPos), '</say-as>',
									censor.slice(endPos)].join('');
								ignoreIn.push(position + '<say-as interpret-as="expletive">'.length);
							}
						});
						tries++;
						if (tries === total) {
							resolve();
						}
					});
				}
			});
		});
	});
	// console.log(censor);
	return censor;
};
