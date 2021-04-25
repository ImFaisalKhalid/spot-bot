const config = require('../../config.json');

module.exports = {
  name: 'skip',
  description: 'Use this command to skip the current song!',
  cooldown: 1,
  aliases: ['s'],
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

    let numInVc = 0;
    client.channels.cache.get(message.guild.voice.channelID).members.forEach(() => {
      numInVc += 1;
    });
    // Subtract 1 to remove bot
    numInVc -= 1;

    const numRequired = Math.ceil(numInVc / 2);

    // Make an array for skips if needed
    if (!data.queue[0].skipVotes) {
      data.queue[0].skipVotes = [];
    }

    // Check if user already voted
    if (data.queue[0].skipVotes.includes(message.member.id)) {
      message.channel.send(`You already voted! ${data.queue[0].skipVotes.length}/${numRequired} required!`);
      return;
    }

    // Add the user vote to the array and push changes
    data.queue[0].skipVotes.push(message.member.id);
    client.active.set(message.guild.id, data);

    // Check if we have enough votes
    if (data.queue[0].skipVotes.length >= numRequired) {
      message.channel.send('Successfully skipped!');
      data.dispatcher.end();
      return;
    }

    message.channel.send(`Successfully voted! ${data.queue[0].skipVotes.length}/${numRequired} required!`);
  },
};
