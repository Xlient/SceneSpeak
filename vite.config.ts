import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // three.js only loads with the lazy 3D scene; its core and WebGL renderer download in parallel.
        codeSplitting: {
          groups: [
            { name: "three-core", test: /node_modules[\\/]three[\\/]build[\\/]three\.core/ },
            { name: "three-webgl", test: /node_modules[\\/]three[\\/]build[\\/]three\.module/ },
          ],
        },
      },
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
