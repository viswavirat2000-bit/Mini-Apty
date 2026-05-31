import { Walkthrough, WalkthroughStepTarget } from "./types";

interface PlaybackState {
  walkthrough: Walkthrough;
  stepIndex: number;
  balloon?: HTMLElement;
  highlight?: HTMLElement;
}

const CAPTURE_CLASS = "mini-apty-capture-highlight";
let captureEnabled = false;
let playbackState: PlaybackState | null = null;
let currentCaptureOverlay: HTMLElement | null = null;

function buildSelector(element: HTMLElement): string {
  if (element.id) return `#${element.id}`;
  const parts: string[] = [];
  let current: HTMLElement | null = element;
  while (current && current.tagName.toLowerCase() !== "html") {
    let selector = current.tagName.toLowerCase();
    if (current.className) {
      const classes = current.className.toString().trim().split(/\s+/).filter(Boolean);
      if (classes.length) selector += `.${classes.slice(0, 2).join(".")}`;
    }
    parts.unshift(selector);
    current = current.parentElement;
  }
  return parts.join(">");
}

function collectTarget(target: HTMLElement): WalkthroughStepTarget {
  const attributes: Record<string, string> = {};
  for (const attr of Array.from(target.attributes || [])) {
    if (attr.name.startsWith("data-")) {
      attributes[attr.name] = attr.value;
    }
  }
  return {
    id: target.id || undefined,
    selector: buildSelector(target),
    text: target.innerText?.trim().slice(0, 120) || undefined,
    role: target.getAttribute("role") || undefined,
    attributes: Object.keys(attributes).length ? attributes : undefined,
  };
}

function clearCaptureHighlights() {
  document.querySelectorAll(`.${CAPTURE_CLASS}`).forEach((node) => {
    node.classList.remove(CAPTURE_CLASS);
  });
}

function enableCapture() {
  if (captureEnabled) return;
  captureEnabled = true;
  document.body.style.cursor = "crosshair";
  document.addEventListener("click", handleCaptureClick, true);
}

function disableCapture() {
  captureEnabled = false;
  document.body.style.cursor = "";
  document.removeEventListener("click", handleCaptureClick, true);
  clearCaptureHighlights();
}

function handleCaptureClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (!target) return;
  event.preventDefault();
  event.stopPropagation();
  disableCapture();
  clearCaptureHighlights();
  target.classList.add(CAPTURE_CLASS);
  const stepTarget = collectTarget(target);
  chrome.runtime.sendMessage({ type: "CAPTURE_RESULT", target: stepTarget });
}

function resolveTarget(target: WalkthroughStepTarget): HTMLElement | null {
  if (target.id) {
    const el = document.getElementById(target.id);
    if (el) return el;
  }
  if (target.selector) {
    const el = document.querySelector(target.selector);
    if (el instanceof HTMLElement) return el;
  }
  if (target.text) {
    const candidates = Array.from(document.querySelectorAll("*:not(script):not(style)")) as HTMLElement[];
    return candidates.find((el) => el.innerText.trim() === target.text) || null;
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
    const balloon = createBalloon(`<strong>Step ${stepIndex + 1} not found.</strong><div>Target element is missing or changed.</div>`);
    balloon.style.top = "20px";
    balloon.style.left = "20px";
    document.body.appendChild(balloon);
    playbackState.balloon = balloon;
    return;
  }
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

async function saveProgress(stepIndex: number) {
  if (!playbackState) return;
  try {
    const token = await chrome.storage.local.get("miniAptyAuthToken");
    if (!token.miniAptyAuthToken) return;
    await fetch(`${(import.meta.env.VITE_BACKEND_URL || "http://localhost:4000")}/api/walkthroughs/${playbackState.walkthrough.id}/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.miniAptyAuthToken}`,
      },
      body: JSON.stringify({ stepIndex }),
    });
  } catch (error) {
    console.warn("Could not save progress", error);
  }
}

function handleBalloonClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  const action = target.dataset.action;
  if (!action || !playbackState) return;
  event.stopPropagation();
  if (action === "prev") {
    playbackState.stepIndex = Math.max(0, playbackState.stepIndex - 1);
    renderPlayback();
    saveProgress(playbackState.stepIndex);
  } else if (action === "next") {
    if (playbackState.stepIndex + 1 < playbackState.walkthrough.steps.length) {
      playbackState.stepIndex += 1;
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
  if (message?.type === "PLAYBACK_START" && message.walkthrough) {
    stopPlayback();
    playbackState = {
      walkthrough: message.walkthrough as Walkthrough,
      stepIndex: message.stepIndex ?? 0,
    };
    renderPlayback();
    sendResponse({ status: "playing" });
  }
  if (message?.type === "PLAYBACK_STOP") {
    stopPlayback();
    sendResponse({ status: "stopped" });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true;
});

const style = document.createElement("style");
style.textContent = `
  .${CAPTURE_CLASS} { outline: 3px solid rgba(0, 161, 255, 0.85) !important; box-shadow: 0 0 0 4px rgba(0, 161, 255, 0.25); }
  .mini-apty-balloon button.mini-apty-button { background: #fff; color: #1b2a5f; border: none; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
  .mini-apty-balloon button.mini-apty-button:hover { opacity: 0.92; }
`;

document.head.appendChild(style);
