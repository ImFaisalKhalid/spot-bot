const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
const config = require('../../config.json');
const refreshAccess = require('./utils/refresh-token');

// Configure our .env
dotenv.config();

// Create our api wrapper
const spotifyApi = new SpotifyWebApi();
let songId;

/**
 * This function uses the spotify web node wrapper to add tracks to a specific playlist. The
 * playlist requires an access token and the playlist Id for it to work.
 *
 * @param message The Discord message of the command
 * @param mongoClient Our mongo database client
 * @param playlistId The Id of the playlist to add to
 * @param accessToken The access token of the user with the playlist
 * @param songIdToAdd The id of the song to add
 * @returns {Promise<void>}
 */
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

/**
 * This function uses the spotify web node wrapper to search for a specific song and get
 * its ID. The ID is needed to add the song to the playlist.
 *
 * @param message The Discord message of the command
 * @param mongoClient Our mongo database client
 * @param trackName The name of the track to search
 * @param artistName The name of the artist associated with the track
 * @param accessToken The access token for the user
 * @returns {Promise<void>}
 */
async function getSongId(message, mongoClient, trackName, artistName, accessToken) {
  // Some simple string formatting to make query the right format for spotify
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
      return;
    });
}

/**
 * This module is used to add a specific song to a specific playlist. It heavily uses information
 * from our database to get access tokens, playlist Ids, and verify server playlist actually exists.
 *
 * @type {{args: boolean, aliases: [string, string, string], usage: string, name: string,
 * description: string, guildOnly: boolean, execute(*=, *, *=): Promise<undefined>}}
 */
module.exports = {
  name: 'add-to-playlist',
  description: 'Use this command to list all the server playlists!',
  usage: '<TRACK-name-dash-seperated> <ARTIST-name-dash-seperated> <PLAYLIST-name-dash-seperated>',
  aliases: ['add', 'a', 'addtoplaylist'],
  guildOnly: true,
  args: true,
  async execute(message, args, mongoClient) {
    // Arg check
    if (args[0] === undefined || args[1] === undefined || args[2] === undefined) {
      message.channel.send(config.CHECK_USAGE_ERROR);
      return;
    }

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
    await refreshAccess.execute(message, userId, refreshToken, mongoClient);
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
