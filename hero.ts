import { heroui } from "@heroui/theme";

export default heroui({
  themes: {
    light: {
      colors: {
        background: "#fafaf9",
        foreground: "#20372c",
        primary: { DEFAULT: "#326a4e", foreground: "#ffffff" },
      },
    },
    dark: {
      colors: {
        background: "#101815",
        foreground: "#edf4ef",
        content1: "#17211c",
        primary: { DEFAULT: "#8ac5a3", foreground: "#102319" },
      },
    },
  },
});
