import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative asset paths so the build works on GitHub Pages under /<repo>/.
  base: "./",
  plugins: [react()],
  // MapLibre alone is ~800 kB; one chunk is fine for a static site this size.
  build: { chunkSizeWarningLimit: 1500 },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
