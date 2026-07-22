# Chrome Extension

`plugin/` will own a Chrome Manifest V3 extension for manual capture.

The popup will identify the current page, show a compact graph preview from the signed-in account, and expose one primary action: `Add this page`. The extension will send the current page context to Convex and then reflect realtime updates from the same account as the website.

The extension will not observe browsing history. A page enters the account only after the user presses the capture action. It will not contain provider keys or Convex deployment credentials.

Read the [system architecture](../docs/architecture/system.md) and [privacy expectations](../docs/privacy.md). The [popup mockup](../docs/mockups/plugin.html) records the compact graph-first direction.
