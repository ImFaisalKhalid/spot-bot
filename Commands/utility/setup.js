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
  execute(message, args, mongoClient) {
    const myDb = mongoClient.db(message.guild.id);
    const collection = myDb.collection('server-info');

    collection.updateOne(
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
