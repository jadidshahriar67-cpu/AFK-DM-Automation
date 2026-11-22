const textEl = document.getElementById("customText");
const previewEl = document.getElementById("previewText");
const percentEl = document.getElementById("percent");
const progressLabel = document.getElementById("progressLabel");
const progressBar = document.getElementById("progressBar");
const statusEl = document.getElementById("status");

function preview(next = 1) {
  const text = textEl.value.trim() || "Your message";
  previewEl.textContent = `${text} ${next}%`;
  percentEl.textContent = `${next}%`;
}

function render(state) {
  const current = Number(state.current || 0);
  progressLabel.textContent = `${current}%`;
  progressBar.style.width = `${current}%`;
  statusEl.textContent = state.status || "Ready";
  preview(current >= 100 ? 100 : current + 1);
}

async function send(type, extra = {}) {
  const response = await chrome.runtime.sendMessage({ type, ...extra });
  if (!response?.ok) {
    statusEl.textContent = response?.error || "Something went wrong";
    return;
  }
  render(response.state);
}

document.getElementById("save").addEventListener("click", () => send("SAVE_TEXT", { customText: textEl.value }));
document.getElementById("start").addEventListener("click", () => send("START", { customText: textEl.value }));
document.getElementById("pause").addEventListener("click", () => send("PAUSE"));
document.getElementById("reset").addEventListener("click", () => send("RESET"));
textEl.addEventListener("input", () => preview());

(async () => {
  const response = await chrome.runtime.sendMessage({ type: "GET_STATE" });
  if (response?.ok) {
    textEl.value = response.state.customText || "";
    render(response.state);
  }
})();
