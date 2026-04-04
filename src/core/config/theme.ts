import type { ThemeConfig } from "antd";

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: "#A67458",
    borderRadius: 6,
    fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
  },
  components: {
    Button: {
      colorPrimary: "#A67458",
      algorithm: true,
    },
  },
};
