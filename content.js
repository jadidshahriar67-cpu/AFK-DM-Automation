function findComposer() {
  const candidates = [...document.querySelectorAll('div[contenteditable="true"], textarea')]
    .filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });

  const scored = candidates.map(el => {
    const label = [
      el.getAttribute("aria-label") || "",
      el.getAttribute("placeholder") || "",
      el.getAttribute("data-placeholder") || "",
      el.getAttribute("role") || ""
    ].join(" ").toLowerCase();
    let score = 0;
    if (label.includes("message")) score += 10;
    if (label.includes("chat")) score += 3;
    if (el.getAttribute("contenteditable") === "true") score += 2;
    return { el, score };
  }).sort((a, b) => b.score - a.score);

  return scored[0]?.el || null;
}

function replaceComposer(el, value) {
  el.focus();
  if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand("delete", false);
  document.execCommand("insertText", false, value);
  el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "REPLACE_COMPOSER") return;
  try {
    const composer = findComposer();
    if (!composer) throw new Error("Instagram message box পাওয়া যায়নি। Chat refresh করে আবার চেষ্টা করো।");
    replaceComposer(composer, String(message.text || ""));
    sendResponse({ ok: true });
  } catch (err) {
    sendResponse({ ok: false, error: err.message || "Draft update failed" });
  }
  return true;
});
