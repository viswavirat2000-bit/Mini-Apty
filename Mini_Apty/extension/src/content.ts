import { Walkthrough, WalkthroughStepTarget } from "./types";

console.log("Mini Apty content script loaded", { url: window.location.href });

interface PlaybackState {
  walkthrough: Walkthrough;
  stepIndex: number;
  lastExecutedStepIndex?: number;
  balloon?: HTMLElement;
  highlight?: HTMLElement;
}

const CAPTURE_CLASS = "mini-apty-capture-highlight";
let captureEnabled = false;
let playbackState: PlaybackState | null = null;
let currentCaptureOverlay: HTMLElement | null = null;
let captureCount = 0;

const CAPTURE_TEXT_INPUT_TYPES = new Set(["text", "search", "url", "tel", "email", "password", "number", "date", "datetime-local", "month", "time", "week"]);

function buildSelector(element: HTMLElement): string {
  if (element.id) return `#${CSS.escape(element.id)}`;
  const parts: string[] = [];
  let current: HTMLElement | null = element;
  while (current && current.tagName.toLowerCase() !== "html") {
    let selector = current.tagName.toLowerCase();
    if (current.className) {
      const classes = current.className.toString().trim().split(/\s+/).filter(Boolean);
      if (classes.length) selector += `.${classes.slice(0, 2).map(CSS.escape).join(".")}`;
    }
    parts.unshift(selector);
    current = current.parentElement;
  }
  return parts.join(">");
}

function collectTarget(target: Element): WalkthroughStepTarget {
  const attributes: Record<string, string> = {};
  for (const attr of Array.from(target.attributes || [])) {
    if (attr.name.startsWith("data-")) {
      attributes[attr.name] = attr.value;
    }
  }
  // capture common semantic attributes
  const ariaLabel = (target as HTMLElement).getAttribute("aria-label") || undefined;
  const nameAttr = (target as HTMLElement).getAttribute("name") || undefined;
  const titleAttr = (target as HTMLElement).getAttribute("title") || undefined;
  const altAttr = (target as HTMLElement).getAttribute("alt") || undefined;
  const hrefAttr = ((target as HTMLAnchorElement).href && target.tagName.toLowerCase() === "a") ? (target as HTMLAnchorElement).getAttribute("href") || undefined : undefined;
  // anchor/context heuristics: find associated <label> or nearby text
  let anchorText: string | undefined = undefined;
  try {
    if ((target as HTMLElement).id) {
      const lbl = document.querySelector(`label[for="${CSS.escape((target as HTMLElement).id)}"]`);
      if (lbl && lbl instanceof HTMLElement) anchorText = lbl.innerText?.trim() || undefined;
    }
    if (!anchorText) {
      // closest label ancestor
      const ancestorLabel = (target as HTMLElement).closest("label");
      if (ancestorLabel) anchorText = (ancestorLabel as HTMLElement).innerText?.trim() || undefined;
    }
    if (!anchorText) {
      // preceding sibling with text
      const prev = (target as HTMLElement).previousElementSibling as HTMLElement | null;
      if (prev && prev.innerText && prev.innerText.trim().length) anchorText = prev.innerText.trim().slice(0, 120);
    }
  } catch (e) {
    anchorText = undefined;
  }
  // context selector: selector for nearest parent with id or class (up to 3 levels)
  let contextSelector: string | undefined = undefined;
  try {
    let p = (target as HTMLElement).parentElement;
    const parts: string[] = [];
    let depth = 0;
    while (p && depth < 3) {
      if (p.id) {
        parts.unshift(`#${CSS.escape(p.id)}`);
        break;
      }
      let seg = p.tagName.toLowerCase();
      if (p.className) {
        const cls = p.className.toString().trim().split(/\s+/).filter(Boolean);
        if (cls.length) seg += `.${CSS.escape(cls[0])}`;
      }
      parts.unshift(seg);
      p = p.parentElement;
      depth += 1;
    }
    if (parts.length) contextSelector = parts.join(">");
  } catch (e) {
    contextSelector = undefined;
  }
  // path signature: simple chain of tag names up to body
  let pathSignature: string | undefined = undefined;
  try {
    const chain: string[] = [];
    let c: HTMLElement | null = target as HTMLElement;
    let limit = 0;
    while (c && limit < 8 && c.tagName.toLowerCase() !== 'html') {
      const idx = Array.from(c.parentElement ? Array.from(c.parentElement.children) : []).indexOf(c) + 1;
      chain.unshift(`${c.tagName.toLowerCase()}:nth-child(${idx})`);
      c = c.parentElement;
      limit += 1;
    }
    if (chain.length) pathSignature = chain.join('>');
  } catch (e) {
    pathSignature = undefined;
  }
  const value = (() => {
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
      return target.value || undefined;
    }
    return undefined;
  })();
  return {
    id: (target as HTMLElement).id || undefined,
    selector: buildSelector(target as HTMLElement),
    text: (target as HTMLElement).innerText?.trim().slice(0, 120) || undefined,
    value,
    role: target.getAttribute("role") || undefined,
    attributes: Object.keys(attributes).length ? attributes : undefined,
    ariaLabel,
    name: nameAttr,
    title: titleAttr,
    alt: altAttr,
    href: hrefAttr,
    anchorText,
    contextSelector,
    pathSignature,
  };
}

