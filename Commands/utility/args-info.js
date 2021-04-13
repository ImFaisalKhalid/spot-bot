/**
 * This module executes code to send a message to the server with the first argument
 * of the command. It is is mainly used for debugging. The module also includes the
 * command name and description.
 *
 * @type {{args: boolean, name: string, description: string, execute(*, *): void}}
 */
module.exports = {
  name: 'args-info',
  description: 'Information about the arguments provided.',
  args: true,
  execute(message, args) {
    // Sends message with first arg to server where the command was posted
    message.channel.send(`First argument: ${args[0]}`);
  },
};
