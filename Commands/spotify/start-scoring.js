const SpotifyWebApi = require('spotify-web-api-node');
const config = require('../../config.json');
const refreshAccess = require('./utils/refresh-token');
const authorizeServer = require('./utils/authenticate-server');
const buildScoreCollection = require('./utils/build-score-collection');

// Create our api wrapper
const spotifyApi = new SpotifyWebApi();

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
          totalScoreData = JSON.parse(JSON.stringify(myDoc[username].scores));
        } else {
          totalScoreData = myDoc.totals.scores;
        }
      }
    },
  );

  console.log(totalScoreData);

  const filter = (m) => m.content.startsWith('!score') || m.content.startsWith('!begin');

  let count = 0;
  await message.author.send(config.BEGIN_SCORING_MESSAGE);
  const collector = message.author.dmChannel.createMessageCollector(filter);

  collector.on('collect', async (m) => {
    if (count > 0) {
      scoreData[count - 1].score = m.content.split(' ')[1];

      // eslint-disable-next-line radix
      const oldTotal = parseInt(totalScoreData[count - 1].score);
      // eslint-disable-next-line radix
      const argScore = parseInt(m.content.split(' ')[1]);
      const newTotal = oldTotal + argScore;
      totalScoreData[count - 1].score = newTotal;
    }

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

  collector.on('end', async () => {
    message.author.dmChannel.send(config.FINISH_SCORING_MESSAGE);
    message.author.dmChannel.send('Here are the current scores');

    const response = [];
    for (let i = 0; i < totalScoreData.length; i += 1) {
      response.push(`***${totalScoreData[i].name}***`);
      response.push(totalScoreData[i].score);
    }
    message.author.dmChannel.send(response);
    // console.log(scoreData);
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

  console.log('Completed?');
}

module.exports = {
  name: 'start-scoring',
  description: 'Use this to score a playlist!',
  aliases: ['ss', 'startscoring'],
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
