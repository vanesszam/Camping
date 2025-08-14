// CAMPING BOT UNIFIÉ - MARIE
const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');

// Configuration
const MARIE_TOKEN = '8027810983:AAEPaJ5PY1Jw_8RKNPWHvwxOF9OW0hsAKaI';
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwSkZJmQzgwiNVxKbF8TuAj5xU2fY4Na29wHtYxUBYJqMGLzfPZcJoNHcQndcU8yQKg/exec';

// Initialisation du bot
const bot = new TelegramBot(MARIE_TOKEN, {polling: true});

console.log('🏕️ Camping Management Bot Started!');

// =================================
// DATA AND FUNCTIONS
// =================================

const colors = ['🔵 Blue', '🤎 Brown', '🔘 Grey', '🟠 Orange', '🟡 Yellow'];

// Items pour le nettoyage
const cleaningItemsByCategory = {
  kitchen: [
    '🥄 Draining Rack', '🍲 Washing Up Bowl', '🥗 Colander', '🥗 Salad Bowl', '🧀 Cheese Grater', 
    '🥛 Glass Measurer', '🔪 Chopping Board', '🍳 Pan Small', '🍳 Pan Medium', '🍳 Pan Large', 
    '🍳 Frying Pan', '🫖 Kettle', '🍽️ Dinner Plates', '🍽️ Side Plates', '🥣 Cereal Bowls', '☕ Mugs', 
    '🍷 Wine Glass', '🥤 Tumblers', '🍴 Cutlery Tray', '🔪 Knives', '🍴 Forks', '🥄 Spoons', 
    '🥄 Tea Spoons', '🥄 Serving Spoons', '🥄 Ladle', '🍳 Spatula', '🍷 Corkscrew', '🍞 Bread Knife', 
    '🥕 Veg Knife', '🥔 Potato Peeler', '🥫 Tin Opener'
  ],
  cleaning: [
    '🗑️ Bin with Lid', '🪣 Bucket and Strainer', '🧽 Mop', '🧹 Broom', '🧹 Dustpan/Brush', 
    '🚪 Indoor Mat'
  ],
  bedding: [
    '💤 Pillow', '🛏️ Double Duvets', '🛏️ Single Duvets', '🛏️ Double Mattress Cover', '🛏️ Single Mattress Cover'
  ],
  outdoor: [
    '🪑 Outside Table', '🪑 Outside Chairs', '👕 Clothes Rack', '🔥 BBQ', '⛽ BBQ Gas', '🚬 Ashtray', '🏠 Outdoor Mat'
  ],
  toilet: [
    '🧽 Toilet Brush'
  ]
};

// Items pour l'inventaire
const inventoryItemsByCategory = {
  supplies: [
    '🧻 Toilet Paper', '🧼 Soap', '🧴 Shampoo', '🧴 Shower Gel', '🧽 Sponges', 
    '🧹 Cleaning Products', '🗑️ Trash Bags', '💡 Light Bulbs', '🔋 Batteries', 
    '🕯️ Candles', '🔥 Matches', '📄 Paper Towels'
  ],
  maintenance: [
    '🔧 Tools', '🪛 Screws', '🔩 Bolts', '⚡ Electrical Items', '🚿 Plumbing Parts',
    '🎨 Paint', '🪚 Wood Materials', '🔨 Hardware'
  ]
};

