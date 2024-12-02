// commands/clear.js

const { PermissionsBitField, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  name: 'clear',
  description: 'Supprime les messages du bot dans les messages privés.',
  async execute(message, args) {
    // Vérifier si le message est un DM
    if (message.channel.type !== ChannelType.DM) {
      return message.reply('❌ Cette commande ne peut être utilisée que dans les messages privés.');
    }

    // Vérifier si l'utilisateur est autorisé (votre ID)
    if (message.author.id !== '830858630315376730') { // Votre ID Discord
      return message.reply('❌ Vous n\'êtes pas autorisé à utiliser cette commande.');
    }

    // Créer un Embed pour la confirmation
    const confirmationEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('Confirmation de la Suppression des Messages')
      .setDescription('Voulez-vous supprimer **tous les messages** du bot ou **un nombre spécifique** de messages ?\n\n**Répondez avec** `all` **ou le nombre de messages à supprimer.**')
      .setTimestamp();

    await message.reply({ embeds: [confirmationEmbed] });

    try {
      // Filtrer les messages provenant uniquement du bot
      const filter = m => m.author.id === message.author.id;

      // Attendre la réponse de l'utilisateur
      const collected = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 30000, // 30 secondes
        errors: ['time']
      });

      const response = collected.first().content.trim().toLowerCase();

      if (response === 'all') {
        // Supprimer tous les messages du bot dans le DM
        const fetched = await message.channel.messages.fetch({ limit: 100 });
        const botMessages = fetched.filter(m => m.author.id === message.client.user.id);

        if (botMessages.size === 0) {
          return message.reply('⚠️ Aucun message du bot à supprimer.');
        }

        // Supprimer les messages un par un
        for (const [msgId, msg] of botMessages) {
          try {
            await msg.delete();
          } catch (err) {
            console.error(`Erreur lors de la suppression du message ID ${msgId}:`, err);
          }
        }

        return message.reply(`✅ Supprimé ${botMessages.size} message(s) du bot.`);
      } else {
        // Vérifier si la réponse est un nombre valide
        const number = parseInt(response, 10);
        if (isNaN(number) || number <= 0) {
          return message.reply('❌ Réponse invalide. Veuillez répondre avec `all` ou un nombre positif.');
        }

        // Supprimer le nombre spécifié de messages du bot dans le DM
        const fetched = await message.channel.messages.fetch({ limit: number });
        const botMessages = fetched.filter(m => m.author.id === message.client.user.id);

        if (botMessages.size === 0) {
          return message.reply('⚠️ Aucun message du bot à supprimer.');
        }

        // Supprimer les messages un par un
        for (const [msgId, msg] of botMessages) {
          try {
            await msg.delete();
          } catch (err) {
            console.error(`Erreur lors de la suppression du message ID ${msgId}:`, err);
          }
        }

        return message.reply(`✅ Supprimé ${botMessages.size} message(s) du bot.`);
      }
    } catch (error) {
      if (error instanceof Map) {
        // Erreur due au délai d'attente
        return message.reply('⏰ Temps écoulé. Veuillez réessayer la commande.');
      } else {
        console.error(`[${new Date().toLocaleString()}] Erreur lors de l'exécution de la commande !clear:`, error);
        return message.reply('❌ Une erreur est survenue lors de la suppression des messages.');
      }
    }
  },
};
