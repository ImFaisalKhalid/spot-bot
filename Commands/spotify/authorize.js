/**
 * This command will be used to authorize the bot to use specific information
 * from a user's account. Note: Blank module left intentionally to for TODO.
 *
 * @type {{name: string, description: string, guildOnly: boolean, execute(*, *)}}
 */
module.exports = {
  name: 'authorize',
  description: 'Use this command to authorize your Spotify account!',
  guildOnly: true,
  execute(message, args) {
    console.log(message);
    console.log(args);

    message.channel.send('Implementation incoming!');
  },
};
