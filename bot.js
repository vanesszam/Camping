// CAMPING BOT - VERSION PROGRESSIVE
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = '8029829192:AAG6R2M5-0x5cZ48t-1NSCOBUYzYdanIWPA';
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwSkZJmQzgwiNVxKbF8TuAj5xU2fY4Na29wHtYxUBYJqMGLzfPZcJoNHcQndcU8yQKg/exec';
const PASSWORD = '123';

console.log('🏕️ Starting progressive bot...');

const cleanBot = new TelegramBot(TOKEN);
cleanBot.deleteWebHook().then(() => {
  console.log('✅ Webhooks cleaned');
  
  setTimeout(() => {
    const bot = new TelegramBot(TOKEN, {polling: true});
    console.log('🎉 Bot started');
    
    const userSessions = {};
    const authenticatedUsers = {};
    const colors = ['🔵 Blue', '🤎 Brown', '🔘 Grey', '🟠 Orange', '🟡 Yellow'];
    
    async function sendToGoogleSheets(data) {
      try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({action: 'addReport', ...data})
        });
        return await response.json();
      } catch (error) {
        console.error('Google Sheets error:', error);
        return { success: false, error: error.message };
      }
    }
    
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
      
      delete userSessions[chatId];
      showMainMenu(chatId);
    });
    
    // Message handler
    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;
      
      if (text && text.startsWith('/')) return;
      
      console.log(`Message from ${chatId}: "${text}"`);
      
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
      
      if (!authenticatedUsers[chatId]) {
        bot.sendMessage(chatId, '🔐 Please use /start first!');
        return;
      }
      
      // Main menu options (when no active session)
      if (!session) {
        if (text === '🧹 Cleaning') {
          userSessions[chatId] = {step: 'cleaning_color', section: 'cleaning'};
          
          const keyboard = colors.map(color => [{text: color}]);
          bot.sendMessage(chatId, '🎨 Choose bungalow color:', {
            reply_markup: {
              keyboard: keyboard,
              one_time_keyboard: true,
              resize_keyboard: true
            }
          });
        }
        else if (text === '📦 Inventory') {
          userSessions[chatId] = {step: 'inventory_choice', section: 'inventory'};
          
          bot.sendMessage(chatId, '📦 *Inventory Section*\n\nChoose an action:', {
            parse_mode: 'Markdown',
            reply_markup: {
              keyboard: [
                [{text: '📦 Add Stock'}],
                [{text: '📊 Check Stock'}],
                [{text: '🔙 Back to Menu'}]
              ],
              one_time_keyboard: true,
              resize_keyboard: true
            }
          });
        }
        else if (text === '🔧 Maintenance') {
          userSessions[chatId] = {step: 'maintenance_color', section: 'maintenance'};
          
          const keyboard = colors.map(color => [{text: color}]);
          bot.sendMessage(chatId, '🔧 *Maintenance Section*\n\n🎨 Choose bungalow color:', {
            parse_mode: 'Markdown',
            reply_markup: {
              keyboard: keyboard,
              one_time_keyboard: true,
              resize_keyboard: true
            }
          });
        }
        else {
          bot.sendMessage(chatId, `❓ Use menu buttons or /menu`);
        }
        return;
      }
      
      // Handle active sessions
      if (session) {
        
        // CLEANING SECTION
        if (session.section === 'cleaning') {
          
          if (session.step === 'cleaning_color') {
            if (colors.some(color => color === text)) {
              session.selectedColor = text;
              session.step = 'cleaning_number';
              
              bot.sendMessage(chatId, `🔢 Enter bungalow number for ${text}:\n\n(Ex: 1, 20, 15...)`, {
                reply_markup: {remove_keyboard: true}
              });
            } else {
              bot.sendMessage(chatId, '❌ Please choose a color from the list!');
            }
          }
          else if (session.step === 'cleaning_number') {
            const number = parseInt(text);
            if (number && number > 0) {
              session.bungalow = `${session.selectedColor} ${number}`;
              
              const keyboard = [
                [{text: '🏠 Bungalow Ready'}],
                [{text: '🔧 Maintenance Required'}],
                [{text: '📦 Missing Items'}],
                [{text: '🔙 Back to Menu'}]
              ];
              
              bot.sendMessage(chatId, `✅ Bungalow: ${session.bungalow}\n\n🎯 Choose action:`, {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
              session.step = 'cleaning_action';
            } else {
              bot.sendMessage(chatId, '❌ Enter a valid number (ex: 1, 20, 15...)');
            }
          }
          else if (session.step === 'cleaning_action') {
            if (text === '🔙 Back to Menu') {
              delete userSessions[chatId];
              showMainMenu(chatId);
              return;
            }
            
            if (text === '🏠 Bungalow Ready') {
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
              
              bot.sendMessage(chatId, `🎉 *Bungalow Ready reported!*\n\n🏠 ${session.bungalow} is ready for guests\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
            else if (text === '🔧 Maintenance Required') {
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
              
              bot.sendMessage(chatId, `🔧 *Maintenance reported!*\n\n🏠 ${session.bungalow} needs maintenance\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
            else if (text === '📦 Missing Items') {
              bot.sendMessage(chatId, `📦 *Missing Items*\n\nDetailed missing items functionality coming soon...\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
          }
        }
        
        // INVENTORY SECTION
        else if (session.section === 'inventory') {
          
          if (session.step === 'inventory_choice') {
            if (text === '🔙 Back to Menu') {
              delete userSessions[chatId];
              showMainMenu(chatId);
              return;
            }
            
            if (text === '📦 Add Stock') {
              bot.sendMessage(chatId, `📦 *Add Stock*\n\nStock management functionality coming soon...\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
            else if (text === '📊 Check Stock') {
              bot.sendMessage(chatId, `📊 *Check Stock*\n\nStock checking functionality coming soon...\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
          }
        }
        
        // MAINTENANCE SECTION
        else if (session.section === 'maintenance') {
          
          if (session.step === 'maintenance_color') {
            if (colors.some(color => color === text)) {
              session.selectedColor = text;
              session.step = 'maintenance_number';
              
              bot.sendMessage(chatId, `🔢 Enter bungalow number for ${text}:\n\n(Ex: 1, 20, 15...)`, {
                reply_markup: {remove_keyboard: true}
              });
            } else {
              bot.sendMessage(chatId, '❌ Please choose a color from the list!');
            }
          }
          else if (session.step === 'maintenance_number') {
            const number = parseInt(text);
            if (number && number > 0) {
              session.bungalow = `${session.selectedColor} ${number}`;
              
              await sendToGoogleSheets({
                bungalow: session.bungalow,
                item: 'Maintenance Issue',
                quantity: 1,
                category: 'maintenance',
                notes: 'Reported via maintenance section',
                priority: 'high',
                reportedBy: msg.from.first_name || 'User',
                section: 'maintenance'
              });
              
              bot.sendMessage(chatId, `🔧 *Maintenance reported!*\n\n🏠 Bungalow: ${session.bungalow}\n🔧 Issue reported with high priority\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            } else {
              bot.sendMessage(chatId, '❌ Enter a valid number (ex: 1, 20, 15...)');
            }
          }
        }
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
