const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const { env, staffRoleIds, ticketTypes, categoryFor, safeName } = require('../config');
const { isStaff } = require('../handlers/interactions');

const activeTickets = new Map();

async function openTicketMenu(interaction) {
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId('ticket_type').setPlaceholder('Choisis le sujet du ticket').addOptions(ticketTypes)
  );
  return interaction.reply({ content: 'Quel est le sujet de ta demande ?', components: [row], ephemeral: true });
}

async function createTicket(interaction) {
  const type = interaction.values[0];
  if (!ticketTypes.some(item => item.value === type)) return interaction.reply({ content: 'Ce type de ticket est invalide.', ephemeral: true });
  const key = `${interaction.guildId}:${interaction.user.id}`;
  const existing = activeTickets.get(key);
  if (existing) {
    const channel = interaction.guild.channels.cache.get(existing);
    if (channel) return interaction.reply({ content: `Tu as déjà un ticket ouvert : ${channel}.`, ephemeral: true });
    activeTickets.delete(key);
  }

  const categoryId = categoryFor(type);
  const parent = categoryId && interaction.guild.channels.cache.get(categoryId)?.type === ChannelType.GuildCategory ? categoryId : undefined;
  const overwrites = [
    { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
    ...staffRoleIds.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] }))
  ];
  const channel = await interaction.guild.channels.create({
    name: `en-preparation-${type}-${safeName(interaction.user.username)}`.slice(0, 100),
    type: ChannelType.GuildText,
    parent,
    topic: `Ticket ${type} de ${interaction.user.tag} (${interaction.user.id})`,
    permissionOverwrites: overwrites
  });
  activeTickets.set(key, channel.id);

  const embed = new EmbedBuilder().setColor(0x8b35ff).setTitle(`Ticket ${type} — en cours de préparation`)
    .setDescription(`Bonjour ${interaction.user}, un membre de l’équipe va bientôt t’aider.\n\nLien PayPal : ${env.PAYPAL_URL || 'À configurer dans le fichier .env'}\n\nExplique ta demande ici. La transcription sera envoyée à la fermeture du ticket.`)
    .setTimestamp();
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_close').setLabel('Fermer et transcrire').setStyle(ButtonStyle.Danger)
  );
  const staffMentions = staffRoleIds.map(id => `<@&${id}>`).join(' ');
  await channel.send({ content: `${interaction.user}${staffMentions ? ` ${staffMentions}` : ''}`, embeds: [embed], components: [row] });
  return interaction.update({ content: `Ton ticket est prêt : ${channel}`, components: [] });
}

async function buildTranscript(channel) {
  const lines = [`Transcription de #${channel.name}`, `Sujet : ${channel.topic || 'non défini'}`, ''];
  let before;
  while (true) {
    const batch = await channel.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
    if (!batch.size) break;
    const chronological = [...batch.values()].reverse();
    for (const message of chronological) {
      const attachments = [...message.attachments.values()].map(file => file.url);
      const text = message.content || '';
      lines.push(`[${message.createdAt.toISOString()}] ${message.author.tag}: ${text}${attachments.length ? ` | pièces jointes : ${attachments.join(', ')}` : ''}`);
    }
    before = batch.last().id;
    if (batch.size < 100) break;
  }
  return Buffer.from(lines.join('\n') || 'Aucun message', 'utf8');
}

async function closeTicket(interaction) {
  const channel = interaction.channel;
  if (!channel || channel.type !== ChannelType.GuildText || !channel.topic?.includes('Ticket ')) {
    return interaction.reply({ content: 'Ce bouton ne se trouve pas dans un ticket valide.', ephemeral: true });
  }
  const ownerId = channel.topic.match(/\((\d{15,})\)$/)?.[1];
  if (ownerId && interaction.user.id !== ownerId && !isStaff(interaction)) {
    return interaction.reply({ content: 'Seul l’auteur du ticket ou le staff peut le fermer.', ephemeral: true });
  }
  await interaction.reply({ content: 'Fermeture du ticket et création de la transcription…', ephemeral: true });
  const transcript = await buildTranscript(channel);
  const log = env.TICKET_LOG_CHANNEL_ID && interaction.guild.channels.cache.get(env.TICKET_LOG_CHANNEL_ID);
  if (log?.isTextBased()) {
    await log.send({
      content: `Transcription de **${channel.name}** — fermé par ${interaction.user.tag}`,
      files: [new AttachmentBuilder(transcript, { name: `${channel.name}-transcription.txt` })]
    });
  }
  if (ownerId && activeTickets.get(`${interaction.guildId}:${ownerId}`) === channel.id) activeTickets.delete(`${interaction.guildId}:${ownerId}`);
  await channel.delete(`Ticket fermé par ${interaction.user.tag}`);
}

function startTicketCleanup() {
  activeTickets.clear();
}

module.exports = { openTicketMenu, createTicket, closeTicket, startTicketCleanup };
