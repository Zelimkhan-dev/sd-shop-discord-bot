const path = require('node:path');

const env = process.env;
const parseIds = value => (value || '').split(',').map(id => id.trim()).filter(Boolean);

module.exports = {
  env,
  rootDir: path.resolve(__dirname, '..'),
  staffRoleIds: parseIds(env.STAFF_ROLE_ID),
  ticketTypes: [
    { label: 'Achat', value: 'achat', description: 'Question ou demande avant un achat' },
    { label: 'Commande', value: 'commande', description: 'Suivi ou problème de commande' },
    { label: 'Autre demande', value: 'autre', description: 'Toute autre demande' }
  ],
  categoryFor(type) {
    return env[`TICKET_CATEGORY_${String(type).toUpperCase()}_ID`] || env.TICKET_CATEGORY_ID || null;
  },
  safeName(value) {
    return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 75) || 'membre';
  }
};
