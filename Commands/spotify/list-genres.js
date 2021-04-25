const config = require('../../config.json');

/**
 * This module lists all of the genres that we have available to us to search
 * for using the random search command.
 *
 * @type {{aliases: [string, string], name: string, cooldown: number,
 * description: string, guildOnly: boolean, execute(*): void}}
 */
module.exports = {
  name: 'list-genres',
  description: 'Use this command to list all the available genres to search for!',
  cooldown: 5,
  aliases: ['lg', 'listgenres', 'genres', 'genre'],
  guildOnly: true,
  execute(message) {
    // Sends message to server where the command was posted
    message.channel.send(config.GENRES);
  },
};
