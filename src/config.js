const path = require('node:path');

const env = process.env;
const parseIds = value => (value || '').split(',').map(id => id.trim()).filter(Boolean);

const DEFAULT_PAYPAL_URL = 'https://www.paypal.me/DodoNehess725';

module.exports = {
  env,
  rootDir: path.resolve(__dirname, '..'),
  staffRoleIds: parseIds(env.STAFF_ROLE_ID),
  ticketTypes: [
    { label: 'Achat', value: 'achat', description: 'Question ou demande avant un achat' },
    { label: 'Commande', value: 'commande', description: 'Suivi ou problème de commande' },
    { label: 'Autre demande', value: 'autre', description: 'Toute autre demande' }
  ],
  categoryFor(type, guild) {
    const configured = env[`TICKET_CATEGORY_${String(type).toUpperCase()}_ID`] || env.TICKET_CATEGORY_ID;
    if (configured) return configured;
    const names = {
      achat: ['achat', 'achats', 'tickets achat', 'tickets-achats'],
      commande: ['commande', 'commandes', 'tickets commande', 'tickets-commandes'],
      autre: ['autre', 'autres', 'tickets autre', 'tickets-autres']
    };
    const target = names[String(type).toLowerCase()] || [];
    const found = guild?.channels.cache.find(channel => channel.type === 4 && target.includes(channel.name.toLowerCase()));
    return found?.id || guild?.channels.cache.find(channel => channel.type === 4 && ['tickets', 'ticket'].includes(channel.name.toLowerCase()))?.id || null;
  },
  findTextChannel(guild, explicitId, names) {
    if (explicitId) return guild.channels.cache.get(explicitId) || null;
    const targets = names.map(name => name.toLowerCase());
    return guild.channels.cache.find(channel => channel.isTextBased() && targets.includes(channel.name.toLowerCase())) || null;
  },
  findVoiceChannel(guild, explicitId, names) {
    if (explicitId) return guild.channels.cache.get(explicitId) || null;
    const targets = names.map(name => name.toLowerCase());
    return guild.channels.cache.find(channel => channel.type === 2 && targets.includes(channel.name.toLowerCase())) || null;
  },
  get paypalUrl() {
    return env.PAYPAL_URL || DEFAULT_PAYPAL_URL;
  },
  safeName(value) {
    return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 75) || 'membre';
  }
};
