// CAMPING MANAGEMENT BOT - VERSION SIMPLE
const TelegramBot = require('node-telegram-bot-api');

// Configuration
const TOKEN = '8027810983:AAEPaJ5PY1Jw_8RKNPWHvwxOF9OW0hsAKaI';
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwSkZJmQzgwiNVxKbF8TuAj5xU2fY4Na29wHtYxUBYJqMGLzfPZcJoNHcQndcU8yQKg/exec';

console.log('🏕️ Démarrage du Bot de Gestion Camping...');

// Initialisation directe en polling
const bot = new TelegramBot(TOKEN, {polling: true});

console.log('🎉 Bot démarré !');

// =================================
// DATA
// =================================

const colors = ['🔵 Blue', '🤎 Brown', '🔘 Grey', '🟠 Orange', '🟡 Yellow'];
const PASSWORD = '123';

const userSessions = {};
const authenticatedUsers = {};

// =================================
// FUNCTIONS
// =================================

function getUserLanguage(user) {
  return (user.language_code && user.language_code.startsWith('fr')) ? 'fr' : 'en';
}

async function sendToGoogleSheets(data) {
  try {
    // Utiliser fetch natif (disponible dans Node.js 18+)
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({action: 'addReport', ...data})
    });
    return await response.json();
  } catch (error) {
    console.error('Google Sheets error:', error);
    // Continuer même si Google Sheets ne fonctionne pas
    return { success: false, error: error.message };
  }
}

async function sendMessage(chatId, text, options = {}) {
  try {
    await bot.sendMessage(chatId, text, options);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

function showMainMenu(chatId, lang) {
  const text = lang === 'fr' ? 
    '🏠 *Menu Principal*\n\nChoisissez votre section:' :
    '🏠 *Main Menu*\n\nChoose your section:';
    
  const keyboard = lang === 'fr' ? [
    [{text: '🧹 Nettoyage'}],
    [{text: '📦 Inventaire'}],
    [{text: '🔧 Maintenance'}]
  ] : [
    [{text: '🧹 Cleaning'}],
    [{text: '📦 Inventory'}],
    [{text: '🔧 Maintenance'}]
  ];
  
  sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: keyboard,
      one_time_keyboard: true,
      resize_keyboard: true
    }
  });
}

// =================================
// BOT COMMANDS
// =================================

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'User';
  const lang = getUserLanguage(msg.from);
  
  if (authenticatedUsers[chatId]) {
    showMainMenu(chatId, lang);
    return;
  }
  
  userSessions[chatId] = {step: 'password', lang: lang};
  
  const text = lang === 'fr' ? 
    `🔐 *Bot de Gestion Camping*\n\nBonjour ${userName}!\n\nEntrez le mot de passe:` :
    `🔐 *Camping Management Bot*\n\nHello ${userName}!\n\nEnter password:`;
  
  sendMessage(chatId, text, { parse_mode: 'Markdown' });
});

// /menu
bot.onText(/\/menu/, (msg) => {
  const chatId = msg.chat.id;
  const lang = getUserLanguage(msg.from);
  
  if (!authenticatedUsers[chatId]) {
    sendMessage(chatId, '🔐 Please use /start and enter password first!');
    return;
  }
  
  delete userSessions[chatId];
  showMainMenu(chatId, lang);
});

// /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const lang = getUserLanguage(msg.from);
  
  const text = lang === 'fr' ? 
    `ℹ️ *Aide - Bot de Gestion Camping*\n\n🏠 /menu - Menu principal\n🧹 /report - Section nettoyage\n📦 /stock - Section inventaire\n🔧 /maintenance - Section maintenance\n\n*Sections disponibles:*\n🧹 **Nettoyage** - Signaler objets manquants, statut bungalows\n📦 **Inventaire** - Gérer les stocks de fournitures\n🔧 **Maintenance** - Signaler problèmes techniques` :
    `ℹ️ *Help - Camping Management Bot*\n\n🏠 /menu - Main menu\n🧹 /report - Cleaning section\n📦 /stock - Inventory section\n🔧 /maintenance - Maintenance section\n\n*Available sections:*\n🧹 **Cleaning** - Report missing items, bungalow status\n📦 **Inventory** - Manage supplies stock\n🔧 **Maintenance** - Report technical issues`;
  
  sendMessage(chatId, text, { parse_mode: 'Markdown' });
});

