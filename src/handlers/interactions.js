const { PermissionFlagsBits } = require('discord.js');
const { staffRoleIds } = require('../config');
const { openTicketMenu, createTicket, closeTicket } = require('../features/tickets');

async function handleInteraction(interaction, client) {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (command) await command.execute(interaction);
      return;
    }
    if (interaction.isButton() && interaction.customId === 'ticket_open') return openTicketMenu(interaction);
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_type') return createTicket(interaction);
    if (interaction.isButton() && interaction.customId === 'ticket_close') return closeTicket(interaction);
  } catch (error) {
    console.error('Erreur pendant une interaction :', error);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Une erreur est survenue. Vérifie la configuration et les permissions du bot.', ephemeral: true }).catch(() => {});
    }
  }
}

function isStaff(interaction) {
  return interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) ||
    staffRoleIds.some(id => interaction.member?.roles?.cache?.has(id));
}

module.exports = { handleInteraction, isStaff };
