const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const dotenv = require('dotenv');

const app = express();

// Configure the .env
dotenv.config();

/**
 * Local express callback url to allow us to get the data once accepting the permissions transfers
 * the user over to our redirect URL. Once the data is received, it will save the access code into
 * our database.
 */
app.get('/callback', async (req, res) => {
  const { code: accessCode } = req.query;
  const { state } = req.query;

  const mongoLogin = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}`;
  const mongoServer = '@spotbotdata.ihjlp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
  const uri = mongoLogin + mongoServer;

  const myMongoClient = new MongoClient(uri);
  await myMongoClient.connect();

  const userId = state.split('!')[0];
  const serverId = state.split('!')[1];
  const username = state.split('!')[2];

  const myDb1 = myMongoClient.db(serverId);
  const collection1 = myDb1.collection('users');

  collection1.updateOne(
    { id: userId },
    {
      $set: {
        authorizationCode: accessCode,
        name: username,
      },
    },
    { upsert: true },
  );

  const myDb = myMongoClient.db(serverId);
  const collection = myDb.collection('users');

  // Done manually since spotify web wrapper has known bug
  axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_TOKEN}`).toString('base64')}`,
    },
    params: {
      grant_type: 'authorization_code',
      code: accessCode,
      redirect_uri: 'http://localhost:8888/callback',
    },
  })
    .then((response) => {
      collection.updateOne(
        { id: userId },
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

  res.send('Authorization successful!');
});

app.listen(8888);

/**
 * This function simply uses the Spotify wrapper to build a specific authorization link using
 * various different scopes.
 *
 * @param message The Discord message of the command
 * @returns {Promise<void>}
 */
async function requestUserPermissions(message) {
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

  // Sends the message
  await message.author.send(authorizeURL);
}

/**
 * This command is used to authorize the user. Spotify requires my app to have some 'permissions'
 * and they need to be accepted by the user. This module sends them a link that allows them to
 * confirm permissions and then stores info into our database.
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
