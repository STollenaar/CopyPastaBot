import { setInterval } from 'timers';

const { Client, RichEmbed } = require('discord.js');
const database = require('./database');
const snoowrap = require('snoowrap');

let config;
let r;

fs.stat('./config.json', function (err, stat) {
    if (err === null) {
        config = require('./config.json')[0];
        r = new snoowrap({
            userAgent: config.User_Agent,
            clientId: config.Client_Id,
            clientSecret: config.Client_Secret,
            username: config.Username,
            password: config.Password
        })
    } else if (err.code === 'ENOENT') {
        console.log("Deploying config");
        database.defaultConfig(fs, function () {
            config = require('./config.json')[0];
            console.log("Stopping app to get appropriate info");
            stop();
        });
    }

});


// Initialize Discord Bot
const client = new Client();

client.on('ready', function (evt) {
    console.log("Connected");

    //setInterval(function () {


    //}, config.IntervalTimeInSeconds*1000);

});

input.addListener("data", async function (d) {
    d = d.toString().trim().split(" ");

    switch (d[0]) {
        case 'hot':
            r.getSubreddit('copypasta').getHot(10).then((listing) => {
                for (let sub in listing) {
                    sub = listing[sub];
                    console.log(sub);
                }
            });
            break;
    }
});





client.login(config.AuthTkn);
