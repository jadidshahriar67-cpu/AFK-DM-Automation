const ALARM_NAME = "birthday-dm-v4-tick";
const INTERVAL_MINUTES = 62 / 60;

const DEFAULTS = {
  running: false,
  current: 0,
  customText: "Pre Happy Birthday",
  lastInserted: "",
  status: "Ready"
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
    throw new Error("Instagram tab-এ গিয়ে একটি chat খুলে রাখো।");
  }
  return tab;
}

async function insertDraft(text, previousText) {
  const tab = await activeInstagramTab();
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "INSERT_DRAFT",
      text,
      previousText: previousText || ""
    });
    if (!response?.ok) throw new Error(response?.error || "Draft বসানো যায়নি।");
    await chrome.storage.local.set({ lastInserted: text });
    await setStatus(`Draft inserted: ${text}`);
    return true;
  } catch (err) {
    throw new Error(err.message || "Instagram chat refresh করে আবার চেষ্টা করো।");
  }
}

async function stopAtEnd() {
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.storage.local.set({ running: false, current: 100, status: "Completed 100%" });
}

async function start(customText) {
  const text = String(customText ?? "").trim();
  if (!text) throw new Error("আগে নিজের message text লিখো।");

  await activeInstagramTab();
  await chrome.storage.local.set({
    running: true,
    current: 1,
    customText: text,
    lastInserted: "",
    status: "Running"
  });

  const first = `${text} 1%`;
  await insertDraft(first, "");
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: INTERVAL_MINUTES,
    periodInMinutes: INTERVAL_MINUTES
  });
  return await getState();
}

async function pause() {
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.storage.local.set({ running: false, status: "Paused" });
  return await getState();
}

async function reset() {
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.storage.local.set({
    running: false,
    current: 0,
    lastInserted: "",
    status: "Reset"
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
  const draft = `${state.customText} ${next}%`;
  try {
    await insertDraft(draft, state.lastInserted);
    await chrome.storage.local.set({ current: next });
    if (next >= 100) await stopAtEnd();
  } catch (err) {
    await chrome.alarms.clear(ALARM_NAME);
    await chrome.storage.local.set({ running: false, status: `Paused: ${err.message}` });
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
  await chrome.storage.local.set({ ...DEFAULTS, ...state });
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});
