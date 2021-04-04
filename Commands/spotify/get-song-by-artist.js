const axios = require('axios');
const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
const config = require('../../config.json');

dotenv.config();

const spotifyApi = new SpotifyWebApi();

module.exports = {
  name: 'get-song-by-artist',
  description: 'Get a Spotify song',
  usage: '<TRACK-name-dash-seperated> <ARTIST-name-dash-seperated>',
  cooldown: 5,
  args: true,
  execute(message, args) {
    const trackName = args[0].replace(/-/g, ' ');
    const artistName = args[1].replace(/-/g, ' ');
    const query = `track:${trackName} artist:${artistName}`;

    axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        Authorization: 'Basic ' + (new Buffer(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_TOKEN).toString('base64')),
      },
      params: {
        grant_type: 'client_credentials',
      },
    })
      .then((response) => {
        console.log(response.data.access_token);

        spotifyApi.setAccessToken(response.data.access_token);
        spotifyApi.searchTracks(query)
          .then((data) => {
            message.channel.send(`https://open.spotify.com/track/${data.body.tracks.items[0].id}`);
          })
          .catch(() => {
            message.channel.send(config.SONG_SEARCH_ERROR);
          });
      })
      .catch((error) => {
        console.log(error);
        message.channel.send(config.AUTHENTICATION_ERROR);
      });
  },
};
