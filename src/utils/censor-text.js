'use strict';

const fs = require('fs');
const RandExp = require('randexp');
const dir = process.cwd();

module.exports = async (text, vc) => {
	let censor = text.toLowerCase().replace('@', 'a').replace('[5$]', 's').replace('0', 'o');

	const ignoreIn = [];

	await new Promise((resolve) => {
		fs.readFile(dir.concat('/list.txt'), 'utf8', (_err, data) => {
			data.split('\n').filter((x) => x !== '').forEach((w) => {
				if (censor.includes(w) && !ignoreIn.includes(censor.indexOf(w))) {
					let position = 0;
					let i = -1;
					while (position !== -1) {
						position = censor.indexOf(w, i + 1);
						if (position === -1) {
							break;
						}
						if (vc) {
							const endPos = position + w.length + '<say-as interpret-as="expletive">'.length;

							// updating the censoring text
							censor = [censor.slice(0, position), '<say-as interpret-as="expletive">',
								censor.slice(position)].join('');
							censor = [censor.slice(0, endPos), '</say-as>',
								censor.slice(endPos)].join('');
							ignoreIn.push(position + '<say-as interpret-as="expletive">'.length);
							i = endPos;
						}
						else {
							const endPos = position + w.length;

							// updating the censoring text
							censor = [censor.slice(0, position),
								w.replace(w, new RandExp(`.{${w.length}}`).gen()),
								censor.slice(endPos)].join('');
							// eslint-disable-next-line no-param-reassign
							text = [text.slice(0, position), w.replace(w, new RandExp(`.{${w.length}}`)
								.gen()), text.slice(endPos)].join('');
							ignoreIn.push(position + w.length);
							i = endPos;
						}
					}
				}
			});
			resolve();
		});
	});
	if (vc) {
		return censor;
	}
	return text;
};
