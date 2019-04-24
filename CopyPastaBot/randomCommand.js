let database;
let r;
let config;

module.exports = {

    init(d, sr, c) {
        database = d;
        r = sr;
        config = c;
    },

    CommandHandler(message) {
        //getting the posts on the subreddit
        r.getSubreddit('copypasta').getHot().then(async (listing) => {
            const random = Math.floor(Math.random() * Math.floor(listing.length));
            const sub = listing[random];

            let in_DB = await database.checkPost(sub.id);
            //check if this is a new post
            if (in_DB === undefined) {
                database.addPost(sub.id, await sub.title);
            }
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
        });
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