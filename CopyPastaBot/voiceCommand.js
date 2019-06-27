const fs = require('fs');
const util = require('util');
// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech');
const path = require('path');
const request = require('request');

let database;
let r;
let client;
let queued = [];

module.exports = {

    init(data) {
        database = data.database;
        r = data.r;
        client = data.client;
    },

    async CommandHandler(message, cmd, args) {

        let vc = message.author.lastMessage.member.voiceChannelID;

        if (vc === null || vc === undefined) {
            message.reply("You have to be in a voice channel to suffer my pain!!", { tts: true });
            return;
        }

        //stop and skip commands
        if (cmd === 'stop') {
            queued = [];
            if (client.voiceConnections.get(message.guild.id) !== undefined) {
                client.voiceConnections.get(message.guild.id).disconnect();
            }
            return;
        } else if (cmd === 'skip') {
            if (client.voiceConnections.get(message.guild.id) !== undefined) {
                client.voiceConnections.get(message.guild.id).disconnect();
                if (queued.length !== 0) {
                    let next = queued.pop();
                    this.playText(next.text, next.vc);
                }
            }
            return;
        }


        //doing database checks

        let exit = false;
        let sub;
        let text;
        switch (args[0]) {
            case 'post':
                sub = await r.getSubmission(args[1]);
                text = await sub.selftext;
                //some edge case filtering
                if (text.length === 0) {
                    text = await sub.title;
                }
                let in_db = await database.checkPost(args[1]);


                if (in_db === undefined) {
                    database.addPost(args[1], await sub.title);
                }
                break;
            case 'comment':
                text = await r.getComment(args[1]).body;
                break;
            default:
                message.reply("Your command has an issue, I can't suffer now", { tts: true });
                exit = true;
                break;
        }
        if (exit) {
            return;
        }
        if (client.voiceConnections.get(message.guild.id) !== undefined) {
            queued.push({ text: text, vc: vc });
        } else {
            this.playTextTest(text, vc);
        }

    },

    playTextTest(text, vc) {
        request(`localhost:8080/speech?text=${text}&encoding=opus`,async (err, response) => {
            if (!err) {
                const writeFile = util.promisify(fs.writeFile);
                await writeFile('output.mp3', response, 'binary');

                const file = path.join(process.cwd(), 'output.mp3');

                client.channels.forEach(async c => {
                    if (c.id === vc) {
                        await c.join().then(async (connection) => {
                            connection.playFile(file).on('end', () => {
                                if (queued.length !== 0) {
                                    let next = queued.pop();
                                    module.exports.playTextTest(next.text, next.vc);
                                } else {
                                    c.leave();
                                }
                            });
                        });
                    }
                });
            }
        });
    },


    async playText(text, vc) {
        // Creates a client
        const c = new textToSpeech.TextToSpeechClient();

        // Construct the request
        const request = {
            input: { text: text },
            // Select the language and SSML Voice Gender (optional)
            voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
            // Select the type of audio encoding
            audioConfig: { audioEncoding: 'MP3' }
        };

        // Performs the Text-to-Speech request
        const [response] = await c.synthesizeSpeech(request);
        const broadcast = client.createVoiceBroadcast().playFile(response.audioContent);
        // Write the binary audio content to a local file
        const writeFile = util.promisify(fs.writeFile);
        await writeFile('output.mp3', response.audioContent, 'binary');

        const file = path.join(process.cwd(), 'output.mp3');

        client.channels.forEach(async c => {
            if (c.id === vc) {
                await c.join().then(async (connection) => {
                    connection.playFile(file).on('end', () => {
                        if (queued.length !== 0) {
                            let next = queued.pop();
                            module.exports.playText(next.text, next.vc);
                        } else {
                            c.leave();
                        }
                    });
                });
            }
        });
    }
};
