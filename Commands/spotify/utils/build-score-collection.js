const axios = require('axios');

/**
 * This function makes a request to the Spotify tracks route to get a list of all of the songs.
 * It then makes a new collection (or updates an existing one) with data for an individual user
 * to have a id and an array of {track name, artist, and score}.
 *
 * @param message The message used to call the command
 * @param mongoClient Our mongo database client
 * @param playlistId The ID of the playlist we will build the collection for
 * @param playlistName The name of the playlist we will build the collection for
 * @param accessToken The access token for our server
 * @returns {Promise<void>}
 */
async function buildScoreCollection(message, mongoClient, playlistId, playlistName, accessToken) {
  // Connection
  const myDb = mongoClient.db(message.guild.id.toString());
  const scoresCollection = myDb.collection('playlist-scores');

  // Array to hold all the track data we find
  const songs = [];
  await axios({
    method: 'get',
    url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then(async (response) => {
      for (let i = 0; i < response.data.items.length; i += 1) {
        const jsonObject = {
          name: response.data.items[i].track.name,
          artist: response.data.items[i].track.artists[0].name,
          score: 0,
        };
        songs.push(jsonObject);
      }
    }, (error) => {
      console.log(error);
    });

  // Throw into database
  await scoresCollection.updateOne(
    { name: playlistId },
    {
      $set: {
        [message.author.tag]: {
          id: message.author.id,
          scores: songs,
        },
        playlist: playlistName,
      },
    },
    { upsert: true },
  );
}

/**
 * This module executes code to build a new collection in the database
 *
 * @type {{execute(*=, *=, *=, *=, *=): Promise<void>}}
 */
module.exports = {
  async execute(message, mongoClient, playlistId, playlistName, accessToken) {
    await buildScoreCollection(message, mongoClient, playlistId, playlistName, accessToken);
  },
};
