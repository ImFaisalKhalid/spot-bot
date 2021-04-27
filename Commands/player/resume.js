const config = require('../../config.json');

/**
 * This module is used to resume a song that has been paused. It does so
 * by simply resuming the sound in dispatcher.
 *
 * @type {{aliases: [string], name: string, cooldown: number,
 * description: string, guildOnly: boolean, execute(*, *, *, *): undefined}}
 */
module.exports = {
  name: 'resume',
  description: 'This command will pause the current song!',
  cooldown: 1,
  aliases: ['rs'],
  guildOnly: true,
  execute(message, args, mongoClient, client) {
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
    if (!data.dispatcher.paused) {
      message.channel.send('Bot is already playing!');
      return;
    }

    // If not, pause
    data.dispatcher.resume();
    message.channel.send(`Resuming ${data.queue[0].songTitle} by ${data.queue[0].songArtist}!`);
  },
};