function clearCaptureHighlights() {
  document.querySelectorAll(`.${CAPTURE_CLASS}`).forEach((node) => {
    node.classList.remove(CAPTURE_CLASS);
  });
}

function createCaptureOverlay() {
  if (currentCaptureOverlay) return;
  const overlay = document.createElement("div");
  overlay.className = "mini-apty-capture-overlay";
  overlay.innerHTML = `
    <div class="mini-apty-capture-overlay-content">
      <span class="mini-apty-capture-message">Mini Apty capture active — click elements to add steps.</span>
      <button type="button" class="mini-apty-capture-close">Stop</button>
    </div>
  `;
  overlay.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  const button = overlay.querySelector(".mini-apty-capture-close");
  button?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    disableCapture();
  });
  document.body.appendChild(overlay);
  currentCaptureOverlay = overlay;
}

function removeCaptureOverlay() {
  if (!currentCaptureOverlay) return;
  currentCaptureOverlay.remove();
  currentCaptureOverlay = null;
}

function updateCaptureOverlayMessage() {
  if (!currentCaptureOverlay) return;
  const message = currentCaptureOverlay.querySelector(".mini-apty-capture-message") as HTMLElement | null;
  if (!message) return;
  message.textContent = `Mini Apty capture active — ${captureCount} step${captureCount === 1 ? "" : "s"} captured. Click elements to add more.`;
}

function persistPendingStep(stepTarget: WalkthroughStepTarget, trigger: "click" | "manual") {
  const key = "miniAptyPendingSteps";
  chrome.storage.local.get(key, (result) => {
    const pending = Array.isArray(result[key]) ? result[key] : [];
    const next = [...pending, { target: stepTarget, trigger }];
    chrome.storage.local.set({ [key]: next }, () => {
      chrome.runtime.sendMessage({ type: "PENDING_STEPS_UPDATED", steps: next });
    });
  });
}

function getCaptureElement(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null;
  const interactive = target.closest("button, a, input, select, textarea");
  return interactive || target;
}

function isValueCaptureElement(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  if (target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) {
    return true;
  }
  if (target instanceof HTMLInputElement) {
    return CAPTURE_TEXT_INPUT_TYPES.has(target.type);
  }
  return false;
}

function enableCapture() {
  if (captureEnabled) return;
  captureEnabled = true;
  captureCount = 0;
  chrome.storage.local.set({ miniAptyCaptureActive: true });
  document.body.style.cursor = "crosshair";
  document.addEventListener("click", handleCaptureClick, true);
  document.addEventListener("change", handleCaptureFieldChange, true);
  document.addEventListener("keydown", handleCaptureKeyDown, true);
  document.addEventListener("submit", handleCaptureSubmit, true);
  createCaptureOverlay();
  updateCaptureOverlayMessage();
}

function disableCapture() {
  captureEnabled = false;
  chrome.storage.local.set({ miniAptyCaptureActive: false });
  document.body.style.cursor = "";
  document.removeEventListener("click", handleCaptureClick, true);
  document.removeEventListener("change", handleCaptureFieldChange, true);
  document.removeEventListener("keydown", handleCaptureKeyDown, true);
  document.removeEventListener("submit", handleCaptureSubmit, true);
  clearCaptureHighlights();
  removeCaptureOverlay();
}

