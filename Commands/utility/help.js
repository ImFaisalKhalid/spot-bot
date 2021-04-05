const config = require('../../config.json');

/**
 * This function parses the message and if it has an argument, it goes through the commands
 * that we stored in our client in index.js and gives their name, description, and other
 * information.
 *
 * @param message The message send to activate the command
 * @param args The command, if any, to show information of
 * @returns {Promise<Message | void>|*}
 */
function parseCommand(message, args) {
  // Holds all of our commands
  const { commands } = message.client;
  // Will hold our response
  const data = [];

  // If we have no arguments
  if (!args.length) {
    // Add some text to our response
    data.push('Here is a list of all the bot commands:');
    data.push(`**${commands.map((command) => command.name).join(',\n')}**`);
    data.push(`\nYou can send \`${config.PREFIX}help [command name]\` to get info on a specific command!`);

    // Send the response
    message.channel.send(data, { split: true });
    return;
  }

  const name = args[0].toLowerCase();
  // Check if command exists either as alias or command itself
  const command = commands.get(name) || commands.find((c) => c.aliases && c.aliases.includes(name));

  // If command does not exist, send error message
  if (!command) {
    message.reply(config.NO_COMMAND_ERROR);
    return;
  }

  // Add some data to our response
  data.push(`**Name:** ${command.name}`);
  if (command.aliases) {
    data.push(`**Aliases:** ${command.aliases.join(', ')}`);
  }
  if (command.description) {
    data.push(`**Description:** ${command.description}`);
  }
  if (command.usage) {
    data.push(`**Usage:** ${config.PREFIX}${command.name} ${command.usage}`);
  }
  data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);

  // Send our response
  message.channel.send(data, { split: true });
}

/**
 * This module executes code that will send a DM with a list of commands to the user
 * that executed the command. If it contains an argument, the module will instead
 * send information on the command including a short description. The module also exports the
 * command name and description.
 *
 * @type {{usage: string, name: string, description: string, execute(*, *): (*)}}
 */
module.exports = {
  name: 'help',
  description: 'List all of the bot commands!',
  usage: '<command-name>',
  execute(message, args) {
    parseCommand(message, args);
  },
};
