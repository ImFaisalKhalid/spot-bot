const axios = require('axios');

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

  const username = message.author.tag;

  await scoresCollection.updateOne(
    { name: playlistId },
    {
      $set: {
        [username]: {
          id: message.author.id,
          scores: songs,
        },
        playlist: playlistName,
      },
    },
    { upsert: true },
  );
}

module.exports = {
  async execute(message, mongoClient, playlistId, playlistName, accessToken) {
    await buildScoreCollection(message, mongoClient, playlistId, playlistName, accessToken);
  },
};
