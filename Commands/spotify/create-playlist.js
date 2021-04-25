const SpotifyWebApi = require('spotify-web-api-node');
const axios = require('axios');
const refreshAccess = require('./utils/refresh-token');
const config = require('../../config.json');

/**
 * This function creates the actual playlist. It makes a basic post request to the Spotify
 * API using AXIOS along with the user's specific Access Token. The new playlist made is then
 * stored inside the database.
 *
 * @param args The arguments giving with the command
 * @param message The Discord message of the command
 * @param mongoClient Our mongo database client
 * @returns {Promise<void>}
 */
async function createPlaylist(args, message, mongoClient) {
  // Gets the spotify Id of the user
  const myDb = mongoClient.db(message.guild.id.toString());
  const collection = myDb.collection('users');

  // Finding the user collection and getting the userId
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
      // Update database
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

      // Send response
      message.channel.send(response.data.external_urls.spotify);
    }, (error) => {
      console.log(error);
    });
}

/**
 * This function either gets or updates the user's specific Spotify Id. It does
 * so by using the Spotify web node wrapper and saves the info inside our database.
 *
 * @param message The Discord message of the command
 * @param mongoClient Our mongo database client
 * @returns {Promise<void>}
 */
async function getSpotifyUserId(message, mongoClient) {
  const myDb = mongoClient.db(message.guild.id.toString());
  const collection = myDb.collection('users');

  const result = await collection.findOne(
    { id: message.author.id.toString() },
  );

  // credentials are optional
  const spotifyApi = new SpotifyWebApi();

  // Set our access token
  await spotifyApi.setAccessToken(result.accessToken);

  // Get the authenticated user
  await spotifyApi.getMe()
    .then(async (data) => {
      // Add to database
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

/**
 * This module is used to create specific server playlists. The playlist data is then stored
 * into a database to allow adding to the playlists in the future.
 *
 * @type {{args: boolean, aliases: [string], usage: string, name: string,
 * description: string, guildOnly: boolean, execute(*=, *=, *=): Promise<void>}}
 */
module.exports = {
  name: 'create-server-playlist',
  description: 'This command will create a collaborative playlist for the server!',
  usage: '<PLAYLIST-name-dash-seperated>',
  aliases: ['csp'],
  guildOnly: true,
  args: true,
  role: 'DJ',
  async execute(message, args, mongoClient) {
    // Arg check
    if (args[0] === undefined) {
      message.channel.send(config.CHECK_USAGE_ERROR);
      return;
    }

    // Connect to database
    const myDb = mongoClient.db(message.guild.id.toString());
    const collection = myDb.collection('users');

    const result = await collection.findOne(
      { id: message.author.id.toString() },
    );

    // Refresh our token prior to doing anything else
    refreshAccess.execute(message, message.author.id.toString(), result.refreshToken, mongoClient);
    await getSpotifyUserId(message, mongoClient);
    await createPlaylist(args, message, mongoClient);
  },
};
