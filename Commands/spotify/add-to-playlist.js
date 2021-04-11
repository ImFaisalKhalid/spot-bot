const axios = require('axios');
const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
const config = require('../../config.json');

// Configure our .env
dotenv.config();

// Create our api wrapper
const spotifyApi = new SpotifyWebApi();
let songId;

async function addToPlaylist(message, mongoClient, playlistId, accessToken, songIdToAdd) {
  // Set our access token
  spotifyApi.setAccessToken(accessToken);

  // Add tracks to a playlist
  await spotifyApi.addTracksToPlaylist(playlistId, [`spotify:track:${songIdToAdd}`])
    .then(() => {
      // Get a playlist
      spotifyApi.getPlaylist(playlistId)
        .then((playlistData) => {
          message.channel.send(playlistData.body.external_urls.spotify);
        }, (err) => {
          console.log('Something went wrong!', err);
        });
    }, (err) => {
      console.log(err);
    });
}

async function getSongId(message, mongoClient, trackName, artistName, accessToken) {
  const query = `track:${trackName} artist:${artistName}`;

  // Set our access token
  spotifyApi.setAccessToken(accessToken);

  // Search for song based off query
  await spotifyApi.searchTracks(query)
    .then((data) => {
      songId = data.body.tracks.items[0].id;
    })
    .catch((err) => {
      console.log(err);
      message.channel.send(config.SONG_SEARCH_ERROR);
    });
}

async function refreshAccess(message, userId, refreshToken, mongoClient) {
  const myDb = mongoClient.db(message.guild.id.toString());
  const collection = myDb.collection('users');

  // Done manually since spotify web wrapper has known bug
  await axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_TOKEN}`).toString('base64')}`,
    },
    params: {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    },
  })
    .then((response) => {
      console.log(userId);
      console.log(response.data.access_token);
      collection.updateOne(
        { id: userId },
        {
          $set: {
            accessToken: response.data.access_token,
            expiresIn: response.data.expires_in,
          },
        },
        { upsert: true },
      );
    }, (error) => {
      console.log(error);
    });
}

module.exports = {
  name: 'add-to-playlist',
  description: 'Use this command to list all the server playlists!',
  usage: '<TRACK-name-dash-seperated> <ARTIST-name-dash-seperated> <PLAYLIST-name-dash-seperated>',
  aliases: ['add', 'a'],
  guildOnly: true,
  args: true,
  async execute(message, args, mongoClient) {
    // Arg handling
    const trackName = args[0].replace(/-/g, ' ');
    const artistName = args[1].replace(/-/g, ' ');
    const playlistName = args[2].replace(/-/g, ' ');

    // Sends message to server where the command was posted
    const myDb = mongoClient.db(message.guild.id.toString());
    const collection = myDb.collection('playlists');

    // Will hold our playlists
    let userId;
    let playlistId;
    const data = [];
    await collection.find().forEach(
      (myDoc) => {
        data.push(myDoc.playlistName);

        // Get the owner of the playlist
        if (myDoc.playlistName === playlistName) {
          userId = myDoc.submittedById;
          playlistId = myDoc.id;
        }
      },
    );

    // If the playlist is not found, throw an error
    if (!data.includes(playlistName)) {
      message.channel.send(config.PLAYLIST_NOT_FOUND_ERROR);
      return;
    }

    // Find the user's refresh token
    let refreshToken;
    const userCollections = myDb.collection('users');
    await userCollections.find().forEach(
      (myDoc) => {
        if (myDoc.id === userId) {
          refreshToken = myDoc.refreshToken;
        }
      },
    );

    // Get our new access token from the user
    let accessToken;
    await refreshAccess(message, userId, refreshToken, mongoClient);
    await userCollections.find().forEach(
      (myDoc) => {
        if (myDoc.id === userId) {
          accessToken = myDoc.accessToken;
        }
      },
    );

    await getSongId(message, mongoClient, trackName, artistName, accessToken);
    await addToPlaylist(message, mongoClient, playlistId, accessToken, songId);
  },
};
