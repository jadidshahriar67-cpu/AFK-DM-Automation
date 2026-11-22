const ALARM_NAME = "afk-dm-v5-tick";
const INTERVAL_MINUTES = 50 / 60;

const DEFAULTS = {
  running: false,
  current: 0,
  customText: "Pre Happy Birthday",
  status: "Ready",
  targetTabId: null,
  targetUrl: "",
  originalZoom: null
};

async function getState() {
  return { ...DEFAULTS, ...(await chrome.storage.local.get(DEFAULTS)) };
}

async function setStatus(status) {
  await chrome.storage.local.set({ status });
}

async function activeInstagramTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.id || !tab.url?.startsWith("https://www.instagram.com/")) {
    throw new Error("Instagram tab-এ গিয়ে নির্দিষ্ট chat খুলে রাখো।");
  }
  return tab;
}

async function setZoom(tabId, factor) {
  try { await chrome.tabs.setZoom(tabId, factor); } catch (_) {}
}

async function restoreZoom(state = null) {
  const s = state || await getState();
  if (s.targetTabId != null && typeof s.originalZoom === "number") {
    await setZoom(s.targetTabId, s.originalZoom);
  }
  await chrome.storage.local.set({ originalZoom: null });
}

async function getTargetTab(state) {
  if (state.targetTabId == null) throw new Error("Target Instagram tab পাওয়া যায়নি। আবার Start করো।");
  const tab = await chrome.tabs.get(state.targetTabId).catch(() => null);
  const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || active?.id !== tab.id || tab.url !== state.targetUrl) {
    throw new Error("আগের Instagram chat/tab active নেই। নিরাপত্তার জন্য automation pause করা হয়েছে।");
  }
  if (!tab.url?.startsWith("https://www.instagram.com/")) {
    throw new Error("Target tab আর Instagram-এ নেই।");
  }
  return tab;
}

async function insertDraft(text, state) {
  const tab = await getTargetTab(state);
  const response = await chrome.tabs.sendMessage(tab.id, { type: "REPLACE_COMPOSER", text });
  if (!response?.ok) throw new Error(response?.error || "Draft বসানো যায়নি।");
  await setStatus(`Draft updated: ${text}`);
}

async function stopAtEnd() {
  await chrome.alarms.clear(ALARM_NAME);
  const state = await getState();
  await restoreZoom(state);
  await chrome.storage.local.set({ running: false, current: 100, status: "Completed 100%" });
}

async function start(customText) {
  const text = String(customText ?? "").trim();
  if (!text) throw new Error("আগে নিজের message text লিখো।");

  const tab = await activeInstagramTab();
  const originalZoom = await chrome.tabs.getZoom(tab.id);
  await chrome.tabs.setZoom(tab.id, 1.0);

  await chrome.storage.local.set({
    running: true,
    current: 1,
    customText: text,
    status: "Running · 50-second interval",
    targetTabId: tab.id,
    targetUrl: tab.url,
    originalZoom
  });

  const state = await getState();
  try {
    await insertDraft(`${text} 1%`, state);
  } catch (err) {
    await restoreZoom(state);
    await chrome.storage.local.set({ running: false, status: `Paused: ${err.message}` });
    throw err;
  }

  await chrome.alarms.clear(ALARM_NAME);
  await chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: INTERVAL_MINUTES,
    periodInMinutes: INTERVAL_MINUTES
  });
  return await getState();
}

async function pause() {
  await chrome.alarms.clear(ALARM_NAME);
  const state = await getState();
  await restoreZoom(state);
  await chrome.storage.local.set({ running: false, status: "Paused · Original zoom restored" });
  return await getState();
}

async function reset() {
  await chrome.alarms.clear(ALARM_NAME);
  const state = await getState();
  await restoreZoom(state);
  await chrome.storage.local.set({
    running: false,
    current: 0,
    targetTabId: null,
    targetUrl: "",
    status: "Reset · Original zoom restored"
  });
  return await getState();
}

chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name !== ALARM_NAME) return;
  const state = await getState();
  if (!state.running) {
    await chrome.alarms.clear(ALARM_NAME);
    return;
  }
  const next = Math.min(state.current + 1, 100);
  try {
    await insertDraft(`${state.customText} ${next}%`, state);
    await chrome.storage.local.set({ current: next });
    if (next >= 100) await stopAtEnd();
  } catch (err) {
    await chrome.alarms.clear(ALARM_NAME);
    await restoreZoom(state);
    await chrome.storage.local.set({ running: false, status: `Paused: ${err.message} · Original zoom restored` });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      let result;
      if (message.type === "START") result = await start(message.customText);
      else if (message.type === "PAUSE") result = await pause();
      else if (message.type === "RESET") result = await reset();
      else if (message.type === "SAVE_TEXT") {
        const text = String(message.customText ?? "").trim();
        if (!text) throw new Error("Text ফাঁকা রাখা যাবে না।");
        await chrome.storage.local.set({ customText: text, status: "Text saved" });
        result = await getState();
      } else if (message.type === "GET_STATE") result = await getState();
      else throw new Error("Unknown action");
      sendResponse({ ok: true, state: result });
    } catch (err) {
      await setStatus(err.message || "Something went wrong");
      sendResponse({ ok: false, error: err.message || "Something went wrong", state: await getState() });
    }
  })();
  return true;
});

chrome.runtime.onInstalled.addListener(async () => {
  const state = await getState();
  await chrome.storage.local.set({ ...DEFAULTS, ...state, running: false, status: "Ready · AFK DM Automation V5" });
  await chrome.alarms.clear(ALARM_NAME);
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

chrome.runtime.onStartup.addListener(async () => {
  const state = await getState();
  if (state.running) {
    await chrome.alarms.clear(ALARM_NAME);
    await restoreZoom(state);
    await chrome.storage.local.set({ running: false, status: "Paused after browser restart" });
  }
});
