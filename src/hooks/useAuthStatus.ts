import { useSyncExternalStore } from "react";
import { hasAuthSession, SESSION_CHANGE_EVENT, SESSION_KEY } from "../services/api";

function subscribeToAuthStatus(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === SESSION_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SESSION_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SESSION_CHANGE_EVENT, onStoreChange);
  };
}

export function useAuthStatus() {
  return useSyncExternalStore(subscribeToAuthStatus, hasAuthSession, () => false);
}
