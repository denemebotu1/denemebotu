const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.BOT_TOKEN;

const bot = new TelegramBot(TOKEN, {
    polling: true
});


bot.onText(/\/start/, (msg) => {

    const chatId = msg.chat.id;

    bot.sendMessage(chatId,
        "👋 Hoş geldin\n\nBotu kullanmak için kanalımıza katılman gerekiyor.",
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "📢 Kanala Katıl",
                            url: "https://t.me/kanaladi"
                        }
                    ],
                    [
                        {
                            text: "✅ Katıldım",
                            callback_data: "kontrol"
                        }
                    ]
                ]
            }
        }
    );

});


bot.on("callback_query", (query) => {

    const chatId = query.message.chat.id;


    if(query.data === "kontrol") {

        bot.sendMessage(chatId,
            "✅ Üyeliğin onaylandı",
            {
                reply_markup:{
                    inline_keyboard:[
                        [
                            {
                                text:"🎁 Deneme Bonusu",
                                callback_data:"bonus"
                            }
                        ]
                    ]
                }
            }
        );

    }


    if(query.data === "bonus") {

        bot.sendMessage(chatId,
`
🎁 Güncel Deneme Bonusu

🏆 Site:
Yakında eklenecek

🎫 Kod:
Yakında eklenecek

🔗 Link:
Yakında eklenecek
`
        );

    }

});


console.log("Bot çalışıyor...");
