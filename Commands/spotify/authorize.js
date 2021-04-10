const axios = require('axios');
const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
const express = require('express');
const config = require('../../config.json');

const app = express();

app.get('/', (req, res) => {
  res.send('hello world');
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  console.log(code);
  res.send('successfully authorized');
  // console.log(res);
  // try {
  //   const data = await SpotifyWebApi.authorizationCodeGrant(code);
  //   const { accessToken, refreshToken } = data.body;
  //   SpotifyWebApi.setAccessToken(accessToken);
  //   SpotifyWebApi.setRefreshToken(refreshToken);
  //
  //   res.redirect('http://localhost:8888/success');
  // } catch (err) {
  //   res.redirect('/#/error/invalid token');
  // }
});

app.listen(8888);

function requestUserPermissions(message) {
  const scopes = ['playlist-modify-public', 'playlist-read-collaborative', 'playlist-modify-private', 'playlist-read-private'];
  const redirectUri = 'http://localhost:8888/callback';
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const state = 'some-state-of-my-choice';

  // Setting credentials can be done in the wrapper's constructor
  const spotifyApi = new SpotifyWebApi({
    redirectUri,
    clientId,
  });

  // Create the authorization URL
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

  // console.log(authorizeURL);
  message.author.send(authorizeURL);
}

/**
 * This command will be used to authorize the bot to use specific information
 * from a user's account. Note: Blank module left intentionally to for TODO.
 *
 * @type {{name: string, description: string, guildOnly: boolean, execute(*, *)}}
 */
module.exports = {
  name: 'authorize',
  description: 'Use this command to authorize your Spotify account!',
  guildOnly: true,
  execute(message) {
    message.channel.send('Sent you a DM with the authorization link!');
    requestUserPermissions(message);
  },
};
