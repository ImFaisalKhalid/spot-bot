const axios = require('axios');
const dotenv = require('dotenv');
const config = require('../../config.json');
const authorizeServer = require('./utils/authenticate-server');

// Configure our .env
dotenv.config();

/**
 * This function uses axios to request the data for different songs based off the
 * genres, limits, and offsets given in the query.
 *
 * @param message The message used to call the command
 * @param query The query that needs to be sent to the Spotify API
 * @param accessToken The access token used to authenticate ourselves
 */
async function getRandomSong(message, accessToken, query) {
  // Set our access token
  await axios({
    method: 'get',
    url: query,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      for (let i = 0; i < response.data.tracks.items.length; i += 1) {
        message.channel.send(response.data.tracks.items[i].external_urls.spotify);
      }
    })
    .catch((err) => {
      console.log(err);
      message.channel.send(config.AUTHENTICATION_ERROR);
    });
}

/**
 * This will execute an authentication function which will then, upon success, call the function
 * to get a random song or songs based off the genre.
 *
 * @type {{args: boolean, usage: string, name: string, cool down: number,
 * description: string, execute(*=, *): void}}
 */
module.exports = {
  name: 'get-random-song',
  description: 'Get a random Spotify song based off a specific chosen genre!',
  usage: '<GENRE-name-dash-seperated> <NUMBER-3-or-under>',
  cooldown: 1,
  aliases: ['get-random', 'gr', 'getrandom'],
  args: true,
  async execute(message, args, mongoClient) {
    // Arg handling
    if (args[0] === undefined || args[1] === undefined) {
      message.channel.send(config.CHECK_USAGE_ERROR);
      return;
    }

    const genreLowerCase = args[0].toLowerCase();
    const genreName = genreLowerCase.replace(/-/g, ' ');
    const numberToSearch = args[1];

    // Confirm that genre is supported
    if (!config.GENRES.includes(genreName)) {
      message.channel.send(config.SONG_NOT_FOUND_ERROR);
      return;
    }

    // Confirm that second arg is a valid number
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(args[1])) {
      message.channel.send(config.ARG_NUM_ERROR);
      return;
    }

    // Verify that the number to search is in range
    if (numberToSearch > 3 || numberToSearch < 1) {
      message.channel.send(config.CHECK_USAGE_ERROR);
      return;
    }

    // Reauthorize the server and get a new token
    await authorizeServer.execute(message, mongoClient);

    // Connect to database and get server info
    const myDb = mongoClient.db(message.guild.id.toString());
    const collection = myDb.collection('server-info');

    // Use server info to get authorization token
    let serverToken = '';
    await collection.find().forEach(
      (myDoc) => {
        if (myDoc.name === message.guild.name) {
          serverToken = myDoc.serverToken;
        }
      },
    );

    const randomOffset = Math.floor(Math.random() * 990);
    const query = `https://api.spotify.com/v1/search?q=${encodeURIComponent(`genre: ${genreName}`)}&type=track&limit=${numberToSearch}&offset=${randomOffset}`;
    getRandomSong(message, serverToken, query);
  },
};
