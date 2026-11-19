function findComposer() {
  const candidates = [
    ...document.querySelectorAll('div[contenteditable="true"], textarea')
  ].filter(el => {
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

function setNativeValue(el, value) {
  const setter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(el), "value"
  )?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function insertText(el, value, previousText) {
  if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
    const current = el.value || "";
    if (previousText && current.trim() !== previousText.trim()) {
      throw new Error("Composer-এ অন্য text আছে। সেটি বদলাইনি—নিজে clear করে আবার Start করো।");
    }
    if (!previousText && current.trim()) {
      throw new Error("Composer আগে থেকেই লেখা আছে। সেটি বদলাইনি—খালি composer ব্যবহার করো।");
    }
    setNativeValue(el, value);
    return;
  }

  const current = (el.innerText || el.textContent || "").trim();
  if (previousText && current !== previousText.trim()) {
    throw new Error("Composer-এ অন্য text আছে। সেটি বদলাইনি—নিজে clear করে আবার চেষ্টা করো।");
  }
  if (!previousText && current) {
    throw new Error("Composer আগে থেকেই লেখা আছে। সেটি বদলাইনি—খালি composer ব্যবহার করো।");
  }

  el.focus();
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
  if (message.type !== "INSERT_DRAFT") return;
  try {
    const composer = findComposer();
    if (!composer) throw new Error("Message box পাওয়া যায়নি। Instagram chat refresh করে আবার চেষ্টা করো।");
    insertText(composer, message.text, message.previousText || "");
    sendResponse({ ok: true });
  } catch (err) {
    sendResponse({ ok: false, error: err.message });
  }
  return true;
});
