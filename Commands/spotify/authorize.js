const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();

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

  console.log(userId);
  console.log(serverId);
  console.log(username);

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

  // Create the authorization URL
  const authorizeURL = await spotifyApi.createAuthorizeURL(scopes, state);

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
