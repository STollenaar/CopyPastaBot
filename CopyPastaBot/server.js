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


//reacting on certain commands
client.on('message', async (message) => {
    if (message.isMentioned(client.user.id)) {

        let args = message.content.split(" ");
        let cmd = args[1];
        args = args.slice(2, args.length);

        switch (cmd) {
            case 'ping':
                message.reply('pong');
                break;
            case 'list':
                message.reply("processing please wait....").then(embedMessage => { listCommandHandler(embedMessage); });
                break;
            case 'copypasta':
                let in_db = await database.checkPost(args[0]);
                if (in_db !== undefined) {
                    let words = breakSentence(await r.getSubmission(args[0]).selftext, 2000);
                    for (let w in words) {
                        w = words[w];
                        if (w.length !== 0) {
                            message.reply(w);
                        }
                    }
                } else {
                    message.reply("Unknown copypasta, please try a better one");
                }
                break;
            case 'help':
            default:
                helpCommandHandler(message);
                break;
        }
    }
});


async function listCommandHandler(message) {
    let embed = new RichEmbed();
    let subs = await database.getSubmissions();
    embed.setTitle("Available copypasta's:");
    for (let sub in subs) {
        sub = subs[sub];
        let s = await r.getSubmission(sub.ID);
        embed.addField(sub.ID, await s.title);
    }
    message.edit(embed);
}

//simple help handler
function helpCommandHandler(message) {
    let embed = new RichEmbed();
    embed.setTitle("Commands:");
    embed.addField("list", "returns the list of indexed copypasta's");
    embed.addField("copypasta", "providing a valid copypasta id it replies with that copypasta");
    message.reply(embed);
}

function checkHot() {
    let posts = 0;
    r.getSubreddit('copypasta').getHot({ after: lastCheck }).then(async (listing) => {
        for (let sub in listing) {
            if (posts === config.PostLimit) {
                break;
            }
            sub = listing[sub];
            if (sub !== null && sub.id !== undefined && sub.ups >= config.MinUpvotes) {
                let in_DB = await database.checkPost(sub.id);
                if (in_DB === undefined) {
                    database.addPost(sub.id);
                    posts++;
                    client.channels.forEach(c => {
                        if ((config.Debug && c.guild.id === config.DebugServer) || !config.Debug) {
                            if (c.name.includes('meme-spam') && ((sub.over_18 && c.name.includes('nsfw')) || (!sub.over_18 && !c.name.includes('nsfw')))) {
                                const words = breakSentence(sub.selftext, 2000);
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
            }
        }
        lastCheck = new Date(new Date().toUTCString()).getTime();
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


