import { useCallback, useEffect, useRef, useState } from 'react';

interface Rect {
	top: number;
	left: number;
	width: number;
	height: number;
}

export function useElementRect(element: HTMLElement | null): Rect | null {
	const [rect, setRect] = useState<Rect | null>(null);
	const rafRef = useRef(0);

	const update = useCallback(() => {
		cancelAnimationFrame(rafRef.current);
		rafRef.current = requestAnimationFrame(() => {
			if (!element) {
				setRect(null);
				return;
			}
			const r = element.getBoundingClientRect();
			setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
		});
	}, [element]);

	useEffect(() => {
		if (!element) {
			setRect(null);
			return;
		}

		update();

		const ro = new ResizeObserver(update);
		ro.observe(element);

		window.addEventListener('scroll', update, true);
		window.addEventListener('resize', update);

		return () => {
			ro.disconnect();
			window.removeEventListener('scroll', update, true);
			window.removeEventListener('resize', update);
			cancelAnimationFrame(rafRef.current);
		};
	}, [element, update]);

	return rect;
}
