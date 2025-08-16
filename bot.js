// CAMPING BOT - VERSION NETTOYÉE + GOOGLE SHEETS INTEGRATION
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
    
    // Detailed cleaning items by category
    const cleaningItems = {
      kitchen: [
        '🥄 Draining Rack', '🍲 Washing Up Bowl', '🥗 Colander', '🥗 Salad Bowl', 
        '🧀 Cheese Grater', '🥛 Glass Measurer', '🔪 Chopping Board', '🍳 Pan Small', 
        '🍳 Pan Medium', '🍳 Pan Large', '🍳 Frying Pan', '🫖 Kettle',
        '🍽️ Dinner Plates Beige Square', '🍽️ Dinner Plates White Round', '🍽️ Dinner Plates Multicolor Blue/Yellow',
        '🍽️ Side Plates Beige Square', '🍽️ Side Plates White Round', '🍽️ Side Plates Multicolor Blue/Yellow',
        '🍰 Dessert Plates Beige Square', '🍰 Dessert Plates White Round', '🍰 Dessert Plates Multicolor Blue/Yellow',
        '🥣 Cereal Bowls Grey', '🥣 Cereal Bowls Brown', '🥣 Cereal Bowls White',
        '☕ Mugs Grey', '☕ Mugs White', '☕ Mugs Brown',
        '🍷 Wine Glass', '🥤 Tumblers', '🍴 Cutlery Tray', '🔪 Knives', 
        '🍴 Forks', '🥄 Spoons', '🥄 Tea Spoons', '🥄 Serving Spoons', 
        '🥄 Ladle', '🍴 Kitchen Fork', '🍳 Kitchen Spatula', '🥄 Kitchen Tongs',
        '🍷 Corkscrew', '🍞 Bread Knife', '🥕 Veg Knife', '🥔 Potato Peeler', 
        '🥫 Tin Opener', '☕ Coffee Machine', '🍞 Toaster'
      ],
      cleaning: [
        '🗑️ Bin with Lid', '🪣 Bucket', '🧽 Mop', '🦯 Mop Handle',
        '🧹 Broom', '🧹 Dustpan/Brush', '🚪 Indoor Mat'
      ],
      bedding: [
        '💤 Pillow', '🛏️ Double Duvets', '🛏️ Single Duvets', 
        '🛏️ Double Mattress Cover', '🛏️ Single Mattress Cover'
      ],
      outdoor: [
        '🪑 Outside Table', 
        '🪑 Outside Chairs White', '🪑 Outside Chairs Black', '🪑 Outside Chairs Longue Black',
        '👕 Clothes Rack', '🔥 BBQ', '⛽ BBQ Gas', 
        '🍴 BBQ Fork', '🍳 BBQ Spatula', '🥄 BBQ Tongs',
        '🚬 Ashtray', '🏠 Outdoor Mat'
      ],
      toilet: [
        '🧽 Toilet Brush'
      ]
    };
    
    // GOOGLE SHEETS FUNCTIONS
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
    
    async function getFromGoogleSheets(action, filters = {}) {
      try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({action: action, ...filters})
        });
        const result = await response.json();
        return result.success ? result.data : [];
      } catch (error) {
        console.error('Google Sheets get error:', error);
        return [];
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
    
    // FORMAT FUNCTIONS FOR DISPLAY
    function formatMissingItemsList(missingItems) {
      if (!missingItems || missingItems.length === 0) {
        return '📋 *Current Missing Items*\n\n✨ No missing items found!\n\nAll bungalows are fully stocked.';
      }
      
      // Group by bungalow
      const groupedItems = {};
      missingItems.forEach(item => {
        if (!groupedItems[item.bungalow]) {
          groupedItems[item.bungalow] = [];
        }
        groupedItems[item.bungalow].push(`• ${item.item} x${item.quantity}`);
      });
      
      let message = '📋 *Current Missing Items*\n\n';
      for (const [bungalow, items] of Object.entries(groupedItems)) {
        message += `${bungalow}:\n${items.join('\n')}\n\n`;
      }
      
      message += '*Select "Supply Item" to mark items as provided*';
      return message;
    }
    
    function formatPendingRepairs(pendingRepairs) {
      if (!pendingRepairs || pendingRepairs.length === 0) {
        return '🔧 *Current Pending Repairs*\n\n✨ No pending repairs!\n\nAll bungalows are in perfect condition.';
      }
      
      // Group by bungalow
      const groupedRepairs = {};
      pendingRepairs.forEach(repair => {
        if (!groupedRepairs[repair.bungalow]) {
          groupedRepairs[repair.bungalow] = [];
        }
        const priorityIcon = repair.priority === 'urgent' ? '🔧' : 
                           repair.priority === 'high' ? '⚡' : '🔧';
        const priorityText = repair.priority === 'urgent' ? 'Urgent' : 
                           repair.priority === 'high' ? 'High' : 'Normal';
        groupedRepairs[repair.bungalow].push(`• ${priorityIcon} ${priorityText}: ${repair.item}`);
      });
      
      let message = '🔧 *Current Pending Repairs*\n\n';
      for (const [bungalow, repairs] of Object.entries(groupedRepairs)) {
        message += `${bungalow}:\n${repairs.join('\n')}\n\n`;
      }
      
      message += '*Select "Mark as Repaired" to complete repairs*';
      return message;
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
                [{text: '📦 Missing Items List'}],
                [{text: '📊 Check Stock'}],
                [{text: '🔙 Back to Menu'}]
              ],
              one_time_keyboard: true,
              resize_keyboard: true
            }
          });
        }
        else if (text === '🔧 Maintenance') {
          userSessions[chatId] = {step: 'maintenance_choice', section: 'maintenance'};
          
          bot.sendMessage(chatId, '🔧 *Maintenance Section*\n\nChoose an action:', {
            parse_mode: 'Markdown',
            reply_markup: {
              keyboard: [
                [{text: '🔧 Pending Repairs'}],
                [{text: '➕ Report New Issue'}],
                [{text: '📊 Maintenance Log'}],
                [{text: '🔙 Back to Menu'}]
              ],
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
              session.items = []; // Initialize items array
              
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
              session.step = 'cleaning_category';
              
              const keyboard = [
                [{text: '🍽️ Kitchen'}],
                [{text: '🏠 Outdoor'}],
                [{text: '🧹 Cleaning'}],
                [{text: '🛏️ Bedding'}],
                [{text: '🚽 Toilet'}],
                [{text: '🔙 Back'}]
              ];
              
              bot.sendMessage(chatId, '📦 Choose category:', {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
          }
          
          // Category selection
          else if (session.step === 'cleaning_category') {
            if (text === '🔙 Back') {
              session.step = 'cleaning_action';
              
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
              
              bot.sendMessage(chatId, `Choose missing item (${text}):`, {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
          }
          
          // Item selection
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
              
              bot.sendMessage(chatId, '📦 Choose category:', {
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
            
            bot.sendMessage(chatId, `📊 How many "${text}" are missing?\n\nEnter a number:`, {
              reply_markup: {remove_keyboard: true}
            });
          }
          
          // Quantity input
          else if (session.step === 'cleaning_quantity') {
            const quantity = parseInt(text);
            if (quantity && quantity > 0) {
              session.selectedQuantity = quantity;
              
              // Add item to session
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
              
              bot.sendMessage(chatId, `✅ Item added!\n\n📋 *Summary ${session.bungalow}:*\n${summary}\n\nWhat do you want to do?`, {
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
              bot.sendMessage(chatId, '❌ Enter a valid number (ex: 1, 2, 3...)');
            }
          }
          
          // Continue options
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
              
              bot.sendMessage(chatId, '📦 Choose category for next item:', {
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
              
              // Remove "Bungalow Ready" option if no kitchen items
              if (!session.items.some(item => item.category === 'kitchen')) {
                keyboard.splice(1, 1);
              }
              
              bot.sendMessage(chatId, '💡 Add a note?\n\nChoose or type your note:', {
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
              
              bot.sendMessage(chatId, `🎉 *Report sent successfully!*\n\n🏠 Bungalow: ${session.bungalow}\n📦 ${successCount} items reported:\n\n${summary}\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              
              delete userSessions[chatId];
            }
            else if (text === '🗑️ Cancel All') {
              bot.sendMessage(chatId, '❌ Report cancelled.\n\n/menu to return', {
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
          }
          
          // Notes handling
          else if (session.step === 'cleaning_notes') {
            const note = text === '❌ No Note' ? '' : text.replace(/🏠 |🔧 |❌ /, '');
            
            // Apply note to all items
            session.items.forEach(item => {
              item.notes = note;
            });
            
            session.step = 'cleaning_continue';
            
            const summary = session.items.map((item, index) => 
              `${index + 1}. ${item.item} x${item.quantity}${item.notes ? ` (${item.notes})` : ''}`
            ).join('\n');
            
            bot.sendMessage(chatId, `✅ Note added!\n\n📋 *Final Summary ${session.bungalow}:*\n${summary}\n\nReady to send?`, {
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
        
        // INVENTORY SECTION - ONLY MISSING ITEMS
        else if (session.section === 'inventory') {
          
          if (session.step === 'inventory_choice') {
            if (text === '🔙 Back to Menu') {
              delete userSessions[chatId];
              showMainMenu(chatId);
              return;
            }
            
            if (text === '📦 Missing Items List') {
              bot.sendMessage(chatId, `🔄 Loading missing items from Google Sheets...`, {
                reply_markup: {remove_keyboard: true}
              });
              
              // Get real missing items from Google Sheets
              const missingItems = await getFromGoogleSheets('getMissingItems');
              const formattedMessage = formatMissingItemsList(missingItems);
              
              bot.sendMessage(chatId, formattedMessage, {
                parse_mode: 'Markdown',
                reply_markup: {
                  keyboard: [
                    [{text: '🔄 Refresh List'}],
                    [{text: '📦 Supply Item'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
              session.step = 'missing_items_list';
              session.cachedMissingItems = missingItems; // Cache for supply process
            }
            else if (text === '📊 Check Stock') {
              bot.sendMessage(chatId, `🔄 Loading current stock...`, {
                reply_markup: {remove_keyboard: true}
              });
              
              // Get real stock data from Google Sheets
              const stockData = await getFromGoogleSheets('getStock');
              
              let stockMessage = '📊 *Current Stock Status*\n\n';
              if (stockData && stockData.length > 0) {
                // Group by category
                const groupedStock = {};
                stockData.forEach(item => {
                  if (!groupedStock[item.category]) {
                    groupedStock[item.category] = [];
                  }
                  const status = item.quantity > 5 ? '✅' : item.quantity > 0 ? '⚠️' : '❌';
                  groupedStock[item.category].push(`• ${item.item}: ${item.quantity} ${status}`);
                });
                
                for (const [category, items] of Object.entries(groupedStock)) {
                  const categoryIcon = category === 'kitchen' ? '🍽️' : 
                                     category === 'outdoor' ? '🪑' : 
                                     category === 'cleaning' ? '🧹' : '📦';
                  stockMessage += `${categoryIcon} **${category.charAt(0).toUpperCase() + category.slice(1)}:**\n${items.join('\n')}\n\n`;
                }
              } else {
                stockMessage += 'No stock data available.';
              }
              
              stockMessage += '/menu to return';
              
              bot.sendMessage(chatId, stockMessage, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
          }
          
          // Missing items list management
          else if (session.step === 'missing_items_list') {
            if (text === '🔙 Back to Menu') {
              delete userSessions[chatId];
              showMainMenu(chatId);
              return;
            }
            
            if (text === '🔄 Refresh List') {
              bot.sendMessage(chatId, `🔄 Refreshing missing items...`, {
                reply_markup: {remove_keyboard: true}
              });
              
              const missingItems = await getFromGoogleSheets('getMissingItems');
              const formattedMessage = formatMissingItemsList(missingItems);
              
              bot.sendMessage(chatId, formattedMessage, {
                parse_mode: 'Markdown',
                reply_markup: {
                  keyboard: [
                    [{text: '📦 Supply Item'}],
                    [{text: '🔄 Refresh List'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
              session.cachedMissingItems = missingItems;
            }
            else if (text === '📦 Supply Item') {
              if (!session.cachedMissingItems || session.cachedMissingItems.length === 0) {
                bot.sendMessage(chatId, '✨ No missing items to supply!', {
                  reply_markup: {
                    keyboard: [
                      [{text: '🔄 Refresh List'}],
                      [{text: '🔙 Back to Menu'}]
                    ],
                    one_time_keyboard: true,
                    resize_keyboard: true
                  }
                });
                return;
              }
              
              session.step = 'supply_bungalow';
              
              // Get unique bungalows from missing items
              const uniqueBungalows = [...new Set(session.cachedMissingItems.map(item => item.bungalow))];
              const keyboard = uniqueBungalows.map(bungalow => [{text: bungalow}]);
              keyboard.push([{text: '🔙 Back'}]);
              
              bot.sendMessage(chatId, '🏠 Which bungalow did you supply?', {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
          }
          
          // Supply bungalow selection
          else if (session.step === 'supply_bungalow') {
            if (text === '🔙 Back') {
              session.step = 'missing_items_list';
              
              const formattedMessage = formatMissingItemsList(session.cachedMissingItems);
              bot.sendMessage(chatId, formattedMessage, {
                parse_mode: 'Markdown',
                reply_markup: {
                  keyboard: [
                    [{text: '🔄 Refresh List'}],
                    [{text: '📦 Supply Item'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
              return;
            }
            
            session.selectedBungalow = text;
            session.step = 'supply_item';
            
            // Get items for selected bungalow from cached data
            const bungalowItems = session.cachedMissingItems.filter(item => item.bungalow === text);
            const keyboard = bungalowItems.map(item => [{text: `${item.item} x${item.quantity}`}]);
            keyboard.push([{text: '🔙 Back to bungalows'}]);
            
            bot.sendMessage(chatId, `📦 What did you supply to ${text}?`, {
              reply_markup: {
                keyboard: keyboard,
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          }
          
          // Supply item selection
          else if (session.step === 'supply_item') {
            if (text === '🔙 Back to bungalows') {
              session.step = 'supply_bungalow';
              
              const uniqueBungalows = [...new Set(session.cachedMissingItems.map(item => item.bungalow))];
              const keyboard = uniqueBungalows.map(bungalow => [{text: bungalow}]);
              keyboard.push([{text: '🔙 Back'}]);
              
              bot.sendMessage(chatId, '🏠 Which bungalow did you supply?', {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
              return;
            }
            
            session.suppliedItem = text;
            session.step = 'supply_quantity';
            
            // Extract quantity from item name (e.g., "☕ Mugs x2" -> 2)
            const match = text.match(/x(\d+)/);
            const totalMissing = match ? parseInt(match[1]) : 1;
            session.totalMissing = totalMissing;
            
            bot.sendMessage(chatId, `📦 ${text}\n\n📊 How many did you supply?\n\nTotal missing: ${totalMissing}\nEnter quantity (1-${totalMissing}):`, {
              reply_markup: {remove_keyboard: true}
            });
          }
          
          // Supply quantity input
          else if (session.step === 'supply_quantity') {
            const suppliedQty = parseInt(text);
            if (suppliedQty && suppliedQty > 0 && suppliedQty <= session.totalMissing) {
              session.suppliedQuantity = suppliedQty;
              session.step = 'supply_confirm';
              
              const remaining = session.totalMissing - suppliedQty;
              const statusText = remaining > 0 ? 
                `\n📊 Remaining needed: ${remaining}` : 
                `\n✅ All items supplied - will be removed from list`;
              
              const keyboard = [
                [{text: '✅ Confirm Supplied'}],
                [{text: '📝 Add Note'}],
                [{text: '🔙 Back to items'}],
                [{text: '❌ Cancel'}]
              ];
              
              bot.sendMessage(chatId, `✅ *Confirm Supply*\n\n🏠 Bungalow: ${session.selectedBungalow}\n📦 Item: ${session.suppliedItem}\n📊 Quantity supplied: ${suppliedQty}${statusText}\n\nConfirm?`, {
                parse_mode: 'Markdown',
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            } else {
              bot.sendMessage(chatId, `❌ Enter a valid number between 1 and ${session.totalMissing}`);
            }
          }
          
          // Supply confirmation with quantity logic
          else if (session.step === 'supply_confirm') {
            if (text === '✅ Confirm Supplied') {
              const remaining = session.totalMissing - session.suppliedQuantity;
              const itemName = session.suppliedItem.replace(/x\d+/, '').trim();
              
              // Send supply record to Google Sheets
              await sendToGoogleSheets({
                bungalow: session.selectedBungalow,
                item: itemName,
                quantity: session.suppliedQuantity,
                category: 'supplied',
                notes: `Item supplied by ${msg.from.first_name}${session.supplyNote ? ` - ${session.supplyNote}` : ''}. Original missing: ${session.totalMissing}, Supplied: ${session.suppliedQuantity}, Remaining: ${remaining}`,
                priority: remaining > 0 ? 'partial' : 'completed',
                reportedBy: msg.from.first_name || 'User',
                section: 'inventory_supply',
                action: 'item_supplied',
                originalMissing: session.totalMissing,
                quantitySupplied: session.suppliedQuantity,
                quantityRemaining: remaining
              });
              
              // If there are remaining items, update the missing items list
              if (remaining > 0) {
                await sendToGoogleSheets({
                  bungalow: session.selectedBungalow,
                  item: itemName,
                  quantity: remaining,
                  category: 'missing',
                  notes: `Updated quantity after partial supply. Originally ${session.totalMissing}, supplied ${session.suppliedQuantity}`,
                  priority: 'normal',
                  reportedBy: 'System Update',
                  section: 'cleaning',
                  action: 'quantity_updated'
                });
              }
              
              const statusMessage = remaining > 0 ? 
                `📊 ${remaining} ${itemName} still needed for this bungalow.\n✨ Missing items list updated.` :
                `✨ All items supplied! This item has been removed from the missing items list.`;
              
              bot.sendMessage(chatId, `✅ *Supply Recorded Successfully!*\n\n🏠 Bungalow: ${session.selectedBungalow}\n📦 Item: ${itemName}\n📊 Quantity supplied: ${session.suppliedQuantity}\n\n${statusMessage}\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
            else if (text === '📝 Add Note') {
              session.step = 'supply_note';
              
              bot.sendMessage(chatId, `📝 Add a note about this supply:\n\n(Or type "skip" to skip)`, {
                reply_markup: {remove_keyboard: true}
              });
            }
            else if (text === '🔙 Back to items') {
              session.step = 'supply_item';
              
              // Show items for selected bungalow again
              const bungalowItems = session.cachedMissingItems.filter(item => item.bungalow === session.selectedBungalow);
              const keyboard = bungalowItems.map(item => [{text: `${item.item} x${item.quantity}`}]);
              keyboard.push([{text: '🔙 Back to bungalows'}]);
              
              bot.sendMessage(chatId, `📦 What did you supply to ${session.selectedBungalow}?`, {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
            else if (text === '❌ Cancel') {
              session.step = 'missing_items_list';
              
              const formattedMessage = formatMissingItemsList(session.cachedMissingItems);
              bot.sendMessage(chatId, formattedMessage, {
                parse_mode: 'Markdown',
                reply_markup: {
                  keyboard: [
                    [{text: '🔄 Refresh List'}],
                    [{text: '📦 Supply Item'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
          }
          
          // Supply note with updated confirmation
          else if (session.step === 'supply_note') {
            const note = text === 'skip' ? '' : text;
            session.supplyNote = note;
            session.step = 'supply_confirm';
            
            const remaining = session.totalMissing - session.suppliedQuantity;
            const statusText = remaining > 0 ? 
              `\n📊 Remaining needed: ${remaining}` : 
              `\n✅ All items supplied - will be removed from list`;
            
            const keyboard = [
              [{text: '✅ Confirm Supplied'}],
              [{text: '🔙 Back to items'}],
              [{text: '❌ Cancel'}]
            ];
            
            bot.sendMessage(chatId, `✅ *Confirm Supply*\n\n🏠 Bungalow: ${session.selectedBungalow}\n📦 Item: ${session.suppliedItem}\n📊 Quantity supplied: ${session.suppliedQuantity}${note ? `\n📝 Note: ${note}` : ''}${statusText}\n\nConfirm?`, {
              parse_mode: 'Markdown',
              reply_markup: {
                keyboard: keyboard,
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          }
        }
        
        // MAINTENANCE SECTION
        else if (session.section === 'maintenance') {
          
          if (session.step === 'maintenance_choice') {
            if (text === '🔙 Back to Menu') {
              delete userSessions[chatId];
              showMainMenu(chatId);
              return;
            }
            
            if (text === '🔧 Pending Repairs') {
              bot.sendMessage(chatId, `🔄 Loading pending repairs from Google Sheets...`, {
                reply_markup: {remove_keyboard: true}
              });
              
              // Get real pending repairs from Google Sheets
              const pendingRepairs = await getFromGoogleSheets('getPendingRepairs');
              const formattedMessage = formatPendingRepairs(pendingRepairs);
              
              bot.sendMessage(chatId, formattedMessage, {
                parse_mode: 'Markdown',
                reply_markup: {
                  keyboard: [
                    [{text: '🔄 Refresh List'}],
                    [{text: '✅ Mark as Repaired'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
              session.step = 'pending_repairs_list';
              session.cachedPendingRepairs = pendingRepairs;
            }
            else if (text === '➕ Report New Issue') {
              session.step = 'maintenance_color';
              
              const keyboard = colors.map(color => [{text: color}]);
              bot.sendMessage(chatId, '🔧 *Report New Issue*\n\n🎨 Choose bungalow color:', {
                parse_mode: 'Markdown',
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
            else if (text === '📊 Maintenance Log') {
              bot.sendMessage(chatId, `🔄 Loading maintenance log...`, {
                reply_markup: {remove_keyboard: true}
              });
              
              // Get maintenance log from Google Sheets
              const maintenanceLog = await getFromGoogleSheets('getMaintenanceLog');
              
              let logMessage = '📊 *Maintenance Log*\n\n';
              if (maintenanceLog && maintenanceLog.length > 0) {
                const completed = maintenanceLog.filter(item => item.category === 'repaired').slice(0, 5);
                const inProgress = maintenanceLog.filter(item => item.category === 'maintenance' && item.priority !== 'completed').slice(0, 3);
                
                if (completed.length > 0) {
                  logMessage += '✅ **Recently Completed:**\n';
                  completed.forEach(item => {
                    logMessage += `• ${item.bungalow} - ${item.item}\n`;
                  });
                  logMessage += '\n';
                }
                
                if (inProgress.length > 0) {
                  logMessage += '⏳ **In Progress:**\n';
                  inProgress.forEach(item => {
                    logMessage += `• ${item.bungalow} - ${item.item}\n`;
                  });
                  logMessage += '\n';
                }
              } else {
                logMessage += 'No maintenance log entries found.';
              }
              
              logMessage += '/menu to return';
              
              bot.sendMessage(chatId, logMessage, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
          }
          
          // Pending repairs list management
          else if (session.step === 'pending_repairs_list') {
            if (text === '🔙 Back to Menu') {
              delete userSessions[chatId];
              showMainMenu(chatId);
              return;
            }
            
            if (text === '🔄 Refresh List') {
              bot.sendMessage(chatId, `🔄 Refreshing pending repairs...`, {
                reply_markup: {remove_keyboard: true}
              });
              
              const pendingRepairs = await getFromGoogleSheets('getPendingRepairs');
              const formattedMessage = formatPendingRepairs(pendingRepairs);
              
              bot.sendMessage(chatId, formattedMessage, {
                parse_mode: 'Markdown',
                reply_markup: {
                  keyboard: [
                    [{text: '✅ Mark as Repaired'}],
                    [{text: '🔄 Refresh List'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
              session.cachedPendingRepairs = pendingRepairs;
            }
            else if (text === '✅ Mark as Repaired') {
              if (!session.cachedPendingRepairs || session.cachedPendingRepairs.length === 0) {
                bot.sendMessage(chatId, '✨ No pending repairs to mark as completed!', {
                  reply_markup: {
                    keyboard: [
                      [{text: '🔄 Refresh List'}],
                      [{text: '🔙 Back to Menu'}]
                    ],
                    one_time_keyboard: true,
                    resize_keyboard: true
                  }
                });
                return;
              }
              
              session.step = 'repair_bungalow';
              
              // Get unique bungalows from pending repairs
              const uniqueBungalows = [...new Set(session.cachedPendingRepairs.map(item => item.bungalow))];
              const keyboard = uniqueBungalows.map(bungalow => [{text: bungalow}]);
              keyboard.push([{text: '🔙 Back'}]);
              
              bot.sendMessage(chatId, '🏠 Which bungalow did you repair?', {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
          }
          
          // Repair bungalow selection
          else if (session.step === 'repair_bungalow') {
            if (text === '🔙 Back') {
              session.step = 'pending_repairs_list';
              
              const formattedMessage = formatPendingRepairs(session.cachedPendingRepairs);
              bot.sendMessage(chatId, formattedMessage, {
                parse_mode: 'Markdown',
                reply_markup: {
                  keyboard: [
                    [{text: '🔄 Refresh List'}],
                    [{text: '✅ Mark as Repaired'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
              return;
            }
            
            session.selectedBungalow = text;
            session.step = 'repair_issue';
            
            // Get issues for selected bungalow from cached data
            const bungalowIssues = session.cachedPendingRepairs.filter(item => item.bungalow === text);
            const keyboard = bungalowIssues.map(issue => [{text: issue.item}]);
            keyboard.push([{text: '🔙 Back to bungalows'}]);
            
            bot.sendMessage(chatId, `🔧 What did you repair in ${text}?`, {
              reply_markup: {
                keyboard: keyboard,
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          }
          
          // Repair issue selection
          else if (session.step === 'repair_issue') {
            if (text === '🔙 Back to bungalows') {
              session.step = 'repair_bungalow';
              
              const uniqueBungalows = [...new Set(session.cachedPendingRepairs.map(item => item.bungalow))];
              const keyboard = uniqueBungalows.map(bungalow => [{text: bungalow}]);
              keyboard.push([{text: '🔙 Back'}]);
              
              bot.sendMessage(chatId, '🏠 Which bungalow did you repair?', {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
              return;
            }
            
            session.repairedIssue = text;
            session.step = 'repair_confirm';
            
            const keyboard = [
              [{text: '✅ Confirm Repaired'}],
              [{text: '📝 Add Repair Note'}],
              [{text: '🔙 Back to issues'}],
              [{text: '❌ Cancel'}]
            ];
            
            bot.sendMessage(chatId, `✅ *Confirm Repair*\n\n🏠 Bungalow: ${session.selectedBungalow}\n🔧 Issue: ${text}\n\nConfirm that you completed this repair?`, {
              parse_mode: 'Markdown',
              reply_markup: {
                keyboard: keyboard,
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          }
          
          // Repair confirmation with complete Google Sheets integration
          else if (session.step === 'repair_confirm') {
            if (text === '✅ Confirm Repaired') {
              // Mark repair as completed and remove from pending list
              await sendToGoogleSheets({
                bungalow: session.selectedBungalow,
                item: session.repairedIssue,
                quantity: 1,
                category: 'repaired',
                notes: `Repair completed by ${msg.from.first_name}${session.repairNote ? ` - ${session.repairNote}` : ''}`,
                priority: 'completed',
                reportedBy: msg.from.first_name || 'User',
                section: 'maintenance_repair',
                action: 'repair_completed'
              });
              
              // Also log the completion for maintenance tracking
              await sendToGoogleSheets({
                bungalow: session.selectedBungalow,
                item: `${session.repairedIssue} - COMPLETED`,
                quantity: 1,
                category: 'maintenance_log',
                notes: `Completion logged. Original issue: ${session.repairedIssue}. Repaired by: ${msg.from.first_name}${session.repairNote ? `. Details: ${session.repairNote}` : ''}`,
                priority: 'logged',
                reportedBy: msg.from.first_name || 'User',
                section: 'maintenance_log',
                action: 'repair_logged'
              });
              
              bot.sendMessage(chatId, `✅ *Repair Completed Successfully!*\n\n🏠 Bungalow: ${session.selectedBungalow}\n🔧 Issue: ${session.repairedIssue}\n\n✨ This issue has been:\n• Removed from pending repairs\n• Added to maintenance completion log\n• Marked as resolved in system\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
            else if (text === '📝 Add Repair Note') {
              session.step = 'repair_note';
              
              bot.sendMessage(chatId, `📝 Add details about this repair:\n\n(Or type "skip" to skip)`, {
                reply_markup: {remove_keyboard: true}
              });
            }
            else if (text === '🔙 Back to issues') {
              session.step = 'repair_issue';
              
              // Show issues for selected bungalow again
              const bungalowIssues = session.cachedPendingRepairs.filter(item => item.bungalow === session.selectedBungalow);
              const keyboard = bungalowIssues.map(issue => [{text: issue.item}]);
              keyboard.push([{text: '🔙 Back to bungalows'}]);
              
              bot.sendMessage(chatId, `🔧 What did you repair in ${session.selectedBungalow}?`, {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
            else if (text === '❌ Cancel') {
              session.step = 'pending_repairs_list';
              
              const formattedMessage = formatPendingRepairs(session.cachedPendingRepairs);
              bot.sendMessage(chatId, formattedMessage, {
                parse_mode: 'Markdown',
                reply_markup: {
                  keyboard: [
                    [{text: '🔄 Refresh List'}],
                    [{text: '✅ Mark as Repaired'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
          }
          
          // Repair note
          else if (session.step === 'repair_note') {
            const note = text === 'skip' ? '' : text;
            session.repairNote = note;
            session.step = 'repair_confirm';
            
            const keyboard = [
              [{text: '✅ Confirm Repaired'}],
              [{text: '🔙 Back to issues'}],
              [{text: '❌ Cancel'}]
            ];
            
            bot.sendMessage(chatId, `✅ *Confirm Repair*\n\n🏠 Bungalow: ${session.selectedBungalow}\n🔧 Issue: ${session.repairedIssue}${note ? `\n📝 Details: ${note}` : ''}\n\nConfirm that you completed this repair?`, {
              parse_mode: 'Markdown',
              reply_markup: {
                keyboard: keyboard,
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          }
          
          // Original maintenance flow for new issues
          else if (session.step === 'maintenance_color') {
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
              session.step = 'maintenance_type';
              
              const keyboard = [
                [{text: '🔧 Urgent Repair'}],
                [{text: '⚡ Electrical Issue'}],
                [{text: '🚿 Plumbing Issue'}],
                [{text: '🚪 Door/Window Issue'}],
                [{text: '🧹 Special Cleaning'}],
                [{text: '🔙 Back to Menu'}]
              ];
              
              bot.sendMessage(chatId, `🔧 Bungalow: ${session.bungalow}\n\nType of problem:`, {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            } else {
              bot.sendMessage(chatId, '❌ Enter a valid number (ex: 1, 20, 15...)');
            }
          }
          else if (session.step === 'maintenance_type') {
            if (text === '🔙 Back to Menu') {
              delete userSessions[chatId];
              showMainMenu(chatId);
              return;
            }
            
            session.selectedType = text;
            session.step = 'maintenance_description';
            
            bot.sendMessage(chatId, `📝 Describe the problem in detail:\n\n(Or type "skip" to skip description)`, {
              reply_markup: {remove_keyboard: true}
            });
          }
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
              section: 'maintenance',
              action: 'new_issue_reported'
            });
            
            bot.sendMessage(chatId, `🔧 *New Issue Reported!*\n\n🏠 Bungalow: ${session.bungalow}\n🔧 Type: ${session.selectedType}\n📝 Description: ${description || 'None'}\n⚠️ Priority: ${priority}\n\n✨ This issue has been added to pending repairs list.\n\n/menu to return`, {
              parse_mode: 'Markdown',
              reply_markup: {remove_keyboard: true}
            });
            delete userSessions[chatId];
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
