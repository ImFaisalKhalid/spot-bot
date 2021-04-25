const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
const config = require('../../config.json');
const authorizeServer = require('./utils/authenticate-server');

// Configure our .env
dotenv.config();

// Create our api wrapper
const spotifyApi = new SpotifyWebApi();

/**
 * This function uses the Spotify API wrapper to request a song based off certain
 * query filters (song name and artist name). Once it successfully finds the song, it
 * will drop the URL of the song into the server, allowing users to listen to it.
 *
 * @param message The message used to call the command
 * @param query The query that needs to be sent to the Spotify API
 * @param accessToken The access token used to authenticate ourselves
 */
function getSongByArtist(message, query, accessToken) {
  // Set our access token
  spotifyApi.setAccessToken(accessToken);

  // Search for song based off query
  spotifyApi.searchTracks(query)
    .then((data) => {
      message.channel.send(`https://open.spotify.com/track/${data.body.tracks.items[0].id}`);
    })
    .catch((err) => {
      console.log(err);
      message.channel.send(config.SONG_SEARCH_ERROR);
    });
}

/**
 * This will execute an authentication function which will then, upon success, call the function
 * to get a specific song based off a specific artist.
 *
 * @type {{args: boolean, usage: string, name: string, cool down: number,
 * description: string, execute(*=, *): void}}
 */
module.exports = {
  name: 'get-song-by-artist',
  description: 'Get a Spotify song',
  usage: '<TRACK-name-dash-seperated> <ARTIST-name-dash-seperated>',
  cooldown: 1,
  aliases: ['get-song', 'gs', 'getsongbyartist'],
  args: true,
  async execute(message, args, mongoClient) {
    // Arg check
    if (args[0] === undefined || args[1] === undefined) {
      message.channel.send(config.CHECK_USAGE_ERROR);
      return;
    }

    // Arg handling
    const trackName = args[0].replace(/-/g, ' ');
    const artistName = args[1].replace(/-/g, ' ');
    const query = `track:${trackName} artist:${artistName}`;

    // Reauthorize the server and get a new token
    await authorizeServer.execute(message, mongoClient);

    // Connect to database and get server info
    const myDb = mongoClient.db(message.guild.id.toString());
    const collection = myDb.collection('server-info');

    // Use server info to get authorization token
    let serverToken = '';
    await collection.find().forEach(
      (myDoc) => {
        if (myDoc.name === message.guild.name) {
          serverToken = myDoc.serverToken;
        }
      },
    );

    getSongByArtist(message, query, serverToken);
  },
};
