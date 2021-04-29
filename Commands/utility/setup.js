/**
 * This module runs a setup script to help attach the mongo database to the server. It
 * connects to the database and adds some basic server info. Left as a command since it can
 * help reset some of the server info as needed.
 *
 * @type {{name: string, description: string, guildOnly: boolean, execute(*, *, *): void}}
 */
module.exports = {
  name: 'setup',
  description: 'This needs to be called to properly setup the bot for the server!',
  guildOnly: true,
  async execute(message, args, mongoClient) {
    // Basic error check to make sure we're not in DM
    if (message.guild === null) {
      console.log('Returning from setup - 1');
      return;
    }

    if (message.guild.owner === null) {
      console.log('Returning from setup - 2');
      return;
    }

    if (message.guild.owner.tag === null) {
      console.log('Returning from setup - 3');
      return;
    }

    const myDb = mongoClient.db(message.guild.id);
    const collection = myDb.collection('server-info');

    await collection.updateOne(
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
  },
};