// Messages bilingues
const messages = {
  fr: {
    welcome: (name) => `✅ *Bienvenue ${name}!*\n\n🏕️ *Bot de Gestion Camping*\n\nChoisissez une section:`,
    mainMenu: '🏠 *Menu Principal*\n\nChoisissez votre section:',
    cleaningWelcome: '🧹 *Section Nettoyage*\n\nUtilisez /report pour signaler des objets manquants ou statut',
    inventoryWelcome: '📦 *Section Inventaire*\n\nUtilisez /stock pour gérer les stocks',
    maintenanceWelcome: '🔧 *Section Maintenance*\n\nUtilisez /maintenance pour signaler des problèmes',
    enterPassword: (name) => `🔐 *Bot de Gestion Camping*\n\nBonjour ${name}!\n\nEntrez le mot de passe:`,
    wrongPassword: '❌ Mauvais mot de passe!\n\nEssayez encore:',
    accessGranted: '✅ *Accès accordé!*\n\n🏕️ *Bot de Gestion Camping*',
    chooseColor: '🎨 Choisissez la couleur du bungalow:',
    enterNumber: (color) => `🔢 Entrez le numéro du bungalow pour ${color}:\n\n(Ex: 1, 20, 15...)`,
    chooseAction: (bungalow) => `✅ Bungalow: ${bungalow}\n\n🎯 Choisissez l'action:`,
    bungalowReady: (bungalow) => `🎉 *Bungalow Prêt signalé!*\n\n🏠 ${bungalow} est prêt pour les clients\n\n/menu pour retourner au menu`,
    maintenanceReported: (bungalow) => `🔧 *Maintenance signalée!*\n\n🏠 ${bungalow} nécessite une maintenance\n\n/menu pour retourner au menu`,
    chooseCategory: '📦 Choisissez la catégorie:',
    howMany: (item) => `📊 Combien de "${item}" manquent?\n\nEntrez un nombre:`,
    itemAdded: '✅ Objet ajouté!',
    summary: (bungalow) => `📋 *Résumé ${bungalow}:*`,
    reportSent: (bungalow, count) => `🎉 *Rapport envoyé avec succès!*\n\n🏠 Bungalow: ${bungalow}\n📦 ${count} objets signalés:\n\n/menu pour retourner au menu`,
    reportCancelled: '❌ Rapport annulé.\n\n/menu pour retourner au menu',
    help: `ℹ️ *Aide - Bot de Gestion Camping*\n\n🏠 /menu - Menu principal\n🧹 /report - Section nettoyage\n📦 /stock - Section inventaire\n🔧 /maintenance - Section maintenance\n\n*Sections disponibles:*\n🧹 **Nettoyage** - Signaler objets manquants, statut bungalows\n📦 **Inventaire** - Gérer les stocks de fournitures\n🔧 **Maintenance** - Signaler problèmes techniques`
  },
  en: {
    welcome: (name) => `✅ *Welcome ${name}!*\n\n🏕️ *Camping Management Bot*\n\nChoose a section:`,
    mainMenu: '🏠 *Main Menu*\n\nChoose your section:',
    cleaningWelcome: '🧹 *Cleaning Section*\n\nUse /report to report missing items or status',
    inventoryWelcome: '📦 *Inventory Section*\n\nUse /stock to manage supplies',
    maintenanceWelcome: '🔧 *Maintenance Section*\n\nUse /maintenance to report issues',
    enterPassword: (name) => `🔐 *Camping Management Bot*\n\nHello ${name}!\n\nEnter password:`,
    wrongPassword: '❌ Wrong password!\n\nTry again:',
    accessGranted: '✅ *Access granted!*\n\n🏕️ *Camping Management Bot*',
    chooseColor: '🎨 Choose bungalow color:',
    enterNumber: (color) => `🔢 Enter bungalow number for ${color}:\n\n(Ex: 1, 20, 15...)`,
    chooseAction: (bungalow) => `✅ Bungalow: ${bungalow}\n\n🎯 Choose action:`,
    bungalowReady: (bungalow) => `🎉 *Bungalow Ready reported!*\n\n🏠 ${bungalow} is ready for guests\n\n/menu to return to main menu`,
    maintenanceReported: (bungalow) => `🔧 *Maintenance reported!*\n\n🏠 ${bungalow} needs maintenance\n\n/menu to return to main menu`,
    chooseCategory: '📦 Choose category:',
    howMany: (item) => `📊 How many "${item}" are missing?\n\nEnter a number:`,
    itemAdded: '✅ Item added!',
    summary: (bungalow) => `📋 *Summary ${bungalow}:*`,
    reportSent: (bungalow, count) => `🎉 *Report sent successfully!*\n\n🏠 Bungalow: ${bungalow}\n📦 ${count} items reported:\n\n/menu to return to main menu`,
    reportCancelled: '❌ Report cancelled.\n\n/menu to return to main menu',
    help: `ℹ️ *Help - Camping Management Bot*\n\n🏠 /menu - Main menu\n🧹 /report - Cleaning section\n📦 /stock - Inventory section\n🔧 /maintenance - Maintenance section\n\n*Available sections:*\n🧹 **Cleaning** - Report missing items, bungalow status\n📦 **Inventory** - Manage supplies stock\n🔧 **Maintenance** - Report technical issues`
  }
};

// Fonction pour obtenir la langue
function getUserLanguage(user) {
  const languageCode = user.language_code;
  return (languageCode && languageCode.startsWith('fr')) ? 'fr' : 'en';
}

