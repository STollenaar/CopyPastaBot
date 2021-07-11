'use strict';

const request = require('async-request');
const cheerio = require('cheerio');

function grabText(dom) {
	if (dom.data) {
		return dom.data;
	} else if (dom.children) {
		let data = [];
		for (const child of dom.children) {
			data.push(grabText(child));
		}
		return data;
	} else {
		return undefined;
	}
}

async function scrapeUrl(url) {
	const req = await request(url);

	const $ = cheerio.load(req.body);
	let datas = [];


	const paragraphs = $('p');
	paragraphs.each((_index, value) => {
		if (value.attribs.id) {
			datas.push(grabText(value));
		}
	});
	// Normalizing the entries
	datas = datas.flat(5).join('').split('.').map((e) => e.trim());
	datas = datas.filter((e) => e != '');
	return datas;

}

async function getArticles(url) {
	const resp = await request(url);

	const $ = cheerio.load(resp.body);

	const articles = $('h1');
	let arts = [];
	for (const article of articles) {
		if (article.children) {
			const children = article.children.filter((a) => a.name === 'a');
			arts.push(children[0]?.attribs.href);
		}
	}
	arts = arts.filter((e) => e !== undefined);
	return arts;
}

module.exports = async (url) => {
	const articles = await getArticles(url);
	const texts = [];

	for (const article of articles) {
		texts.push(await scrapeUrl(`${url}${article}`));
	}
	return texts.flat(5);
};
