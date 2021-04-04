/**
 * This module is called when the bot logs or turns on. It simply logs
 * some information to confirm the official login.
 *
 * @type {{once: boolean, name: string, execute(*): void}}
 */
module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
  },
};
