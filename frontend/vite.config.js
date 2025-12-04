import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Mobile-first optimizations
    target: ["es2020", "edge88", "firefox78", "chrome87", "safari14"],

    // Enable code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // UI and animation libraries
          "vendor-ui": ["framer-motion", "lucide-react"],
          // Chart libraries
          "vendor-charts": ["recharts"],
          // Markdown and math rendering (heavy dependencies)
          "vendor-markdown": ["react-markdown", "remark-math", "rehype-katex"],
          // Socket and real-time features
          "vendor-realtime": ["socket.io-client"],
          // Other utilities
          "vendor-utils": ["react-confetti"],
        },
        // Asset file naming for better caching
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split(".").pop();
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = "images";
          } else if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            extType = "fonts";
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
      },
    },

    // Optimize chunk size for mobile
    chunkSizeWarningLimit: 500,

    // Enable minification
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: mode === "production", // Remove console in production
        drop_debugger: true,
        passes: 2, // Multiple passes for better compression
      },
      mangle: {
        safari10: true, // Safari 10 compatibility
      },
    },

    // CSS code splitting
    cssCodeSplit: true,

    // Source maps disabled for production
    sourcemap: false,

    // Reduce bundle size
    reportCompressedSize: true,
  },

  // Performance optimizations
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "framer-motion"],
    // Exclude heavy dependencies from pre-bundling
    exclude: ["@splinetool/react-spline"],
  },

  // Development server settings
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    // Enable HTTP/2 for faster loading
    hmr: {
      overlay: true,
      clientPort: 5173,
    },
    // Compression for dev server
    compress: true,
    // Configure headers for CORS and Google OAuth compatibility
    headers: {
      "Cross-Origin-Opener-Policy": "unsafe-none",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  },

  // Preview server settings (for production preview)
  preview: {
    port: 3000,
    strictPort: true,
    compress: true,
  },
}));
