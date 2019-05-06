let database;
let r;
let config;

module.exports = {

    init(data) {
        database = data.database;
        r = data.r;
        config = data.config;
    },

    async CommandHandler(message,cmd, args) {
        let in_db = await database.checkPost(args[0]);
        if (in_db !== undefined) {
            let sub = await r.getSubmission(args[0]);
            let text = await sub.selftext;
            //some edge case filtering
            if (text.length === 0) {
                text = await sub.title;
            }
            const words = this.breakSentence(text, config.MessageLimit);
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
        } else {
            message.reply("Unknown copypasta, please try a better one");
        }
    },


    //breaks the text up in the max size
    breakSentence(word, limit) {
        const queue = word.split(' ');
        const list = [];

        while (queue.length) {
            const word = queue.shift();

            if (word.length >= limit) {
                list.push(word);
            }
            else {
                let words = word;

                while (true) {
                    if (!queue.length ||
                        words.length > limit ||
                        words.length + queue[0].length + 1 > limit) {
                        break;
                    }

                    words += ' ' + queue.shift();
                }

                list.push(words);
            }
        }

        return list;
    }
};