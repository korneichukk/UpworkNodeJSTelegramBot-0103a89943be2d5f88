'user strict';
const { Api, TelegramClient } = require('telegram');
const StringSession = require('telegram/sessions').StringSession;
const input = require('input');
const { join } = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const apiId = parseInt(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const groupId = process.env.TELEGRAM_CHAT_ID;
const messageToSend = process.env.MESSAGE;
const groupInviteLink = process.env.TELEGRAM_GROUP_INVITE_LINK;

async function readSessionString() {
    try {
        await fs.access(__dirname + '/.string_session', fs.constants.F_OK);
        console.log('Session string file exists.');

        const data = await fs.readFile(__dirname + '/.string_session', 'utf8');
        console.log('Session string read.');

        return data;
    } catch (err) {
        console.error(err);
    }
};

async function writeSessionString(string) {
    fs.writeFile(__dirname + '/.string_session', string, function (err) {
        if (err) return console.log(err);
        console.log('Session string saved.');
    });
}

async function writeUsersData(users) {
    // console.log(users);
    // const userObj = Object.fromEntries(users);
    // console.log(userObj);


    const usersObjArray = users.map((user) => Object.fromEntries(user));
    console.log(usersObjArray);
    const usersJSON = JSON.stringify(usersObjArray, null, 2);
    fs.writeFile(__dirname + `/users-${groupId}.json`, usersJSON, function (err) {
        if (err) return console.log(err);
        console.log('Users data saved.');
    });

}

async function parseGroupForUsers(client) {
    const result = await client.invoke(
        new Api.messages.GetFullChat({
            chatId: groupId,
        }),
    );
    return result;
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

async function cleanUsersData(users) {
    let users_to_message = [];

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        if (user.get('bot') || user.get('self')) {
            continue;
        }
        users_to_message.push(user);
    }

    return users_to_message;
}

async function sendMessage(client, userID) {
    client.sendMessage(
        userID,
        {
            message: messageToSend
        }
    ).catch((err) => {
        console.log(err);
    });
}

async function joinGroup(client) {
    if (!groupInviteLink) {
        console.error('No group invite link provided.');
        return;
    }
    const groupInviteCode = groupInviteLink.replace("+", "").split("/").slice(-1)[0];
    console.log(groupInviteCode);
    await client.invoke(
        new Api.messages.ImportChatInvite({
            hash: groupInviteCode,
        })
    );
}

(async () => {
    try {
        const string_session = await readSessionString();
        const stringSession = new StringSession(string_session);
        const client = new TelegramClient(
            stringSession,
            apiId,
            apiHash,
            { connectionRetries: 5 }
        );

        await client.start({
            phoneNumber: async () => await input.text('Please enter your phone: '),
            password: async () => await input.text('Please enter your password: '),
            phoneCode: async () => await input.text('Please enter the code you received: '),
        });

        if (!string_session) {
            await writeSessionString(client.session.save());
        }

        await client.connect();
        // try {
        //     await joinGoup(client);
        // } catch (err) {
        //     console.error(err);
        // }
        if (groupInviteLink) {
            try {
                joinGroup(client);
            } catch (err) {
                console.error(err);
            }
        }

        data = await parseGroupForUsers(client);
        users = await parseDataForUsers(data);
        users_cleaned = await cleanUsersData(users);
        // console.log(users_cleaned);
        await writeUsersData(users_cleaned);

        users_cleaned.forEach(function (user) {
            sendMessage(client, user.get('id').value);
        });
    } catch (err) {
        console.error(err);
    }


})();