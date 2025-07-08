// Wrap everything to avoid polluting the global scope
(() => {
    // Wait for Pusher to be loaded in the content script context
    if (!window.Pusher) {
        console.error("Pusher library not loaded.");
        return;
    }

    let currentChannel = null;
    let pusher = null;

    /**
     * Initializes the kick chat functionality by setting up a Pusher connection
     * and subscribing to the specified chatroom channel to handle incoming chat events.
     *
     * @param {string} chatroomId - The ID of the chatroom to connect to and receive messages from.
     * @return {void} This function does not return a value.
     */
    function initKickChat(chatroomId) {
        if (pusher) {
            if (currentChannel) pusher.unsubscribe(currentChannel);
            pusher.disconnect();
        }

        pusher = new Pusher("32cbd69e4b950bf97679", {
            cluster: "us2",
            wsHost: "ws-us2.pusher.com",
            wsPort: 443,
            wssPort: 443,
            forceTLS: true,
            enabledTransports: ["ws"],
        });

        currentChannel = `chatrooms.${chatroomId}.v2`;
        const channel = pusher.subscribe(currentChannel);

        channel.bind("App\\Events\\ChatMessageEvent", (event) => {
            try {
                const chatWrapper = document.querySelector('[data-a-target="chat-scroller"]')
                if (!chatWrapper) return;

                const scrollContent = chatWrapper.querySelector('.simplebar-scroll-content');
                const chatContainer = chatWrapper.querySelector('[data-test-selector="chat-scrollable-area__message-container"]');

                const isNearBottom = scrollContent.scrollHeight - scrollContent.scrollTop - scrollContent.clientHeight < 50;

                const messageEl = createKickChatMessageElement(event);
                chatContainer.appendChild(messageEl);

                if (isNearBottom) {
                    scrollContent.scrollTo({
                        top: scrollContent.scrollHeight,
                        behavior: 'smooth'
                    });
                }

            } catch (err) {
                console.error("Failed to parse Kick chat message event:", err);
            }
        });

        pusher.connection.bind("error", (err) => console.error("Pusher error:", err));
        pusher.connection.bind("disconnected", () => console.warn("Pusher disconnected"));
    }

    chrome.storage.sync.get("kickChatroomId", ({ kickChatroomId }) => {
        const id = kickChatroomId || "13808";
        initKickChat(id);
    });

    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === "reloadKickChat") {
            chrome.storage.sync.get("kickChatroomId", ({ kickChatroomId }) => {
                if (kickChatroomId) {
                    initKickChat(kickChatroomId);
                }
            });
        }
    });
})();

/**
 * Creates a chat message element for display in a Kick chat interface.
 *
 * @param {Object} messageData - The data object representing the message details.
 * @param {Object} messageData.sender - The sender's information.
 * @param {string} messageData.sender.username - The username of the sender.
 * @param {Object} [messageData.sender.identity] - The sender's identity details.
 * @param {string} [messageData.sender.identity.color] - The color associated with the sender's username.
 * @param {string} messageData.content - The text content of the message.
 * @return {HTMLElement} The constructed DOM element representing the chat message.
 */
