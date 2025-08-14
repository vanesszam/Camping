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
