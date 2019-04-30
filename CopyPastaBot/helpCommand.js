﻿let RichEmbed;
let config;

module.exports = {

    init(data) {
        RichEmbed = data.RichEmbed;
        config = data.config;
    },


    //simple help handler
    CommandHandler(message, args) {
        let embed = new RichEmbed();
        embed.setTitle("Commands:");

        config.Commands.forEach(x => {
            embed.addField(x.Command, x.Description);
        });

        //embed.addField("list", "returns the list of indexed copypasta's.");
        //embed.addField("copypasta", "providing a valid copypasta id it replies with that copypasta.");
        //embed.addField("random/wisdom", "gives a random copypasta.");
        message.reply(embed);
    }
}
