# SD-Shop — Bot Discord

Bot Discord en JavaScript avec discord.js v14 : bienvenue avec bannière et avatar, tickets PayPal avec transcription, et salons vocaux BDA temporaires.

## Prérequis
- Node.js 20 ou plus récent
- Une application et un bot créés sur le [Discord Developer Portal](https://discord.com/developers/applications)

## Installation sous Windows
1. Télécharge ou décompresse le projet, puis ouvre le dossier `sd-shop-discord-bot-main`.
2. Ouvre un terminal dans ce dossier et lance `npm install`.
3. Copie `.env.example` vers `.env`, puis complète les identifiants.
4. Mets ta bannière dans le dossier principal sous le nom **`banniere.png`**, ou configure `WELCOME_BANNER_URL` avec un lien d’image accessible.
5. Lance `npm start`.

Ne partage jamais le token du bot. Active dans le Developer Portal les intents **Server Members Intent** et **Message Content Intent**. Le rôle du bot doit être suffisamment haut et avoir accès à la gestion des salons, messages, historique, fichiers et vocaux.

## Commandes slash
Les commandes sont rangées dans `src/commands/`, et non dans `src/index.js` :
- `/ticket-panel` — publie le panneau dans `TICKET_PANEL_CHANNEL_ID` (ou dans le salon courant si l’ID est absent).
- `/bda-setup` — affiche la configuration vocale. Les salons BDA temporaires sont créés automatiquement quand un membre rejoint le vocal d’attente.

Elles sont enregistrées automatiquement au démarrage sur le serveur `GUILD_ID`.

## Tickets et transcriptions
Les membres choisissent Achat, Commande ou Autre demande. Un salon privé est créé avec le lien PayPal et le bouton de fermeture. À la fermeture, un fichier texte est envoyé dans `TICKET_LOG_CHANNEL_ID`, puis le salon est supprimé. Les rôles du staff sont indiqués dans `STAFF_ROLE_ID`, séparés par des virgules si besoin.

## Configuration
Voir `.env.example`. Les catégories `TICKET_CATEGORY_ACHAT_ID`, `TICKET_CATEGORY_COMMANDE_ID` et `TICKET_CATEGORY_AUTRE_ID` sont facultatives et retombent sur `TICKET_CATEGORY_ID`. `BDA_WAITING_VOICE_ID` correspond au vocal d’attente; `BDA_CATEGORY_ID` est facultatif.

```bash
npm start
```
