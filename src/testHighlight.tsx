import { useEffect } from 'react';

export interface TestHighlightOptions {
	/** Target container element id. Located via `document.getElementById`. */
	containerId: string;
	/** Sentences (or phrases) to highlight inside the container. */
	sentences: string[];
	/** Case-insensitive matching. Default: false. */
	caseInsensitive?: boolean;
	/** Animation duration per highlight (ms). Default: 800. */
	duration?: number;
	/** Stagger between consecutive highlight animations (ms). Default: 120. */
	stagger?: number;
}

export const TEST_HIGHLIGHT_CLASS = 'crg-test-highlight';

function escapeRegExp(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Finds the container by id, scans its text nodes, wraps any matches against
 * `sentences` in animated highlight spans, and returns a cleanup function that
 * removes the highlights.
 *
 * Limitation: matching is scoped to individual text nodes, so a sentence split
 * across nested elements (e.g. `<span>foo</span> bar`) will not be matched.
 */
export function testHighlight(options: TestHighlightOptions): () => void {
	const {
		containerId,
		sentences,
		caseInsensitive = false,
		duration = 800,
		stagger = 120,
	} = options;

	if (typeof document === 'undefined') return () => {};

	const container = document.getElementById(containerId);
	if (!container) return () => {};

	const phrases = Array.from(new Set(sentences.map((s) => s.trim()).filter(Boolean))).sort(
		(a, b) => b.length - a.length,
	);
	if (phrases.length === 0) return () => {};

	const regex = new RegExp(phrases.map(escapeRegExp).join('|'), caseInsensitive ? 'gi' : 'g');

	const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
		acceptNode(node) {
			let parent: Node | null = node.parentNode;
			while (parent && parent !== container) {
				if (parent instanceof HTMLElement) {
					if (parent.classList.contains(TEST_HIGHLIGHT_CLASS)) return NodeFilter.FILTER_REJECT;
					if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
						return NodeFilter.FILTER_REJECT;
					}
				}
				parent = parent.parentNode;
			}
			return node.nodeValue && node.nodeValue.length > 0
				? NodeFilter.FILTER_ACCEPT
				: NodeFilter.FILTER_REJECT;
		},
	});

	const textNodes: Text[] = [];
	let cursor = walker.nextNode();
	while (cursor) {
		textNodes.push(cursor as Text);
		cursor = walker.nextNode();
	}

	const created: HTMLElement[] = [];

	textNodes.forEach((node) => {
		const text = node.nodeValue ?? '';
		regex.lastIndex = 0;
		if (!regex.test(text)) return;
		regex.lastIndex = 0;

		const frag = document.createDocumentFragment();
		let lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = regex.exec(text)) !== null) {
			const start = match.index;
			const end = start + match[0].length;
			if (start > lastIndex) {
				frag.appendChild(document.createTextNode(text.slice(lastIndex, start)));
			}
			const mark = document.createElement('span');
			mark.className = TEST_HIGHLIGHT_CLASS;
			mark.textContent = match[0];
			created.push(mark);
			frag.appendChild(mark);
			lastIndex = end;
			if (match[0].length === 0) regex.lastIndex += 1;
		}
		if (lastIndex < text.length) {
			frag.appendChild(document.createTextNode(text.slice(lastIndex)));
		}

		node.parentNode?.replaceChild(frag, node);
	});

	created.forEach((el, i) => {
		el.style.animationDuration = `${duration}ms`;
		el.style.animationDelay = `${i * stagger}ms`;
	});

	return () => {
		created.forEach((el) => {
			const parent = el.parentNode;
			if (!parent) return;
			parent.replaceChild(document.createTextNode(el.textContent ?? ''), el);
			parent.normalize();
		});
	};
}

export interface TestHighlightProps extends TestHighlightOptions {
	/** Optional extra dependencies that should re-trigger highlighting. */
	deps?: ReadonlyArray<unknown>;
}

/**
 * Declarative wrapper around `testHighlight`. Renders nothing; applies highlights
 * to the container identified by `containerId` on mount and re-applies whenever
 * `containerId`, `sentences`, or `deps` change.
 */
export function TestHighlight({
	containerId,
	sentences,
	caseInsensitive,
	duration,
	stagger,
	deps,
}: TestHighlightProps): null {
	const sentencesKey = sentences.join('');

	useEffect(() => {
		return testHighlight({ containerId, sentences, caseInsensitive, duration, stagger });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [containerId, sentencesKey, caseInsensitive, duration, stagger, ...(deps ?? [])]);

	return null;
}
