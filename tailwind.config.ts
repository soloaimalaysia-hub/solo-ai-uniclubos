import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // UniClub OS Brand
        'uco-blue': '#1E3A8A',
        'uco-blue-light': '#2563EB',
        'uco-blue-dark': '#1e2f6b',
        'uco-orange': '#F97316',
        'uco-orange-light': '#FB923C',
        'uco-orange-dark': '#EA580C',
        'uco-surface': '#F8FAFC',
        'uco-surface-2': '#F1F5F9',
        'uco-text': '#1E293B',
        'uco-text-muted': '#64748B',
        'uco-border': '#E2E8F0',
        'uco-success': '#10B981',
        'uco-warning': '#F59E0B',
        'uco-danger': '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'uco-card': '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
        'uco-lg': '0 10px 25px -5px rgba(30,58,138,0.08), 0 8px 10px -6px rgba(30,58,138,0.04)',
      },
    },
  },
  plugins: [],
};
export default config;
