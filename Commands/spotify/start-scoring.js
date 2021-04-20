const SpotifyWebApi = require('spotify-web-api-node');
const config = require('../../config.json');
const refreshAccess = require('./utils/refresh-token');
const authorizeServer = require('./utils/authenticate-server');
const buildScoreCollection = require('./utils/build-score-collection');

// Create our api wrapper
const spotifyApi = new SpotifyWebApi();

/**
 * This function initiates a message - response system utilizing the Discord channel
 * collection. It collects messages that have the !score prefix and then saves the score
 * into the database. Upon the end of this collector, it displays the current score total.
 *
 * @param message The message used to call the command
 * @param playlistId The ID of the playlist we are 'scoring'
 * @param mongoClient Our mongo database client
 * @returns {Promise<void>}
 */
async function collectScores(message, playlistId, mongoClient) {
  // Connection
  const myDb = mongoClient.db(message.guild.id.toString());
  const scoresCollection = myDb.collection('playlist-scores');
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
  // Set our access token
  spotifyApi.setAccessToken(serverToken);

  // Extract some playlist data
  let scoreData = [];
  let totalScoreData = [];
  let playlistLength = 0;
  await scoresCollection.find().forEach(
    (myDoc) => {
      if (myDoc.name === playlistId) {
        const username = message.author.tag;
        scoreData = myDoc[username].scores;
        playlistLength = myDoc[username].scores.length;

        if (myDoc.totals === undefined || myDoc.totals === null) {
          // Creates a deep copy of the scores array
          totalScoreData = JSON.parse(JSON.stringify(myDoc[username].scores));
        } else {
          totalScoreData = myDoc.totals.scores;
        }
      }
    },
  );

  // This will filter out anything that is not !score or !begin in our collector
  const filter = (m) => m.content.startsWith('!score') || m.content.startsWith('!begin');

  // Get brief instructions on how to start scoring
  await message.author.send(config.BEGIN_SCORING_MESSAGE);
  const collector = message.author.dmChannel.createMessageCollector(filter);

  // The following runs on the whenever the correct message is collected
  let count = 0;
  collector.on('collect', async (m) => {
    // Because of our !begin message, count is off by 1
    if (count > 0) {
      scoreData[count - 1].score = m.content.split(' ')[1];

      // eslint-disable-next-line radix
      const oldTotal = parseInt(totalScoreData[count - 1].score);
      // eslint-disable-next-line radix
      const argScore = parseInt(m.content.split(' ')[1]);
      const newTotal = oldTotal + argScore;
      totalScoreData[count - 1].score = newTotal;
    }

    // Collector stops when we get through the entire playlist
    if (count === playlistLength) {
      collector.stop();
      return;
    }

    message.author.dmChannel.send('Rate this song using `!score <number>` boi');
    // Search for song based off query
    await spotifyApi.searchTracks(`track:${scoreData[count].name} artist:${scoreData[count].artist}`)
      .then((data) => {
        message.author.dmChannel.send(`https://open.spotify.com/track/${data.body.tracks.items[0].id}`);
      })
      .catch((err) => {
        console.log(err);
        message.author.dmChannel.send(config.SONG_SEARCH_ERROR);
      });

    count += 1;
  });

  // This runs when the collector is finished
  collector.on('end', async () => {
    message.author.dmChannel.send(config.FINISH_SCORING_MESSAGE);
    message.author.dmChannel.send('Here are the current scores');

    // Pushes data into array so we can print/send it
    const response = [];
    for (let i = 0; i < totalScoreData.length; i += 1) {
      response.push(`***${totalScoreData[i].name}***`);
      response.push(totalScoreData[i].score);
    }
    message.author.dmChannel.send(response);

    // Update our database based off the received scores
    await scoresCollection.updateOne(
      { name: playlistId },
      {
        $set: {
          [message.author.tag]: {
            scores: scoreData,
          },
          totals: {
            scores: totalScoreData,
          },
        },
      },
      { upsert: true },
    );
  });
}

/**
 * This module refreshes the server token, gets the playlist Id based off the argument, then
 * builds a new collection for the playlist scores if needed, and then sets up a message
 * response system to collect the scores.
 *
 * @type {{args: boolean, aliases: [string, string], usage: string, name: string,
 * description: string, guildOnly: boolean, execute(*=, *, *=): Promise<undefined>}}
 */
module.exports = {
  name: 'start-scoring',
  description: 'Use this to score a playlist!',
  aliases: ['ss', 'startscoring, score'],
  args: true,
  guildOnly: true,
  usage: '<PLAYLIST-name-dash-seperated>',
  async execute(message, args, mongoClient) {
    // Arg check
    if (args[0] === undefined) {
      message.channel.send(config.CHECK_USAGE_ERROR);
      return;
    }
    const playlist = args[0].replace(/-/g, ' ');

    // Reauthorize the server and get a new token
    await authorizeServer.execute(message, mongoClient);

    // Connect to the right database
    const myDb = mongoClient.db(message.guild.id.toString());
    const playlistCollection = myDb.collection('playlists');
    const userCollection = myDb.collection('users');

    // Check if playlist exists as server playlist
    let playlistId = -1;
    let playlistOwner = -1;
    await playlistCollection.find().forEach(
      (myDoc) => {
        if (myDoc.playlistName === playlist) {
          playlistId = myDoc.id;
          playlistOwner = myDoc.submittedById;
        }
      },
    );

    // If the playlist is not found as a server-playlist
    if (playlistId === -1) {
      message.channel.send(config.PLAYLIST_NOT_FOUND_ERROR);
      return;
    }

    // Now get the playlist owner token and refresh it
    let refreshToken = '';
    await userCollection.find().forEach(
      (myDoc) => {
        if (myDoc.id === playlistOwner) {
          refreshToken = myDoc.refreshToken;
        }
      },
    );
    await refreshAccess.execute(message, playlistOwner, refreshToken, mongoClient);

    // Now return the access token
    let accessToken = '';
    await userCollection.find().forEach(
      (myDoc) => {
        if (myDoc.id === playlistOwner) {
          accessToken = myDoc.accessToken;
        }
      },
    );

    await buildScoreCollection.execute(message, mongoClient, playlistId, playlist, accessToken);
    await collectScores(message, playlistId, mongoClient);
  },
};
