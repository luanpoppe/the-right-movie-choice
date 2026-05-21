import { defineConfig } from "vitest/config";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsConfigPaths()],
  test: {
    dir: "src",
    globals: true,
    workspace: [
      {
        extends: true,
        test: {
          name: "unit",
          dir: "src/",
        },
      },
    ],
  },
});
