import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PopupView, type PopupViewProps } from "./PopupView";
import type { PopupGraph } from "./types";

vi.mock("@recoil-river/graph", () => ({
  KnowledgeGraph2D: ({
    graph,
    onNodeClick,
  }: {
    graph: PopupGraph;
    onNodeClick?(node: PopupGraph["nodes"][number]): void;
  }) =>
    graph.nodes.length === 0 ? (
      <div role="status">
        <p>Your river starts here.</p>
        <small>Save a page to create the first node.</small>
      </div>
    ) : (
      <button
        type="button"
        aria-label={`Knowledge graph with ${graph.nodes.length} bookmark${
          graph.nodes.length === 1 ? "" : "s"
        }`}
        onClick={() => onNodeClick?.(graph.nodes[0]!)}
      >
        Graph
      </button>
    ),
}));

const supportedTab = {
  url: "https://example.com/article",
  title: "An article",
  faviconUrl: "https://example.com/favicon.ico",
  supported: true,
};

const defaultProps: PopupViewProps = {
  authState: "signedIn",
  authMode: "signIn",
  currentTab: supportedTab,
  graph: { nodes: [], edges: [] },
  recent: [],
  saveState: "idle",
  webUrl: "https://recoil.example",
  onAuthModeChange: vi.fn(),
  onAuthSubmit: vi.fn(),
  onSave: vi.fn(),
};

describe("PopupView", () => {
  it("shows an honest graph empty state and ADD", () => {
    render(<PopupView {...defaultProps} />);

    expect(screen.getByText("Your river starts here.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ADD" })).toBeEnabled();
  });

  it.each([
    ["saving", "ADDING…", true],
    ["created", "ADDED", true],
    ["existing", "ALREADY ADDED", true],
    ["error", "TRY AGAIN", false],
  ] as const)("renders the %s button state", (saveState, label, disabled) => {
    render(
      <PopupView
        {...defaultProps}
        saveState={saveState}
        saveError={saveState === "error" ? "Could not save this page." : undefined}
      />,
    );

    expect(screen.getByRole("button", { name: label })).toHaveProperty(
      "disabled",
      disabled,
    );
    if (saveState === "error") {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Could not save this page.",
      );
    }
  });

  it("disables saving for unsupported pages", () => {
    render(
      <PopupView
        {...defaultProps}
        currentTab={{ url: "chrome://extensions", title: "", supported: false }}
      />,
    );

    expect(
      screen.getByRole("button", { name: "UNSUPPORTED PAGE" }),
    ).toBeDisabled();
  });

  it("submits compact sign-in and sign-up forms explicitly", async () => {
    const user = userEvent.setup();
    const onAuthSubmit = vi.fn();
    const onAuthModeChange = vi.fn();
    const { rerender } = render(
      <PopupView
        {...defaultProps}
        authState="signedOut"
        onAuthSubmit={onAuthSubmit}
        onAuthModeChange={onAuthModeChange}
      />,
    );

    await user.type(screen.getByLabelText("Email"), "reader@example.com");
    await user.type(screen.getByLabelText("Password"), "riverpass");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(onAuthSubmit).toHaveBeenCalledWith({
      email: "reader@example.com",
      password: "riverpass",
      flow: "signIn",
    });

    rerender(
      <PopupView
        {...defaultProps}
        authState="signedOut"
        authMode="signUp"
        onAuthSubmit={onAuthSubmit}
        onAuthModeChange={onAuthModeChange}
      />,
    );
    expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
  });

  it("shows only 12 newest shortcuts with fallbacks and private deep links", () => {
    const recent = Array.from({ length: 14 }, (_, index) => ({
      id: `bookmark-${index}`,
      title: `Bookmark ${index}`,
      domain: index === 0 ? "missing.example" : `site-${index}.example`,
      faviconUrl:
        index === 0 ? undefined : `https://site-${index}.example/favicon.ico`,
      enrichmentStatus: "ready" as const,
      createdAt: 14 - index,
    }));
    render(<PopupView {...defaultProps} recent={recent} />);

    const shortcuts = screen.getAllByRole("link", {
      name: /Open Bookmark \d+ in Recoil River/,
    });
    expect(shortcuts).toHaveLength(12);
    expect(shortcuts[0]).toHaveAttribute(
      "href",
      "https://recoil.example/bookmarks/bookmark-0",
    );
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("replaces a failed favicon with the domain initial", () => {
    render(
      <PopupView
        {...defaultProps}
        recent={[
          {
            id: "one",
            title: "Broken",
            domain: "broken.example",
            faviconUrl: "https://broken.example/favicon.ico",
            enrichmentStatus: "ready",
            createdAt: 1,
          },
        ]}
      />,
    );

    fireEvent.error(
      screen.getByRole("img", { name: "broken.example favicon" }),
    );
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("opens a graph node in the private website reader", () => {
    const openSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null);
    render(
      <PopupView
        {...defaultProps}
        graph={{
          nodes: [
            {
              id: "bookmark-one",
              title: "Connected article",
              domain: "example.com",
              enrichmentStatus: "ready",
              createdAt: 1,
            },
          ],
          edges: [],
        }}
      />,
    );

    fireEvent.click(
      screen.getByLabelText("Knowledge graph with 1 bookmark"),
    );
    expect(openSpy).toHaveBeenCalledWith(
      "https://recoil.example/bookmarks/bookmark-one",
      "_blank",
      "noopener,noreferrer",
    );
    openSpy.mockRestore();
  });
});
