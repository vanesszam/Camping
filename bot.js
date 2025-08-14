// CAMPING MANAGEMENT BOT - COMPLETE VERSION
const TelegramBot = require('node-telegram-bot-api');

// Configuration
const TOKEN = '8029829192:AAG6R2M5-0x5cZ48t-1NSCOBUYzYdanIWPA';
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwSkZJmQzgwiNVxKbF8TuAj5xU2fY4Na29wHtYxUBYJqMGLzfPZcJoNHcQndcU8yQKg/exec';

console.log('🏕️ Starting Camping Management Bot...');

// Clean webhooks first then start polling
const cleanBot = new TelegramBot(TOKEN);
cleanBot.deleteWebHook().then(() => {
  console.log('✅ Webhooks cleaned');
  
  setTimeout(() => {
    const bot = new TelegramBot(TOKEN, {polling: true});
    console.log('🎉 Bot started in polling mode');
    
    // =================================
    // DATA AND CONSTANTS
    // =================================
    
    const colors = ['🔵 Blue', '🤎 Brown', '🔘 Grey', '🟠 Orange', '🟡 Yellow'];
    const PASSWORD = '123';
    
    const userSessions = {};
    const authenticatedUsers = {};
    
    // Cleaning items by category
    const cleaningItems = {
      kitchen: [
        '🥄 Draining Rack', '🍲 Washing Up Bowl', '🥗 Colander', '🥗 Salad Bowl', 
        '🧀 Cheese Grater', '🥛 Glass Measurer', '🔪 Chopping Board', '🍳 Pan Small', 
        '🍳 Pan Medium', '🍳 Pan Large', '🍳 Frying Pan', '🫖 Kettle', 
        '🍽️ Dinner Plates', '🍽️ Side Plates', '🥣 Cereal Bowls', '☕ Mugs', 
        '🍷 Wine Glass', '🥤 Tumblers', '🍴 Cutlery Tray', '🔪 Knives', 
        '🍴 Forks', '🥄 Spoons', '🥄 Tea Spoons', '🥄 Serving Spoons', 
        '🥄 Ladle', '🍳 Spatula', '🍷 Corkscrew', '🍞 Bread Knife', 
        '🥕 Veg Knife', '🥔 Potato Peeler', '🥫 Tin Opener'
      ],
      cleaning: [
        '🗑️ Bin with Lid', '🪣 Bucket and Strainer', '🧽 Mop', '🧹 Broom', 
        '🧹 Dustpan/Brush', '🚪 Indoor Mat'
      ],
      bedding: [
        '💤 Pillow', '🛏️ Double Duvets', '🛏️ Single Duvets', 
        '🛏️ Double Mattress Cover', '🛏️ Single Mattress Cover'
      ],
      outdoor: [
        '🪑 Outside Table', '🪑 Outside Chairs', '👕 Clothes Rack', '🔥 BBQ', 
        '⛽ BBQ Gas', '🚬 Ashtray', '🏠 Outdoor Mat'
      ],
      toilet: [
        '🧽 Toilet Brush'
      ]
    };
    
    // Inventory items by category
    const inventoryItems = {
      supplies: [
        '🧻 Toilet Paper', '🧼 Soap', '🧴 Shampoo', '🧴 Shower Gel', 
        '🧽 Sponges', '🧹 Cleaning Products', '🗑️ Trash Bags', '💡 Light Bulbs', 
        '🔋 Batteries', '🕯️ Candles', '🔥 Matches', '📄 Paper Towels'
      ],
      maintenance: [
        '🔧 Tools', '🪛 Screws', '🔩 Bolts', '⚡ Electrical Items', 
        '🚿 Plumbing Parts', '🎨 Paint', '🪚 Wood Materials', '🔨 Hardware'
      ]
    };
    
    // =================================
    // HELPER FUNCTIONS
    // =================================
    
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
    
    async function sendMessage(chatId, text, options = {}) {
      try {
        await bot.sendMessage(chatId, text, options);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
    
    function showMainMenu(chatId) {
      sendMessage(chatId, '🏠 *Main Menu*\n\nChoose your section:', {
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
    
    // =================================
    // BOT COMMANDS
    // =================================
    
    // /start command
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const userName = msg.from.first_name || 'User';
      
      if (authenticatedUsers[chatId]) {
        showMainMenu(chatId);
        return;
      }
      
      userSessions[chatId] = {step: 'password'};
      sendMessage(chatId, `🔐 *Camping Management Bot*\n\nHello ${userName}!\n\nEnter password:`, {
        parse_mode: 'Markdown'
      });
    });
    
    // /menu command
    bot.onText(/\/menu/, (msg) => {
      const chatId = msg.chat.id;
      
      if (!authenticatedUsers[chatId]) {
        sendMessage(chatId, '🔐 Please use /start and enter password first!');
        return;
      }
      
      delete userSessions[chatId];
      showMainMenu(chatId);
    });
    
    // /report command - direct to cleaning
    bot.onText(/\/report/, (msg) => {
      const chatId = msg.chat.id;
      
      if (!authenticatedUsers[chatId]) {
        sendMessage(chatId, '🔐 Please use /start and enter password first!');
        return;
      }
      
      userSessions[chatId] = {step: 'cleaning_color', items: [], section: 'cleaning'};
      
      const keyboard = colors.map(color => [{text: color}]);
      sendMessage(chatId, '🎨 Choose bungalow color:', {
        reply_markup: {
          keyboard: keyboard,
          one_time_keyboard: true,
          resize_keyboard: true
        }
      });
    });
    
    // /stock command - direct to inventory
    bot.onText(/\/stock/, (msg) => {
      const chatId = msg.chat.id;
      
      if (!authenticatedUsers[chatId]) {
        sendMessage(chatId, '🔐 Please use /start and enter password first!');
        return;
      }
      
      userSessions[chatId] = {step: 'inventory_choice', section: 'inventory'};
      
      const keyboard = [
        [{text: '📦 Add Stock'}],
        [{text: '📊 Check Stock'}],
        [{text: '🔙 Back to Menu'}]
      ];
      
      sendMessage(chatId, '📦 *Inventory Section*\n\nChoose an action:', {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: keyboard,
          one_time_keyboard: true,
          resize_keyboard: true
        }
      });
    });
    
    // /maintenance command - direct to maintenance
    bot.onText(/\/maintenance/, (msg) => {
      const chatId = msg.chat.id;
      
      if (!authenticatedUsers[chatId]) {
        sendMessage(chatId, '🔐 Please use /start and enter password first!');
        return;
      }
      
      userSessions[chatId] = {step: 'maintenance_color', section: 'maintenance'};
      
      const keyboard = colors.map(color => [{text: color}]);
      sendMessage(chatId, '🔧 *Maintenance Section*\n\n🎨 Choose bungalow color:', {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: keyboard,
          one_time_keyboard: true,
          resize_keyboard: true
        }
      });
    });
    
    // /help command
    bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      sendMessage(chatId, `ℹ️ *Help - Camping Management Bot*\n\n🏠 /menu - Main menu\n🧹 /report - Cleaning section\n📦 /stock - Inventory section\n🔧 /maintenance - Maintenance section\n\n*Available sections:*\n🧹 **Cleaning** - Report missing items, bungalow status\n📦 **Inventory** - Manage supplies stock\n🔧 **Maintenance** - Report technical issues\n\n*How cleaning works:*\n1️⃣ Choose color\n2️⃣ Enter number\n3️⃣ Choose: Ready/Maintenance/Missing Item\n4️⃣ If missing: select category & item\n5️⃣ Enter quantity\n6️⃣ Add note (optional)\n7️⃣ Send or add more items\n\n💡 You can report multiple items for the same bungalow!`, {
        parse_mode: 'Markdown'
      });
    });
    
    // =================================
    // MESSAGE HANDLER
    // =================================
    
    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;
      
      if (!userSessions[chatId] || text.startsWith('/')) return;
      
      const session = userSessions[chatId];
      
      // Password step
      if (session.step === 'password') {
        if (text === PASSWORD) {
          authenticatedUsers[chatId] = true;
          sendMessage(chatId, '✅ *Access granted!*\n\n🏕️ *Camping Management Bot*', {
            parse_mode: 'Markdown'
          });
          delete userSessions[chatId];
          setTimeout(() => showMainMenu(chatId), 1000);
        } else {
          sendMessage(chatId, '❌ Wrong password!\n\nTry again:');
        }
        return;
      }
      
      // Main menu navigation
      if (!session.step || session.step === 'main_menu') {
        if (text === '🧹 Cleaning') {
          userSessions[chatId] = {step: 'cleaning_color', items: [], section: 'cleaning'};
          
          const keyboard = colors.map(color => [{text: color}]);
          sendMessage(chatId, '🎨 Choose bungalow color:', {
            reply_markup: {
              keyboard: keyboard,
              one_time_keyboard: true,
              resize_keyboard: true
            }
          });
        }
        else if (text === '📦 Inventory') {
          userSessions[chatId] = {step: 'inventory_choice', section: 'inventory'};
          
          const keyboard = [
            [{text: '📦 Add Stock'}],
            [{text: '📊 Check Stock'}],
            [{text: '🔙 Back to Menu'}]
          ];
          
          sendMessage(chatId, '📦 *Inventory Section*\n\nChoose an action:', {
            parse_mode: 'Markdown',
            reply_markup: {
              keyboard: keyboard,
              one_time_keyboard: true,
              resize_keyboard: true
            }
          });
        }
        else if (text === '🔧 Maintenance') {
          userSessions[chatId] = {step: 'maintenance_color', section: 'maintenance'};
          
          const keyboard = colors.map(color => [{text: color}]);
          sendMessage(chatId, '🔧 *Maintenance Section*\n\n🎨 Choose bungalow color:', {
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
      
      // =================================
      // CLEANING SECTION
      // =================================
      
      if (session.section === 'cleaning') {
        
        // Step 1: Choose color
        if (session.step === 'cleaning_color') {
          if (colors.some(color => color === text)) {
            session.selectedColor = text;
            session.step = 'cleaning_number';
            
            sendMessage(chatId, `🔢 Enter bungalow number for ${text}:\n\n(Ex: 1, 20, 15...)`, {
              reply_markup: {remove_keyboard: true}
            });
          } else {
            sendMessage(chatId, '❌ Please choose a color from the list!');
          }
        }
        
        // Step 2: Enter number
        else if (session.step === 'cleaning_number') {
          const number = parseInt(text);
          if (number && number > 0) {
            session.bungalow = `${session.selectedColor} ${number}`;
            session.step = 'cleaning_main_choice';
            
            const keyboard = [
              [{text: '🏠 Bungalow Ready'}],
              [{text: '🔧 Maintenance'}],
              [{text: '📦 Missing Item'}],
              [{text: '🔙 Back to Menu'}]
            ];
            
            sendMessage(chatId, `✅ Bungalow: ${session.bungalow}\n\n🎯 Choose action:`, {
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
        
        // Step 3: Main choice
        else if (session.step === 'cleaning_main_choice') {
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
            
            sendMessage(chatId, `🎉 *Bungalow Ready reported!*\n\n🏠 ${session.bungalow} is ready for guests\n\n/menu to return to main menu`, {
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
            
            sendMessage(chatId, `🔧 *Maintenance reported!*\n\n🏠 ${session.bungalow} needs maintenance\n\n/menu to return to main menu`, {
              parse_mode: 'Markdown',
              reply_markup: {remove_keyboard: true}
            });
            delete userSessions[chatId];
          }
          else if (text === '📦 Missing Item') {
            session.step = 'cleaning_category';
            
            const keyboard = [
              [{text: '🍽️ Kitchen'}],
              [{text: '🏠 Outdoor'}],
              [{text: '🧹 Cleaning'}],
              [{text: '🛏️ Bedding'}],
              [{text: '🚽 Toilet'}],
              [{text: '🔙 Back'}]
            ];
            
            sendMessage(chatId, '📦 Choose category:', {
              reply_markup: {
                keyboard: keyboard,
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          }
        }
        
        // Step 4: Choose category
        else if (session.step === 'cleaning_category') {
          if (text === '🔙 Back') {
            session.step = 'cleaning_main_choice';
            
            const keyboard = [
              [{text: '🏠 Bungalow Ready'}],
              [{text: '🔧 Maintenance'}],
              [{text: '📦 Missing Item'}],
              [{text: '🔙 Back to Menu'}]
            ];
            
            sendMessage(chatId, `✅ Bungalow: ${session.bungalow}\n\n🎯 Choose action:`, {
              reply_markup: {
                keyboard: keyboard,
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
            return;
          }
          
          let category = '';
          if (text === '🍽️ Kitchen') category = 'kitchen';
          else if (text === '🏠 Outdoor') category = 'outdoor';
          else if (text === '🧹 Cleaning') category = 'cleaning';
          else if (text === '🛏️ Bedding') category = 'bedding';
          else if (text === '🚽 Toilet') category = 'toilet';
          
          if (category) {
            session.selectedCategory = category;
            session.step = 'cleaning_item';
            
            const items = cleaningItems[category];
            const keyboard = items.map(item => [{text: item}]);
            keyboard.push([{text: '🔙 Back to categories'}]);
            
            sendMessage(chatId, `Choose missing item (${text}):`, {
              reply_markup: {
                keyboard: keyboard,
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          }
        }
        
        // Step 5: Choose item
        else if (session.step === 'cleaning_item') {
          if (text === '🔙 Back to categories') {
            session.step = 'cleaning_category';
            
            const keyboard = [
              [{text: '🍽️ Kitchen'}],
              [{text: '🏠 Outdoor'}],
              [{text: '🧹 Cleaning'}],
              [{text: '🛏️ Bedding'}],
              [{text: '🚽 Toilet'}],
              [{text: '🔙 Back'}]
            ];
            
            sendMessage(chatId, '📦 Choose category:', {
              reply_markup: {
                keyboard: keyboard,
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
            return;
          }
          
          session.selectedItem = text;
          session.step = 'cleaning_quantity';
          
          sendMessage(chatId, `📊 How many "${text}" are missing?\n\nEnter a number:`, {
            reply_markup: {remove_keyboard: true}
          });
        }
        
        // Step 6: Quantity
        else if (session.step === 'cleaning_quantity') {
          const quantity = parseInt(text);
          if (quantity && quantity > 0) {
            session.selectedQuantity = quantity;
            
            session.items.push({
              item: session.selectedItem,
              quantity: session.selectedQuantity,
              category: session.selectedCategory,
              notes: ''
            });
            
            session.step = 'cleaning_continue';
            
            const summary = session.items.map((item, index) => 
              `${index + 1}. ${item.item} x${item.quantity}`
            ).join('\n');
            
            sendMessage(chatId, `✅ Item added!\n\n📋 *Summary ${session.bungalow}:*\n${summary}\n\nWhat do you want to do?`, {
              parse_mode: 'Markdown',
              reply_markup: {
                keyboard: [
                  [{text: '➕ Add Another Item'}],
                  [{text: '📝 Add Note'}],
                  [{text: '📤 Send Report'}],
                  [{text: '🗑️ Cancel All'}]
                ],
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          } else {
            sendMessage(chatId, '❌ Enter a valid number (ex: 1, 2, 3...)');
          }
        }
        
        // Step 7: Continue or send
        else if (session.step === 'cleaning_continue') {
          if (text === '➕ Add Another Item') {
            session.step = 'cleaning_category';
            
            const keyboard = [
              [{text: '🍽️ Kitchen'}],
              [{text: '🏠 Outdoor'}],
              [{text: '🧹 Cleaning'}],
              [{text: '🛏️ Bedding'}],
              [{text: '🚽 Toilet'}],
              [{text: '🔙 Back'}]
            ];
            
            sendMessage(chatId, '📦 Choose category for next item:', {
              reply_markup: {
                keyboard: keyboard,
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          }
          else if (text === '📝 Add Note') {
            session.step = 'cleaning_notes';
            
            const keyboard = [
              [{text: '❌ No Note'}],
              [{text: '🏠 Bungalow Ready'}],
              [{text: '🔧 For Maintenance'}]
            ];
            
            if (!session.items.some(item => item.category === 'kitchen')) {
              keyboard.splice(1, 1); // Remove "Bungalow Ready" if no kitchen items
            }
            
            sendMessage(chatId, '💡 Add a note?\n\nChoose or type your note:', {
              reply_markup: {
                keyboard: keyboard,
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          }
          else if (text === '📤 Send Report') {
            let successCount = 0;
            
            for (const item of session.items) {
              try {
                await sendToGoogleSheets({
                  bungalow: session.bungalow,
                  item: item.item,
                  quantity: item.quantity,
                  category: item.category,
                  notes: item.notes,
                  priority: 'normal',
                  reportedBy: msg.from.first_name || 'User',
                  section: 'cleaning'
                });
                successCount++;
              } catch (error) {
                console.error('Send error:', error);
              }
            }
            
            const summary = session.items.map((item, index) => 
              `${index + 1}. ${item.item} x${item.quantity}${item.notes ? ` (${item.notes})` : ''}`
            ).join('\n');
            
            sendMessage(chatId, `🎉 *Report sent successfully!*\n\n🏠 Bungalow: ${session.bungalow}\n📦 ${successCount} items reported:\n\n${summary}\n\n/menu to return to main menu`, {
              parse_mode: 'Markdown',
              reply_markup: {remove_keyboard: true}
            });
            
            delete userSessions[chatId];
          }
          else if (text === '🗑️ Cancel All') {
            sendMessage(chatId, '❌ Report cancelled.\n\n/menu to return to main menu', {
              reply_markup: {remove_keyboard: true}
            });
            delete userSessions[chatId];
          }
        }
        
        // Step 8: Notes
        else if (session.step === 'cleaning_notes') {
          const note = text === '❌ No Note' ? '' : text.replace(/🏠 |🔧 |❌ /, '');
          
          session.items.forEach(item => {
            item.notes = note;
          });
          
          session.step = 'cleaning_continue';
          
          const summary = session.items.map((item, index) => 
            `${index + 1}. ${item.item} x${item.quantity}${item.notes ? ` (${item.notes})` : ''}`
          ).join('\n');
          
          sendMessage(chatId, `✅ Note added!\n\n📋 *Final Summary ${session.bungalow}:*\n${summary}\n\nReady to send?`, {
            parse_mode: 'Markdown',
            reply_markup: {
              keyboard: [
                [{text: '📤 Send Report'}],
                [{text: '➕ Add Another Item'}],
                [{text: '🗑️ Cancel All'}]
              ],
              one_time_keyboard: true,
              resize_keyboard: true
            }
          });
        }
      }
      
      // =================================
      // INVENTORY SECTION
      // =================================
      
      if (session.section === 'inventory') {
        
        // Step 1: Choose action
        if (session.step === 'inventory_choice') {
          if (text === '🔙 Back to Menu') {
            delete userSessions[chatId];
            showMainMenu(chatId);
            return;
          }
          
          if (text === '📦 Add Stock') {
            session.step = 'inventory_category';
            
            const keyboard = [
              [{text: '🧻 Supplies'}],
              [{text: '🔧 Maintenance Materials'}],
              [{text: '🔙 Back'}]
            ];
            
            sendMessage(chatId, '📦 Choose category:', {
              reply_markup: {
                keyboard: keyboard,
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          }
          else if (text === '📊 Check Stock') {
            sendMessage(chatId, '📊 *Stock Status*\n\nChecking current stock levels...\n\n/menu to return to main menu', {
              parse_mode: 'Markdown',
              reply_markup: {remove_keyboard: true}
            });
            delete userSessions[chatId];
          }
        }
        
        // Step 2: Choose category
        else if (session.step === 'inventory_category') {
          if (text === '🔙 Back') {
            session.step = 'inventory_choice';
            
            const keyboard = [
              [{text: '📦 Add Stock'}],
              [{text: '📊 Check Stock'}],
              [{text: '🔙 Back to Menu'}]
            ];
            
            sendMessage(chatId, '📦 *Inventory Section*\n\nChoose an action:', {
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
          if (text === '🧻 Supplies') category = 'supplies';
          else if (text === '🔧 Maintenance Materials') category = 'maintenance';
          
          if (category) {
            session.selectedCategory = category;
            session.step = 'inventory_item';
            
            const items = inventoryItems[category];
            const keyboard = items.map(item => [{text: item}]);
            keyboard.push([{text: '🔙 Back'}]);
            
            sendMessage(chatId, `Choose item (${text}):`, {
              reply_markup: {
                keyboard: keyboard,
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          }
        }
        
        // Step 3: Choose item
        else if (session.step === 'inventory_item') {
          if (text === '🔙 Back') {
            session.step = 'inventory_category';
            
            const keyboard = [
              [{text: '🧻 Supplies'}],
              [{text: '🔧 Maintenance Materials'}],
              [{text: '🔙 Back'}]
            ];
            
            sendMessage(chatId, '📦 Choose category:', {
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
          
          sendMessage(chatId, `📊 How many "${text}" do you want to add to stock?\n\nEnter a number:`, {
            reply_markup: {remove_keyboard: true}
          });
        }
        
        // Step 4: Quantity
        else if (session.step === 'inventory_quantity') {
          const quantity = parseInt(text);
          if (quantity && quantity > 0) {
            await sendToGoogleSheets({
              bungalow: 'General Stock',
              item: session.selectedItem,
              quantity: quantity,
              category: session.selectedCategory,
              notes: 'Stock addition',
              priority: 'normal',
              reportedBy: msg.from.first_name || 'User',
              section: 'inventory'
            });
            
            sendMessage(chatId, `✅ *Stock updated!*\n\n📦 Item: ${session.selectedItem}\n📊 Quantity added: ${quantity}\n\n/menu to return to main menu`, {
              parse_mode: 'Markdown',
              reply_markup: {remove_keyboard: true}
            });
            delete userSessions[chatId];
          } else {
            sendMessage(chatId, '❌ Enter a valid number (ex: 1, 5, 10...)');
          }
        }
      }
      
      // =================================
      // MAINTENANCE SECTION
      // =================================
      
      if (session.section === 'maintenance') {
        
        // Step 1: Choose color
        if (session.step === 'maintenance_color') {
          if (colors.some(color => color === text)) {
            session.selectedColor = text;
            session.step = 'maintenance_number';
            
            sendMessage(chatId, `🔢 Enter bungalow number for ${text}:\n\n(Ex: 1, 20, 15...)`, {
              reply_markup: {remove_keyboard: true}
            });
          } else {
            sendMessage(chatId, '❌ Please choose a color from the list!');
          }
        }
        
        // Step 2: Enter number
        else if (session.step === 'maintenance_number') {
          const number = parseInt(text);
          if (number && number > 0) {
            session.bungalow = `${session.selectedColor} ${number}`;
            session.step = 'maintenance_type';
            
            const keyboard = [
              [{text: '🔧 Urgent Repair'}],
              [{text: '⚡ Electrical Issue'}],
              [{text: '🚿 Plumbing Issue'}],
              [{text: '🚪 Door/Window Issue'}],
              [{text: '🧹 Special Cleaning'}],
              [{text: '🔙 Back to Menu'}]
            ];
            
            sendMessage(chatId, `🔧 Bungalow: ${session.bungalow}\n\nType of problem:`, {
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
        
        // Step 3: Choose type
        else if (session.step === 'maintenance_type') {
          if (text === '🔙 Back to Menu') {
            delete userSessions[chatId];
            showMainMenu(chatId);
            return;
          }
          
          session.selectedType = text;
          session.step = 'maintenance_description';
          
          sendMessage(chatId, `📝 Describe the problem in detail:\n\n(Or type "skip" to skip description)`, {
            reply_markup: {remove_keyboard: true}
          });
        }
        
        // Step 4: Description
        else if (session.step === 'maintenance_description') {
          const description = text === 'skip' ? '' : text;
          
          let priority = 'normal';
          if (session.selectedType.includes('Urgent')) {
            priority = 'urgent';
          } else if (session.selectedType.includes('Electrical') || 
                     session.selectedType.includes('Plumbing')) {
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
          
          sendMessage(chatId, `🔧 *Maintenance reported!*\n\n🏠 Bungalow: ${session.bungalow}\n🔧 Type: ${session.selectedType}\n📝 Description: ${description || 'None'}\n⚠️ Priority: ${priority}\n\n/menu to return to main menu`, {
            parse_mode: 'Markdown',
            reply_markup: {remove_keyboard: true}
          });
          delete userSessions[chatId];
        }
      }
    });
    
    // =================================
    // ERROR HANDLING
    // =================================
    
    bot.on('error', (error) => {
      console.error('Bot error:', error);
    });
    
    bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });
    
    console.log('🏕️ Camping Management Bot is running...');
    
  }, 3000);
  
}).catch((error) => {
  console.error('❌ Webhook cleanup error:', error);
});
