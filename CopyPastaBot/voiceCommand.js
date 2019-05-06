const fs = require('fs');
const util = require('util');
// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech');


let database;
let r;
let client;

module.exports = {

    init(data) {
        database = data.database;
        r = data.r;
        client = data.client;
    },

    async CommandHandler(message, args) {
        let in_db = await database.checkPost(args[0]);
        let sub = await r.getSubmission(args[0]);
        let text = await sub.selftext;
        //some edge case filtering
        if (text.length === 0) {
            text = await sub.title;
        }

        if (in_db === undefined) {
            database.addPost(args[0], await sub.title);
        }
        // Creates a client
        const c = new textToSpeech.TextToSpeechClient();

        // Construct the request
        const request = {
            input: { text: text },
            // Select the language and SSML Voice Gender (optional)
            voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
            // Select the type of audio encoding
            audioConfig: { audioEncoding: 'MP3' },
        };

        // Performs the Text-to-Speech request
        const [response] = await c.synthesizeSpeech(request);
        const broadcast = client.createVoiceBroadcast().playFile(response.audioContent);
        // Write the binary audio content to a local file
        const writeFile = util.promisify(fs.writeFile);
        await writeFile('output.mp3', response.audioContent, 'binary');
        let vc = message.author.lastMessage.member.voiceChannelID;

        if (vc !== null && vc !== undefined) {
            client.channels.forEach(async c => {
                if (c.id === vc) {
                    await c.join().then(async (connection) => {
                        connection.playFile("C:/Users/Stephen/Documents/Visual Studio 2017/Projects/CopyPastaBot/CopyPastaBot/output.mp3").on('end', () => c.leave());
                    });

                }
            });
        } else {
            message.reply("You have to be in a voice channel to suffer my pain!!", { tts: true });
        }
    }
};
