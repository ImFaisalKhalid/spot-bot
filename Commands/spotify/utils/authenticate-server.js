const axios = require('axios');
const dotenv = require('dotenv');
const config = require('../../../config.json');

// Configure our .env
dotenv.config();

/**
 * This function uses axios to make a request to the Spotify API token endpoint
 * to get us authorization to use the API. Once it successfully makes a request, it
 * calls a function to get us the song.
 *
 * @param message The message used to call the command
 * @param mongoClient Our mongo database client
 */
async function authenticate(message, mongoClient) {
  const myDb = mongoClient.db(message.guild.id.toString());
  const collection = myDb.collection('server-info');

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
    .then(async (response) => {
      await collection.updateOne(
        { name: message.guild.name },
        {
          $set: {
            serverToken: response.data.access_token,
          },
        },
        { upsert: true },
      );
    })
    .catch((err) => {
      console.log(err);
      message.channel.send(config.AUTHENTICATION_ERROR);
    });
}

/**
 * This module authenticates our server with Spotify to allow us to make
 * various different API calls using an authorization token.
 *
 * @type {{execute(*=, *=, *=, *=): Promise<void>}}
 */
module.exports = {
  async execute(message, mongoClient) {
    await authenticate(message, mongoClient);
  },
};
