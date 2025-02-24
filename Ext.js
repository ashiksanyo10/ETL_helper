// manifest.json
{
  "manifest_version": 3,
  "name": "Auto Refresh Extension",
  "version": "1.0",
  "description": "Refreshes the current tab at chosen intervals.",
  "permissions": ["tabs", "scripting", "storage"],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png"
  },
  "icons": {
    "16": "icon.png",
    "48": "icon.png",
    "128": "icon.png"
  }
}

// background.js
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ activeTab: null, refreshInterval: null });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.get(["activeTab"], (data) => {
    if (data.activeTab === tabId) {
      chrome.storage.local.set({ activeTab: null, refreshInterval: null });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "start") {
    chrome.storage.local.set({ activeTab: message.tabId, refreshInterval: message.interval });
  } else if (message.action === "stop") {
    chrome.storage.local.set({ activeTab: null, refreshInterval: null });
  }
});

// popup.html
<!DOCTYPE html>
<html>
<head>
  <title>Auto Refresh</title>
  <link rel="stylesheet" href="styles.css">
  <script src="popup.js" defer></script>
</head>
<body>
  <div class="container">
    <h3>Auto Refresh</h3>
    <p>Choose Refresh Interval</p>
    <div class="radio-group">
      <input type="radio" id="five" name="interval" value="5000" checked>
      <label for="five">5 seconds</label>
      <input type="radio" id="fifteen" name="interval" value="15000">
      <label for="fifteen">15 seconds</label>
    </div>
    <div class="button-group">
      <button id="start">Start</button>
      <button id="stop">Stop</button>
    </div>
  </div>
</body>
</html>

// styles.css
body {
  font-family: Arial, sans-serif;
  text-align: center;
  width: 200px;
  padding: 20px;
  background-color: #f4f4f4;
  border-radius: 10px;
}
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.radio-group {
  margin: 10px 0;
}
.button-group {
  display: flex;
  gap: 10px;
}
button {
  padding: 8px 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
#start {
  background-color: #28a745;
  color: white;
}
#stop {
  background-color: #dc3545;
  color: white;
}
button:hover {
  opacity: 0.8;
}

// popup.js
document.getElementById("start").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let interval = document.querySelector('input[name="interval"]:checked').value;
  chrome.storage.local.set({ refreshTab: tab.id, refreshInterval: parseInt(interval) });
  chrome.runtime.sendMessage({ action: "start", tabId: tab.id, interval: parseInt(interval) });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: startRefreshing,
    args: [parseInt(interval)]
  });
});

document.getElementById("stop").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.storage.local.remove("refreshTab");
  chrome.runtime.sendMessage({ action: "stop" });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: stopRefreshing
  });
});

function startRefreshing(interval) {
  if (window.refreshIntervalId) {
    clearInterval(window.refreshIntervalId);
  }
  window.refreshIntervalId = setInterval(() => {
    location.reload();
  }, interval);
}

function stopRefreshing() {
  if (window.refreshIntervalId) {
    clearInterval(window.refreshIntervalId);
    window.refreshIntervalId = null;
  }
}
