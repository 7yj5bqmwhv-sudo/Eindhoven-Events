import { ChakraProvider } from "@chakra-ui/react";
import { ColorModeProvider } from "./color-mode";
import { system } from "../../theme";

export function Provider({ children }) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider
        defaultTheme="system"
        enableSystem
        storageKey="eindhoven-theme"
      >
        {children}
      </ColorModeProvider>
    </ChakraProvider>
  );
}
