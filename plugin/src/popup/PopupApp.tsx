import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { api } from "@recoil-river/backend/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";

import {
  PopupView,
  type AuthMode,
  type SaveState,
} from "./PopupView";
import { captureCurrentTab, type CurrentTab } from "./current-tab";

const webUrl = import.meta.env.WXT_PUBLIC_WEB_URL;

function readableError(error: unknown, fallback: string): string {
  if (error instanceof Error && /invalid credentials/i.test(error.message)) {
    return "That email and password combination was not found.";
  }
  if (error instanceof Error && /already exists|duplicate/i.test(error.message)) {
    return "An account already exists for this email.";
  }
  return fallback;
}

export function PopupApp() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const addCurrentPage = useMutation(api.bookmarks.addCurrentPage);
  const recent = useQuery(
    api.bookmarks.listRecent,
    isAuthenticated ? {} : "skip",
  );
  const graph = useQuery(
    api.graph.getPopupSnapshot,
    isAuthenticated ? {} : "skip",
  );
  const [authMode, setAuthMode] = useState<AuthMode>("signIn");
  const [authError, setAuthError] = useState<string>();
  const [currentTab, setCurrentTab] = useState<CurrentTab | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string>();

  useEffect(() => {
    void captureCurrentTab(chrome.tabs).then(setCurrentTab);
  }, []);

  async function submitAuth(args: {
    email: string;
    password: string;
    flow: AuthMode;
  }) {
    setAuthError(undefined);
    try {
      await signIn("password", args);
    } catch (error) {
      setAuthError(
        readableError(
          error,
          args.flow === "signIn"
            ? "Could not log in. Check your details and try again."
            : "Could not create this account. Try again.",
        ),
      );
    }
  }

  async function save() {
    if (!currentTab?.supported) {
      return;
    }
    setSaveState("saving");
    setSaveError(undefined);
    try {
      const result = await addCurrentPage({
        url: currentTab.url,
        title: currentTab.title || new URL(currentTab.url).hostname,
        faviconUrl: currentTab.faviconUrl,
      });
      setSaveState(result.result === "created" ? "created" : "existing");
    } catch (error) {
      setSaveState("error");
      setSaveError(
        readableError(error, "Could not save this page. Try again."),
      );
    }
  }

  return (
    <PopupView
      authState={
        isLoading
          ? "loading"
          : isAuthenticated
            ? "signedIn"
            : "signedOut"
      }
      authMode={authMode}
      authError={authError}
      currentTab={currentTab}
      graph={
        graph
          ? {
              nodes: graph.nodes.map((node) => ({
                ...node,
                id: String(node.id),
              })),
              edges: graph.edges.map((edge) => ({
                ...edge,
                id: String(edge.id),
                source: String(edge.source),
                target: String(edge.target),
              })),
            }
          : { nodes: [], edges: [] }
      }
      recent={(recent ?? []).map((bookmark) => ({
        ...bookmark,
        id: String(bookmark.id),
      }))}
      saveState={saveState}
      saveError={saveError}
      webUrl={webUrl ?? ""}
      onAuthModeChange={(mode) => {
        setAuthMode(mode);
        setAuthError(undefined);
      }}
      onAuthSubmit={submitAuth}
      onSave={save}
    />
  );
}
