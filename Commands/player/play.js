const ytdl = require('ytdl-core-discord');
const dotenv = require('dotenv');
const { google } = require('googleapis');
const config = require('../../config.json');

// Configure the .env
dotenv.config();

// Create our Youtube wrapper
const youtubeV3 = google.youtube({ version: 'v3', auth: process.env.YOUTUBE_KEY });

/**
 * Plays the actual music by streaming into the voice channel using a Discord Dispatcher.
 *
 * @param client Our Discord client for the server
 * @param message The Discord message of the command
 * @param data The data regarding our queue/vc for this specific server
 * @returns {Promise<void>}
 */
async function play(client, message, data) {
  // connection.play(await ytdl(url), { type: 'opus', bitrate: 128000 });
  message.channel.send(`Now playing: ${data.queue[0].songTitle} by ${data.queue[0].songArtist}. Song was requested by ${data.queue[0].requester}!`);
  for (let i = 0; i < data.queue.length; i += 1) {
    const messageData = [];
    messageData.push('------------------------------------------');
    if (i === 0) {
      messageData.push('***NOW PLAYING***');
    }
    messageData.push(`***Song:*** ${data.queue[i].songTitle}`);
    messageData.push(`***By:*** ${data.queue[i].songArtist}`);
    messageData.push(`***Requester:*** ${data.queue[i].requester}`);

    message.channel.send(messageData);
  }

  // eslint-disable-next-line no-param-reassign
  data.dispatcher = await data.connection.play(await ytdl(data.queue[0].url), { type: 'opus', bitrate: 512000, highWaterMark: 50, volume: 0.5 });
  // eslint-disable-next-line no-param-reassign
  data.dispatcher.guildId = data.guildId;

  data.dispatcher.once('finish', function () {
    // eslint-disable-next-line no-use-before-define
    finish(client, message, this);
  });

  data.dispatcher.on('error', console.error);
}

/**
 * The script that is executed once our dispatcher ends streaming voice data. It simply finds the
 * next song to play or lets the user know that the music is finished.
 *
 * @param client Our Discord client for the server
 * @param message The Discord message of the command
 * @param dispatcher The voice connection dispatcher that streams our sound data
 * @returns {Promise<void>}
 */
async function finish(client, message, dispatcher) {
  const fetched = client.active.get(dispatcher.guildId);

  // Remove first item
  fetched.queue.shift();

  // Check if it is empty
  if (fetched.queue.length > 0) {
    client.active.set(dispatcher.guildId, fetched);
    // Play next song
    play(client, message, fetched);
  } else {
    client.active.delete(dispatcher.guildId);
    message.channel.send('Finished queue');
  }
}

/**
 * This module plays the actual music. Given that Spotify doesn't actually have a server side
 * web player, as of right now, Youtube is being used instead. The bot connects to the voice chat
 * that the user is in and then uses the Youtube API to get the proper link and play the music. This
 * module also builds the queue.
 *
 * @type {{args: boolean, aliases: [string], usage: string, name: string, cooldown: number,
 * description: string, guildOnly: boolean, execute(*=, *, *=, *=): Promise<undefined>}}
 */
module.exports = {
  name: 'play',
  description: 'Use this command to play a song!',
  aliases: ['p'],
  guildOnly: true,
  usage: '<TRACK-name-dash-seperated> <ARTIST-name-dash-seperated>',
  args: true,
  cooldown: 1,
  async execute(message, args, mongoClient, client) {
    // Check if user is in a voice channel
    if (!message.member.voice.channel) {
      message.channel.send(config.VOICE_CHAT_ERROR);
      return;
    }

    // Check if bot is already connected
    // eslint-disable-next-line max-len
    if (message.member.voice && message.guild.voice && message.member.voice.channelID !== message.guild.voice.channelID) {
      message.channel.send(config.ALREADY_IN_VC_ERROR);
      return;
    }

    // Get the active collection. If none, make one
    const data = client.active.get(message.guild.id) || {};

    // Build our connection. Save in collection
    if (!data.connection) {
      data.connection = await message.member.voice.channel.join();
    }

    // Build our queue. Save in collection
    if (!data.queue) {
      data.queue = [];
    }

    // Set this data to our specific guild
    data.guildId = message.guild.id;

    // Arg handling
    if (args[0].includes('youtube.com')) {
      // No API call. Go direct to ytdl
      await data.queue.push({
        songTitle: 'Youtube',
        songArtist: 'direct URL',
        requester: message.author.tag,
        url: args[0],
      });

      if (!data.dispatcher) {
        play(client, message, data);
      } else {
        message.channel.send('Added to queue! Here is the queue now:');
        for (let i = 0; i < data.queue.length; i += 1) {
          const messageData = [];
          messageData.push('------------------------------------------');
          if (i === 0) {
            messageData.push('***NOW PLAYING***');
          }
          messageData.push(`***Song:*** ${data.queue[i].songTitle}`);
          messageData.push(`***By:*** ${data.queue[i].songArtist}`);
          messageData.push(`***Requester:*** ${data.queue[i].requester}`);

          message.channel.send(messageData);
        }
      }

      // Set our map
      client.active.set(message.guild.id, data);

      return;
    }

    console.log(args.join(' '));

    // Call to youtube api
    await youtubeV3.search.list({
      part: 'snippet',
      type: 'video',
      q: args.join(' '),
      maxResults: 5,
      order: 'relevance',
      safeSearch: 'None',
    }, async (err, response) => {
      // Add data to our queue
      data.queue.push({
        songTitle: response.data.items[0].snippet.title,
        songArtist: response.data.items[0].snippet.channelTitle,
        requester: message.author.tag,
        url: `https://youtube.com/watch?v=${response.data.items[0].id.videoId}`,
      });

      if (!data.dispatcher) {
        play(client, message, data);
      } else {
        message.channel.send('Added to queue! Here is the queue now:');
        for (let i = 0; i < data.queue.length; i += 1) {
          const messageData = [];
          messageData.push('------------------------------------------');
          if (i === 0) {
            messageData.push('***NOW PLAYING***');
          }
          messageData.push(`***Song:*** ${data.queue[i].songTitle}`);
          messageData.push(`***By:*** ${data.queue[i].songArtist}`);
          messageData.push(`***Requester:*** ${data.queue[i].requester}`);

          message.channel.send(messageData);
        }
      }

      // Set our map
      client.active.set(message.guild.id, data);
    });
  },
};
