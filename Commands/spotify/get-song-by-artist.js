const axios = require('axios');
const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');

dotenv.config();

// const spotifyApi = new SpotifyWebApi({
//   clientId: process.env.SPOTIFY_CLIENT_ID,
//   clientSecret: process.env.SPOTIFY_TOKEN,
//   redirectUri: 'http://localhost:8888/callback',
// });

const spotifyApi = new SpotifyWebApi();

module.exports = {
  name: 'get-song-by-artist',
  description: 'Get a Spotify song',
  usage: '<TRACK-name-dash-seperated> <ARTIST-name-dash-seperated>',
  cooldown: 5,
  args: true,
  execute(message, args) {
    console.log(args);

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
        spotifyApi.setAccessToken(response.data.access_token);
        console.log(`QUERY: ${query}`);
        spotifyApi.searchTracks(query)
          .then((data) => {
            console.log('Search tracks by "Alright" in the track name and "Kendrick Lamar" in the artist name');
            console.log(data.body.tracks.items);
            console.log(data.body.tracks.items[0].name);
            console.log(data.body.tracks.items[0].id);
            message.channel.send(`https://open.spotify.com/track/${data.body.tracks.items[0].id}`);
          })
          .catch((err) => {
            console.log('Something went wrong!', err);
            message.channel.send('Oh no! We had a Spotify search error!');
          });
      })
      .catch((error) => {
        console.log(error);
        message.channel.send('Oh no! We had an authentication error!');
      });
  },
};
