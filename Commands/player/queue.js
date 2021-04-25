module.exports = {
  name: 'queue',
  description: 'This command will list the current queue!',
  cooldown: 1,
  aliases: ['q'],
  guildOnly: true,
  execute(message, args, mongoClient, client) {
    // Sends message to server where the command was posted
    const data = client.active.get(message.guild.id);

    if (!data) {
      message.channel.send('There is currently no music playing!');
      return;
    }

    for (let i = 0; i < data.queue.length; i += 1) {
      // We want to only display 5 entries at most
      if (i === 5) {
        break;
      }

      // Build our message
      const messageData = [];
      messageData.push('------------------------------------------');
      if (i === 0) {
        messageData.push('***NOW PLAYING***');
      }
      messageData.push(`***Song:*** ${data.queue[i].songTitle}`);
      messageData.push(`***By:*** ${data.queue[i].songArtist}`);
      messageData.push(`***Requester:*** ${data.queue[i].requester}`);

      // Send our message
      message.channel.send(messageData);
    }
  },
};
