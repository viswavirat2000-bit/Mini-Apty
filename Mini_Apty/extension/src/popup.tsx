import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AuthResponse, Walkthrough } from "./types";
import { clearToken, getToken, setToken, getCachedWalkthroughs } from "./storage";
import { createWalkthrough, findRelevantWalkthroughs, listMyWalkthroughs, login, signup } from "./api";

const initialStep = {
  title: "",
  description: "",
  trigger: "manual" as const,
  target: {},
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
  const [steps, setSteps] = useState<typeof initialStep[]>([]);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftPathPattern, setDraftPathPattern] = useState("%/*");
  const [relevantWalkthroughs, setRelevantWalkthroughs] = useState<Walkthrough[]>([]);
  const [myWalkthroughs, setMyWalkthroughs] = useState<Walkthrough[]>([]);
  const [status, setStatus] = useState("Ready");
  const [view, setView] = useState<"author" | "playback">("author");

  const isAuthenticated = Boolean(token);

  useEffect(() => {
    const load = async () => {
      const storedToken = await getToken();
      setTokenState(storedToken);
      const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      const tab = tabs[0];
      if (tab?.url) {
        try {
          const url = new URL(tab.url);
          setOrigin(url.origin);
          setPath(url.pathname + url.search + url.hash);
          setDraftPathPattern(`${url.pathname}%`);
          setPageTitle(tab.title || "");
        } catch {
          setOrigin("");
          setPath("");
        }
      }
      if (storedToken) {
        refreshWalkthroughs(storedToken);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const listener = (message: any) => {
      if (message?.type === "CAPTURE_RESULT" && message.target) {
        setSteps((prev) => [...prev, { ...initialStep, title: `Step ${prev.length + 1}`, target: message.target }]);
        setStatus("Captured step target.");
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);

  const refreshWalkthroughs = async (tokenValue: string) => {
    try {
      const [mine, relevant] = await Promise.all([listMyWalkthroughs(), findRelevantWalkthroughs(origin, path)]);
      setMyWalkthroughs(mine);
      setRelevantWalkthroughs(relevant);
      setStatus("Loaded walkthroughs.");
    } catch (err) {
      const cached = await getCachedWalkthroughs(origin, path);
      if (cached) {
        setRelevantWalkthroughs(cached);
        setStatus("Offline: using cached walkthroughs.");
      } else {
        setStatus("Could not load walkthroughs.");
      }
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
    setStatus("Waiting for page capture...");
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tab = tabs[0];
    if (!tab?.id) return setError("Unable to find active tab.");
    chrome.tabs.sendMessage(tab.id, { type: "START_CAPTURE" }, (response) => {
      if (chrome.runtime.lastError) {
        setError("Capture not available on this page.");
      } else {
        setStatus("Select an element on the page to capture.");
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
      setStatus("Walkthrough saved.");
    } catch (err: any) {
      setError(err.message || "Failed to save walkthrough.");
    }
  };

  const handleStartPlayback = async (walkthrough: Walkthrough) => {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tab = tabs[0];
    if (!tab?.id) return setError("Unable to find active tab.");
    chrome.tabs.sendMessage(tab.id, { type: "PLAYBACK_START", walkthrough, stepIndex: 0 }, (response) => {
      if (chrome.runtime.lastError) {
        setError("Playback failed to start.");
      } else {
        setStatus(`Playing ${walkthrough.title}`);
      }
    });
  };

  const authorPane = (
    <div>
      <section>
        <h2>Author Walkthrough</h2>
        <div className="field">
          <label>Walkthrough title</label>
          <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="Enter title" />
        </div>
        <div className="field">
          <label>Origin</label>
          <input value={origin} readOnly />
        </div>
        <div className="field">
          <label>Path pattern</label>
          <input value={draftPathPattern} onChange={(e) => setDraftPathPattern(e.target.value)} placeholder="Path wildcard e.g. /checkout%" />
        </div>
        <button onClick={sendCaptureCommand}>Capture Step</button>
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
        <button className="primary" onClick={handleSaveDraft}>Save Walkthrough</button>
      </section>
      <section>
        <h2>Your Walkthroughs</h2>
        {myWalkthroughs.length ? (
          myWalkthroughs.map((item) => (
            <div key={item.id} className="walkthrough-card">
              <strong>{item.title}</strong>
              <div>{item.origin}{item.pathPattern ? ` ${item.pathPattern}` : ""}</div>
              <div>{item.steps.length} steps</div>
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
