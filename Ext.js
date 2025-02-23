// manifest.json
{
  "manifest_version": 3,
  "name": "Auto Refresh Extension",
  "version": "1.0",
  "description": "Refreshes the current tab at chosen intervals.",
  "permissions": ["tabs", "scripting", "storage"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png"
  },
  "background": {
    "service_worker": "background.js"
  },
  "icons": {
    "16": "icon.png",
    "48": "icon.png",
    "128": "icon.png"
  }
}

// popup.html
<!DOCTYPE html>
<html>
<head>
  <title>Auto Refresh</title>
  <script src="popup.js" defer></script>
</head>
<body>
  <h3>Choose Refresh Interval</h3>
  <input type="radio" id="five" name="interval" value="5000" checked>
  <label for="five">5 seconds</label><br>
  <input type="radio" id="fifteen" name="interval" value="15000">
  <label for="fifteen">15 seconds</label><br>
  <button id="start">Start</button>
  <button id="stop">Stop</button>
</body>
</html>

// popup.js
document.getElementById("start").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let interval = document.querySelector('input[name="interval"]:checked').value;
  chrome.storage.local.set({ refreshTab: tab.id, refreshInterval: parseInt(interval) });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: startRefreshing,
    args: [parseInt(interval)]
  });
});

document.getElementById("stop").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.storage.local.remove("refreshTab");
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
