const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { env } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bda-setup')
    .setDescription('Afficher la configuration des vocaux BDA')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const waiting = env.BDA_WAITING_VOICE_ID ? `<#${env.BDA_WAITING_VOICE_ID}>` : 'non configuré';
    const category = env.BDA_CATEGORY_ID ? `<#${env.BDA_CATEGORY_ID}>` : 'non configurée';
    return interaction.reply({ content: `Vocal d’attente : ${waiting}\nCatégorie des vocaux temporaires : ${category}`, ephemeral: true });
  }
};
