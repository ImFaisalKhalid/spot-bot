const SpotifyWebApi = require('spotify-web-api-node');
const axios = require('axios');

async function createPlaylist(args, message, mongoClient) {
  // Gets the spotify Id of the user
  const myDb = mongoClient.db(message.guild.id.toString());
  const collection = myDb.collection('users');

  const result = await collection.findOne(
    { id: message.author.id.toString() },
  );
  const uri = `https://api.spotify.com/v1/users/${result.spotifyId}/playlists`;

  // Create a new collection
  const playlistCollection = myDb.collection('playlists');

  const playlistName = args[0].replace(/-/g, ' ');
  // Using axios since wrapper does not have collab playlist function
  await axios({
    method: 'post',
    url: uri,
    headers: {
      Authorization: `Bearer ${result.accessToken}`,
    },
    data: {
      name: playlistName,
      public: false,
      collaborative: true,
    },
  })
    .then(async (response) => {
      await playlistCollection.updateOne(
        { id: response.data.id },
        {
          $set: {
            playlistName: response.data.name,
            ownerInfo: response.data.owner,
            snapshotId: response.data.snapshot_id,
            submittedBy: message.author.tag,
            submittedById: message.author.id,
          },
        },
        { upsert: true },
      );

      message.channel.send(response.data.external_urls.spotify);
    }, (error) => {
      console.log(error);
    });
}

async function getSpotifyUserId(message, mongoClient) {
  const myDb = mongoClient.db(message.guild.id.toString());
  const collection = myDb.collection('users');

  const result = await collection.findOne(
    { id: message.author.id.toString() },
  );

  // credentials are optional
  const spotifyApi = new SpotifyWebApi({
    clientId: 'fcecfc72172e4cd267473117a17cbd4d',
    clientSecret: 'a6338157c9bb5ac9c71924cb2940e1a7',
    redirectUri: 'http://www.example.com/callback',
  });

  await spotifyApi.setAccessToken(result.accessToken);

  // Get the authenticated user
  await spotifyApi.getMe()
    .then(async (data) => {
      console.log('ID', data.body.id);
      console.log('DN', data.body.display_name);

      await collection.updateOne(
        { id: message.author.id.toString() },
        {
          $set: {
            spotifyId: data.body.id,
            spotifyName: data.body.display_name,
          },
        },
        { upsert: true },
      );
    }, (err) => {
      console.log('Something went wrong!', err);
    });
}

async function refreshToken(message, mongoClient) {
  const myDb = mongoClient.db(message.guild.id.toString());
  const collection = myDb.collection('users');

  const result = await collection.findOne(
    { id: message.author.id.toString() },
  );

  // Done manually since spotify web wrapper has known bug
  await axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_TOKEN}`).toString('base64')}`,
    },
    params: {
      grant_type: 'refresh_token',
      refresh_token: result.refreshToken,
    },
  })
    .then(async (response) => {
      await collection.updateOne(
        { id: message.author.id.toString() },
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

module.exports = {
  name: 'create-server-playlist',
  description: 'This command will create a collaborative playlist for the server!',
  usage: '<PLAYLIST-name-dash-seperated>',
  aliases: ['csp'],
  guildOnly: true,
  args: true,
  async execute(message, args, mongoClient) {
    // Sends message to server where the command was posted
    await refreshToken(message, mongoClient);
    await getSpotifyUserId(message, mongoClient);
    await createPlaylist(args, message, mongoClient);
  },
};
