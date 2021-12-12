# Spot Bot

### Description:

Ever get tired of listening to the same set of songs over and over again? This new Discord bot aims to solve that problem! 
By utilizing the Spotify API, the bot allows server users to generate a random song based off a certain category. It also 
inspires more community interaction by allowing users to submit songs to a playlist and to have them be judged competition
style by users of a specific role!  

On top of all that, this bot allows you to listen to music in a voice channel without the bitrate being capped behind a paywall!

### Technologies Used:
- Axios
- Digital Ocean
- MongoDB Atlas
- NodeJs
- Spotify and Youtube APIs
- Discord.js Library

### Styling:
- Airbnb Javascript formatting
- Commands all stored in a ```Commands``` folder for easy command handler parsing
- Events all stored in a ```Events``` folder for easy event handling
- Sensitive information stored in a ```.env``` file

# How to Install

### Local Copy:
1. Clone the project
2. Install the npm packages: 
```bash
npm install
```
3. Create a .env file:
```bash
vi .env
```
4. Post in the token information using the following format:
```bash
DISCORD_TOKEN=
SPOTIFY_TOKEN=
SPOTIFY_CLIENT_ID=
MONGO_USER=
MONGO_PASS=
YOUTUBE_KEY=
```
5. Begin developing!

### Inviting the Bot:
1. Invite the bot using [this link](https://discord.com/oauth2/authorize?client_id=827367232459243521&scope=bot&permissions=8)
2. Confirm the server
3. Start using it!

# How To Use

The bot comes with various different set of commands!

### Utility Commands:

- ```-help``` List all of the commands this bot supports!


### Spotify Commands:

- ```-authorize``` Authorize your Spotify account! Required for playlist creation!
- ```-create-server-playlist``` Create a collaborative playlist for the server!
- ```-add-to-playlist``` List all the server playlists!
- ```-list-playlists``` List all the server playlists!
- ```-get-song-by-artist``` Get a Spotify song!
- ```-get-random-song``` Get a random Spotify song based off a specific chosen genre!
- ```-list-genres``` List all the available genres to search for!
- ```-start-scoring``` Use this to score a playlist!

### Player Commands:

- ```-play``` Play a song!
- ```-pause``` Pause the current song!
- ```-resume``` Resume the current song!
- ```-skip``` Skip the current song
- ```-volume``` Adjust the volume!
- ```-queue``` List the current queue!

### Fun:

- ```-ping``` Ping the bot to see if it is online!

# Contributing

Have a set of commands that you think should be added to the bot? Found some strange bug that
you would like to tackle? Have a way to improve sound quality? Submit a pull request!

Contributions are always welcome! If you are looking for a starting point, here are some features that
still need to be implemented:

- **SoundCloud support** 
    - The bot needs to be able to get songs from SoundCloud and play them 
      via voice chat.
    
- **YouTube playlist** 
    - The bot still does not allow you to create or play YouTube playlists.

- **A way to play Spotify playlists** 
    - This bot allows servers to create their own playlists but currently
does not have a features to allow users to play a playlist via voice chat.
  
- **Join and kick bot commands** 
    - A set of commands that allow you to summon a bot into a voice
chat and kick it from the voice chat.
  
- **Anything that makes the queue or music player a better experience**
    - Perhaps a way to show song lyrics?
    - Clearing the queue?
    - Shuffle a queue?
    - Save the current song by getting a DM?
    
**The possibilities are endless!**


### Want more information on the project? Reach out!

- Check out [my website](https://www.imfaisalkhalid.com/)
- Follow [my Twitter](https://twitter.com/ImFaisalKhalid)
- Connect with me [on LinkedIn](https://www.linkedin.com/in/Imfaisalkhalid/)
