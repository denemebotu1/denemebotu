const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.BOT_TOKEN;

const bot = new TelegramBot(TOKEN, {
    polling: true
});


// Kanal ve grup
const CHANNEL = "@bonusheroduyuru";
const GROUP = "@bonusherochat";


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



// Butonlar
bot.on("callback_query", async (query) => {

    const chatId = query.message.chat.id;


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
                    "✅ Üyeliğiniz onaylandı\n\n🎁 Deneme bonuslarını görmek için aşağıdaki butona basabilirsiniz.",
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



    if (query.data === "bonus") {


        bot.sendMessage(
            chatId,
            "🎁 Güncel Deneme Bonusu\n\n🏆 Site: Yakında eklenecek\n\n🎫 Kod: Yakında eklenecek"
        );


    }


});


console.log("Bot çalışıyor...");
