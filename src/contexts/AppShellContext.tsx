import React, { createContext, useContext, useMemo } from 'react';
import { isAppShell, isNativeApp, isStandalonePwa } from '../lib/appShell';

interface AppShellContextValue {
  isAppShell: boolean;
  isNativeApp: boolean;
  isStandalonePwa: boolean;
}

const AppShellContext = createContext<AppShellContextValue>({
  isAppShell: false,
  isNativeApp: false,
  isStandalonePwa: false,
});

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(
    () => ({
      isAppShell: isAppShell(),
      isNativeApp: isNativeApp(),
      isStandalonePwa: isStandalonePwa(),
    }),
    [],
  );

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell(): AppShellContextValue {
  return useContext(AppShellContext);
}
