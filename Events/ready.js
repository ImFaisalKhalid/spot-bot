/**
 * This module is called when the bot logs or turns on. It simply logs
 * some information to confirm the official login.
 *
 * @type {{once: boolean, name: string, execute(*): void}}
 */
module.exports = {
  name: 'ready',
  once: true,
  execute(client, mongoClient) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    console.log(`ID is${client.guild.id}`);

    const myDb = mongoClient.db('botData2');
    const collection = myDb.collection('server2');

    const myobj = { name: 'Company Inc', address: 'Highway 37' };
    collection.insertOne(myobj, (err) => {
      if (err) throw err;
      console.log('1 document inserted');
    });
  },
};
