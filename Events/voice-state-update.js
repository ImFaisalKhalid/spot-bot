const Discord = require('discord.js');
const config = require('../config.json');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client, mongoClient) {
    if (newState.channel === null && oldState.member.user.username === 'Spotify Bot') {
      oldState.guild.voice = undefined;
      client.active.delete(oldState.guild.id);
    }
  },
};
