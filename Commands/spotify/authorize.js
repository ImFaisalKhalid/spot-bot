const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const dotenv = require('dotenv');

const app = express();

// Configure the .env
dotenv.config();

app.get('/', (req, res) => {
  res.send('hello world');
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  const { state } = req.query;

  const mongoLogin = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}`;
  const mongoServer = '@spotbotdata.ihjlp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
  const uri = mongoLogin + mongoServer;

  const myMongoClient = new MongoClient(uri);
  await myMongoClient.connect();

  const userId = state.split('!')[0];
  const serverId = state.split('!')[1];
  const username = state.split('!')[2];

  const myDb = myMongoClient.db(serverId);
  const collection = myDb.collection('users');

  collection.updateOne(
    { id: userId },
    {
      $set: {
        authorizationCode: code,
        name: username,
      },
    },
    { upsert: true },
  );

  res.send('Authorization successful!');
});

app.listen(8888);

async function requestUserPermissions(message, mongoClient) {
  const scopes = ['playlist-modify-public', 'playlist-read-collaborative', 'playlist-modify-private', 'playlist-read-private'];
  const redirectUri = 'http://localhost:8888/callback';
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const state = `${message.author.id.toString()}!${message.guild.id.toString()}!${message.author.tag}`;

  // Setting credentials can be done in the wrapper's constructor
  const spotifyApi = new SpotifyWebApi({
    redirectUri,
    clientId,
  });

  // Create the authorization URL, send it, save the resp in mongoDb
  const authorizeURL = await spotifyApi.createAuthorizeURL(scopes, state);

  const myDb = mongoClient.db(message.guild.id.toString());
  const collection = myDb.collection('users');

  const result = await collection.findOne(
    { id: message.author.id.toString() },
  );

  // Done manually since spotify web wrapper has known bug
  axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_TOKEN}`).toString('base64')}`,
    },
    params: {
      grant_type: 'authorization_code',
      code: result.authorizationCode,
      redirect_uri: redirectUri,
    },
  })
    .then((response) => {
      collection.updateOne(
        { id: message.author.id.toString() },
        {
          $set: {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            expiresIn: response.data.expires_in,
          },
        },
        { upsert: true },
      );
    }, (error) => {
      console.log(error);
    });

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
  execute(message, args, mongoClient) {
    message.channel.send('Sent you a DM with the authorization link!');
    requestUserPermissions(message, mongoClient);
  },
};