function handleCaptureClick(event: MouseEvent) {
  const target = getCaptureElement(event.target);
  if (!target) return;
  if (currentCaptureOverlay?.contains(target)) {
    return;
  }
  clearCaptureHighlights();
  target.classList.add(CAPTURE_CLASS);
  const stepTarget = collectTarget(target);
  const trigger: "click" | "manual" = ["button", "a", "input", "select", "textarea"].includes(target.tagName.toLowerCase())
    ? target.tagName.toLowerCase() === "a" || target instanceof HTMLButtonElement || ((target instanceof HTMLInputElement || target instanceof HTMLSelectElement) && target.type !== "text")
      ? "click"
      : "manual"
    : "manual";
  persistPendingStep(stepTarget, trigger);
  chrome.runtime.sendMessage({ type: "CAPTURE_RESULT", target: stepTarget, trigger, skipStorage: true });
  captureCount += 1;
  updateCaptureOverlayMessage();
}

function handleCaptureFieldChange(event: Event) {
  const target = event.target;
  if (!target || !(target instanceof Node) || currentCaptureOverlay?.contains(target)) return;
  if (!isValueCaptureElement(target)) return;
  const stepTarget = collectTarget(target);
  persistPendingStep(stepTarget, "manual");
  chrome.runtime.sendMessage({ type: "CAPTURE_RESULT", target: stepTarget, trigger: "manual", skipStorage: true });
  captureCount += 1;
  updateCaptureOverlayMessage();
}

function handleCaptureKeyDown(event: KeyboardEvent) {
  if (event.key !== "Enter") return;
  const target = event.target;
  if (!isValueCaptureElement(target)) return;
  if (currentCaptureOverlay?.contains(target as Node)) return;
  const stepTarget = collectTarget(target);
  persistPendingStep(stepTarget, "manual");
  chrome.runtime.sendMessage({ type: "CAPTURE_RESULT", target: stepTarget, trigger: "manual", skipStorage: true });
}

function handleCaptureSubmit(event: Event) {
  const submitEvent = event as SubmitEvent;
  const submitter = submitEvent.submitter instanceof Element ? submitEvent.submitter : null;
  const target = submitter || (event.target instanceof Element ? event.target : null);
  if (!target) return;
  if (currentCaptureOverlay?.contains(target)) return;
  const stepTarget = collectTarget(target);
  persistPendingStep(stepTarget, "click");
  chrome.runtime.sendMessage({ type: "CAPTURE_RESULT", target: stepTarget, trigger: "click", skipStorage: true });
  captureCount += 1;
  updateCaptureOverlayMessage();
}

