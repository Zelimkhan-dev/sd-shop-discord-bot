# SD-Shop — Bot Discord

Bot Discord en JavaScript avec discord.js v14 : message de bienvenue, tickets avec choix et lien PayPal, transcription à la fermeture, et salons vocaux BDA temporaires.

## Prérequis
- Node.js 20 ou plus récent
- Une application et un bot créés sur le [Discord Developer Portal](https://discord.com/developers/applications)

## Installation
```bash
git clone https://github.com/Zelimkhan-dev/sd-shop-discord-bot.git
cd sd-shop-discord-bot
npm install
cp .env.example .env
```
Complétez `.env` avec les IDs et paramètres de votre serveur. Ne partagez jamais le token du bot.

## Configuration Discord
Dans le Developer Portal, activez les intents privilégiés **Server Members Intent** et **Message Content Intent**. Invitez le bot avec les permissions de gérer les salons, voir les salons, envoyer des messages, lire l’historique, joindre des fichiers, se connecter et déplacer des membres. Le rôle du bot doit être suffisamment élevé.

Configurez dans `.env` le token, `CLIENT_ID`, `GUILD_ID`, les salons de bienvenue, panneau, transcriptions, la bannière, le lien PayPal, la catégorie de tickets et le rôle staff. `TICKET_CATEGORY_ID` sert de catégorie par défaut; des catégories distinctes par type sont facultatives. `BDA_WAITING_VOICE_ID` indique le vocal d’attente et `BDA_CATEGORY_ID` la catégorie facultative des vocaux temporaires.

## Démarrage et utilisation
```bash
npm start
```
Au démarrage, les commandes `/ticket-panel` et `/bda-setup` sont enregistrées sur le serveur configuré. Un administrateur exécute `/ticket-panel` pour publier le panneau. Les membres choisissent Achat, Commande ou Autre demande; le bot crée un salon privé avec le lien PayPal et un bouton de fermeture. La fermeture envoie une transcription texte au salon configuré puis supprime le ticket.

Quand un membre rejoint le vocal d’attente, un vocal privé « BDA + nom » est créé et il y est déplacé. Le vocal temporaire est supprimé quand il est vide.

Hébergez le processus en continu pour que le bot reste actif. Activez le mode développeur Discord pour copier les identifiants des salons, catégories et rôles.
