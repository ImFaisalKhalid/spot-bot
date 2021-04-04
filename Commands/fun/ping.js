module.exports = {
  name: 'ping',
  description: 'Ping!',
  cooldown: 5,
  aliases: ['pping', 'pingg'],
  guildOnly: true,
  execute(message, args) {
    message.channel.send('Pong.');
  },
};
