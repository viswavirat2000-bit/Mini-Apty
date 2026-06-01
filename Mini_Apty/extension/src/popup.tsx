import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AuthResponse, Walkthrough, WalkthroughStep, WalkthroughStepTarget } from "./types";
import { clearToken, getToken, setToken, getCachedWalkthroughs, getPendingSteps, setPendingSteps, clearPendingSteps, getDraftTitle, setDraftTitle as persistDraftTitle, getDraftPathPattern, setDraftPathPattern as persistDraftPathPattern } from "./storage";
import { createWalkthrough, deleteWalkthrough, findRelevantWalkthroughs, findRelevantWalkthroughsWithToken, getWalkthrough, getProgress, listMyWalkthroughs, listMyWalkthroughsWithToken, login, signup } from "./api";

const initialStep: WalkthroughStep = {
  title: "",
  description: "",
  trigger: "manual",
  target: {} as WalkthroughStepTarget,
};

function App() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [path, setPath] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [steps, setSteps] = useState<WalkthroughStep[]>([]);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftPathPattern, setDraftPathPattern] = useState("%/*");
  const [relevantWalkthroughs, setRelevantWalkthroughs] = useState<Walkthrough[]>([]);
  const [myWalkthroughs, setMyWalkthroughs] = useState<Walkthrough[]>([]);
  const [status, setStatus] = useState("Ready");
  const [view, setView] = useState<"author" | "playback">("author");
  const [contentScriptConnected, setContentScriptConnected] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastRelevantFetchInfo, setLastRelevantFetchInfo] = useState<string>("");

  const isAuthenticated = Boolean(token);

  const loadPendingSteps = async () => {
    const pendingSteps = await getPendingSteps();
    if (!pendingSteps.length) return;
    setSteps(pendingSteps.map((item, index) => ({
      ...initialStep,
      title: item?.title || `Step ${index + 1}`,
      target: item?.target || item,
      trigger: item?.trigger || "manual",
    })));
    setStatus("Recovered captured step(s).");
  };

  useEffect(() => {
    const load = async () => {
      const storedToken = await getToken();
      setTokenState(storedToken);
      const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      const tab = tabs[0];
      let currentOrigin = "";
      let currentPath = "";
      if (tab?.url) {
        try {
          const url = new URL(tab.url);
          currentOrigin = url.origin;
          currentPath = url.pathname + url.search + url.hash;
          setOrigin(currentOrigin);
          setPath(currentPath);
          setDraftPathPattern(`${url.pathname}%`);
          setPageTitle(tab.title || "");
        } catch {
          setOrigin("");
          setPath("");
        }
      }

      await loadPendingSteps();

      const storedTitle = await getDraftTitle();
      if (storedTitle) {
        setDraftTitle(storedTitle);
      }
      const storedPathPattern = await getDraftPathPattern();
      if (storedPathPattern) {
        setDraftPathPattern(storedPathPattern);
      }

      if (storedToken) {
        refreshWalkthroughs(storedToken, currentOrigin, currentPath);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const messageListener = (message: any) => {
      if (message?.type === "CAPTURE_RESULT" && message.target) {
        setSteps((prev) => {
          const next = [...prev, { ...initialStep, title: `Step ${prev.length + 1}`, target: message.target, trigger: message.trigger || "manual" }];
          setPendingSteps(next).catch(() => null);
          return next;
        });
        setStatus("Captured step target.");
      }
      if (message?.type === "PENDING_STEPS_UPDATED" && Array.isArray(message.steps)) {
        loadPendingSteps().catch(() => null);
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);

    const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName !== "local") return;
      if (changes.miniAptyPendingSteps) {
        loadPendingSteps().catch(() => null);
      }
    };
    chrome.storage.onChanged.addListener(storageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
      chrome.storage.onChanged.removeListener(storageListener);
    };
  }, []);

  const refreshWalkthroughs = async (tokenValue: string | null, currentOrigin?: string, currentPath?: string) => {
    const originToUse = currentOrigin ?? origin;
    const pathToUse = currentPath ?? path;
    try {
      const [mine, relevant] = tokenValue
        ? await Promise.all([listMyWalkthroughsWithToken(tokenValue), findRelevantWalkthroughsWithToken(originToUse, pathToUse, tokenValue)])
        : await Promise.all([listMyWalkthroughs(), findRelevantWalkthroughs(originToUse, pathToUse)]);
      setMyWalkthroughs(mine);
      setRelevantWalkthroughs(relevant);
      setLastRelevantFetchInfo(`origin=${originToUse} path=${pathToUse} count=${relevant.length}`);
      setStatus(`Loaded walkthroughs. ${relevant.length} relevant walkthrough(s) found.`);
    } catch (err: any) {
      const cached = await getCachedWalkthroughs(originToUse, pathToUse);
      if (cached) {
        setRelevantWalkthroughs(cached);
        setLastRelevantFetchInfo(`origin=${originToUse} path=${pathToUse} cached=${cached.length}`);
        setStatus("Offline: using cached walkthroughs.");
      } else {
        setLastRelevantFetchInfo(`origin=${originToUse} path=${pathToUse} error=${err?.message || err}`);
        setStatus("Could not load walkthroughs.");
      }
    }
  };

  const sendTabMessage = async (tabId: number, message: any) => {
    return new Promise<any>((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  };

  const injectContentScript = async (tabId: number) => {
    return new Promise<void>((resolve, reject) => {
      chrome.scripting.executeScript(
        { target: { tabId }, files: ["content.js"] },
        () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        }
      );
    });
  };

  const ensureContentScript = async (tabId: number) => {
    try {
      await sendTabMessage(tabId, { type: "PING" });
      setContentScriptConnected(true);
      return true;
    } catch (error: any) {
      const message = String(error?.message || error);
      if (message.includes("Receiving end") || message.includes("Could not establish connection")) {
        setStatus("Injecting content script into page...");
        try {
          await injectContentScript(tabId);
          await sendTabMessage(tabId, { type: "PING" });
          setContentScriptConnected(true);
          setStatus("Content script injected.");
          return true;
        } catch (injectionError: any) {
          console.error("Content script injection failed", injectionError);
          setContentScriptConnected(false);
          return false;
        }
      }
      console.error("Content script ping failed", error);
      setContentScriptConnected(false);
      return false;
    }
  };

  const handleAuth = async () => {
    setError(null);
    try {
      const response: AuthResponse = isSignup ? await signup(email, password) : await login(email, password);
      await setToken(response.token);
      setTokenState(response.token);
      setStatus("Signed in.");
      await refreshWalkthroughs(response.token);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate.");
    }
  };

  const doLogout = async () => {
    await clearToken();
    setTokenState(null);
    setMyWalkthroughs([]);
    setRelevantWalkthroughs([]);
    setStatus("Signed out.");
  };

  const sendCaptureCommand = async () => {
    setError(null);
    setStatus("Waiting for page capture...");
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tab = tabs[0];
    if (!tab?.id) return setError("Unable to find active tab.");
    const ready = await ensureContentScript(tab.id);
    if (!ready) return setError("Content script unavailable on this page. Refresh the page and try again.");
    chrome.tabs.sendMessage(tab.id, { type: "START_CAPTURE" }, (response) => {
      if (chrome.runtime.lastError) {
        setError("Capture not available on this page.");
      } else {
        setStatus("Select an element on the page to capture.");
        setIsCapturing(true);
      }
    });
  };

  const stopCaptureCommand = async () => {
    setError(null);
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tab = tabs[0];
    if (!tab?.id) return setError("Unable to find active tab.");
    chrome.tabs.sendMessage(tab.id, { type: "STOP_CAPTURE" }, (response) => {
      if (chrome.runtime.lastError) {
        setError("Unable to stop capture on this page.");
      } else {
        setStatus("Capture stopped.");
        setIsCapturing(false);
      }
    });
  };

  const handleSaveDraft = async () => {
    if (!draftTitle.trim()) return setError("Enter a walkthrough title.");
    if (!origin || !path) return setError("Page context missing.");
    if (!steps.length) return setError("Capture at least one step.");
    try {
      const created = await createWalkthrough({ title: draftTitle.trim(), origin, pathPattern: draftPathPattern.trim(), steps });
      setMyWalkthroughs((prev) => [created, ...prev]);
      setSteps([]);
      setDraftTitle("");
      setDraftPathPattern("%/*");
      await persistDraftTitle("");
      await persistDraftPathPattern("%/*");
      await clearPendingSteps();
      setStatus("Walkthrough saved.");
    } catch (err: any) {
      setError(err.message || "Failed to save walkthrough.");
    }
  };

  const handleNewWalkthrough = async () => {
    setSteps([]);
    setDraftTitle("");
    const defaultPattern = path ? path.split("?")[0].split("#")[0] + "%" : "%/*";
    setDraftPathPattern(defaultPattern);
    await persistDraftTitle("");
    await persistDraftPathPattern(defaultPattern);
    await clearPendingSteps();
    setIsCapturing(false);
    setStatus("Ready for a new walkthrough.");
  };

  const handleDeleteWalkthrough = async (id: number) => {
    if (!window.confirm("Delete this walkthrough?")) return;
    try {
      await deleteWalkthrough(id);
      setMyWalkthroughs((prev) => prev.filter((item) => item.id !== id));
      setStatus("Walkthrough deleted.");
    } catch (err: any) {
      setError(err.message || "Failed to delete walkthrough.");
    }
  };

  const handleStartPlayback = async (walkthrough: Walkthrough) => {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tab = tabs[0];
    if (!tab?.id) return setError("Unable to find active tab.");
    const ready = await ensureContentScript(tab.id);
    if (!ready) return setError("Content script unavailable on this page. Refresh the page and try again.");

    try {
      const refreshedWalkthrough = await getWalkthrough(walkthrough.id);
      const progress = await getProgress(walkthrough.id);
      const startIndex = progress?.stepIndex ?? 0;
      console.log("Mini Apty popup sending PLAYBACK_START", { tabId: tab.id, walkthroughId: walkthrough.id, startIndex });
      chrome.tabs.sendMessage(tab.id, { type: "PLAYBACK_START", walkthrough: refreshedWalkthrough, stepIndex: startIndex }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Mini Apty popup playback message failed", chrome.runtime.lastError);
          setError("Playback failed to start.");
        } else {
          console.log("Mini Apty popup playback response", response);
          setStatus(`Playing ${walkthrough.title} from step ${startIndex + 1}`);
        }
      });
    } catch (err: any) {
      console.error("Failed to start playback", err);
      setError(err?.message || "Failed to start playback.");
    }
  };

  const authorPane = (
    <div>
      <section>
        <h2>Author Walkthrough</h2>
        <div className="field">
          <label>Walkthrough title</label>
          <input value={draftTitle} onChange={async (e) => {
            const value = e.target.value;
            setDraftTitle(value);
            await persistDraftTitle(value);
          }} placeholder="Enter title" />
        </div>
        <div className="field">
          <label>Origin</label>
          <input value={origin} readOnly />
        </div>
        <div className="field">
          <label>Path pattern</label>
          <input value={draftPathPattern} onChange={async (e) => {
            const value = e.target.value;
            setDraftPathPattern(value);
            await persistDraftPathPattern(value);
          }} placeholder="Path wildcard e.g. /checkout%" />
        </div>
        <div className="field">
          <label>Content script status</label>
          <div>{contentScriptConnected === null ? "Unknown" : contentScriptConnected ? "Connected" : "Not connected"}</div>
        </div>
        {isCapturing && (
          <div className="field" style={{ color: "#f0f8ff", background: "rgba(0,0,0,0.15)", padding: "10px", borderRadius: "8px", marginBottom: "12px" }}>
            Capture is active. Click elements on the page to record steps, then reopen the popup to review them.
          </div>
        )}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
          <button className="primary" onClick={sendCaptureCommand} disabled={isCapturing}>Capture Step</button>
          <button className="secondary" onClick={stopCaptureCommand} disabled={!isCapturing}>Stop Capture</button>
        </div>
        <div className="steps">
          {steps.map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-header">{step.title}</div>
              <textarea
                value={step.description}
                onChange={(e) => {
                  const updated = [...steps];
                  updated[index].description = e.target.value;
                  setSteps(updated);
                }}
                placeholder="Step description"
              />
              <div className="target-preview">Target: {step.target.selector || step.target.id || step.target.text || "unknown"}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
          <button className="primary" onClick={handleSaveDraft}>Save Walkthrough</button>
          <button className="secondary" onClick={handleNewWalkthrough}>New Walkthrough</button>
        </div>
      </section>
      <section>
        <h2>Your Walkthroughs</h2>
        {myWalkthroughs.length ? (
          myWalkthroughs.map((item) => (
            <div key={item.id} className="walkthrough-card">
              <strong>{item.title}</strong>
              <div>{item.origin}{item.pathPattern ? ` ${item.pathPattern}` : ""}</div>
              <div>{item.steps.length} steps</div>
              <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                <button className="secondary" onClick={() => handleDeleteWalkthrough(item.id)}>Delete</button>
              </div>
            </div>
          ))
        ) : (
          <div>No saved walkthroughs yet.</div>
        )}
      </section>
    </div>
  );

  const playbackPane = (
    <div>
      <h2>Available Walkthroughs</h2>
      {relevantWalkthroughs.length ? (
        relevantWalkthroughs.map((walkthrough) => (
          <div key={walkthrough.id} className="walkthrough-card">
            <strong>{walkthrough.title}</strong>
            <div>{walkthrough.steps.length} steps</div>
            <button onClick={() => handleStartPlayback(walkthrough)}>Start Playback</button>
          </div>
        ))
      ) : (
        <div>No walkthroughs available for this page.</div>
      )}
      <div className="field" style={{ marginTop: "12px" }}>
        <label>Playback diagnostics</label>
        <div>{lastRelevantFetchInfo || "No lookup performed yet."}</div>
      </div>
    </div>
  );

  const authPane = (
    <div>
      <h2>{isSignup ? "Sign Up" : "Log In"}</h2>
      <div className="field">
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="primary" onClick={handleAuth}>{isSignup ? "Create Account" : "Sign In"}</button>
      <button className="secondary" onClick={() => setIsSignup((prev) => !prev)}>{isSignup ? "Have an account? Log in" : "Need an account? Sign up"}</button>
    </div>
  );

  const statusMessage = useMemo(() => {
    return status;
  }, [status]);

  return (
    <div className="container">
      <header>
        <h1>Mini Apty</h1>
        {isAuthenticated && <button className="secondary" onClick={doLogout}>Logout</button>}
      </header>
      {error && <div className="error-banner">{error}</div>}
      {isAuthenticated ? (
        <div>
          <div className="page-context">{origin}{path ? ` ${path}` : ""}</div>
          <div className="page-context">Content script: {contentScriptConnected === null ? "Unknown" : contentScriptConnected ? "Connected" : "Not connected"}</div>
          <div className="page-context">Playback lookup: {lastRelevantFetchInfo || "pending..."}</div>
          <div className="tabs">
            <button className={`tab-button ${view === "author" ? "active" : ""}`} onClick={() => setView("author")}>Author</button>
            <button className={`tab-button ${view === "playback" ? "active" : ""}`} onClick={() => setView("playback")}>Playback</button>
          </div>
          <div className="pane">{view === "author" ? authorPane : playbackPane}</div>
        </div>
      ) : authPane}
      <footer>{statusMessage}</footer>
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