function resolveTarget(target: WalkthroughStepTarget): HTMLElement | null {
  if (target.id) {
    const el = document.getElementById(target.id);
    if (el) return el;
  }
  if (target.selector) {
    try {
      const el = document.querySelector(target.selector);
      if (el instanceof HTMLElement) return el;
    } catch (error) {
      console.warn("Invalid selector during playback resolution:", target.selector, error);
    }
  }
  // Try matching by semantic attributes captured during authoring
  if (target.ariaLabel) {
    const byAria = Array.from(document.querySelectorAll("*[aria-label]")) as HTMLElement[];
    const found = byAria.find((el) => (el.getAttribute("aria-label") || "").trim() === target.ariaLabel?.trim());
    if (found) return found;
  }
  if (target.name) {
    const byName = Array.from(document.querySelectorAll("*[name]")) as HTMLElement[];
    const found = byName.find((el) => (el.getAttribute("name") || "").trim() === target.name?.trim());
    if (found) return found;
  }
  if (target.href) {
    const links = Array.from(document.querySelectorAll("a[href]") ) as HTMLAnchorElement[];
    const found = links.find((a) => {
      const href = a.getAttribute("href") || "";
      return href === target.href || href.endsWith(target.href || "") || href.includes(target.href || "");
    });
    if (found) return found as HTMLElement;
  }
  if (target.title) {
    const byTitle = Array.from(document.querySelectorAll("*[title]")) as HTMLElement[];
    const found = byTitle.find((el) => (el.getAttribute("title") || "").trim() === target.title?.trim());
    if (found) return found;
  }
  if (target.alt) {
    const byAlt = Array.from(document.querySelectorAll("img[alt], area[alt]")) as HTMLElement[];
    const found = byAlt.find((el) => (el.getAttribute("alt") || "").trim() === target.alt?.trim());
    if (found) return found;
  }
  // Anchor/context matching: try label association or nearby text
  if (target.anchorText) {
    const labels = Array.from(document.querySelectorAll('label')) as HTMLLabelElement[];
    const lbl = labels.find((l) => (l.innerText || '').trim() === target.anchorText?.trim());
    if (lbl) {
      // if label has for attribute, find the control
      const forAttr = lbl.getAttribute('for');
      if (forAttr) {
        const control = document.getElementById(forAttr);
        if (control instanceof HTMLElement) return control;
      }
      // otherwise, find input/select/textarea inside label
      const control = lbl.querySelector('input,select,textarea,button,a') as HTMLElement | null;
      if (control) return control;
    }
    // fallback: find element whose previous sibling's text equals anchorText
    const candidates = Array.from(document.querySelectorAll('*')) as HTMLElement[];
    const found = candidates.find((el) => {
      const prev = el.previousElementSibling as HTMLElement | null;
      return prev && (prev.innerText || '').trim() === target.anchorText?.trim();
    });
    if (found) return found;
  }
  // If contextSelector provided, search within that context first
  if (target.contextSelector) {
    try {
      const contexts = Array.from(document.querySelectorAll(target.contextSelector)) as HTMLElement[];
      for (const ctx of contexts) {
        if (target.selector) {
          const el = ctx.querySelector(target.selector);
          if (el instanceof HTMLElement) return el;
        }
        if (target.text && ctx.innerText && ctx.innerText.includes(target.text)) {
          // find element inside ctx with that text
          const inner = Array.from(ctx.querySelectorAll('*')) as HTMLElement[];
          const found = inner.find((el) => (el.innerText || '').trim() === target.text?.trim());
          if (found) return found;
        }
      }
    } catch (e) {
      // ignore invalid context selectors
    }
  }
  if (target.text) {
    const candidates = Array.from(document.querySelectorAll("*:not(script):not(style)")) as HTMLElement[];
    // prefer exact text match, then startsWith, then includes
    let found = candidates.find((el) => el.innerText.trim() === target.text);
    if (found) return found;
    found = candidates.find((el) => el.innerText.trim().startsWith(target.text || ""));
    if (found) return found;
    found = candidates.find((el) => el.innerText.trim().includes(target.text || ""));
    if (found) return found;
    return null;
  }
  return null;
}

function createBalloon(message: string): HTMLElement {
  const balloon = document.createElement("div");
  balloon.className = "mini-apty-balloon";
  balloon.style.position = "absolute";
  balloon.style.zIndex = "2147483647";
  balloon.style.maxWidth = "320px";
  balloon.style.background = "rgba(27, 42, 95, 0.95)";
  balloon.style.color = "#fff";
  balloon.style.padding = "12px";
  balloon.style.borderRadius = "10px";
  balloon.style.boxShadow = "0 8px 30px rgba(0,0,0,0.35)";
  balloon.style.fontFamily = "Arial, sans-serif";
  balloon.style.fontSize = "13px";
  balloon.style.lineHeight = "1.4";
  balloon.style.pointerEvents = "auto";
  balloon.innerHTML = message;
  return balloon;
}

