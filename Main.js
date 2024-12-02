// Main.js

const { 
    Client, 
    GatewayIntentBits, 
    PermissionsBitField, 
    Collection 
  } = require('discord.js');
  const { 
    joinVoiceChannel, 
    VoiceConnectionStatus,
    EndBehaviorType,
    entersState
  } = require('@discordjs/voice');
  const fs = require('fs');
  const { execFile } = require('child_process');
  const ffmpegPath = require('ffmpeg-static');
  const prism = require('prism-media');
  const opusscript = require('opusscript'); // Assurez-vous que opusscript est installé
  const config = require('./config.json');
  const path = require('path');
  
  // Initialisation du client Discord
  const client = new Client({ 
    intents: [
      GatewayIntentBits.Guilds, 
      GatewayIntentBits.GuildVoiceStates, 
      GatewayIntentBits.GuildMessages, 
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages
    ],
    partials: ['CHANNEL'] // Pour gérer les DMs
  });
  
  // Chargement des commandes
  client.commands = new Collection();
  const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
  }
  
  // Vérifier et créer le répertoire des enregistrements si nécessaire
  const recordingsPath = config.recordingsPath;
  if (!fs.existsSync(recordingsPath)) {
    try {
      fs.mkdirSync(recordingsPath, { recursive: true });
      console.log(`[${new Date().toLocaleString()}] Répertoire 'recordings' créé.`);
    } catch (err) {
      console.error(`[${new Date().toLocaleString()}] Erreur lors de la création du répertoire 'recordings':`, err);
      process.exit(1);
    }
  } else {
    // Vérifier les permissions d'écriture
    fs.access(recordingsPath, fs.constants.W_OK, (err) => {
      if (err) {
        console.error(`[${new Date().toLocaleString()}] Le bot n'a pas les permissions d'écriture dans le répertoire 'recordings'.`);
        process.exit(1);
      } else {
        console.log(`[${new Date().toLocaleString()}] Répertoire 'recordings' accessible en écriture.`);
      }
    });
  }
  
  // Map pour suivre les sessions d'enregistrement par serveur
  const recordingSessions = new Map();
  
  // Fonction pour vérifier si au moins un utilisateur est sourd
  function isAnyUserDeafened(guild) {
    const members = guild.members.cache.filter(member => member.voice && member.voice.deaf);
    return members.size > 0;
  }
  
  // Fonction pour gérer l'enregistrement
  async function startRecording(guild, voiceChannel) {
    if (recordingSessions.has(guild.id)) {
      console.log(`[${new Date().toLocaleString()}] Enregistrement déjà en cours dans le serveur "${guild.name}".`);
      return;
    }
  
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false // Assurez-vous que le bot n'est pas sourd pour recevoir l'audio
    });
  
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
      console.log(`[${new Date().toLocaleString()}] Bot connecté au salon vocal "${voiceChannel.name}".`);
  
      const receiver = connection.receiver;
  
      // Créer un répertoire spécifique pour cette session d'enregistrement
      const timestamp = Date.now();
      const sessionPath = path.join(recordingsPath, `${guild.id}-${timestamp}`);
      fs.mkdirSync(sessionPath);
      console.log(`[${new Date().toLocaleString()}] Répertoire de session créé: ${sessionPath}`);
  
      // Map pour suivre les flux audio de chaque utilisateur
      const audioStreams = new Map();
  
      // Fonction pour gérer les flux audio entrants
      const onAudio = (userId, userName, audioStream) => {
        console.log(`[${new Date().toLocaleString()}] Enregistrement de l'utilisateur ${userName} (ID: ${userId}).`);
  
        const pcmFilePath = path.join(sessionPath, `${userId}-${timestamp}.pcm`);
        const mp3FilePath = pcmFilePath.replace('.pcm', '.mp3');
  
        const opusDecoder = new prism.opus.Decoder({
          rate: 48000,
          channels: 2,
          frameSize: 960,
        });
  
        const writeStream = fs.createWriteStream(pcmFilePath);
        audioStream.pipe(opusDecoder).pipe(writeStream);
  
        opusDecoder.on('data', (chunk) => {
          // Optionnel: Ajouter des logs sur la réception des données
        });
  
        opusDecoder.on('error', (error) => {
          console.error(`[${new Date().toLocaleString()}] Erreur du décodeur Opus pour l'utilisateur ID: ${userId}:`, error);
        });
  
        writeStream.on('error', (error) => {
          console.error(`[${new Date().toLocaleString()}] Erreur d'écriture du fichier PCM pour l'utilisateur ID: ${userId}:`, error);
        });
  
        writeStream.on('finish', () => {
          console.log(`[${new Date().toLocaleString()}] Écriture du fichier PCM terminée pour l'utilisateur ID: ${userId}.`);
  
          // Convertir PCM en MP3
          execFile(ffmpegPath, [
            '-f', 's16le',
            '-ar', '48000',
            '-ac', '2',
            '-i', pcmFilePath,
            mp3FilePath
          ], (error) => {
            if (error) {
              console.error(`[${new Date().toLocaleString()}] Erreur lors de la conversion en MP3 pour l'utilisateur ID: ${userId}:`, error);
              return;
            }
  
            // Vérifier que le fichier MP3 n'est pas vide
            fs.stat(mp3FilePath, (err, stats) => {
              if (err) {
                console.error(`[${new Date().toLocaleString()}] Erreur lors de la vérification du fichier MP3 pour l'utilisateur ID: ${userId}:`, err);
                return;
              }
  
              if (stats.size === 0) {
                console.error(`[${new Date().toLocaleString()}] Le fichier MP3 pour l'utilisateur ID: ${userId} est vide.`);
                return;
              }
  
              console.log(`[${new Date().toLocaleString()}] Enregistrement converti en MP3 à ${mp3FilePath}`);
  
              // Collecter les informations sur les utilisateurs enregistrés
              const recordedUsers = Array.from(audioStreams.keys()).map(id => `<@${id}>`).join(', ');
  
              // Préparer les informations à envoyer
              const startTime = new Date(timestamp).toLocaleString();
              const endTime = new Date().toLocaleString();
              const infoMessage = `📄 **Enregistrement Audio**
  - **Salon Vocal :** ${voiceChannel.name}
  - **Heure de Début :** ${startTime}
  - **Heure de Fin :** ${endTime}
  - **Utilisateurs Enregistrés :** ${recordedUsers}`;
  
              // Envoyer le fichier MP3 avec les informations
              const targetUser = client.users.cache.get(config.targetUserId);
              if (targetUser) {
                console.log(`[${new Date().toLocaleString()}] Envoi de l'enregistrement à l'utilisateur cible (ID: ${config.targetUserId}).`);
                targetUser.send({
                  content: infoMessage,
                  files: [mp3FilePath],
                })
                .then(() => {
                  console.log(`[${new Date().toLocaleString()}] Enregistrement envoyé à l'utilisateur cible (ID: ${config.targetUserId}).`);
                })
                .catch(err => {
                  console.error(`[${new Date().toLocaleString()}] Erreur lors de l'envoi du fichier à l'utilisateur cible:`, err);
                });
              } else {
                console.error(`[${new Date().toLocaleString()}] Utilisateur cible non trouvé (ID: ${config.targetUserId}).`);
              }
            });
          });
        });
  
        // Stocker le flux audio
        audioStreams.set(userId, { audioStream, writeStream, opusDecoder });
      };
  
      // Écouter les flux audio de tous les utilisateurs présents
      voiceChannel.members.forEach(member => {
        if (member.user.bot) return; // Ignorer les bots
  
        const userId = member.id;
        const userName = member.user.tag;
  
        const audioStream = receiver.subscribe(userId, {
          end: {
            behavior: EndBehaviorType.Manual
          },
          mode: 'opus' // Recevoir des paquets Opus bruts
        });
  
        onAudio(userId, userName, audioStream);
      });
  
      // Écouter les futurs utilisateurs qui rejoignent ou parlent
      receiver.speaking.on('start', (userId) => {
        const member = voiceChannel.guild.members.cache.get(userId);
        if (member && !member.user.bot) {
          const userName = member.user.tag;
          if (!audioStreams.has(userId)) {
            const audioStream = receiver.subscribe(userId, {
              end: {
                behavior: EndBehaviorType.Manual
              },
              mode: 'opus' // Recevoir des paquets Opus bruts
            });
  
            onAudio(userId, userName, audioStream);
          }
        }
      });
  
      // Stocker la session d'enregistrement
      recordingSessions.set(guild.id, { connection, audioStreams, sessionPath });
  
      // Surveiller l'état de sourdine casque pour arrêter l'enregistrement si nécessaire
      const interval = setInterval(() => {
        if (!isAnyUserDeafened(guild)) {
          console.log(`[${new Date().toLocaleString()}] Plus aucun utilisateur en sourdine casque. Arrêt de l'enregistrement.`);
          stopRecording(guild.id);
          clearInterval(interval);
        }
      }, 5000); // Vérifier toutes les 5 secondes
    } catch (error) {
      console.error(`[${new Date().toLocaleString()}] Erreur lors de la connexion au salon vocal "${voiceChannel.name}":`, error);
      connection.destroy();
    }
  }
  
  // Fonction pour arrêter l'enregistrement
  function stopRecording(guildId) {
    const session = recordingSessions.get(guildId);
    if (!session) {
      console.log(`[${new Date().toLocaleString()}] Aucune session d'enregistrement à arrêter pour le serveur ID: ${guildId}.`);
      return;
    }
  
    const { connection, audioStreams, sessionPath } = session;
  
    // Arrêter tous les flux audio
    audioStreams.forEach(({ audioStream, writeStream, opusDecoder }, userId) => {
      audioStream.destroy();
      writeStream.end();
      console.log(`[${new Date().toLocaleString()}] Arrêt de l'enregistrement pour l'utilisateur ID: ${userId}.`);
    });
  
    // Supprimer la session
    recordingSessions.delete(guildId);
  
    // Déconnecter le bot du salon vocal
    connection.destroy();
    console.log(`[${new Date().toLocaleString()}] Bot déconnecté du salon vocal.`);
  }
  
  // Événement VoiceStateUpdate pour surveiller les changements de sourdine
  client.on('voiceStateUpdate', (oldState, newState) => {
    const guild = newState.guild;
  
    // Vérifier si le statut 'deaf' a changé
    const wasDeaf = oldState.deaf;
    const isDeaf = newState.deaf;
  
    if (!wasDeaf && isDeaf) {
      // Un utilisateur a été sourd (soit lui-même, soit par un modérateur)
      console.log(`[${new Date().toLocaleString()}] ${newState.member.user.tag} a été sourd.`);
      
      if (isAnyUserDeafened(guild)) {
        const voiceChannel = newState.channel;
        if (voiceChannel) {
          startRecording(guild, voiceChannel);
        }
      }
    }
  
    if (wasDeaf && !isDeaf) {
      // Un utilisateur a été rendu audible
      console.log(`[${new Date().toLocaleString()}] ${newState.member.user.tag} a été rendu audible.`);
      
      if (!isAnyUserDeafened(guild)) {
        stopRecording(guild.id);
      }
    }
  });
  
  // Événement MessageCreate pour gérer les commandes
  client.on('messageCreate', async (message) => {
    // Ignorer les messages envoyés par le bot
    if (message.author.bot) return;
  
    // Gérer uniquement les messages commençant par '!'
    if (!message.content.startsWith('!')) return;
  
    // Extraire la commande et les arguments
    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
  
    // Récupérer la commande
    const command = client.commands.get(commandName);
    if (!command) return;
  
    try {
      await command.execute(message, args);
    } catch (error) {
      console.error(`[${new Date().toLocaleString()}] Erreur lors de l'exécution de la commande ${commandName}:`, error);
      message.reply('Il y a eu une erreur lors de l\'exécution de cette commande.');
    }
  });
  
  // Événement Ready pour afficher le statut du bot
  client.once('ready', () => {
    console.log(`[${new Date().toLocaleString()}] Bot prêt et en ligne.`);
  });
  
  // Connexion du bot
  client.login(config.token);
  