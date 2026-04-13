export type FavoritePolicyItem = {
  id: string;
  title: string;
  department: string;
  docNo: string;
  publishDate: string;
  content?: string;
  savedAt: number;
};

const FAVORITES_KEY = "policy-search-favorites";
const FAVORITES_EVENT = "policy-favorites:changed";

export function loadFavoritePolicies(): FavoritePolicyItem[] {
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoritePolicyItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === "string" && typeof item.title === "string");
  } catch {
    return [];
  }
}

export function saveFavoritePolicies(items: FavoritePolicyItem[]) {
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
  } catch {
    // ignore
  }
}

export function upsertFavoritePolicy(item: Omit<FavoritePolicyItem, "savedAt">) {
  const current = loadFavoritePolicies();
  const next = [
    { ...item, savedAt: Date.now() },
    ...current.filter((fav) => fav.id !== item.id),
  ];
  saveFavoritePolicies(next);
}

export function removeFavoritePolicy(policyId: string) {
  const current = loadFavoritePolicies();
  saveFavoritePolicies(current.filter((fav) => fav.id !== policyId));
}

export const policyFavoritesChangedEvent = FAVORITES_EVENT;

