const ytdl = require('ytdl-core-discord');
const dotenv = require('dotenv');
const { google } = require('googleapis');
const SpotifyWebApi = require('spotify-web-api-node');
const config = require('../../config.json');
const authorizeServer = require('../spotify/utils/authenticate-server');

// Configure the .env
dotenv.config();

// Create our api wrapper
const spotifyApi = new SpotifyWebApi();

// Create our Youtube wrapper
const youtubeV3 = google.youtube({ version: 'v3', auth: process.env.YOUTUBE_KEY });

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
  data.dispatcher = await data.connection.play(await ytdl(data.queue[0].url), { type: 'opus', bitrate: 512000, highWaterMark: 30 });
  // eslint-disable-next-line no-param-reassign
  data.dispatcher.guildId = data.guildId;

  data.dispatcher.once('finish', function () {
    // eslint-disable-next-line no-use-before-define
    finish(client, message, this);
  });

  data.dispatcher.on('error', console.error);
}

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

module.exports = {
  name: 'play',
  description: 'Use this command to play a song!',
  aliases: ['p'],
  guildOnly: true,
  usage: '<TRACK-name-dash-seperated> <ARTIST-name-dash-seperated>',
  args: true,
  cooldown: 1,
  async execute(message, args, mongoClient, client) {
    // Arg check
    if (args[0] === undefined || args[1] === undefined) {
      message.channel.send(config.CHECK_USAGE_ERROR);
      return;
    }

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

    // Arg handling
    const trackName = args[0].replace(/-/g, ' ');
    const artistName = args[1].replace(/-/g, ' ');
    const query = `track:${trackName} artist:${artistName}`;

    // Connect to database and get server info
    const myDb = mongoClient.db(message.guild.id.toString());
    const collection = myDb.collection('server-info');

    // Reauthorize the server and get a new token
    await authorizeServer.execute(message, mongoClient);

    // Use server info to get authorization token
    let serverToken = '';
    await collection.find().forEach(
      (myDoc) => {
        if (myDoc.name === message.guild.name) {
          // Set our access token
          serverToken = myDoc.serverToken;
        }
      },
    );
    await spotifyApi.setAccessToken(serverToken);

    // Search for song based off query
    let song = '';
    let artist = '';
    await spotifyApi.searchTracks(query)
      .then((data) => {
        song = data.body.tracks.items[0].name;
        artist = data.body.tracks.items[0].artists[0].name;
      })
      .catch((err) => {
        console.log(err);
        message.channel.send(config.SONG_SEARCH_ERROR);
        return;
      });

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

    // Call to youtube api
    await youtubeV3.search.list({
      part: 'snippet',
      type: 'video',
      q: `${song} ${artist} lyrics`,
      maxResults: 5,
      order: 'relevance',
      safeSearch: 'None',
    }, async (err, response) => {
      // Add data to our queue
      data.queue.push({
        songTitle: song,
        songArtist: artist,
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
