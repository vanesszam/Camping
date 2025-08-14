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
    
    // Detailed cleaning items by category
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
    
    // Detailed inventory items by category
    const inventoryItems = {
      supplies: [
        '🧻 Toilet Paper', '🧼 Soap', '🧴 Shampoo', '🧴 Shower Gel', 
        '🧽 Sponges', '🧹 Cleaning Products', '🗑️ Trash Bags', '💡 Light Bulbs', 
        '🔋 Batteries', '🕯️ Candles', '🔥 Matches', '📄 Paper Towels',
        '🧴 Dish Soap', '🧽 Scrubbing Pads', '🧻 Kitchen Roll', '🧼 Hand Sanitizer'
      ],
      maintenance: [
        '🔧 Screwdriver Set', '🪛 Screws Assorted', '🔩 Bolts & Nuts', '⚡ Extension Cords', 
        '🚿 Shower Head', '🚿 Plumbing Washers', '🎨 Touch-up Paint', '🪚 Wood Screws',
        '🔨 Hammer', '📏 Measuring Tape', '🔧 Wrench Set', '⚡ Light Switch'
      ]
    };
    
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
                [{text: '📦 Missing Items List'}],
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
          
          // NEW: Category selection
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
          
          // NEW: Item selection
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
          
          // NEW: Quantity input
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
          
          // NEW: Continue options
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
          
          // NEW: Notes handling
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
        
        // INVENTORY SECTION - COMPLETE
        else if (session.section === 'inventory') {
          
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
              
              bot.sendMessage(chatId, '📦 Choose category to add stock:', {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
            else if (text === '📦 Missing Items List') {
              // Show missing items from cleaning reports
              bot.sendMessage(chatId, `📋 *Missing Items from Cleaning Reports*\n\nLoading missing items...\n\nNote: This will show items reported as missing by cleaning team that need to be supplied to bungalows.`, {
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
            }
            else if (text === '📊 Check Stock') {
              // For now, show a summary message
              // Later this could fetch real data from Google Sheets
              bot.sendMessage(chatId, `📊 *Current Stock Status*\n\n🧻 **Supplies:**\n• Toilet Paper: Low\n• Cleaning Products: OK\n• Light Bulbs: Critical\n\n🔧 **Maintenance:**\n• Tools: OK\n• Screws: Low\n• Paint: OK\n\n💡 *Use "Add Stock" to replenish items*\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
          }
          
          // NEW: Missing items list management
          else if (session.step === 'missing_items_list') {
            if (text === '🔙 Back to Menu') {
              delete userSessions[chatId];
              showMainMenu(chatId);
              return;
            }
            
            if (text === '🔄 Refresh List') {
              // In real implementation, this would fetch from Google Sheets
              // For now, show example missing items
              bot.sendMessage(chatId, `📋 *Current Missing Items*\n\n🔵 Blue 15:\n• ☕ Mugs x2\n• 🍳 Frying Pan x1\n\n🟠 Orange 7:\n• 🧽 Toilet Brush x1\n• 💤 Pillow x1\n\n🤎 Brown 22:\n• 🥄 Spoons x4\n• 🔥 BBQ Gas x1\n\n*Select "Supply Item" to mark items as provided*`, {
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
            }
            else if (text === '📦 Supply Item') {
              session.step = 'supply_bungalow';
              
              // In real implementation, these would come from Google Sheets
              const keyboard = [
                [{text: '🔵 Blue 15'}],
                [{text: '🟠 Orange 7'}],
                [{text: '🤎 Brown 22'}],
                [{text: '🔙 Back'}]
              ];
              
              bot.sendMessage(chatId, '🏠 Which bungalow did you supply?', {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
          }
          
          // NEW: Supply bungalow selection
          else if (session.step === 'supply_bungalow') {
            if (text === '🔙 Back') {
              session.step = 'missing_items_list';
              
              bot.sendMessage(chatId, `📋 *Missing Items from Cleaning Reports*\n\nSelect an option:`, {
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
            
            // Show items for selected bungalow (in real implementation, from Google Sheets)
            let items = [];
            if (text === '🔵 Blue 15') {
              items = [
                [{text: '☕ Mugs x2'}],
                [{text: '🍳 Frying Pan x1'}]
              ];
            } else if (text === '🟠 Orange 7') {
              items = [
                [{text: '🧽 Toilet Brush x1'}],
                [{text: '💤 Pillow x1'}]
              ];
            } else if (text === '🤎 Brown 22') {
              items = [
                [{text: '🥄 Spoons x4'}],
                [{text: '🔥 BBQ Gas x1'}]
              ];
            }
            
            items.push([{text: '🔙 Back to bungalows'}]);
            
            bot.sendMessage(chatId, `📦 What did you supply to ${text}?`, {
              reply_markup: {
                keyboard: items,
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          }
          
          // NEW: Supply item selection
          else if (session.step === 'supply_item') {
            if (text === '🔙 Back to bungalows') {
              session.step = 'supply_bungalow';
              
              const keyboard = [
                [{text: '🔵 Blue 15'}],
                [{text: '🟠 Orange 7'}],
                [{text: '🤎 Brown 22'}],
                [{text: '🔙 Back'}]
              ];
              
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
            session.step = 'supply_confirm';
            
            const keyboard = [
              [{text: '✅ Confirm Supplied'}],
              [{text: '📝 Add Note'}],
              [{text: '🔙 Back to items'}],
              [{text: '❌ Cancel'}]
            ];
            
            bot.sendMessage(chatId, `✅ *Confirm Supply*\n\n🏠 Bungalow: ${session.selectedBungalow}\n📦 Item: ${text}\n\nConfirm that you supplied this item?`, {
              parse_mode: 'Markdown',
              reply_markup: {
                keyboard: keyboard,
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          }
          
          // NEW: Supply confirmation
          else if (session.step === 'supply_confirm') {
            if (text === '✅ Confirm Supplied') {
              // In real implementation, this would:
              // 1. Mark item as "supplied" in Google Sheets
              // 2. Remove from missing items list
              // 3. Add to supplied items log
              
              await sendToGoogleSheets({
                bungalow: session.selectedBungalow,
                item: session.suppliedItem,
                quantity: 1,
                category: 'supplied',
                notes: `Item supplied by ${msg.from.first_name}${session.supplyNote ? ` - ${session.supplyNote}` : ''}`,
                priority: 'completed',
                reportedBy: msg.from.first_name || 'User',
                section: 'inventory_supply',
                action: 'item_supplied'
              });
              
              bot.sendMessage(chatId, `✅ *Item Supplied Successfully!*\n\n🏠 Bungalow: ${session.selectedBungalow}\n📦 Item: ${session.suppliedItem}\n\n✨ This item has been removed from the missing items list.\n\n/menu to return`, {
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
              let items = [];
              if (session.selectedBungalow === '🔵 Blue 15') {
                items = [
                  [{text: '☕ Mugs x2'}],
                  [{text: '🍳 Frying Pan x1'}]
                ];
              } else if (session.selectedBungalow === '🟠 Orange 7') {
                items = [
                  [{text: '🧽 Toilet Brush x1'}],
                  [{text: '💤 Pillow x1'}]
                ];
              } else if (session.selectedBungalow === '🤎 Brown 22') {
                items = [
                  [{text: '🥄 Spoons x4'}],
                  [{text: '🔥 BBQ Gas x1'}]
                ];
              }
              
              items.push([{text: '🔙 Back to bungalows'}]);
              
              bot.sendMessage(chatId, `📦 What did you supply to ${session.selectedBungalow}?`, {
                reply_markup: {
                  keyboard: items,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
            else if (text === '❌ Cancel') {
              session.step = 'missing_items_list';
              
              bot.sendMessage(chatId, `📋 *Missing Items from Cleaning Reports*\n\nSelect an option:`, {
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
          
          // NEW: Supply note
          else if (session.step === 'supply_note') {
            const note = text === 'skip' ? '' : text;
            session.supplyNote = note;
            session.step = 'supply_confirm';
            
            const keyboard = [
              [{text: '✅ Confirm Supplied'}],
              [{text: '🔙 Back to items'}],
              [{text: '❌ Cancel'}]
            ];
            
            bot.sendMessage(chatId, `✅ *Confirm Supply*\n\n🏠 Bungalow: ${session.selectedBungalow}\n📦 Item: ${session.suppliedItem}${note ? `\n📝 Note: ${note}` : ''}\n\nConfirm that you supplied this item?`, {
              parse_mode: 'Markdown',
              reply_markup: {
                keyboard: keyboard,
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          }
          
          // NEW: Category selection for inventory
          else if (session.step === 'inventory_category') {
            if (text === '🔙 Back') {
              session.step = 'inventory_choice';
              
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
              keyboard.push([{text: '🔙 Back to categories'}]);
              
              bot.sendMessage(chatId, `Choose item to add (${text}):`, {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
          }
          
          // NEW: Item selection for inventory
          else if (session.step === 'inventory_item') {
            if (text === '🔙 Back to categories') {
              session.step = 'inventory_category';
              
              const keyboard = [
                [{text: '🧻 Supplies'}],
                [{text: '🔧 Maintenance Materials'}],
                [{text: '🔙 Back'}]
              ];
              
              bot.sendMessage(chatId, '📦 Choose category to add stock:', {
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
            
            bot.sendMessage(chatId, `📊 How many "${text}" do you want to add to stock?\n\nEnter a number:`, {
              reply_markup: {remove_keyboard: true}
            });
          }
          
          // NEW: Quantity for inventory
          else if (session.step === 'inventory_quantity') {
            const quantity = parseInt(text);
            if (quantity && quantity > 0) {
              session.step = 'inventory_location';
              session.selectedQuantity = quantity;
              
              const keyboard = [
                [{text: '🏪 Main Storage'}],
                [{text: '🧹 Cleaning Closet'}],
                [{text: '🔧 Maintenance Room'}],
                [{text: '🏠 Reception'}],
                [{text: '📍 Other Location'}]
              ];
              
              bot.sendMessage(chatId, `📍 Where are you adding ${quantity} x "${session.selectedItem}"?\n\nChoose storage location:`, {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            } else {
              bot.sendMessage(chatId, '❌ Enter a valid number (ex: 1, 5, 10, 25...)');
            }
          }
          
          // NEW: Location for inventory
          else if (session.step === 'inventory_location') {
            let location = '';
            if (text === '🏪 Main Storage') location = 'Main Storage';
            else if (text === '🧹 Cleaning Closet') location = 'Cleaning Closet';
            else if (text === '🔧 Maintenance Room') location = 'Maintenance Room';
            else if (text === '🏠 Reception') location = 'Reception';
            else if (text === '📍 Other Location') {
              session.step = 'inventory_custom_location';
              bot.sendMessage(chatId, `📝 Enter custom location name:`, {
                reply_markup: {remove_keyboard: true}
              });
              return;
            } else {
              location = text; // Custom location from previous step
            }
            
            if (location) {
              session.selectedLocation = location;
              session.step = 'inventory_confirm';
              
              const keyboard = [
                [{text: '✅ Confirm & Add'}],
                [{text: '📝 Add Note'}],
                [{text: '🔙 Change Location'}],
                [{text: '❌ Cancel'}]
              ];
              
              bot.sendMessage(chatId, `📋 *Stock Addition Summary:*\n\n📦 Item: ${session.selectedItem}\n📊 Quantity: ${session.selectedQuantity}\n📍 Location: ${location}\n\nConfirm this addition?`, {
                parse_mode: 'Markdown',
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
          }
          
          // NEW: Custom location input
          else if (session.step === 'inventory_custom_location') {
            session.selectedLocation = text;
            session.step = 'inventory_confirm';
            
            const keyboard = [
              [{text: '✅ Confirm & Add'}],
              [{text: '📝 Add Note'}],
              [{text: '🔙 Change Location'}],
              [{text: '❌ Cancel'}]
            ];
            
            bot.sendMessage(chatId, `📋 *Stock Addition Summary:*\n\n📦 Item: ${session.selectedItem}\n📊 Quantity: ${session.selectedQuantity}\n📍 Location: ${text}\n\nConfirm this addition?`, {
              parse_mode: 'Markdown',
              reply_markup: {
                keyboard: keyboard,
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          }
          
          // NEW: Confirmation step
          else if (session.step === 'inventory_confirm') {
            if (text === '✅ Confirm & Add') {
              await sendToGoogleSheets({
                bungalow: 'General Stock',
                item: session.selectedItem,
                quantity: session.selectedQuantity,
                category: session.selectedCategory,
                notes: `Added to ${session.selectedLocation}${session.inventoryNote ? ` - ${session.inventoryNote}` : ''}`,
                priority: 'normal',
                reportedBy: msg.from.first_name || 'User',
                section: 'inventory',
                location: session.selectedLocation
              });
              
              bot.sendMessage(chatId, `✅ *Stock updated successfully!*\n\n📦 Item: ${session.selectedItem}\n📊 Quantity added: ${session.selectedQuantity}\n📍 Location: ${session.selectedLocation}\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
            else if (text === '📝 Add Note') {
              session.step = 'inventory_note';
              
              bot.sendMessage(chatId, `📝 Add a note about this stock addition:\n\n(Or type "skip" to skip)`, {
                reply_markup: {remove_keyboard: true}
              });
            }
            else if (text === '🔙 Change Location') {
              session.step = 'inventory_location';
              
              const keyboard = [
                [{text: '🏪 Main Storage'}],
                [{text: '🧹 Cleaning Closet'}],
                [{text: '🔧 Maintenance Room'}],
                [{text: '🏠 Reception'}],
                [{text: '📍 Other Location'}]
              ];
              
              bot.sendMessage(chatId, `📍 Choose new storage location:`, {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
            else if (text === '❌ Cancel') {
              bot.sendMessage(chatId, '❌ Stock addition cancelled.\n\n/menu to return', {
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
          }
          
          // NEW: Note adding
          else if (session.step === 'inventory_note') {
            const note = text === 'skip' ? '' : text;
            session.inventoryNote = note;
            session.step = 'inventory_confirm';
            
            const keyboard = [
              [{text: '✅ Confirm & Add'}],
              [{text: '🔙 Change Location'}],
              [{text: '❌ Cancel'}]
            ];
            
            bot.sendMessage(chatId, `📋 *Stock Addition Summary:*\n\n📦 Item: ${session.selectedItem}\n📊 Quantity: ${session.selectedQuantity}\n📍 Location: ${session.selectedLocation}${note ? `\n📝 Note: ${note}` : ''}\n\nConfirm this addition?`, {
              parse_mode: 'Markdown',
              reply_markup: {
                keyboard: keyboard,
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          }
        }
        
        // MAINTENANCE SECTION - COMPLETE
        else if (session.section === 'maintenance') {
          
          if (session.step === 'maintenance_choice') {
            if (text === '🔙 Back to Menu') {
              delete userSessions[chatId];
              showMainMenu(chatId);
              return;
            }
            
            if (text === '🔧 Pending Repairs') {
              // Show maintenance issues from cleaning reports and maintenance reports
              bot.sendMessage(chatId, `🔧 *Pending Maintenance Issues*\n\nLoading pending repairs...\n\nNote: This shows all maintenance issues reported by cleaning team and direct maintenance reports.`, {
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
              bot.sendMessage(chatId, `📊 *Maintenance Log*\n\n✅ **Recently Completed:**\n• 🔵 Blue 12 - Electrical fixed\n• 🟠 Orange 5 - Plumbing repaired\n• 🤎 Brown 18 - Door handle fixed\n\n⏳ **In Progress:**\n• 🟡 Yellow 9 - BBQ repair\n• 🔘 Grey 14 - Shower head replacement\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
          }
          
          // NEW: Pending repairs list management
          else if (session.step === 'pending_repairs_list') {
            if (text === '🔙 Back to Menu') {
              delete userSessions[chatId];
              showMainMenu(chatId);
              return;
            }
            
            if (text === '🔄 Refresh List') {
              // In real implementation, this would fetch from Google Sheets
              // Show example pending maintenance issues
              bot.sendMessage(chatId, `🔧 *Current Pending Repairs*\n\n🔵 Blue 8:\n• 🔧 Urgent: Door lock broken\n• ⚡ High: Electrical outlet not working\n\n🟠 Orange 15:\n• 🚿 High: Shower head leaking\n• 🧹 Normal: Deep cleaning needed\n\n🤎 Brown 3:\n• 🔧 Urgent: Window won't close\n• 🚪 Normal: Squeaky door\n\n🟡 Yellow 21:\n• 🔥 High: BBQ gas connection issue\n\n*Select "Mark as Repaired" to complete repairs*`, {
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
            }
            else if (text === '✅ Mark as Repaired') {
              session.step = 'repair_bungalow';
              
              // In real implementation, these would come from Google Sheets
              const keyboard = [
                [{text: '🔵 Blue 8'}],
                [{text: '🟠 Orange 15'}],
                [{text: '🤎 Brown 3'}],
                [{text: '🟡 Yellow 21'}],
                [{text: '🔙 Back'}]
              ];
              
              bot.sendMessage(chatId, '🏠 Which bungalow did you repair?', {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
          }
          
          // NEW: Repair bungalow selection
          else if (session.step === 'repair_bungalow') {
            if (text === '🔙 Back') {
              session.step = 'pending_repairs_list';
              
              bot.sendMessage(chatId, `🔧 *Pending Maintenance Issues*\n\nSelect an option:`, {
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
            
            // Show issues for selected bungalow (in real implementation, from Google Sheets)
            let issues = [];
            if (text === '🔵 Blue 8') {
              issues = [
                [{text: '🔧 Door lock broken'}],
                [{text: '⚡ Electrical outlet not working'}]
              ];
            } else if (text === '🟠 Orange 15') {
              issues = [
                [{text: '🚿 Shower head leaking'}],
                [{text: '🧹 Deep cleaning needed'}]
              ];
            } else if (text === '🤎 Brown 3') {
              issues = [
                [{text: '🔧 Window won\'t close'}],
                [{text: '🚪 Squeaky door'}]
              ];
            } else if (text === '🟡 Yellow 21') {
              issues = [
                [{text: '🔥 BBQ gas connection issue'}]
              ];
            }
            
            issues.push([{text: '🔙 Back to bungalows'}]);
            
            bot.sendMessage(chatId, `🔧 What did you repair in ${text}?`, {
              reply_markup: {
                keyboard: issues,
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          }
          
          // NEW: Repair issue selection
          else if (session.step === 'repair_issue') {
            if (text === '🔙 Back to bungalows') {
              session.step = 'repair_bungalow';
              
              const keyboard = [
                [{text: '🔵 Blue 8'}],
                [{text: '🟠 Orange 15'}],
                [{text: '🤎 Brown 3'}],
                [{text: '🟡 Yellow 21'}],
                [{text: '🔙 Back'}]
              ];
              
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
          
          // NEW: Repair confirmation
          else if (session.step === 'repair_confirm') {
            if (text === '✅ Confirm Repaired') {
              // In real implementation, this would:
              // 1. Mark issue as "repaired" in Google Sheets
              // 2. Remove from pending repairs list
              // 3. Add to maintenance log with completion details
              
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
              
              bot.sendMessage(chatId, `✅ *Repair Completed Successfully!*\n\n🏠 Bungalow: ${session.selectedBungalow}\n🔧 Issue: ${session.repairedIssue}\n\n✨ This issue has been removed from pending repairs and added to maintenance log.\n\n/menu to return`, {
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
              let issues = [];
              if (session.selectedBungalow === '🔵 Blue 8') {
                issues = [
                  [{text: '🔧 Door lock broken'}],
                  [{text: '⚡ Electrical outlet not working'}]
                ];
              } else if (session.selectedBungalow === '🟠 Orange 15') {
                issues = [
                  [{text: '🚿 Shower head leaking'}],
                  [{text: '🧹 Deep cleaning needed'}]
                ];
              } else if (session.selectedBungalow === '🤎 Brown 3') {
                issues = [
                  [{text: '🔧 Window won\'t close'}],
                  [{text: '🚪 Squeaky door'}]
                ];
              } else if (session.selectedBungalow === '🟡 Yellow 21') {
                issues = [
                  [{text: '🔥 BBQ gas connection issue'}]
                ];
              }
              
              issues.push([{text: '🔙 Back to bungalows'}]);
              
              bot.sendMessage(chatId, `🔧 What did you repair in ${session.selectedBungalow}?`, {
                reply_markup: {
                  keyboard: issues,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
            else if (text === '❌ Cancel') {
              session.step = 'pending_repairs_list';
              
              bot.sendMessage(chatId, `🔧 *Pending Maintenance Issues*\n\nSelect an option:`, {
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
          
          // NEW: Repair note
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
