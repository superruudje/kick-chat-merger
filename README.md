# Kick Chat Extension

This browser extension injects **Kick.com** live chat into the Twitch chat, enabling you to view and interact with Kick chat in real time alongside other content.

## Features

- Connects to a specific Kick channel’s chatroom
- Live chat rendering using Pusher
- Lightweight popup configuration
- Persistent channel setting via Chrome Sync storage

## Installation (Development)

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourname/kick-chat-extension.git
   cd kick-chat-extension
   ```

2. **Install dependencies** (if any build tools are used):

   ```bash
   npm install
   ```

3. **Load the extension into Chrome/Edge/Brave**:

   - Open `chrome://extensions/`
   - Enable **Developer Mode**
   - Click **Load unpacked**
   - Select the root directory of this repository

## Usage

1. Click the extension icon in the browser toolbar to open the popup.
2. Enter the **Kick channel name** and click **Save**.
3. The chatroom ID is resolved automatically via the Kick API and stored.
4. The chat is injected into the active tab without needing a manual page reload.

> Note: You must be on a Twitch live stream for the chat to be injected.

## How it Works

- The extension fetches the `chatroomId` for the given Kick channel name.
- It subscribes to Kick’s Pusher channel: `chatrooms.{id}.v2`.
- Messages are rendered into a designated chat container on the page (e.g. Twitch/YouTube chat area).

## Development Notes

- Chat injection logic is in the content script and uses a dynamically invoked function.
- Communication between popup and content script is done via `chrome.runtime.sendMessage`.
- Kick API endpoint used:
  ```
  https://kick.com/api/v1/channels/{channelName}
  ```

## Troubleshooting

- If chat doesn’t appear immediately after saving, ensure the page supports injection and is active.
- Check the browser console (`F12`) for errors related to Pusher connection or DOM selectors.

## License

MIT © Rudi Haamke
