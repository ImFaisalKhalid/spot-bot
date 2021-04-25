const config = require('../../config.json');

module.exports = {
  name: 'volume',
  description: 'This command can be used to adjust volume!',
  cooldown: 1,
  aliases: ['v'],
  guildOnly: true,
  args: true,
  execute(message, args, mongoClient, client) {
    // Arg checking
    if (args[0] === undefined || isNaN(args[0])) {
      message.channel.send(config.CHECK_USAGE_ERROR);
      return;
    }

    // Volume value checking
    if (args[0] < 0 || args[0] > 100) {
      message.channel.send('Volume must be between 0 and 100');
      return;
    }
    const data = client.active.get(message.guild.id);

    if (!data) {
      message.channel.send('There is currently no music playing!');
      return;
    }

    // Check if in the same voice channel
    // eslint-disable-next-line max-len
    if (message.member.voice && message.guild.voice && message.member.voice.channelID !== message.guild.voice.channelID) {
      message.channel.send(config.ALREADY_IN_VC_ERROR);
      return;
    }

    data.dispatcher.setVolume(args[0] / 100);
    message.channel.send('Volume changed!');
  },
};