// =================================
// MESSAGE HANDLER
// =================================

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (!userSessions[chatId] || text.startsWith('/')) return;
  
  const session = userSessions[chatId];
  const lang = session.lang || 'en';
  
  // Mot de passe
  if (session.step === 'password') {
    if (text === PASSWORD) {
      authenticatedUsers[chatId] = true;
      const successText = lang === 'fr' ? 
        '✅ *Accès accordé!*\n\n🏕️ *Bot de Gestion Camping*' :
        '✅ *Access granted!*\n\n🏕️ *Camping Management Bot*';
      
      sendMessage(chatId, successText, { parse_mode: 'Markdown' });
      delete userSessions[chatId];
      setTimeout(() => showMainMenu(chatId, lang), 1000);
    } else {
      const errorText = lang === 'fr' ? 
        '❌ Mauvais mot de passe!\n\nEssayez encore:' :
        '❌ Wrong password!\n\nTry again:';
      sendMessage(chatId, errorText);
    }
    return;
  }
  
  // Menu principal
  if (!session.step || session.step === 'main_menu') {
    if (text === '🧹 Nettoyage' || text === '🧹 Cleaning') {
      userSessions[chatId] = {step: 'cleaning_color', items: [], lang: lang, section: 'cleaning'};
      
      const keyboard = colors.map(color => [{text: color}]);
      const colorText = lang === 'fr' ? '🎨 Choisissez la couleur du bungalow:' : '🎨 Choose bungalow color:';
      
      sendMessage(chatId, colorText, {
        reply_markup: {
          keyboard: keyboard,
          one_time_keyboard: true,
          resize_keyboard: true
        }
      });
    } 
    else if (text === '📦 Inventaire' || text === '📦 Inventory') {
      const invText = lang === 'fr' ? 
        '📦 *Section Inventaire*\n\nFonctionnalité en cours de développement...\n\n/menu pour retourner au menu principal' :
        '📦 *Inventory Section*\n\nFeature under development...\n\n/menu to return to main menu';
      
      sendMessage(chatId, invText, {
        parse_mode: 'Markdown',
        reply_markup: {remove_keyboard: true}
      });
    }
    else if (text === '🔧 Maintenance') {
      userSessions[chatId] = {step: 'maintenance_color', lang: lang, section: 'maintenance'};
      
      const keyboard = colors.map(color => [{text: color}]);
      const maintText = lang === 'fr' ? 
        '🔧 *Section Maintenance*\n\n🎨 Choisissez la couleur du bungalow:' :
        '🔧 *Maintenance Section*\n\n🎨 Choose bungalow color:';
      
      sendMessage(chatId, maintText, {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: keyboard,
          one_time_keyboard: true,
          resize_keyboard: true
        }
      });
    }
    return;
  }
  
  // SECTION NETTOYAGE
  if (session.section === 'cleaning') {
    if (session.step === 'cleaning_color') {
      if (colors.some(color => color === text)) {
        session.selectedColor = text;
        session.step = 'cleaning_number';
        
        const numberText = lang === 'fr' ? 
          `🔢 Entrez le numéro du bungalow pour ${text}:\n\n(Ex: 1, 20, 15...)` :
          `🔢 Enter bungalow number for ${text}:\n\n(Ex: 1, 20, 15...)`;
        
        sendMessage(chatId, numberText, { reply_markup: {remove_keyboard: true} });
      } else {
        sendMessage(chatId, '❌ Please choose a color from the list!');
      }
    }
    else if (session.step === 'cleaning_number') {
      const number = parseInt(text);
      if (number && number > 0) {
        session.bungalow = `${session.selectedColor} ${number}`;
        session.step = 'cleaning_main_choice';
        
        const keyboard = lang === 'fr' ? [
          [{text: '🏠 Bungalow Prêt'}],
          [{text: '🔧 Maintenance'}],
          [{text: '📦 Objet Manquant'}],
          [{text: '🔙 Retour Menu'}]
        ] : [
          [{text: '🏠 Bungalow Ready'}],
          [{text: '🔧 Maintenance'}],
          [{text: '📦 Missing Item'}],
          [{text: '🔙 Back to Menu'}]
        ];
        
        const actionText = lang === 'fr' ? 
          `✅ Bungalow: ${session.bungalow}\n\n🎯 Choisissez l'action:` :
          `✅ Bungalow: ${session.bungalow}\n\n🎯 Choose action:`;
        
        sendMessage(chatId, actionText, {
          reply_markup: {
            keyboard: keyboard,
            one_time_keyboard: true,
            resize_keyboard: true
          }
        });
      } else {
        sendMessage(chatId, '❌ Enter a valid number (ex: 1, 20, 15...)');
      }
    }
    else if (session.step === 'cleaning_main_choice') {
      if (text === '🔙 Retour Menu' || text === '🔙 Back to Menu') {
        delete userSessions[chatId];
        showMainMenu(chatId, lang);
        return;
      }
      
      if (text === '🏠 Bungalow Ready' || text === '🏠 Bungalow Prêt') {
        await sendToGoogleSheets({
          bungalow: session.bungalow,
          item: 'Bungalow Ready',
          quantity: 1,
          category: 'status',
          notes: '',
          priority: 'normal',
          reportedBy: msg.from.first_name || 'User',
          section: 'cleaning'
        });
        
        const readyText = lang === 'fr' ? 
          `🎉 *Bungalow Prêt signalé!*\n\n🏠 ${session.bungalow} est prêt pour les clients\n\n/menu pour retourner au menu` :
          `🎉 *Bungalow Ready reported!*\n\n🏠 ${session.bungalow} is ready for guests\n\n/menu to return to main menu`;
        
        sendMessage(chatId, readyText, {
          parse_mode: 'Markdown',
          reply_markup: {remove_keyboard: true}
        });
        delete userSessions[chatId];
      }
      else if (text === '🔧 Maintenance') {
        await sendToGoogleSheets({
          bungalow: session.bungalow,
          item: 'Maintenance Required',
          quantity: 1,
          category: 'maintenance',
          notes: '',
          priority: 'high',
          reportedBy: msg.from.first_name || 'User',
          section: 'cleaning'
        });
        
        const maintText = lang === 'fr' ? 
          `🔧 *Maintenance signalée!*\n\n🏠 ${session.bungalow} nécessite une maintenance\n\n/menu pour retourner au menu` :
          `🔧 *Maintenance reported!*\n\n🏠 ${session.bungalow} needs maintenance\n\n/menu to return to main menu`;
        
        sendMessage(chatId, maintText, {
          parse_mode: 'Markdown',
          reply_markup: {remove_keyboard: true}
        });
        delete userSessions[chatId];
      }
      else if (text === '📦 Missing Item' || text === '📦 Objet Manquant') {
        sendMessage(chatId, '📦 *Fonctionnalité objets manquants*\n\nEn cours de développement...\n\n/menu pour retourner au menu', {
          parse_mode: 'Markdown',
          reply_markup: {remove_keyboard: true}
        });
        delete userSessions[chatId];
      }
    }
  }
  
  // SECTION MAINTENANCE
  if (session.section === 'maintenance') {
    if (session.step === 'maintenance_color') {
      if (colors.some(color => color === text)) {
        session.selectedColor = text;
        session.step = 'maintenance_number';
        
        const numberText = lang === 'fr' ? 
          `🔢 Entrez le numéro du bungalow pour ${text}:\n\n(Ex: 1, 20, 15...)` :
          `🔢 Enter bungalow number for ${text}:\n\n(Ex: 1, 20, 15...)`;
        
        sendMessage(chatId, numberText, { reply_markup: {remove_keyboard: true} });
      } else {
        sendMessage(chatId, '❌ Veuillez choisir une couleur de la liste!');
      }
    }
    else if (session.step === 'maintenance_number') {
      const number = parseInt(text);
      if (number && number > 0) {
        session.bungalow = `${session.selectedColor} ${number}`;
        
        await sendToGoogleSheets({
          bungalow: session.bungalow,
          item: 'Problème de Maintenance',
          quantity: 1,
          category: 'maintenance',
          notes: 'Signalé via section maintenance',
          priority: 'high',
          reportedBy: msg.from.first_name || 'User',
          section: 'maintenance'
        });
        
        const maintText = lang === 'fr' ? 
          `🔧 *Maintenance signalée!*\n\n🏠 Bungalow: ${session.bungalow}\n🔧 Problème signalé avec priorité haute\n\n/menu pour retourner au menu` :
          `🔧 *Maintenance reported!*\n\n🏠 Bungalow: ${session.bungalow}\n🔧 Issue reported with high priority\n\n/menu to return to main menu`;
        
        sendMessage(chatId, maintText, {
          parse_mode: 'Markdown',
          reply_markup: {remove_keyboard: true}
        });
        delete userSessions[chatId];
      } else {
        sendMessage(chatId, '❌ Entrez un numéro valide (ex: 1, 20, 15...)');
      }
    }
  }
});

// Gestion des erreurs
bot.on('error', (error) => {
  console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('🏕️ Camping Management Bot is running...');
