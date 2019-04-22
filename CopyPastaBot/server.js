const { Client, RichEmbed } = require('discord.js');
const database = require('./database');
const snoowrap = require('snoowrap');
const fs = require('fs');

let config;
let r;
let input = process.openStdin();
let lastCheck = 0;

fs.stat('./config.json', function (err, stat) {
    if (err === null) {
        config = require('./config.json')[0];
        client.login(config.AuthTkn);
        r = new snoowrap({
            userAgent: config.User_Agent,
            clientId: config.Client_Id,
            clientSecret: config.Client_Secret,
            username: config.Username,
            password: config.Password
        });
    } else if (err.code === 'ENOENT') {
        console.log("Deploying config");
        database.defaultConfig(fs, function () {
            config = require('./config.json')[0];
            console.log("Stopping app to get appropriate info");
        });
    }

});


// Initialize Discord Bot
const client = new Client();

client.on('ready', function (evt) {
    console.log("Connected");

    setInterval(function () {
        checkHot();

    }, config.IntervalTimeInSeconds * 1000);

});

input.addListener("data", async function (d) {
    d = d.toString().trim().split(" ");

    switch (d[0]) {
        case 'hot':
            checkHot();
            break;
    }
});


function checkHot() {
    r.getSubreddit('copypasta').getHot({ limit: 10, after: lastCheck }).then((listing) => {
        for (let sub in listing) {
            sub = listing[sub];
            if (sub !== null && sub.id !== undefined && sub.ups >= config.MinUpvotes) {
                database.checkPost(sub.id, function (row) {
                    if (row === undefined) {
                        database.addPost(sub.id);
                        client.channels.forEach(c => {
                            if ((config.Debug && c.guild.id === config.DebugServer) || !config.Debug) {
                                if (c.name.includes('meme-spam') && ((sub.over_18 && c.name.includes('nsfw')) || (!sub.over_18 && !c.name.includes('nsfw')))) {
                                    const words = breakSentence(sub.selftext);
                                    for (let w in words) {
                                        w = words[w];
                                        if (w.length !== 0) {
                                            c.send(w);
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
            }
        }
        lastCheck = new Date(new Date().toUTCString()).getTime();;
    });
}

function breakSentence(word, limit) {
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


