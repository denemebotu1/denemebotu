const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.BOT_TOKEN;

const bot = new TelegramBot(TOKEN, {
    polling: true
});


// Kanal ve grup
const CHANNEL = "@bonusheroduyuru";
const GROUP = "@bonusherochat";


// Bot menüsü
bot.setMyCommands([
    {
        command: "start",
        description: "Botu başlat"
    }
]);


// /start
bot.onText(/\/start/, (msg) => {

    const chatId = msg.chat.id;

    bot.sendMessage(
        chatId,
        "👋 Hoş geldin\n\n🎁 Deneme bonuslarını görebilmek için aşağıdaki grup ve kanala katılmanız gerekmektedir.\n\nKatılım yaptıktan sonra ✅ Kontrol Et butonuna basınız.",
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "📢 Kanala Katıl",
                            url: "https://t.me/bonusheroduyuru"
                        }
                    ],
                    [
                        {
                            text: "👥 Gruba Katıl",
                            url: "https://t.me/bonusherochat"
                        }
                    ],
                    [
                        {
                            text: "✅ Kontrol Et",
                            callback_data: "kontrol"
                        }
                    ]
                ]
            }
        }
    );

});



// Buton kontrolleri
bot.on("callback_query", async (query) => {

    const chatId = query.message.chat.id;


    // Üyelik kontrolü
    if (query.data === "kontrol") {

        try {

            const channelMember = await bot.getChatMember(
                CHANNEL,
                chatId
            );


            const groupMember = await bot.getChatMember(
                GROUP,
                chatId
            );


            const validStatus = [
                "member",
                "administrator",
                "creator"
            ];


            const channelOk = validStatus.includes(channelMember.status);
            const groupOk = validStatus.includes(groupMember.status);



            if (channelOk && groupOk) {

                bot.sendMessage(
                    chatId,
                    "✅ Üyeliğiniz onaylandı\n\n🎁 Deneme bonusunu almak için aşağıdaki butona basabilirsiniz.",
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "🎁 Deneme Bonusu",
                                        callback_data: "bonus"
                                    }
                                ]
                            ]
                        }
                    }
                );


            } else {


                bot.sendMessage(
                    chatId,
                    "❌ Henüz grup veya kanala katılımınız bulunamadı.\n\nLütfen katıldıktan sonra tekrar kontrol ediniz."
                );

            }


        } catch (error) {

            console.log(error);

            bot.sendMessage(
                chatId,
                "⚠️ Kontrol sırasında hata oluştu. Lütfen tekrar deneyin."
            );

        }

    }



    // Deneme bonusu
    if (query.data === "bonus") {


        bot.sendMessage(
            chatId,
            "🎁 BİLLİONBAHİS 500 TL DENEME BONUSU\n\n⚠️ Deneme bonusunu almak için aşağıdaki link üzerinden üyeliğinizi oluşturmanız gerekmektedir.",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "BİLLİONBAHİS 500 TL DENEME BONUSU",
                                url: "https://tinyurl.com/BonusHeroAff"
                            }
                        ]
                    ]
                }
            }
        );


    }


});


console.log("Bot çalışıyor...");
