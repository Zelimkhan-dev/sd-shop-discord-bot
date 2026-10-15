require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, Events } = require('discord.js');
const { loadCommands, registerCommands } = require('./handlers/commands');
const { handleInteraction } = require('./handlers/interactions');
const { onMemberJoin } = require('./events/memberJoin');
const { onVoiceStateUpdate } = require('./events/voiceStateUpdate');
const { startTicketCleanup } = require('./features/tickets');

const required = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Variable manquante dans .env : ${key}`);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel]
});
client.commands = new Collection();
loadCommands(client);

client.once(Events.ClientReady, async readyClient => {
  console.log(`Connecté en tant que ${readyClient.user.tag}`);
  try {
    await registerCommands(readyClient);
    console.log('Commandes slash enregistrées sur le serveur.');
  } catch (error) {
    console.error('Échec de l’enregistrement des commandes slash :', error);
  }
});

client.on(Events.InteractionCreate, interaction => handleInteraction(interaction, client));
client.on(Events.GuildMemberAdd, onMemberJoin);
client.on(Events.VoiceStateUpdate, onVoiceStateUpdate);
client.on(Events.ClientReady, startTicketCleanup);
client.on(Events.Error, error => console.error('Erreur Discord :', error));

client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('Connexion Discord impossible :', error);
  process.exitCode = 1;
});
