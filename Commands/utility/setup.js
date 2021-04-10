module.exports = {
  name: 'setup',
  description: 'This needs to be called to properly setup the bot for the server!',
  guildOnly: true,
  execute(message, args, mongoClient) {
    const myDb = mongoClient.db(message.guild.id);
    const collection = myDb.collection('server-info');

    collection.update(
      { name: message.guild.name },
      {
        $set: {
          members: message.guild.memberCount,
          owner: message.guild.owner.user.tag,
          region: message.guild.region,
          creation: message.guild.createdAt.toLocaleString(),
        },
      },
      { upsert: true },
    );

    // Sends message to server where the command was posted
    message.channel.send('Setup is done! The bot is ready for commands!');
  },
};
