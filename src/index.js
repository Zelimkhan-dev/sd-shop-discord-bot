require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, PermissionFlagsBits, AttachmentBuilder, REST, Routes } = require('discord.js');
const fs = require('node:fs/promises');
const path = require('node:path');

const env = process.env;
const required = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
for (const key of required) if (!env[key]) throw new Error(`Variable manquante dans .env : ${key}`);
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates], partials: [Partials.Channel] });
const tickets = new Map();
const types = [
  { label: 'Achat', value: 'achat', description: 'Question ou demande avant un achat' },
  { label: 'Commande', value: 'commande', description: 'Suivi ou problème de commande' },
  { label: 'Autre demande', value: 'autre', description: 'Toute autre demande' }
];
const categoryFor = value => env[`TICKET_CATEGORY_${value.toUpperCase()}_ID`] || env.TICKET_CATEGORY_ID;
const safeName = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 75) || 'membre';

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
  await rest.put(Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID), { body: [
    { name: 'ticket-panel', description: 'Publier le panneau d’ouverture des tickets', default_member_permissions: String(PermissionFlagsBits.ManageGuild) },
    { name: 'bda-setup', description: 'Afficher les identifiants vocaux BDA configurés', default_member_permissions: String(PermissionFlagsBits.ManageGuild) }
  ] });
}
client.once(Events.ClientReady, async c => { console.log(`Connecté en tant que ${c.user.tag}`); try { await registerCommands(); } catch (e) { console.error('Enregistrement commandes :', e); } });

