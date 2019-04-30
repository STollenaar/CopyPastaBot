let database;
let RichEmbed;
let config;

module.exports = {

    init(data) {
        database = data.database;
        RichEmbed = data.RichEmbed;
        config = data.config;
    },

    //doing the list command
    async CommandHandler(message, args) {
        let embed = new RichEmbed();
        let subs = await database.getSubmissions();

        if (subs.length === 0) {
            message.edit("No submissions available.. GO AND MAKE SOME PASTA!");
            return;
        }

        //building the embedded message
        this.embedBuilder(embed, 1, subs);

        const filter = (reaction, user) => {
            return ['⏪','⏩','◀', '▶', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
        };

        //scrolling through map timeline
        message.reply(embed).then(async embedMessage => {
            await embedMessage.react('⏪');
            await embedMessage.react('◀');
            await embedMessage.react('▶');
            await embedMessage.react('⏩');

            let page = parseInt(1);
            let collector = embedMessage.createReactionCollector(filter, { time: 180000 });

            collector.on('collect', (reaction, reactionCollector) => {
                let editEmbed = new RichEmbed();

                //switching correctly
                switch (reaction.emoji.name) {
                    case '⏪':
                        page = 1;
                        break;
                    case '◀':
                        page > 1 ? page -= 1 : page = page;
                        break;
                    case '▶':
                        page < Math.ceil(subs.length / config.PageSize) ? page += 1 : page = page;
                        break;
                    case '⏩':
                        page = Math.ceil(subs.length / config.PageSize);
                        break;
                }
                this.embedBuilder(editEmbed, page, subs);
                //completing edit
                embedMessage.edit(editEmbed);
            });
        });
    },

    //building the embedded message
    embedBuilder(embed, page, subs) {
        embed.setTitle(`Available copypasta's page ${page}/${Math.ceil(subs.length / config.PageSize)}:`);
        for (let sub in subs) {
            sub = parseInt(sub) + (page - 1) * config.PageSize;
            sub = subs[sub];
            if (embed.fields.length === config.PageSize || sub === undefined) {
                break;
            }

            embed.addField(sub.ID, sub.Title);
        }
    }
}