function renderPlayback() {
  if (!playbackState) return;
  const { walkthrough, stepIndex } = playbackState;
  const step = walkthrough.steps[stepIndex];
  removePlaybackUI();
  const target = resolveTarget(step.target);
  if (!target) {
    console.warn("Playback: could not resolve step target", { stepIndex, target: step.target });
    const balloon = createBalloon(`
      <strong>Step ${stepIndex + 1} not found.</strong>
      <div>Target element is missing or changed.</div>
      <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:10px;">
        <button class="mini-apty-button" data-action="prev">Prev</button>
        <button class="mini-apty-button" data-action="next">Next</button>
        <button class="mini-apty-button" data-action="stop">Stop</button>
      </div>
    `);
    balloon.style.top = "20px";
    balloon.style.left = "20px";
    document.body.appendChild(balloon);
    balloon.addEventListener("click", handleBalloonClick);
    playbackState.balloon = balloon;
    return;
  }
  console.debug("Playback: resolved target", { stepIndex, selector: step.target.selector, id: step.target.id, element: target });
  const alreadyExecuted = playbackState.lastExecutedStepIndex === stepIndex;
  if (!alreadyExecuted) {
    if (step.target.value && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
      try {
        target.value = step.target.value;
        target.dispatchEvent(new Event("input", { bubbles: true }));
        target.dispatchEvent(new Event("change", { bubbles: true }));
      } catch (error) {
        console.warn("Playback value assignment failed", error);
      }
    }
    if (step.trigger === "click") {
      try {
        target.click();
      } catch (error) {
        console.warn("Playback click action failed", error);
      }
    }
    playbackState.lastExecutedStepIndex = stepIndex;
    savePlaybackState();
  }
  if (step.trigger === "manual" || target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
    try {
      target.focus();
    } catch (error) {
      console.warn("Playback focus action failed", error);
    }
  }
  target.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
  const rect = target.getBoundingClientRect();
  const balloon = createBalloon(`
    <div style="font-weight:700; margin-bottom:6px;">${step.title}</div>
    <div style="margin-bottom:10px;">${step.description}</div>
    <div style="display:flex; gap:8px; justify-content:flex-end;">
      <button class="mini-apty-button" data-action="prev">Prev</button>
      <button class="mini-apty-button" data-action="next">Next</button>
      <button class="mini-apty-button" data-action="stop">Stop</button>
    </div>
  `);
  document.body.appendChild(balloon);
  balloon.style.top = `${window.scrollY + rect.bottom + 12}px`;
  balloon.style.left = `${window.scrollX + rect.left}px`;
  playbackState.balloon = balloon;
  const highlight = document.createElement("div");
  highlight.className = "mini-apty-playback-highlight";
  highlight.style.position = "absolute";
  highlight.style.top = `${window.scrollY + rect.top - 6}px`;
  highlight.style.left = `${window.scrollX + rect.left - 6}px`;
  highlight.style.width = `${rect.width + 12}px`;
  highlight.style.height = `${rect.height + 12}px`;
  highlight.style.border = "3px solid rgba(255, 193, 7, 0.95)";
  highlight.style.borderRadius = "10px";
  highlight.style.zIndex = "2147483646";
  document.body.appendChild(highlight);
  playbackState.highlight = highlight;
  balloon.addEventListener("click", handleBalloonClick);
}

function removePlaybackUI() {
  playbackState?.balloon?.remove();
  playbackState?.highlight?.remove();
  if (playbackState) {
    playbackState.balloon = undefined;
    playbackState.highlight = undefined;
  }
}

async function getTokenFromStorage(): Promise<string | null> {
  const result = await chrome.storage.local.get("miniAptyAuthToken");
  return result?.miniAptyAuthToken || null;
}

