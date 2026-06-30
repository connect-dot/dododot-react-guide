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
	activationDelay = 0,
): UseTargetElementResult {
	const [element, setElement] = useState<HTMLElement | null>(null);
	const [searching, setSearching] = useState(false);
	const [timedOut, setTimedOut] = useState(false);
	const observerRef = useRef<MutationObserver | null>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const activationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (activationTimerRef.current) clearTimeout(activationTimerRef.current);
		setElement(null);
		setSearching(false);
		setTimedOut(false);

		if (!targetId) return;

		const activateElement = (el: HTMLElement) => {
			const activate = () => {
				setElement(el);
				setSearching(false);
				if (scrollTo) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			};
			if (activationDelay > 0) {
				setSearching(true);
				activationTimerRef.current = setTimeout(activate, activationDelay);
				return;
			}
			activate();
		};

		const found = document.querySelector<HTMLElement>(`[data-guide-id="${targetId}"]`);

		if (found) {
			activateElement(found);
			return;
		}

		if (!waitForTarget) return;

		setSearching(true);

		observerRef.current = new MutationObserver(() => {
			const el = document.querySelector<HTMLElement>(`[data-guide-id="${targetId}"]`);
			if (el) {
				observerRef.current?.disconnect();
				if (timerRef.current) clearTimeout(timerRef.current);
				activateElement(el);
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
			if (activationTimerRef.current) clearTimeout(activationTimerRef.current);
		};
	}, [targetId, waitForTarget, scrollTo, activationDelay]);

	return { element, searching, timedOut };
}
