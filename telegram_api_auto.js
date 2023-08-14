const { Api, TelegramClient } = require('telegram');
// const telegramBot = require('node-telegram-bot-api');
const StringSession = require('telegram/sessions').StringSession;
const input = require('input');
const fs = require('fs').promises;
require('dotenv').config();

const apiId = parseInt(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const groupId = process.env.TELEGRAM_CHAT_ID;
// const telegramBotToken = process.env.TELEGRAM_TOKEN;

// const bot = new telegramBot(telegramBotToken, { polling: true });

// async function sendMessageToUser(user, message) {
//     const recipient = user.get('id').value;
//     console.log(recipient);

//     await bot.getChat(recipient).then(() => {
//         bot.sendMessage(recipient, message);
//     });
// }

function saveSessionString(string) {
    fs.writeFile(__dirname + '/.string_session', string, function (err) {
        if (err) return console.log(err);
        console.log('Session string saved.');
    });
};

async function checkFileExistsAndRead() {
    try {
        await fs.access(__dirname + '/.string_session', fs.constants.F_OK);
        console.log('Session string file exists.');

        const data = await fs.readFile(__dirname + '/.string_session', 'utf8');
        console.log('Session string read.');

        return data;
    } catch (err) {
        console.error(err);
    }
}

async function run(client) {
    await client.connect();

    const result = await client.invoke(
        new Api.messages.GetFullChat({
            chatId: groupId,
        })
    );
    const users = parseDataForUsers(result);

    return users;
}

async function parseDataForUsers(result) {
    var users_processed = [];


    result.users.forEach(function (user) {
        const processed_user = new Map();
        processed_user.set('id', user.id);
        processed_user.set('first_name', user.firstName);
        processed_user.set('last_name', user.lastName);
        processed_user.set('username', user.username);
        processed_user.set('self', user.self);
        processed_user.set('phone', user.phone);
        processed_user.set('bot', user.botInfoVersion);

        users_processed.push(processed_user);
    });

    return users_processed;
}

async function processUsers(users) {
    var users_to_message = [];

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        if (user.get('bot') || user.get('self')) {
            continue;
        }
        users_to_message.push(user);
    }

    return users_to_message;
};

(async () => {
    try {
        const string_session = await checkFileExistsAndRead();
        const stringSession = new StringSession(string_session);
        const client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });

        await client.start({
            phoneNumber: async () => await input.text("Please enter your phone number: "),
            password: async () => await input.text("Please enter your password: "),
            phoneCode: async () => await input.text("Please enter the code you received: "),
        });

        if (!string_session) {
            saveSessionString(client.session.save());
        }

        const users = await processUsers(await run(client));

        console.log(users);

        users.forEach(function (user) {
            client.sendMessage(
                user.get('id').value,
                {
                    message:
                        'Hello, ' + user.get('first_name') + '!'
                }
            ).catch((err) => {
                console.log(err);
            });
        });

    } catch (error) {
        console.error('Error:', error);
    }
})();


