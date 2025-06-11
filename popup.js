const input = document.getElementById("channelId");
const status = document.getElementById("status");
const saveBtn = document.getElementById("saveBtn");

// Load saved channel ID on popup open
chrome.storage.sync.get("kickChannelId", ({ kickChannelId }) => {
    if (kickChannelId) {
        input.value = kickChannelId;
    }
});

saveBtn.onclick = () => {
    const val = input.value.trim();
    if (val) {
        chrome.storage.sync.set({ kickChannelId: val }, () => {
            status.textContent = "Saved!";
            setTimeout(() => (status.textContent = ""), 1500);
        });
    } else {
        status.textContent = "Please enter a valid channel ID.";
    }
};