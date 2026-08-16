const TelegramBot = require("node-telegram-bot-api");
const { Pool } = require("pg");

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 8290342310;

const bot = new TelegramBot(TOKEN, {
    polling: true
});


// ==========================================
// POSTGRESQL BAĞLANTISI
// ==========================================

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});


// ==========================================
// USERS TABLOSU
// ==========================================

db.query(`
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    username TEXT,
    first_name TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    bonus_click INTEGER DEFAULT 0
)
`)
.then(() => {
    console.log("Database hazır");
})
.catch(err => {
    console.log("Database hatası:", err);
});


// ==========================================
// KANAL VE GRUP
// ==========================================

const CHANNEL = "@bonusheroduyuru";
const GROUP = "@bonusherochat";


// ==========================================
// BOT MENÜSÜ
// ==========================================

bot.setMyCommands([
    {
        command: "start",
        description: "Botu başlat"
    },
    {
        command: "admin",
        description: "Admin panel"
    }
]);


// ==========================================
// KULLANICI KAYIT
// ==========================================

async function saveUser(msg) {

    const user = msg.from;

    try {

        await db.query(
            `
            INSERT INTO users
            (telegram_id, username, first_name)
            VALUES ($1, $2, $3)
            ON CONFLICT (telegram_id)
            DO UPDATE SET
                username = EXCLUDED.username,
                first_name = EXCLUDED.first_name
            `,
            [
                user.id,
                user.username || "",
                user.first_name || ""
            ]
        );

    } catch (error) {

        console.log("Kullanıcı kayıt hatası:", error);

    }

}


// ==========================================
// START
// ==========================================

bot.onText(/\/start/, async (msg) => {

    await saveUser(msg);

    const chatId = msg.chat.id;

    bot.sendMessage(
        chatId,
        "👋 Hoş geldin\n\n" +
        "🎁 Deneme bonuslarını görebilmek için aşağıdaki grup ve kanala katılmanız gerekmektedir.\n\n" +
        "Katılım yaptıktan sonra ✅ Kontrol Et butonuna basınız.",
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


// ==========================================
// ADMIN PANEL
// ==========================================

bot.onText(/\/admin/, async (msg) => {

    if (msg.from.id !== ADMIN_ID) {
        return;
    }

    try {

        const users = await db.query(
            "SELECT COUNT(*) FROM users"
        );

        const today = await db.query(
            `
            SELECT COUNT(*)
            FROM users
            WHERE created_at::date = CURRENT_DATE
            `
        );

        const bonus = await db.query(
            `
            SELECT SUM(bonus_click)
            FROM users
            `
        );

        bot.sendMessage(
            msg.chat.id,

            `
👑 BONUS HERO ADMİN

👥 Toplam Kullanıcı:
${users.rows[0].count}

📅 Bugün Gelen:
${today.rows[0].count}

🎁 Bonus Tıklama:
${bonus.rows[0].sum || 0}
`
        );

    } catch (error) {

        console.log("Admin panel hatası:", error);

    }

});


// ==========================================
// ADMİN DUYURU SİSTEMİ
// ==========================================
//
// Admin bota normal mesaj gönderirse
// mesaj bütün kayıtlı kullanıcılara gider.
//
// Örnek:
//
// Admin -> Bot:
// "🔥 Yeni bonus geldi!"
//
// Bot -> Tüm kullanıcılar:
// "🔥 Yeni bonus geldi!"
//
// ==========================================

bot.on("message", async (msg) => {

    // Admin değilse hiçbir şey yapma
    if (msg.from.id !== ADMIN_ID) {
        return;
    }

    // Komutları duyuru olarak gönderme
    if (msg.text && msg.text.startsWith("/")) {
        return;
    }

    // Sadece yazı mesajlarını şimdilik gönder
    if (!msg.text) {
        return;
    }

    try {

        console.log("Admin duyuru gönderiyor...");

        // Tüm kayıtlı kullanıcıları getir
        // Admin hesabını hariç tut
        const users = await db.query(
            `
            SELECT telegram_id
            FROM users
            WHERE telegram_id != $1
            `,
            [ADMIN_ID]
        );

        let basarili = 0;
        let basarisiz = 0;

        // Her kullanıcıya gönder
        for (const user of users.rows) {

            try {

                await bot.sendMessage(
                    user.telegram_id,
                    msg.text
                );

                basarili++;

                // Telegram API'ye çok hızlı yüklenmemesi için
                await new Promise(resolve =>
                    setTimeout(resolve, 100)
                );

            } catch (error) {

                basarisiz++;

                console.log(
                    `Mesaj gönderilemedi: ${user.telegram_id}`,
                    error.message
                );

            }

        }

        // Admin'e sonuç gönder
        await bot.sendMessage(
            ADMIN_ID,

            `
📢 DUYURU GÖNDERİLDİ

👥 Toplam:
${users.rows.length}

✅ Başarılı:
${basarili}

❌ Başarısız:
${basarisiz}
`
        );

    } catch (error) {

        console.log("Duyuru hatası:", error);

        await bot.sendMessage(
            ADMIN_ID,
            "❌ Duyuru gönderilirken hata oluştu."
        );

    }

});


// ==========================================
// BUTONLAR
// ==========================================

bot.on("callback_query", async (query) => {

    const chatId = query.message.chat.id;


    // ======================================
    // ÜYELİK KONTROL
    // ======================================

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


            if (
                validStatus.includes(channelMember.status) &&
                validStatus.includes(groupMember.status)
            ) {

                bot.sendMessage(
                    chatId,

                    "✅ Üyeliğiniz onaylandı\n\n" +
                    "🎁 Deneme bonusunu almak için aşağıdaki butona basabilirsiniz.",

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
                    "❌ Henüz grup veya kanala katılımınız bulunamadı."
                );

            }

        } catch (error) {

            console.log("Üyelik kontrol hatası:", error);

            bot.sendMessage(
                chatId,
                "❌ Üyelik kontrolü sırasında bir hata oluştu."
            );

        }

    }


    // ======================================
    // BONUS
    // ======================================

    if (query.data === "bonus") {

        try {

            await db.query(
                `
                UPDATE users
                SET bonus_click = bonus_click + 1
                WHERE telegram_id = $1
                `,
                [chatId]
            );


            bot.sendMessage(
                chatId,

                "🎁 BİLLİONBAHİS 500 TL DENEME BONUSU\n\n" +
                "⚠️ Deneme bonusunu almak için aşağıdaki link üzerinden üyeliğinizi oluşturmanız gerekmektedir.",

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

        } catch (error) {

            console.log("Bonus hatası:", error);

        }

    }

});


// ==========================================
// BOT BAŞLADI
// ==========================================

console.log("Bot çalışıyor...");
