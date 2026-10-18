import { ChakraProvider } from "@chakra-ui/react";
import { useLayoutEffect, useState } from "react";
import { ColorModeProvider } from "./color-mode";
import { system } from "../../theme";

export function Provider({ children }) {
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    // Normalize older preferences before the theme provider reads storage.
    try {
      const saved = window.localStorage.getItem("eindhoven-theme");
      if (saved && saved !== "light" && saved !== "dark") {
        window.localStorage.setItem("eindhoven-theme", "light");
      }
    } catch {
      // Appearance still works when browser storage is unavailable.
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <ChakraProvider value={system}>
      <ColorModeProvider
        defaultTheme="light"
        enableSystem={false}
        storageKey="eindhoven-theme"
      >
        {children}
      </ColorModeProvider>
    </ChakraProvider>
  );
}
