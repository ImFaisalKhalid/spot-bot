/**
 * This module responds to a ping command with a message letting the server
 * know that the ping has been received. The module also includes the
 * command name, description, aliases, and a cool down to prevent spamming.
 *
 * @type {{aliases: [string, string], name: string, cooldown: number,
 * description: string, guildOnly: boolean, execute(*): void}}
 */
module.exports = {
  name: 'ping',
  description: 'Ping!',
  cooldown: 5,
  aliases: ['pping', 'pingg'],
  guildOnly: true,
  execute(message) {
    // Sends message to server where the command was posted
    message.channel.send('Ping received! Bot is online and working!.');
  },
};
