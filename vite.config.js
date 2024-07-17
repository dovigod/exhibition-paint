import { loadEnv, defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

// import { entryReplacementPlugin } from "@packages/plugins/vite";
// console.log(entryReplacementPlugin);
const config = defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [glsl()],
  };
});

export default config;
