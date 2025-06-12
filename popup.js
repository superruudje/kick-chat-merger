const input = document.getElementById("channelName");
const status = document.getElementById("status");
const saveBtn = document.getElementById("saveBtn");

// Load saved channel name (optional, just for UX)
chrome.storage.sync.get("kickChannelName", ({ kickChannelName }) => {
    if (kickChannelName) {
        input.value = kickChannelName;
    }
});

saveBtn.onclick = async () => {
    const channelName = input.value.trim().toLowerCase();

    if (!channelName) {
        status.textContent = "Please enter a channel name.";
        return;
    }

    try {
        const res = await fetch(`https://kick.com/api/v1/channels/${channelName}`);
        if (!res.ok) throw new Error("Channel not found");
        const data = await res.json();

        const chatroomId = data.chatroom.id;

        chrome.storage.sync.set({
            kickChannelName: channelName,
            kickChatroomId: chatroomId
        }, () => {
            status.textContent = "Saved!";
            setTimeout(() => (status.textContent = ""), 1500);

            // 🔁 Notify content script to reinitialize
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: "reloadKickChat" });
                }
            });
        });
    } catch (e) {
        console.error(e);
        status.textContent = "Invalid channel name or network error.";
    }
};