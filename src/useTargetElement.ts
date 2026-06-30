import { useEffect, useRef, useState } from 'react';

interface UseTargetElementResult {
	element: HTMLElement | null;
	searching: boolean;
	timedOut: boolean;
}

const TARGET_TIMEOUT = 10_000;

export function useTargetElement(
	targetId: string | null,
	waitForTarget = true,
	scrollTo = true,
): UseTargetElementResult {
	const [element, setElement] = useState<HTMLElement | null>(null);
	const [searching, setSearching] = useState(false);
	const [timedOut, setTimedOut] = useState(false);
	const observerRef = useRef<MutationObserver | null>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		setElement(null);
		setSearching(false);
		setTimedOut(false);

		if (!targetId) return;

		const found = document.querySelector<HTMLElement>(`[data-guide-id="${targetId}"]`);

		if (found) {
			setElement(found);
			if (scrollTo) found.scrollIntoView({ behavior: 'smooth', block: 'center' });
			return;
		}

		if (!waitForTarget) return;

		setSearching(true);

		observerRef.current = new MutationObserver(() => {
			const el = document.querySelector<HTMLElement>(`[data-guide-id="${targetId}"]`);
			if (el) {
				observerRef.current?.disconnect();
				if (timerRef.current) clearTimeout(timerRef.current);
				setElement(el);
				setSearching(false);
				if (scrollTo) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		});

		observerRef.current.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['data-guide-id'],
		});

		timerRef.current = setTimeout(() => {
			observerRef.current?.disconnect();
			setSearching(false);
			setTimedOut(true);
		}, TARGET_TIMEOUT);

		return () => {
			observerRef.current?.disconnect();
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [targetId, waitForTarget, scrollTo]);

	return { element, searching, timedOut };
}
