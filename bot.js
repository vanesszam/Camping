
    // CAMPING BOT - DEBUG VERSION FOR MENU
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = '8029829192:AAG6R2M5-0x5cZ48t-1NSCOBUYzYdanIWPA';
const PASSWORD = '123';

console.log('🏕️ Starting debug bot...');

const cleanBot = new TelegramBot(TOKEN);
cleanBot.deleteWebHook().then(() => {
  console.log('✅ Webhooks cleaned');
  
  setTimeout(() => {
    const bot = new TelegramBot(TOKEN, {polling: true});
    console.log('🎉 Bot started');
    
    const userSessions = {};
    const authenticatedUsers = {};
    
    function showMainMenu(chatId) {
      bot.sendMessage(chatId, '🏠 *Main Menu*\n\nChoose your section:', {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{text: '🧹 Cleaning'}],
            [{text: '📦 Inventory'}],
            [{text: '🔧 Maintenance'}]
          ],
          one_time_keyboard: true,
          resize_keyboard: true
        }
      });
    }
    
    // /start
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const userName = msg.from.first_name || 'User';
      
      if (authenticatedUsers[chatId]) {
        showMainMenu(chatId);
        return;
      }
      
      userSessions[chatId] = {step: 'password'};
      bot.sendMessage(chatId, `🔐 Hello ${userName}!\n\nEnter password:`);
    });
    
    // /menu
    bot.onText(/\/menu/, (msg) => {
      const chatId = msg.chat.id;
      
      if (!authenticatedUsers[chatId]) {
        bot.sendMessage(chatId, '🔐 Please use /start first!');
        return;
      }
      
      delete userSessions[chatId]; // Clear any ongoing session
      showMainMenu(chatId);
    });
    
    // Message handler
    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;
      
      // Skip if it's a command
      if (text && text.startsWith('/')) return;
      
      console.log(`Message from ${chatId}: "${text}"`); // Debug log
      
      const session = userSessions[chatId];
      
      // Password step
      if (session && session.step === 'password') {
        if (text === PASSWORD) {
          authenticatedUsers[chatId] = true;
          bot.sendMessage(chatId, '✅ Access granted!');
          delete userSessions[chatId];
          setTimeout(() => showMainMenu(chatId), 1000);
        } else {
          bot.sendMessage(chatId, '❌ Wrong password! Try again:');
        }
        return;
      }
      
      // Check if user is authenticated
      if (!authenticatedUsers[chatId]) {
        bot.sendMessage(chatId, '🔐 Please use /start first!');
        return;
      }
      
      // Main menu options
      if (text === '🧹 Cleaning') {
        console.log('Cleaning option selected'); // Debug
        bot.sendMessage(chatId, '🧹 *Cleaning Section*\n\nYou selected cleaning! Full functionality will be available soon.', {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [
              [{text: '🔙 Back to Menu'}]
            ],
            one_time_keyboard: true,
            resize_keyboard: true
          }
        });
      }
      else if (text === '📦 Inventory') {
        console.log('Inventory option selected'); // Debug
        bot.sendMessage(chatId, '📦 *Inventory Section*\n\nYou selected inventory! Full functionality will be available soon.', {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [
              [{text: '🔙 Back to Menu'}]
            ],
            one_time_keyboard: true,
            resize_keyboard: true
          }
        });
      }
      else if (text === '🔧 Maintenance') {
        console.log('Maintenance option selected'); // Debug
        bot.sendMessage(chatId, '🔧 *Maintenance Section*\n\nYou selected maintenance! Full functionality will be available soon.', {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [
              [{text: '🔙 Back to Menu'}]
            ],
            one_time_keyboard: true,
            resize_keyboard: true
          }
        });
      }
      else if (text === '🔙 Back to Menu') {
        console.log('Back to menu selected'); // Debug
        showMainMenu(chatId);
      }
      else {
        console.log('Unknown message:', text); // Debug
        bot.sendMessage(chatId, `❓ Unknown option: "${text}"\n\nPlease use the menu buttons or /menu to return to main menu.`);
      }
    });
    
    bot.on('error', (error) => {
      console.error('Bot error:', error);
    });
    
    bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });
    
  }, 2000);
  
}).catch((error) => {
  console.error('❌ Cleanup error:', error);
});
