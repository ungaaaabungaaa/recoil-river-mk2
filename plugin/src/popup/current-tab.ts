export type CurrentTab = {
  url: string;
  title: string;
  faviconUrl?: string;
  supported: boolean;
};

type TabsReader = {
  query(
    queryInfo: { active: boolean; currentWindow: boolean },
  ): Promise<Array<{ url?: string; title?: string; favIconUrl?: string }>>;
};

export function isSupportedPageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function captureCurrentTab(
  tabs: TabsReader,
): Promise<CurrentTab> {
  try {
    const [tab] = await tabs.query({ active: true, currentWindow: true });
    const url = tab?.url ?? "";
    return {
      url,
      title: tab?.title ?? "",
      faviconUrl: tab?.favIconUrl,
      supported: isSupportedPageUrl(url),
    };
  } catch {
    return { url: "", title: "", supported: false };
  }
}
