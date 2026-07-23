import { FormEvent, useState } from "react";

import { GraphCanvas } from "./GraphCanvas";
import type { CurrentTab } from "./current-tab";
import type { PopupBookmark, PopupGraph } from "./types";

export type AuthMode = "signIn" | "signUp";
export type SaveState = "idle" | "saving" | "created" | "existing" | "error";

export type PopupViewProps = {
  authState: "loading" | "signedOut" | "signedIn";
  authMode: AuthMode;
  authError?: string;
  currentTab: CurrentTab | null;
  graph: PopupGraph;
  recent: PopupBookmark[];
  saveState: SaveState;
  saveError?: string;
  webUrl: string;
  onAuthModeChange(mode: AuthMode): void;
  onAuthSubmit(args: {
    email: string;
    password: string;
    flow: AuthMode;
  }): void | Promise<void>;
  onSave(): void | Promise<void>;
};

function AuthForm({
  mode,
  error,
  onModeChange,
  onSubmit,
}: {
  mode: AuthMode;
  error?: string;
  onModeChange(mode: AuthMode): void;
  onSubmit(args: {
    email: string;
    password: string;
    flow: AuthMode;
  }): void | Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit({ email, password, flow: mode });
  }

  return (
    <main className="auth-shell">
      <header className="brand-lockup">
        <span className="brand-glyph" aria-hidden="true">
          RR
        </span>
        <span>RECOIL RIVER</span>
      </header>
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">PRIVATE KNOWLEDGE GRAPH</p>
        <h1 id="auth-title">
          {mode === "signIn" ? "Return to your river." : "Start your river."}
        </h1>
        <p className="auth-copy">
          Save useful pages and watch them connect into a second brain.
        </p>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete={
                mode === "signIn" ? "current-password" : "new-password"
              }
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error ? <p role="alert">{error}</p> : null}
          <button className="auth-submit" type="submit">
            {mode === "signIn" ? "Log in" : "Sign up"}
          </button>
        </form>
        <button
          className="mode-switch"
          type="button"
          onClick={() =>
            onModeChange(mode === "signIn" ? "signUp" : "signIn")
          }
        >
          {mode === "signIn"
            ? "New here? Sign up"
            : "Already have an account? Log in"}
        </button>
        <small className="demo-note">
          Demo authentication: email verification and recovery are not enabled.
        </small>
      </section>
    </main>
  );
}

function FaviconShortcut({
  bookmark,
  webUrl,
}: {
  bookmark: PopupBookmark;
  webUrl: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(bookmark.faviconUrl) && !failed;

  return (
    <a
      className="favicon-shortcut"
      href={`${webUrl}/bookmarks/${bookmark.id}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${bookmark.title} in Recoil River`}
      title={bookmark.title}
    >
      {showImage ? (
        <img
          src={bookmark.faviconUrl}
          alt={`${bookmark.domain} favicon`}
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{bookmark.domain.charAt(0).toUpperCase()}</span>
      )}
    </a>
  );
}

function buttonPresentation(
  state: SaveState,
  supported: boolean,
): { label: string; disabled: boolean } {
  if (!supported) {
    return { label: "UNSUPPORTED PAGE", disabled: true };
  }
  if (state === "saving") {
    return { label: "ADDING…", disabled: true };
  }
  if (state === "created") {
    return { label: "ADDED", disabled: true };
  }
  if (state === "existing") {
    return { label: "ALREADY ADDED", disabled: true };
  }
  if (state === "error") {
    return { label: "TRY AGAIN", disabled: false };
  }
  return { label: "ADD", disabled: false };
}

export function PopupView(props: PopupViewProps) {
  if (props.authState === "loading") {
    return (
      <main className="popup-loading" aria-busy="true">
        <span className="loading-mark" aria-hidden="true" />
        <p>Finding your river…</p>
      </main>
    );
  }

  if (props.authState === "signedOut") {
    return (
      <AuthForm
        mode={props.authMode}
        error={props.authError}
        onModeChange={props.onAuthModeChange}
        onSubmit={props.onAuthSubmit}
      />
    );
  }

  const button = buttonPresentation(
    props.saveState,
    props.currentTab?.supported ?? false,
  );

  return (
    <main className="popup-shell">
      <header className="popup-header">
        <span>RECOIL RIVER</span>
        <span className="live-dot" title="Private graph connected" />
      </header>
      <section className="graph-panel" aria-label="Your knowledge graph">
        <GraphCanvas
          graph={props.graph}
          onNodeClick={(bookmark) => {
            const baseUrl = props.webUrl.replace(/\/$/, "");
            window.open(
              `${baseUrl}/bookmarks/${bookmark.id}`,
              "_blank",
              "noopener,noreferrer",
            );
          }}
        />
      </section>
      <section className="capture-panel">
        <p className="current-page">
          {props.currentTab?.supported
            ? props.currentTab.title || props.currentTab.url
            : "Open a public web page to save it."}
        </p>
        <button
          className={`add-button add-button--${props.saveState}`}
          type="button"
          disabled={button.disabled}
          onClick={() => void props.onSave()}
        >
          {button.label}
        </button>
        {props.saveError ? (
          <p className="save-error" role="alert">
            {props.saveError}
          </p>
        ) : null}
        <div className="recent-grid" aria-label="Recent bookmarks">
          {props.recent.slice(0, 12).map((bookmark) => (
            <FaviconShortcut
              key={bookmark.id}
              bookmark={bookmark}
              webUrl={props.webUrl.replace(/\/$/, "")}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
