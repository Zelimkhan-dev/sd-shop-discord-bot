const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { env, staffRoleIds, safeName } = require('../config');

async function onVoiceStateUpdate(oldState, newState) {
  const waitingId = env.BDA_WAITING_VOICE_ID;
  if (waitingId && oldState.channelId !== newState.channelId && newState.channelId === waitingId) {
    const member = newState.member;
    if (member && !member.user.bot) {
      const guild = newState.guild;
      const parent = env.BDA_CATEGORY_ID && guild.channels.cache.get(env.BDA_CATEGORY_ID)?.type === ChannelType.GuildCategory
        ? env.BDA_CATEGORY_ID : undefined;
      try {
        const overwrites = [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
          { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream, PermissionFlagsBits.UseVAD] },
          ...staffRoleIds.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.MoveMembers] }))
        ];
        const voice = await guild.channels.create({
          name: `BDA-${safeName(member.user.username)}`.slice(0, 100),
          type: ChannelType.GuildVoice,
          parent,
          permissionOverwrites: overwrites
        });
        await member.voice.setChannel(voice).catch(async error => {
          console.error('Déplacement vers le vocal BDA impossible :', error);
          if (!voice.members.size) await voice.delete().catch(() => {});
        });
      } catch (error) {
        console.error('Création du vocal BDA impossible :', error);
      }
    }
  }

  const departed = oldState.channel;
  if (departed && departed.id !== env.BDA_WAITING_VOICE_ID && departed.type === ChannelType.GuildVoice &&
      departed.name.startsWith('BDA-') && departed.members.size === 0) {
    await departed.delete('Vocal BDA temporaire vide').catch(() => {});
  }
}

module.exports = { onVoiceStateUpdate };
