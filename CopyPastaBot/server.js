const { Client, RichEmbed } = require('discord.js');
const database = require('./database');
const snoowrap = require('snoowrap');
const handlers = [require('./helpCommand'), require('./listCommand'), require('./randomCommand'), require('./copypastaCommand'), require('./voiceCommand')];
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
        let data = { RichEmbed: RichEmbed, database: database, r: r, config: config, client: client };
        handlers.forEach(x => {
            if (x.init) {
                x.init(data);
            }
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
        case 'manual':
            if (d.length === 3) {
                if (d[1] === 'add' && await database.checkPost(d[2]) === undefined) {
                    let sub = await r.getSubmission(d[2]);
                    if (sub !== undefined) {
                        database.addPost(d[2], await sub.title);
                    }
                } else if (d[1] === 'remove' && await database.checkPost(d[2]) !== undefined) {
                    console.log(`removing postID: ${d[2]}`);
                    database.removePost(d[2]);
                }
            }
            break;
    }
});


//reacting on certain commands
client.on('message', async (message) => {
    if (message.isMentioned(client.user.id)) {

        let args = message.content.split(" ");
        let cmd = args[1];
        args = args.slice(2, args.length);

        if (cmd === 'ping') {
            message.reply('pong');
        } else {
            //finding the command in the config
            let command = config.Commands.find(x => x.Command === cmd);
            if (command !== undefined) {
                //handling the command
                handlers[command.HandlerIndex].CommandHandler(message, args);
            } else {
                //sending default help command
                handlers[0].CommandHandler(message, args);
            }
        }
    }
});





function checkHot() {
    let posts = 0;
    //getting the posts on the subreddit
    r.getSubreddit('copypasta').getHot({ after: lastCheck }).then(async (listing) => {
        for (let sub in listing) {
            if (posts === config.PostLimit) {
                break;
            }

            sub = listing[sub];
            //filtering the different things
            if (sub !== null && sub.id !== undefined && sub.ups >= config.MinUpvotes) {
                let in_DB = await database.checkPost(sub.id);
                //check if this is a new post
                if (in_DB === undefined) {
                    database.addPost(sub.id, await sub.title);
                    posts++;
                    //posting in the appropriate channels
                    client.channels.forEach(c => {
                        if ((config.Debug && c.guild.id === config.DebugServer) || !config.Debug) {
                            if (c.name.includes('copypasta')) {
                                const words = breakSentence(sub.selftext, config.MessageLimit);
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
        //updating the lastcheck timestamp
        lastCheck = new Date(new Date().toUTCString()).getTime();
    });
}


//breaks the text up in the max size
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




