import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const pair = (light, dark) => ({ value: { base: light, _light: light, _dark: dark } });

export const system = createSystem(
  defaultConfig,
  defineConfig({
    globalCss: {
      html: { scrollPaddingTop: "10rem" },
      body: {
        bg: "bg",
        color: "fg",
        margin: 0,
        fontOpticalSizing: "auto",
        WebkitFontSmoothing: "antialiased",
      },
      "h1, h2, h3": { letterSpacing: "-0.035em", textWrap: "balance" },
      "::selection": { bg: "teal.muted" },
      "button, a, input, label": { touchAction: "manipulation" },
      "button:not(:disabled):active": { transform: "scale(0.97)" },
      "button, .event-card": {
        transition: "background-color 140ms ease, box-shadow 140ms ease, transform 140ms ease",
      },
      ".event-card:active": { transform: "scale(0.99)" },
      ".app-navigation": { backdropFilter: "blur(20px) saturate(150%)" },
      "@media (prefers-reduced-transparency: reduce)": {
        ".app-navigation": { bg: "bg.panel", backdropFilter: "none" },
      },
      "@media (prefers-contrast: more)": {
        ".app-navigation": { bg: "bg.panel", backdropFilter: "none", borderBottom: "1px solid", borderColor: "fg" },
        ".event-card": { borderColor: "fg" },
      },
      "@media (prefers-reduced-motion: reduce)": {
        "*, *::before, *::after": {
          scrollBehavior: "auto",
          animationDuration: "0.01ms !important",
          animationIterationCount: "1 !important",
          transitionDuration: "0.01ms !important",
        },
        "button:active, .event-card:active": { transform: "none" },
      },
    },
    theme: {
      tokens: { fonts: { body: { value: font }, heading: { value: font } } },
      semanticTokens: {
        colors: {
          bg: {
            DEFAULT: pair("#f4f5f3", "#151a16"),
            panel: pair("#ffffff", "#202821"),
            subtle: pair("#eef0ed", "#2a342c"),
            muted: pair("#e3e7e1", "#364338"),
            emphasized: pair("#d1d8cf", "#455448"),
            material: pair("rgba(255,255,255,.90)", "rgba(32,40,33,.92)"),
          },
          fg: {
            DEFAULT: pair("#223a28", "#f1f4e2"),
            muted: pair("#59645b", "#b5c0b3"),
            subtle: pair("#647066", "#a6b3a5"),
          },
          border: {
            DEFAULT: pair("#8a958c", "#697765"),
            subtle: pair("#dee3dc", "#3b483b"),
            muted: pair("#bcc5b9", "#8a958c"),
          },
          teal: {
            solid: pair("#536f08", "#a9c95b"),
            contrast: pair("#ffffff", "#223a28"),
            fg: pair("#32573b", "#c0da84"),
            subtle: pair("#f1f4e2", "#303e27"),
            muted: pair("#eaefd1", "#40522d"),
            emphasized: pair("#d7e3ad", "#586d38"),
            focusRing: pair("#6d910a", "#c0da84"),
          },
        },
      },
    },
  }),
);