function createKickChatMessageElement(messageData) {
    const username = messageData.sender.username;
    const color = messageData.sender.identity?.color || "#FFFFFF";
    const messageText = messageData.content;

    // Outer wrapper
    const outerLayout = document.createElement("div");
    outerLayout.className = "Layout-sc-1xcs6mc-0";

    // Main message container
    const messageEl = document.createElement("div");
    messageEl.className = "chat-line__message";
    messageEl.setAttribute("data-a-target", "chat-line-message");
    messageEl.setAttribute("data-a-user", username);
    messageEl.setAttribute("tabindex", "0");

    // Left side layout
    const layoutLeft = document.createElement("div");
    layoutLeft.className = "Layout-sc-1xcs6mc-0 AoXTY";

    const highlight = document.createElement("div");
    highlight.className = "Layout-sc-1xcs6mc-0 haALyh chat-line__message-highlight";

    const container = document.createElement("div");
    container.className = "Layout-sc-1xcs6mc-0 AoXTY chat-line__message-container";

    const subContainer = document.createElement("div");
    subContainer.className = "Layout-sc-1xcs6mc-0";

    const messageInner = document.createElement("div");
    messageInner.className = "Layout-sc-1xcs6mc-0 fHdBNk chat-line__no-background";

    const contentLayout = document.createElement("div");
    contentLayout.className = "Layout-sc-1xcs6mc-0 dtoOxd";

    // Username container
    const usernameContainer = document.createElement("div");
    usernameContainer.className = "Layout-sc-1xcs6mc-0 nnbce chat-line__username-container chat-line__username-container--hoverable";

    // BADGE SPAN
    const badgeWrapper = document.createElement("span");
    const badgeLayout = document.createElement("div");
    badgeLayout.className = "InjectLayout-sc-1i43xsx-0 dvtAVE";
    const badgeBtn = document.createElement("button");
    badgeBtn.setAttribute("data-a-target", "chat-badge");

    const badgeImg = document.createElement("img");
    badgeImg.alt = "Kick badge";
    badgeImg.ariaLabel = "Kick badge";
    badgeImg.className = "chat-badge";
    badgeImg.src = chrome.runtime.getURL("kick_logo.jpg");
    badgeImg.tabIndex = 0;

    badgeBtn.appendChild(badgeImg);
    badgeLayout.appendChild(badgeBtn);
    badgeWrapper.appendChild(badgeLayout);

    // USERNAME
    const usernameSpan = document.createElement("span");
    usernameSpan.className = "chat-line__username";
    usernameSpan.setAttribute("role", "button");
    usernameSpan.setAttribute("tabindex", "0");

    const usernameInnerSpan = document.createElement("span");
    const usernameDisplay = document.createElement("span");
    usernameDisplay.className = "chat-author__display-name";
    usernameDisplay.setAttribute("data-a-target", "chat-message-username");
    usernameDisplay.setAttribute("data-a-user", username);
    usernameDisplay.setAttribute("data-test-selector", "message-username");
    usernameDisplay.style.color = color;
    usernameDisplay.textContent = username;

    usernameInnerSpan.appendChild(usernameDisplay);
    usernameSpan.appendChild(usernameInnerSpan);

    // : separator
    const separator = document.createElement("span");
    separator.setAttribute("aria-hidden", "true");
    separator.textContent = ": ";

    // MESSAGE BODY
    const bodySpan = document.createElement("span");
    bodySpan.setAttribute("data-a-target", "chat-line-message-body");
    bodySpan.setAttribute("dir", "auto");

    // Parse content into elements (text + emotes)
    const parsedElements = parseKickMessage(messageText);
    parsedElements.forEach((node) => bodySpan.appendChild(node));

    // Nest everything
    usernameContainer.appendChild(badgeWrapper); // badge first
    usernameContainer.appendChild(usernameSpan);

    contentLayout.appendChild(usernameContainer);
    contentLayout.appendChild(separator);
    contentLayout.appendChild(bodySpan);

    messageInner.appendChild(contentLayout);
    subContainer.appendChild(messageInner);
    container.appendChild(subContainer);
    layoutLeft.appendChild(highlight);
    layoutLeft.appendChild(container);

    messageEl.appendChild(layoutLeft);
    outerLayout.appendChild(messageEl);

    return outerLayout;
}

/**
 * Parses a message string containing emote placeholders and converts them into text nodes and image elements.
 *
 * @param {string} content - The message content to be parsed. It may contain emote placeholders in the format `[emote:id:name]`.
 * @return {Array.<Node>} An array of DOM nodes, including text nodes and image elements, representing the parsed message content.
 */
function parseKickMessage(content) {
    const parts = [];
    const regex = /\[emote:(\d+):([^\]]+)\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const [full, emoteId, emoteName] = match;

        if (match.index > lastIndex) {
            parts.push(document.createTextNode(content.slice(lastIndex, match.index)));
        }

        const img = document.createElement("img");
        img.src = `https://files.kick.com/emotes/${emoteId}/fullsize`;
        img.alt = emoteName;
        img.className = "kick-emote";
        img.style.height = "28px";
        img.style.verticalAlign = "middle";
        parts.push(img);

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
        parts.push(document.createTextNode(content.slice(lastIndex)));
    }

    return parts;
}