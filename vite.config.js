import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to 'local' to load the .env.local file.
  const env = process.env;
  const useLocalAPI = env.USE_LOCAL_API === "true";

  return {
    plugins: [react(), tailwindcss()],
    define: {
      "import.meta.env.VITE_USE_LOCAL_API": JSON.stringify(useLocalAPI),
    },
  };
});
