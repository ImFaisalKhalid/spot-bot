const fs = require('fs');
const Discord = require('discord.js');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

// Configure the .env
dotenv.config();

const mongoLogin = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}`;
const mongoServer = '@spotbotdata.ihjlp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
const uri = mongoLogin + mongoServer;

const myMongoClient = new MongoClient(uri);
myMongoClient.connect();

// Setup the Discord client and create
const client = new Discord.Client();
client.commands = new Discord.Collection();
client.cooldowns = new Discord.Collection();
client.active = new Discord.Collection();

// Use file system to store the names of our command folders and event files
const eventFiles = fs.readdirSync('./events').filter((file) => file.endsWith('.js'));
const commandFolders = fs.readdirSync('./commands');

// Loops through each commands folder
for (const folder of commandFolders) {
  // Gets all the file names
  const commandFiles = fs.readdirSync(`./commands/${folder}`).filter((file) => file.endsWith('.js'));

  // Loops through each file
  for (const file of commandFiles) {
    // Add it to our client commands list
    const command = require(`./commands/${folder}/${file}`);
    client.commands.set(command.name, command);
  }
}

// Loops through each event
for (const file of eventFiles) {
  // Executes the event
  const event = require(`./Events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client, myMongoClient));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client, myMongoClient));
  }
}

// Login to the client using our super secret Discord token
client.login(process.env.DISCORD_TOKEN);
