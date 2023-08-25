## 1. Goal

The project goal - is to create a Telegram API implementation, which will login as a normal account, join a specific group, get all participants, message all participants a specific message. For that purpose another Telegram Bot will be made for orchestrating everything. further I will call it **System**.

## 2. System details

The system consists of the following functional blocks:
	1. Orchestrator Bot functionality.
	2. Telegram API functionality.

### 2.1 Ochestrator Bot functionality

Set new task on parsing specific group. 

```properties
TelegramBot > /run [group-id] [invite-link]
	-- [group-id] - id of a group you want to parse
	-- [invite-link] (optional) - invite link if you want automated user to
								  join on it's own

	ex.: /run 123456789 https://t.me/+asdf
```

Add new automated user.

```properties
TelegramBot > /new 
# Bot will proceed to guide you on logging in into another account.
```

Remove automated user

```properties
TelegramBot > /remove [user-phone-number]
	-- [user-phone-number] - phone number the user was saved with.
```

### 2.2 Telegram API functionality

Script will log in into given account, saving string session in the process. For automation will be used Gram JS.

JS:

```javascript
const { Api, TelegramClient } = require('telegram');

const client = new TelegramClient(
	stringSession,
	apiId,
	apiHash,
	{ connectionRetries: 5}
);
```
