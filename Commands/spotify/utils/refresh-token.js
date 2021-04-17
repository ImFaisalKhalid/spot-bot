const axios = require('axios');

/**
 * Gets the saved refresh token from the mongo database and uses it to get a new access code.
 * This is required because Spotify only allows access tokens to live for about an hour at a time.
 *
 * @param message The Discord message of the command
 * @param userId The DISCORD user id of the user who we want to refresh token of
 * @param refreshToken The refresh token of the user
 * @param mongoClient Our mongo database client
 * @returns {Promise<void>}
 */
async function refreshAccess(message, userId, refreshToken, mongoClient) {
  const myDb = mongoClient.db(message.guild.id.toString());
  const collection = myDb.collection('users');

  // Done manually since spotify web wrapper has known bug
  await axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_TOKEN}`).toString('base64')}`,
    },
    params: {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    },
  })
    .then(async (response) => {
      await collection.updateOne(
        { id: userId },
        {
          $set: {
            accessToken: response.data.access_token,
            expiresIn: response.data.expires_in,
          },
        },
        { upsert: true },
      );
    }, (error) => {
      console.log(error);
    });
}

/**
 * This module refreshes our access to the access token
 *
 * @type {{execute(*=, *=, *=, *=): Promise<void>}}
 */
module.exports = {
  async execute(message, userId, refreshToken, mongoClient) {
    refreshAccess(message, userId, refreshToken, mongoClient);
  },
};
