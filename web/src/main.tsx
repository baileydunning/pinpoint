
// Set theme before React renders
(() => {
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('theme');
		let theme: 'dark' | 'light';
		if (stored === 'dark' || stored === 'light') {
			theme = stored;
		} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			theme = 'dark';
		} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
			theme = 'light';
		} else {
			theme = 'dark';
		}
		if (theme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}
})();


import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "@/hooks/ThemeProvider";

createRoot(document.getElementById("root")!).render(
	<ThemeProvider>
		<App />
	</ThemeProvider>
);