client.on(Events.GuildMemberAdd, async member => {
  const channel = member.guild.channels.cache.get(env.WELCOME_CHANNEL_ID);
  if (!channel?.isTextBased()) return;
  const embed = new EmbedBuilder().setColor(0x5865f2).setTitle(`Bienvenue chez SD-Shop, ${member.user.username} !`).setDescription(`Nous sommes ravis de t’accueillir, ${member}.`).setThumbnail(member.displayAvatarURL({ size: 256 })).setTimestamp();
  if (env.WELCOME_BANNER_URL) embed.setImage(env.WELCOME_BANNER_URL);
  await channel.send({ embeds: [embed] }).catch(console.error);
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'ticket-panel') {
        const channel = interaction.guild.channels.cache.get(env.TICKET_PANEL_CHANNEL_ID) || interaction.channel;
        const embed = new EmbedBuilder().setColor(0x5865f2).setTitle('🎫 Assistance SD-Shop').setDescription('Clique sur **Ouvrir un ticket**, puis choisis le sujet correspondant.');
        await channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_open').setLabel('Ouvrir un ticket').setStyle(ButtonStyle.Primary).setEmoji('🎫'))] });
        return interaction.reply({ content: `Panneau publié dans ${channel}.`, ephemeral: true });
      }
      if (interaction.commandName === 'bda-setup') return interaction.reply({ content: `Vocal d’attente : ${env.BDA_WAITING_VOICE_ID ? `<#${env.BDA_WAITING_VOICE_ID}>` : 'non configuré'}\nCatégorie des vocaux temporaires : ${env.BDA_CATEGORY_ID ? `<#${env.BDA_CATEGORY_ID}>` : 'non configurée'}`, ephemeral: true });
    }
    if (interaction.isButton() && interaction.customId === 'ticket_open') {
      const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('ticket_type').setPlaceholder('Choisis le sujet du ticket').addOptions(types));
      return interaction.reply({ content: 'Quel est le sujet de ta demande ?', components: [row], ephemeral: true });
    }
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_type') {
      const type = interaction.values[0];
      if (tickets.has(`${interaction.guildId}:${interaction.user.id}`)) return interaction.reply({ content: `Tu as déjà un ticket ouvert : <#${tickets.get(`${interaction.guildId}:${interaction.user.id}`)}>.`, ephemeral: true });
      const category = categoryFor(type);
      const parent = category && interaction.guild.channels.cache.get(category)?.type === ChannelType.GuildCategory ? category : undefined;
      const channel = await interaction.guild.channels.create({ name: `ticket-${type}-${safeName(interaction.user.username)}`.slice(0, 100), type: ChannelType.GuildText, parent, topic: `Ticket ${type} de ${interaction.user.tag} (${interaction.user.id})`, permissionOverwrites: [
        { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
        ...(env.STAFF_ROLE_ID ? [{ id: env.STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] }] : [])
      ] });
      tickets.set(`${interaction.guildId}:${interaction.user.id}`, channel.id);
      const embed = new EmbedBuilder().setColor(0x57f287).setTitle(`Ticket ${type} — en cours de préparation`).setDescription(`Bonjour ${interaction.user}, un membre de l’équipe va bientôt t’aider.\n\nLien PayPal : ${env.PAYPAL_URL || 'À configurer dans le fichier .env'}\n\nExplique ta demande ici. La transcription sera envoyée à la fermeture du ticket.`).setTimestamp();
      await channel.send({ content: `${interaction.user}${env.STAFF_ROLE_ID ? ` <@&${env.STAFF_ROLE_ID}>` : ''}`, embeds: [embed], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_close').setLabel('Fermer et transcrire').setStyle(ButtonStyle.Danger))] });
      return interaction.update({ content: `Ton ticket est prêt : ${channel}`, components: [] });
    }
    if (interaction.isButton() && interaction.customId === 'ticket_close') {
      const channel = interaction.channel;
      const ownerId = channel.topic?.match(/\((\d{15,})\)$/)?.[1];
      if (ownerId && interaction.user.id !== ownerId && !interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) && !interaction.member?.roles?.cache?.has(env.STAFF_ROLE_ID)) return interaction.reply({ content: 'Seul l’auteur du ticket ou le staff peut le fermer.', ephemeral: true });
      await interaction.reply({ content: 'Fermeture du ticket et création de la transcription…', ephemeral: true });
      const lines = [];
      let before;
      while (true) {
        const batch = await channel.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
        if (!batch.size) break;
        lines.unshift(...[...batch.values()].reverse().map(m => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content}${m.attachments.size ? ` | pièces jointes : ${[...m.attachments.values()].map(a => a.url).join(', ')}` : ''}`));
        before = batch.last().id;
        if (batch.size < 100) break;
      }
      const file = new AttachmentBuilder(Buffer.from(lines.join('\n') || 'Aucun message', 'utf8'), { name: `${channel.name}-transcription.txt` });
      const log = env.TICKET_LOG_CHANNEL_ID && interaction.guild.channels.cache.get(env.TICKET_LOG_CHANNEL_ID);
      if (log?.isTextBased()) await log.send({ content: `Transcription de **${channel.name}** (fermé par ${interaction.user.tag})`, files: [file] });
      const opener = ownerId && tickets.get(`${interaction.guildId}:${ownerId}`) === channel.id;
      if (opener) tickets.delete(`${interaction.guildId}:${ownerId}`);
      await channel.delete(`Ticket fermé par ${interaction.user.tag}`);
    }
  } catch (error) { console.error(error); if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) await interaction.reply({ content: 'Une erreur est survenue. Vérifie la configuration et les permissions du bot.', ephemeral: true }).catch(() => {}); }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  const waitingId = env.BDA_WAITING_VOICE_ID;
  if (!waitingId || oldState.channelId === newState.channelId || newState.channelId !== waitingId) return;
  const member = newState.member;
  if (!member || member.user.bot) return;
  const guild = newState.guild;
  const parent = env.BDA_CATEGORY_ID && guild.channels.cache.get(env.BDA_CATEGORY_ID)?.type === ChannelType.GuildCategory ? env.BDA_CATEGORY_ID : undefined;
  try {
    const voice = await guild.channels.create({ name: `BDA ${member.user.username}`.slice(0, 100), type: ChannelType.GuildVoice, parent, permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
      { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream, PermissionFlagsBits.UseVAD] },
      ...(env.STAFF_ROLE_ID ? [{ id: env.STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.MoveMembers] }] : [])
    ] });
    await member.voice.setChannel(voice).catch(async error => { console.error(error); if (!voice.members.size) await voice.delete().catch(() => {}); });
  } catch (error) { console.error('Création du vocal BDA impossible :', error); }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  const channel = oldState.channel;
  if (!channel || channel.id === env.BDA_WAITING_VOICE_ID || channel.type !== ChannelType.GuildVoice || !channel.name.startsWith('BDA ')) return;
  if (channel.members.size === 0) await channel.delete('Vocal BDA temporaire vide').catch(() => {});
});

client.login(env.DISCORD_TOKEN);
