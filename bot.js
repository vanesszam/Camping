// BOT MINIMAL POUR TEST
const TelegramBot = require('node-telegram-bot-api');

console.log('🏕️ Test du bot...');

const TOKEN = '8029829192:AAG6R2M5-0x5cZ48t-1NSCOBUYzYdanIWPA';
const bot = new TelegramBot(TOKEN, {polling: true});

console.log('✅ Bot démarré');

const userSessions = {};
const PASSWORD = '123';

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'User';
  
  userSessions[chatId] = {step: 'password'};
  bot.sendMessage(chatId, `🔐 Bonjour ${userName}!\n\nEntrez le mot de passe:`);
});

// Messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (!userSessions[chatId] || text.startsWith('/')) return;
  
  const session = userSessions[chatId];
  
  if (session.step === 'password') {
    if (text === PASSWORD) {
      bot.sendMessage(chatId, '✅ *Accès accordé!*\n\n🏠 *Menu Principal*\n\nChoisissez:', {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{text: '🧹 Nettoyage'}],
            [{text: '📦 Inventaire'}],
            [{text: '🔧 Maintenance'}]
          ],
          one_time_keyboard: true,
          resize_keyboard: true
        }
      });
      delete userSessions[chatId];
    } else {
      bot.sendMessage(chatId, '❌ Mauvais mot de passe! Essayez encore:');
    }
    return;
  }
  
  // Menu principal
  if (text === '🧹 Nettoyage') {
    bot.sendMessage(chatId, '🧹 *Section Nettoyage*\n\nFonctionnalités complètes bientôt disponibles!', {
      parse_mode: 'Markdown',
      reply_markup: {remove_keyboard: true}
    });
  }
  else if (text === '📦 Inventaire') {
    bot.sendMessage(chatId, '📦 *Section Inventaire*\n\nFonctionnalités complètes bientôt disponibles!', {
      parse_mode: 'Markdown',
      reply_markup: {remove_keyboard: true}
    });
  }
  else if (text === '🔧 Maintenance') {
    bot.sendMessage(chatId, '🔧 *Section Maintenance*\n\nFonctionnalités complètes bientôt disponibles!', {
      parse_mode: 'Markdown',
      reply_markup: {remove_keyboard: true}
    });
  }
});

bot.on('error', (error) => {
  console.error('Erreur:', error);
});

console.log('🎉 Bot en marche!');
