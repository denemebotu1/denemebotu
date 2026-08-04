const TelegramBot = require("node-telegram-bot-api");
const { Pool } = require("pg");

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 8290342310;

const bot = new TelegramBot(TOKEN, {
    polling: true
});


// PostgreSQL bağlantısı
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});


// Tablo oluşturma
db.query(`
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    username TEXT,
    first_name TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    bonus_click INTEGER DEFAULT 0
)
`).then(() => {
    console.log("Database hazır");
}).catch(err => {
    console.log(err);
});



// Kanal ve grup
const CHANNEL = "@bonusheroduyuru";
const GROUP = "@bonusherochat";



// Menü
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




// Kullanıcı kayıt
async function saveUser(msg) {

    const user = msg.from;

    await db.query(
        `
        INSERT INTO users 
        (telegram_id, username, first_name)
        VALUES ($1,$2,$3)
        ON CONFLICT (telegram_id) DO NOTHING
        `,
        [
            user.id,
            user.username || "",
            user.first_name || ""
        ]
    );

}




// START
bot.onText(/\/start/, async (msg) => {


    await saveUser(msg);


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





// ADMIN PANEL
bot.onText(/\/admin/, async (msg)=>{


    if(msg.from.id !== ADMIN_ID){
        return;
    }


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


});







// BUTONLAR

bot.on("callback_query", async(query)=>{


const chatId = query.message.chat.id;



// Üyelik kontrol

if(query.data==="kontrol"){


try{


const channelMember = await bot.getChatMember(
CHANNEL,
chatId
);


const groupMember = await bot.getChatMember(
GROUP,
chatId
);



const validStatus=[
"member",
"administrator",
"creator"
];


if(
validStatus.includes(channelMember.status)
&&
validStatus.includes(groupMember.status)
){


bot.sendMessage(
chatId,
"✅ Üyeliğiniz onaylandı\n\n🎁 Deneme bonusunu almak için aşağıdaki butona basabilirsiniz.",
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


}else{


bot.sendMessage(
chatId,
"❌ Henüz grup veya kanala katılımınız bulunamadı."
);


}



}catch(error){

console.log(error);

}



}




// Bonus

if(query.data==="bonus"){



await db.query(
`
UPDATE users
SET bonus_click = bonus_click + 1
WHERE telegram_id=$1
`,
[chatId]
);



bot.sendMessage(
chatId,
"🎁 BİLLİONBAHİS 500 TL DENEME BONUSU\n\n⚠️ Deneme bonusunu almak için aşağıdaki link üzerinden üyeliğinizi oluşturmanız gerekmektedir.",
{
reply_markup:{
inline_keyboard:[
[
{
text:"BİLLİONBAHİS 500 TL DENEME BONUSU",
url:"https://tinyurl.com/BonusHeroAff"
}
]
]
}
}
);


}



});



console.log("Bot çalışıyor...");