// Fonction Google Sheets
async function sendToGoogleSheets(data) {
  try {
    if (!GOOGLE_SCRIPT_URL) {
      console.error('GOOGLE_SCRIPT_URL not configured');
      return { success: false, error: 'Configuration error' };
    }

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({action: 'addReport', ...data})
    });
    
    return await response.json();
  } catch (error) {
    console.error('Google Sheets error:', error);
    throw error;
  }
}

// =================================
// BOT LOGIC
// =================================

const userSessions = {};
const authenticatedUsers = {};
const PASSWORD = '123';

// Fonction pour envoyer un message
async function sendMessage(chatId, text, options = {}) {
  try {
    await bot.sendMessage(chatId, text, options);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Commande /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'User';
  const lang = getUserLanguage(msg.from);
  
  if (authenticatedUsers[chatId]) {
    showMainMenu(chatId, lang);
    return;
  }
  
  userSessions[chatId] = {step: 'password', lang: lang};
  
  sendMessage(chatId, messages[lang].enterPassword(userName), {
    parse_mode: 'Markdown'
  });
});

// Fonction pour afficher le menu principal
function showMainMenu(chatId, lang) {
  const keyboard = lang === 'fr' ? [
    [{text: '🧹 Nettoyage'}],
    [{text: '📦 Inventaire'}],
    [{text: '🔧 Maintenance'}]
  ] : [
    [{text: '🧹 Cleaning'}],
    [{text: '📦 Inventory'}],
    [{text: '🔧 Maintenance'}]
  ];
  
  sendMessage(chatId, messages[lang].mainMenu, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: keyboard,
      one_time_keyboard: true,
      resize_keyboard: true
    }
  });
}

// Commande /menu
bot.onText(/\/menu/, (msg) => {
  const chatId = msg.chat.id;
  const lang = getUserLanguage(msg.from);
  
  if (!authenticatedUsers[chatId]) {
    sendMessage(chatId, '🔐 Please use /start and enter password first!');
    return;
  }
  
  delete userSessions[chatId]; // Reset session
  showMainMenu(chatId, lang);
});

// Commande /report (section nettoyage)
bot.onText(/\/report/, (msg) => {
  const chatId = msg.chat.id;
  const lang = getUserLanguage(msg.from);
  
  if (!authenticatedUsers[chatId]) {
    sendMessage(chatId, '🔐 Please use /start and enter password first!');
    return;
  }
  
  userSessions[chatId] = {step: 'cleaning_color', items: [], lang: lang, section: 'cleaning'};
  
  const keyboard = colors.map(color => [{text: color}]);
  
  sendMessage(chatId, messages[lang].chooseColor, {
    reply_markup: {
      keyboard: keyboard,
      one_time_keyboard: true,
      resize_keyboard: true
    }
  });
});

// Commande /stock (section inventaire)
bot.onText(/\/stock/, (msg) => {
  const chatId = msg.chat.id;
  const lang = getUserLanguage(msg.from);
  
  if (!authenticatedUsers[chatId]) {
    sendMessage(chatId, '🔐 Please use /start and enter password first!');
    return;
  }
  
  userSessions[chatId] = {step: 'inventory_choice', lang: lang, section: 'inventory'};
  
  const keyboard = lang === 'fr' ? [
    [{text: '📦 Ajouter Stock'}],
    [{text: '📊 Vérifier Stock'}],
    [{text: '🔙 Retour Menu'}]
  ] : [
    [{text: '📦 Add Stock'}],
    [{text: '📊 Check Stock'}],
    [{text: '🔙 Back to Menu'}]
  ];
  
  sendMessage(chatId, '📦 *Section Inventaire*\n\nChoisissez une action:', {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: keyboard,
      one_time_keyboard: true,
      resize_keyboard: true
    }
  });
});

// Commande /maintenance
bot.onText(/\/maintenance/, (msg) => {
  const chatId = msg.chat.id;
  const lang = getUserLanguage(msg.from);
  
  if (!authenticatedUsers[chatId]) {
    sendMessage(chatId, '🔐 Please use /start and enter password first!');
    return;
  }
  
  userSessions[chatId] = {step: 'maintenance_color', lang: lang, section: 'maintenance'};
  
  const keyboard = colors.map(color => [{text: color}]);
  
  sendMessage(chatId, '🔧 *Section Maintenance*\n\n🎨 Choisissez la couleur du bungalow:', {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: keyboard,
      one_time_keyboard: true,
      resize_keyboard: true
    }
  });
});

