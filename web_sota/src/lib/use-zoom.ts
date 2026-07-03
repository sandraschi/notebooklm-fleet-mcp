import { useCallback, useEffect, useState } from "react";

const ZOOM_LEVELS = [0.8, 1.0, 1.25, 1.5, 2.0, 3.0];

function applyCssZoom(level: number) {
	const root = document.documentElement;
	root.style.zoom = String(level);
}

export function useZoom() {
	const [, setZoomIndex] = useState(() => {
		try {
			const saved = localStorage.getItem("tauri-zoom");
			if (saved) {
				const idx = ZOOM_LEVELS.indexOf(parseFloat(saved));
				if (idx >= 0) return idx;
			}
		} catch {
			/* ignore */
		}
		return 0;
	});

	const applyZoom = useCallback(async (level: number) => {
		localStorage.setItem("tauri-zoom", String(level));
		try {
			const { getCurrentWindow } = await import("@tauri-apps/api/window");
			await (getCurrentWindow() as any).setZoom(level);
		} catch {
			applyCssZoom(level);
		}
	}, []);

	useEffect(() => {
		const handler = (e: WheelEvent) => {
			if (!e.ctrlKey) return;
			e.preventDefault();
			setZoomIndex((prev) => {
				const next =
					e.deltaY < 0
						? Math.min(prev + 1, ZOOM_LEVELS.length - 1)
						: Math.max(prev - 1, 0);
				if (next !== prev) applyZoom(ZOOM_LEVELS[next]);
				return next;
			});
		};
		window.addEventListener("wheel", handler, { passive: false });
		const saved = localStorage.getItem("tauri-zoom");
		if (saved) {
			const level = parseFloat(saved);
			if (ZOOM_LEVELS.includes(level)) applyZoom(level);
		}
		return () => window.removeEventListener("wheel", handler);
	}, [applyZoom]);
}
