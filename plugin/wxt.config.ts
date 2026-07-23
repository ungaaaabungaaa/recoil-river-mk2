import { defineConfig } from "wxt";

function configuredConvexOrigin(): URL {
  const value = process.env.WXT_PUBLIC_CONVEX_URL;
  if (!value) {
    throw new Error(
      "WXT_PUBLIC_CONVEX_URL is required to build the Recoil River extension.",
    );
  }
  const url = new URL(value);
  if (url.protocol !== "https:" && url.hostname !== "127.0.0.1") {
    throw new Error("WXT_PUBLIC_CONVEX_URL must use HTTPS.");
  }
  return url;
}

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: () => {
    const convex = configuredConvexOrigin();
    const httpsOrigin = convex.origin;
    const websocketOrigin = `wss://${convex.host}`;

    return {
      name: "Recoil River",
      description: "Save the current page into your private knowledge graph.",
      version: "0.1.0",
      permissions: ["activeTab"],
      host_permissions: [`${httpsOrigin}/*`],
      content_security_policy: {
        extension_pages: [
          "script-src 'self'",
          "object-src 'self'",
          `connect-src 'self' ${httpsOrigin} ${websocketOrigin}`,
          "img-src 'self' data: https:",
          "font-src 'self'",
        ].join("; "),
      },
    };
  },
});
