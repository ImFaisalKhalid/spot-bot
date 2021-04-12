module.exports = {
  name: 'list-playlists',
  description: 'Use this command to list all the server playlists!',
  aliases: ['list', 'l'],
  guildOnly: true,
  async execute(message, args, mongoClient) {
    // Sends message to server where the command was posted
    const myDb = mongoClient.db(message.guild.id.toString());
    const collection = myDb.collection('playlists');

    // Will hold our response
    const data = [];
    data.push('Here is a list of all the server playlists:');

    await collection.find().forEach(
      (myDoc) => {
        data.push(myDoc.playlistName);
      },
    );

    // Send our response
    message.channel.send(data, { split: true });
  },
};