async function saveProgress(stepIndex: number) {
  if (!playbackState) return;
  try {
    const token = await getTokenFromStorage();
    if (!token) return;
    await fetch(`${(import.meta.env.VITE_BACKEND_URL || "http://localhost:4000")}/api/walkthroughs/${playbackState.walkthrough.id}/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stepIndex }),
    });
  } catch (error) {
    console.warn("Could not save progress", error);
  }
}

function handleBalloonClick(event: MouseEvent) {
  const element = event.target as HTMLElement | null;
  const button = element?.closest("[data-action]") as HTMLElement | null;
  const action = button?.dataset?.action;
  if (!action || !playbackState) return;
  event.stopPropagation();
  if (action === "prev") {
    playbackState.stepIndex = Math.max(0, playbackState.stepIndex - 1);
    savePlaybackState();
    renderPlayback();
    saveProgress(playbackState.stepIndex);
  } else if (action === "next") {
    if (playbackState.stepIndex + 1 < playbackState.walkthrough.steps.length) {
      playbackState.stepIndex += 1;
      savePlaybackState();
      renderPlayback();
      saveProgress(playbackState.stepIndex);
    } else {
      stopPlayback();
    }
  } else if (action === "stop") {
    stopPlayback();
  }
}

function stopPlayback() {
  removePlaybackUI();
  playbackState = null;
  chrome.storage.local.set({ miniAptyPlaybackState: null });
}

function savePlaybackState() {
  if (!playbackState) {
    chrome.storage.local.set({ miniAptyPlaybackState: null });
    return;
  }
  chrome.storage.local.set({
    miniAptyPlaybackState: {
      walkthrough: playbackState.walkthrough,
      stepIndex: playbackState.stepIndex,
      lastExecutedStepIndex: playbackState.lastExecutedStepIndex,
    },
  });
}

async function handleMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
  if (message?.type === "START_CAPTURE") {
    enableCapture();
    sendResponse({ status: "capture_started" });
  }
  if (message?.type === "STOP_CAPTURE") {
    disableCapture();
    sendResponse({ status: "capture_stopped" });
  }
  if (message?.type === "PING") {
    sendResponse({ status: "pong" });
  }
  if (message?.type === "PLAYBACK_START" && message.walkthrough) {
    console.debug("PLAYBACK_START received", { id: message.walkthrough.id, stepIndex: message.stepIndex, steps: message.walkthrough.steps });
    stopPlayback();
    playbackState = {
      walkthrough: message.walkthrough as Walkthrough,
      stepIndex: message.stepIndex ?? 0,
    };
    savePlaybackState();
    renderPlayback();
    sendResponse({ status: "playing" });
  }
  if (message?.type === "PLAYBACK_STOP") {
    stopPlayback();
    sendResponse({ status: "stopped" });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Mini Apty content script received message", message);
  handleMessage(message, sender, sendResponse);
  return true;
});

function onSpaRouteChange() {
  console.log("Mini Apty SPA route change detected", window.location.href);
  if (captureEnabled) {
    if (!currentCaptureOverlay) createCaptureOverlay();
    updateCaptureOverlayMessage();
  }
  if (playbackState) {
    removePlaybackUI();
    renderPlayback();
  }
}

function watchSpaNavigation() {
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (this: History, ...args: [any, string, string | URL | null | undefined]) {
    const result = originalPushState.apply(this, args);
    setTimeout(onSpaRouteChange, 0);
    return result;
  };

  history.replaceState = function (this: History, ...args: [any, string, string | URL | null | undefined]) {
    const result = originalReplaceState.apply(this, args);
    setTimeout(onSpaRouteChange, 0);
    return result;
  };

  window.addEventListener("popstate", onSpaRouteChange);
}

// Restore capture state across page navigations
chrome.storage.local.get("miniAptyCaptureActive", (result) => {
  if (result.miniAptyCaptureActive === true) {
    console.log("Mini Apty restoring capture mode on new page");
    enableCapture();
  }
});

// Restore playback state across page navigations
chrome.storage.local.get("miniAptyPlaybackState", (result) => {
  const state = result.miniAptyPlaybackState;
  if (state && state.walkthrough && typeof state.stepIndex === "number") {
    console.log("Mini Apty restoring playback on new page", { walkthroughId: state.walkthrough.id, stepIndex: state.stepIndex });
    playbackState = {
      walkthrough: state.walkthrough,
      stepIndex: state.stepIndex,
      lastExecutedStepIndex: typeof state.lastExecutedStepIndex === "number" ? state.lastExecutedStepIndex : undefined,
    };
    renderPlayback();
  }
});

watchSpaNavigation();

const style = document.createElement("style");
style.textContent = `
  .${CAPTURE_CLASS} { outline: 3px solid rgba(0, 161, 255, 0.85) !important; box-shadow: 0 0 0 4px rgba(0, 161, 255, 0.25); }
  .mini-apty-balloon button.mini-apty-button { background: #fff; color: #1b2a5f; border: none; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
  .mini-apty-balloon button.mini-apty-button:hover { opacity: 0.92; }
  .mini-apty-capture-overlay {
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 2147483647;
    background: rgba(27, 42, 95, 0.95);
    color: #fff;
    padding: 10px 14px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    font-family: sans-serif;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .mini-apty-capture-overlay button {
    border: none;
    background: #fff;
    color: #1b2a5f;
    padding: 4px 10px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
  }
  .mini-apty-capture-overlay button:hover {
    opacity: 0.92;
  }
`;

document.head.appendChild(style);
