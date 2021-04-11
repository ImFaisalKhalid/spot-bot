const Discord = require('discord.js');
const config = require('../config.json');
const setup = require('../Commands/utility/setup');

let setupRan = false;

/**
 * This module executes whenever a message in the Discord server is sent. It checks the
 * message to see if it is a command and then it executes that. On top of that, it handles
 * the command module's options if they exist (ex: cool downs, aliases, etc.)
 *
 * @type {{name: string, execute(*=, *): (undefined|*)}}
 */
module.exports = {
  name: 'message',
  async execute(message, client, mongoClient) {
    // Run our setup
    if (!setupRan) {
      setup.execute(message, '', mongoClient);
      setupRan = true;
      console.log('Running setup');
    }

    // Confirm user is authorized
    // const myDb = mongoClient.db(message.guild.id.toString());
    // const collection = myDb.collection('users');

    // Exits if we have the wrong prefix
    if (!message.content.startsWith(config.PREFIX) || message.author.bot) {
      return;
    }

    // Extract our arguments
    const args = message.content.slice(config.PREFIX.length).trim().split(/ +/);

    // Check if the command exists. Return if it does not.
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName)
      || client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) {
      return;
    }

    // Verify that the permissions are correct
    if (command.permissions) {
      const authorPerms = message.channel.permissionsFor(message.author);
      if (!authorPerms || !authorPerms.has(command.permissions)) {
        message.reply(config.WRONG_PERM_ERROR);
        return;
      }
    }

    // Verify that we have arguments if they are required
    if (command.args && !args.length) {
      let reply = `You didn't provide any arguments, ${message.author}!`;
      if (command.usage) {
        reply += `\nThe proper usage would be: \`${config.PREFIX}${command.name} ${command.usage}\``;
      }
      message.channel.send(reply);
      return;
    }

    // Verify that there is a cool down
    const { cooldowns } = client;
    if (!cooldowns.has(command.name)) {
      cooldowns.set(command.name, new Discord.Collection());
    }

    // If there is a cool down, cause a timeout
    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;
    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        message.reply(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command!`);
        return;
      }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    // If all goes well, execute the command!
    try {
      command.execute(message, args, mongoClient);
    } catch (error) {
      message.reply(config.COMMAND_EXECUTION_ERROR);
    }
  },
};
