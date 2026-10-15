const path = require('node:path');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { env, rootDir } = require('../config');

async function onMemberJoin(member) {
  const channel = member.guild.channels.cache.get(env.WELCOME_CHANNEL_ID);
  if (!channel?.isTextBased()) return;

  const embed = new EmbedBuilder().setColor(0x8b35ff)
    .setTitle(`Bienvenue chez SD-Shop, ${member.user.username} !`)
    .setDescription(`Nous sommes ravis de t’accueillir, ${member}.`)
    .setThumbnail(member.displayAvatarURL({ size: 256 })).setTimestamp();
  const files = [];
  if (env.WELCOME_BANNER_URL) {
    embed.setImage(env.WELCOME_BANNER_URL);
  } else {
    const bannerPath = path.join(rootDir, 'banniere.png');
    try {
      files.push(new AttachmentBuilder(bannerPath, { name: 'banniere.png' }));
      embed.setImage('attachment://banniere.png');
    } catch (error) {
      console.error('Impossible de joindre banniere.png :', error);
    }
  }
  await channel.send({ embeds: [embed], files }).catch(console.error);
}

module.exports = { onMemberJoin };
