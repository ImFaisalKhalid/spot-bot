/**
 * This module executes code to list all of the playlists the server has. It does this
 * by going through the database and looking at all of the saved playlist data.
 *
 * @type {{aliases: [string, string], name: string, description: string,
 * guildOnly: boolean, execute(*, *, *): Promise<void>}}
 */
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

    // Loop through our collection
    await collection.find().forEach(
      (myDoc) => {
        data.push(myDoc.playlistName);
      },
    );

    // Send our response
    message.channel.send(data, { split: true });
  },
};
