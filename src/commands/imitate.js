'use strict'

const { messageGather } = require('../utils');
const Markov = require('markov-strings').default;
let client;

module.exports = {
    description: 'Imitate someone, by tagging them. Sends 1 message',

    init(c) {
        if (!c) {
            return this;
        }
        client = c;
    },

    async commandHandler(message) {
        const user = message.mentions.members.filter((e) => e.user.id !== client.user.id).keys().next().value;
        if (!user) {
            message.reply('Sorry, you didn\'t specify an user to imitate');
            return;
        }
        const reply = await message.reply('Sure, going to imitate. Give me a moment to prepare');
        await message.channel.startTyping();
        const array = [user];
        const dictionary = (await messageGather(array)).map((e) => e.content);
        const sentences = [];
        for (const dic of dictionary) {
            const sentence = dic.split(/\r?\n/);
            sentences.push(...sentence);
        }
        const markov = new Markov(sentences, { stateSize: 3 });
        await new Promise((resolve) => {
            markov.buildCorpus();
            resolve();
        });

        const options = {
            maxTries: 50, // Give up if I don't have a sentence after 20 tries (default is 10)
            prng: Math.random, // An external Pseudo Random Number Generator if you want to get seeded results
            filter: (result) => {
                return result.string.split(' ').length >= 5 // At least 5 words
                    && result.string.endsWith('.'); // End sentences with a dot.
            },
        };

        // Generate a sentence
        try {
            const result = await markov.generateAsync(options);
            message.reply(result.string);
        } catch (err){
            message.reply("Damn, that person is so cursed that I can't even imitate that!!!");            
        }
        reply.delete();
        await message.channel.stopTyping();
    },
}