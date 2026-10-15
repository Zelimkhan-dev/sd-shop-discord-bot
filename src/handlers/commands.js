const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes, PermissionFlagsBits } = require('discord.js');
const { env } = require('../config');

function loadCommands(client) {
  const commandsDir = path.join(__dirname, '..', 'commands');
  for (const file of fs.readdirSync(commandsDir).filter(name => name.endsWith('.js'))) {
    const command = require(path.join(commandsDir, file));
    client.commands.set(command.data.name, command);
  }
}

async function registerCommands(client) {
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
  const body = [...client.commands.values()].map(command => command.data.toJSON());
  await rest.put(Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID), { body });
}

module.exports = { loadCommands, registerCommands, PermissionFlagsBits };
