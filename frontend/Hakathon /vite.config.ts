import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/Hakathon/",
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        about: 'about.html',
        services: 'services.html',
        doctors: 'doctors.html',
        contact: 'contact.html',
        login: 'login.html',
        signup: 'signup.html',
        404: '404.html'
      }
    }
  }
});
