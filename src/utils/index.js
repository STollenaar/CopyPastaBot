'use strict';

module.exports = {
	breakSentence: require('./break-sentence'),
	isImage: require('./image'),
	isVideo: require('./video'),
	article: require('./article-extraction'),
	ssmlValidate: require('./ssml-validate'),
	urlExtraction: require('./url-extraction'),
	censorText: require('./censor-text'),
	getSubreddit: require('./get-subreddit'),
	getSubmission: require('./get-submission'),
	getComment: require('./get-comment'),
	initMarkov: require('./init-markov'),
	messageGather: require('./message-gather'),
	articleExtract: require('./article-extraction')
};
