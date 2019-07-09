'use strict';

const { breakSentence } = require('../utils');

let database;
let r;
let RichEmbed

module.exports = {
    init(data) {
        database = data.database;
        r = data.r;
        RichEmbed = data.RichEmbed;
    },

    async CommandHandler(message, cmd, args) {
        const inDB = await database.checkPost(args[0]);
        if (inDB === undefined) {
            message.reply('Unknown copypasta, please try a better one');
        } else {
            const sub = await r.getSubmission(args[0]);
            let text = await sub.selftext;
            // Edge case filtering
            if (text.length === 0) {
                text = await sub.title;

                let url = sub.url;
                //sending image instead
                if (url.length !== 0) {
                    const embed = new RichEmbed();
                    embed.setTitle(text);

                    //filtering between images
                    if (images.findIndex(i => url.includes(i)) !== -1) {
                        embed.setImage(url.replace(".gifv", ".gif"));
                    } else {
                        embed.setUrl(url);
                    }
                    message.reply(embed);
                    return;
                }
            }
            const words = breakSentence(text, await database.getConfigValue('MessageLimit'));
            message.reply(words[0]);
            for (let w in words) {
                w = words[w + 1];
                if (w === undefined) {
                    break;
                }
                if (w.length !== 0) {
                    message.channel.send(w);
                }
            }
        }
    },
};