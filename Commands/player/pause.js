const config = require('../../config.json');

module.exports = {
  name: 'pause',
  description: 'This command will pause the current song!',
  cooldown: 1,
  aliases: ['p'],
  guildOnly: true,
  execute(message, args, mongoClient, client) {
    // Sends message to server where the command was posted
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

    // Check if already paused
    if (data.dispatcher.paused) {
      message.channel.send('Bot is already paused!');
      return;
    }

    // If not, pause
    data.dispatcher.pause(true);
    message.channel.send(`Paused ${data.queue[0].songTitle} by ${data.queue[0].songArtist}!`);
  },
};
