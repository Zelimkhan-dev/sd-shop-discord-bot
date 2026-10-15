const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { env } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Publier le panneau d’ouverture des tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const channel = interaction.guild.channels.cache.get(env.TICKET_PANEL_CHANNEL_ID) || interaction.channel;
    if (!channel?.isTextBased()) return interaction.reply({ content: 'Le salon du panneau est introuvable ou invalide.', ephemeral: true });
    const embed = new EmbedBuilder().setColor(0x8b35ff).setTitle('🎫 Assistance SD-Shop')
      .setDescription('Clique sur **Ouvrir un ticket**, puis choisis le sujet correspondant. Notre équipe te répondra dès que possible.');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_open').setLabel('Ouvrir un ticket').setStyle(ButtonStyle.Primary).setEmoji('🎫')
    );
    await channel.send({ embeds: [embed], components: [row] });
    return interaction.reply({ content: `Panneau publié dans ${channel}.`, ephemeral: true });
  }
};
