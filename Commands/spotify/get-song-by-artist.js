const axios = require('axios');
const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
const config = require('../../config.json');

// Configure our .env
dotenv.config();

// Create our api wrapper
const spotifyApi = new SpotifyWebApi();
let authToken = '';

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
 * This function uses axios to make a request to the Spotify API token endpoint
 * to get us authorization to use the API. Once it successfully makes a request, it
 * calls a function to get us the song.
 *
 * @param message The message used to call the command
 * @param query The query that needs to be sent to the Spotify API
 */
async function authenticate(message) {
  await axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_TOKEN}`).toString('base64')}`,
    },
    params: {
      grant_type: 'client_credentials',
    },
  })
    .then((response) => {
      authToken = response.data.access_token;
    })
    .catch(() => {
      message.channel.send(config.AUTHENTICATION_ERROR);
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
  cooldown: 5,
  aliases: ['get-song', 'gs', 'getsongbyartist'],
  args: true,
  async execute(message, args) {
    // Arg handling
    const trackName = args[0].replace(/-/g, ' ');
    const artistName = args[1].replace(/-/g, ' ');
    const query = `track:${trackName} artist:${artistName}`;

    await authenticate(message);
    getSongByArtist(message, query, authToken);
  },
};