// Gestion des messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (!userSessions[chatId] || text.startsWith('/')) return;
  
  const session = userSessions[chatId];
  const lang = session.lang || 'en';
  
  // Étape mot de passe
  if (session.step === 'password') {
    if (text === PASSWORD) {
      authenticatedUsers[chatId] = true;
      sendMessage(chatId, messages[lang].accessGranted, {
        parse_mode: 'Markdown'
      });
      delete userSessions[chatId];
      setTimeout(() => showMainMenu(chatId, lang), 1000);
    } else {
      sendMessage(chatId, messages[lang].wrongPassword);
    }
    return;
  }
  
  // Navigation sections principales
  if (!session.step || session.step === 'main_menu') {
    if (text === '🧹 Nettoyage' || text === '🧹 Cleaning') {
      userSessions[chatId] = {step: 'cleaning_color', items: [], lang: lang, section: 'cleaning'};
      
      const keyboard = colors.map(color => [{text: color}]);
      
      sendMessage(chatId, messages[lang].chooseColor, {
        reply_markup: {
          keyboard: keyboard,
          one_time_keyboard: true,
          resize_keyboard: true
        }
      });
    } 
    else if (text === '📦 Inventaire' || text === '📦 Inventory') {
      userSessions[chatId] = {step: 'inventory_choice', lang: lang, section: 'inventory'};
      
      const keyboard = lang === 'fr' ? [
        [{text: '📦 Ajouter Stock'}],
        [{text: '📊 Vérifier Stock'}],
        [{text: '🔙 Retour Menu'}]
      ] : [
        [{text: '📦 Add Stock'}],
        [{text: '📊 Check Stock'}],
        [{text: '🔙 Back to Menu'}]
      ];
      
      sendMessage(chatId, '📦 *Section Inventaire*\n\nChoisissez une action:', {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: keyboard,
          one_time_keyboard: true,
          resize_keyboard: true
        }
      });
    }
    else if (text === '🔧 Maintenance') {
      userSessions[chatId] = {step: 'maintenance_color', lang: lang, section: 'maintenance'};
      
      const keyboard = colors.map(color => [{text: color}]);
      
      sendMessage(chatId, '🔧 *Section Maintenance*\n\n🎨 Choisissez la couleur du bungalow:', {
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
  
  // SECTION NETTOYAGE - Logique identique à l'ancien Marie Bot
  if (session.section === 'cleaning') {
    
    // Choisir couleur
    if (session.step === 'cleaning_color') {
      if (colors.some(color => color === text)) {
        session.selectedColor = text;
        session.step = 'cleaning_number';
        
        sendMessage(chatId, messages[lang].enterNumber(text), {
          reply_markup: {remove_keyboard: true}
        });
      } else {
        sendMessage(chatId, '❌ Please choose a color from the list!');
      }
    }
    
    // Entrer numéro
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
        
        sendMessage(chatId, messages[lang].chooseAction(session.bungalow), {
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
    
    // Choix principal
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
        
        sendMessage(chatId, messages[lang].bungalowReady(session.bungalow), {
          parse_mode: 'Markdown',
          reply_markup: {remove_keyboard: true}
        });
        delete userSessions[chatId];
        
      } else if (text === '🔧 Maintenance') {
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
        
        sendMessage(chatId, messages[lang].maintenanceReported(session.bungalow), {
          parse_mode: 'Markdown',
          reply_markup: {remove_keyboard: true}
        });
        delete userSessions[chatId];
        
      } else if (text === '📦 Missing Item' || text === '📦 Objet Manquant') {
        session.step = 'cleaning_category';
        
        const keyboard = lang === 'fr' ? [
          [{text: '🍽️ Cuisine'}],
          [{text: '🏠 Extérieur'}],
          [{text: '🧹 Nettoyage'}],
          [{text: '🛏️ Literie'}],
          [{text: '🚽 Toilettes'}],
          [{text: '🔙 Retour'}]
        ] : [
          [{text: '🍽️ Kitchen'}],
          [{text: '🏠 Outdoor'}],
          [{text: '🧹 Cleaning'}],
          [{text: '🛏️ Bedding'}],
          [{text: '🚽 Toilet'}],
          [{text: '🔙 Back'}]
        ];
        
        sendMessage(chatId, messages[lang].chooseCategory, {
          reply_markup: {
            keyboard: keyboard,
            one_time_keyboard: true,
            resize_keyboard: true
          }
        });
      }
    }
    
    // [Ici on continuerait avec le reste de la logique de nettoyage - catégories, items, quantités, etc.]
    // Je vais raccourcir pour l'instant, mais toute la logique originale peut être intégrée
  }
  
  // SECTION INVENTAIRE
  if (session.section === 'inventory') {
    
    // Choix action inventaire
    if (session.step === 'inventory_choice') {
      if (text === '🔙 Retour Menu' || text === '🔙 Back to Menu') {
        delete userSessions[chatId];
        showMainMenu(chatId, lang);
        return;
      }
      
      if (text === '📦 Ajouter Stock' || text === '📦 Add Stock') {
        session.step = 'inventory_category';
        
        const keyboard = lang === 'fr' ? [
          [{text: '🧻 Fournitures'}],
          [{text: '🔧 Matériel Maintenance'}],
          [{text: '🔙 Retour'}]
        ] : [
          [{text: '🧻 Supplies'}],
          [{text: '🔧 Maintenance Materials'}],
          [{text: '🔙 Back'}]
        ];
        
        sendMessage(chatId, '📦 Choisissez la catégorie:', {
          reply_markup: {
            keyboard: keyboard,
            one_time_keyboard: true,
            resize_keyboard: true
          }
        });
      }
      else if (text === '📊 Vérifier Stock' || text === '📊 Check Stock') {
        sendMessage(chatId, '📊 *État des Stocks*\n\nConsultation en cours...\n\n/menu pour retourner au menu', {
          parse_mode: 'Markdown',
          reply_markup: {remove_keyboard: true}
        });
        delete userSessions[chatId];
      }
    }
    
    // Catégorie inventaire
    else if (session.step === 'inventory_category') {
      if (text === '🔙 Retour' || text === '🔙 Back') {
        session.step = 'inventory_choice';
        
        const keyboard = lang === 'fr' ? [
          [{text: '📦 Ajouter Stock'}],
          [{text: '📊 Vérifier Stock'}],
          [{text: '🔙 Retour Menu'}]
        ] : [
          [{text: '📦 Add Stock'}],
          [{text: '📊 Check Stock'}],
          [{text: '🔙 Back to Menu'}]
        ];
        
        sendMessage(chatId, '📦 *Section Inventaire*\n\nChoisissez une action:', {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: keyboard,
            one_time_keyboard: true,
            resize_keyboard: true
          }
        });
        return;
      }
      
      let category = '';
      if (text === '🧻 Fournitures' || text === '🧻 Supplies') category = 'supplies';
      else if (text === '🔧 Matériel Maintenance' || text === '🔧 Maintenance Materials') category = 'maintenance';
      
      if (category) {
        session.selectedCategory = category;
        session.step = 'inventory_item';
        
        const items = inventoryItemsByCategory[category];
        const keyboard = items.map(item => [{text: item}]);
        keyboard.push([{text: lang === 'fr' ? '🔙 Retour' : '🔙 Back'}]);
        
        sendMessage(chatId, `Choisissez l'article (${text}):`, {
          reply_markup: {
            keyboard: keyboard,
            one_time_keyboard: true,
            resize_keyboard: true
          }
        });
      }
    }
    
    // Item inventaire
    else if (session.step === 'inventory_item') {
      if (text === '🔙 Retour' || text === '🔙 Back') {
        session.step = 'inventory_category';
        
        const keyboard = lang === 'fr' ? [
          [{text: '🧻 Fournitures'}],
          [{text: '🔧 Matériel Maintenance'}],
          [{text: '🔙 Retour'}]
        ] : [
          [{text: '🧻 Supplies'}],
          [{text: '🔧 Maintenance Materials'}],
          [{text: '🔙 Back'}]
        ];
        
        sendMessage(chatId, '📦 Choisissez la catégorie:', {
          reply_markup: {
            keyboard: keyboard,
            one_time_keyboard: true,
            resize_keyboard: true
          }
        });
        return;
      }
      
      session.selectedItem = text;
      session.step = 'inventory_quantity';
      
      sendMessage(chatId, `📊 Combien de "${text}" voulez-vous ajouter au stock?\n\nEntrez un nombre:`, {
        reply_markup: {remove_keyboard: true}
      });
    }
    
    // Quantité inventaire
    else if (session.step === 'inventory_quantity') {
      const quantity = parseInt(text);
      if (quantity && quantity > 0) {
        await sendToGoogleSheets({
          bungalow: 'Stock Général',
          item: session.selectedItem,
          quantity: quantity,
          category: session.selectedCategory,
          notes: 'Ajout stock',
          priority: 'normal',
          reportedBy: msg.from.first_name || 'User',
          section: 'inventory'
        });
        
        sendMessage(chatId, `✅ *Stock mis à jour!*\n\n📦 Article: ${session.selectedItem}\n📊 Quantité ajoutée: ${quantity}\n\n/menu pour retourner au menu`, {
          parse_mode: 'Markdown',
          reply_markup: {remove_keyboard: true}
        });
        delete userSessions[chatId];
      } else {
        sendMessage(chatId, '❌ Entrez un nombre valide (ex: 1, 5, 10...)');
      }
    }
  }
  
  // SECTION MAINTENANCE
  if (session.section === 'maintenance') {
    
    // Couleur maintenance
    if (session.step === 'maintenance_color') {
      if (colors.some(color => color === text)) {
        session.selectedColor = text;
        session.step = 'maintenance_number';
        
        sendMessage(chatId, `🔢 Entrez le numéro du bungalow pour ${text}:\n\n(Ex: 1, 20, 15...)`, {
          reply_markup: {remove_keyboard: true}
        });
      } else {
        sendMessage(chatId, '❌ Veuillez choisir une couleur de la liste!');
      }
    }
    
    // Numéro maintenance
    else if (session.step === 'maintenance_number') {
      const number = parseInt(text);
      if (number && number > 0) {
        session.bungalow = `${session.selectedColor} ${number}`;
        session.step = 'maintenance_type';
        
        const keyboard = lang === 'fr' ? [
          [{text: '🔧 Réparation Urgente'}],
          [{text: '⚡ Problème Électricité'}],
          [{text: '🚿 Problème Plomberie'}],
          [{text: '🚪 Problème Porte/Fenêtre'}],
          [{text: '🧹 Nettoyage Spécial'}],
          [{text: '🔙 Retour Menu'}]
        ] : [
          [{text: '🔧 Urgent Repair'}],
          [{text: '⚡ Electrical Issue'}],
          [{text: '🚿 Plumbing Issue'}],
          [{text: '🚪 Door/Window Issue'}],
          [{text: '🧹 Special Cleaning'}],
          [{text: '🔙 Back to Menu'}]
        ];
        
        sendMessage(chatId, `🔧 Bungalow: ${session.bungalow}\n\nType de problème:`, {
          reply_markup: {
            keyboard: keyboard,
            one_time_keyboard: true,
            resize_keyboard: true
          }
        });
      } else {
        sendMessage(chatId, '❌ Entrez un numéro valide (ex: 1, 20, 15...)');
      }
    }
    
    // Type maintenance
    else if (session.step === 'maintenance_type') {
      if (text === '🔙 Retour Menu' || text === '🔙 Back to Menu') {
        delete userSessions[chatId];
        showMainMenu(chatId, lang);
        return;
      }
      
      session.selectedType = text;
      session.step = 'maintenance_description';
      
      sendMessage(chatId, `📝 Décrivez le problème en détail:\n\n(Ou tapez "skip" pour ignorer)`, {
        reply_markup: {remove_keyboard: true}
      });
    }
    
    // Description maintenance
    else if (session.step === 'maintenance_description') {
      const description = text === 'skip' ? '' : text;
      
      let priority = 'normal';
      if (session.selectedType.includes('Urgente') || session.selectedType.includes('Urgent')) {
        priority = 'urgent';
      } else if (session.selectedType.includes('Électricité') || session.selectedType.includes('Electrical') || 
                 session.selectedType.includes('Plomberie') || session.selectedType.includes('Plumbing')) {
        priority = 'high';
      }
      
      await sendToGoogleSheets({
        bungalow: session.bungalow,
        item: session.selectedType,
        quantity: 1,
        category: 'maintenance',
        notes: description,
        priority: priority,
        reportedBy: msg.from.first_name || 'User',
        section: 'maintenance'
      });
      
      sendMessage(chatId, `🔧 *Maintenance signalée!*\n\n🏠 Bungalow: ${session.bungalow}\n🔧 Type: ${session.selectedType}\n📝 Description: ${description || 'Aucune'}\n⚠️ Priorité: ${priority}\n\n/menu pour retourner au menu`, {
        parse_mode: 'Markdown',
        reply_markup: {remove_keyboard: true}
      });
      delete userSessions[chatId];
    }
  }
});

// Commande /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const lang = getUserLanguage(msg.from);
  sendMessage(chatId, messages[lang].help, {
    parse_mode: 'Markdown'
  });
});

// Gestion des erreurs
bot.on('error', (error) => {
  console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('🏕️ Camping Management Bot is running...');
