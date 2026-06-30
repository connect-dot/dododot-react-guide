import * as react_jsx_runtime from 'react/jsx-runtime';
import React$1 from 'react';

type GuideAction = 'highlight-and-click' | 'highlight-only' | 'auto-click' | 'input';
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';
type GuideStatus = 'idle' | 'active' | 'waiting-target' | 'paused' | 'completed' | 'cancelled';
interface GuideStep {
    targetId: string;
    action: GuideAction;
    message: string;
    tooltipPosition?: TooltipPosition;
    delay?: number;
    waitForTarget?: boolean;
    scrollTo?: boolean;
    highlightPadding?: number;
}
interface GuideData {
    id: string;
    title?: string;
    cancelable: boolean;
    steps: GuideStep[];
}
interface GuideJson {
    guide: GuideData;
}
interface GuideState {
    status: GuideStatus;
    guideId: string | null;
    title: string;
    cancelable: boolean;
    steps: GuideStep[];
    currentStepIndex: number;
    error: string | null;
}
interface GuideUIComponents {
    renderButton?: (props: {
        variant: 'primary' | 'secondary';
        onClick: () => void;
        children: React.ReactNode;
    }) => React.ReactNode;
    showToast?: (message: string, type: 'success' | 'info') => void;
}
declare function validateGuideJson(data: unknown): data is GuideJson;

type GuideContextValue = GuideState & {
    currentStep: GuideStep | null;
    startGuide(json: GuideJson): void;
    advance(): void;
    goBack(): void;
    cancel(): void;
    reset(): void;
    goToStep(index: number): void;
    setWaiting(): void;
    setFound(): void;
    ui: GuideUIComponents;
};
interface GuideProviderProps {
    children: React$1.ReactNode;
    components?: GuideUIComponents;
}
declare function GuideProvider({ children, components }: GuideProviderProps): react_jsx_runtime.JSX.Element;
declare function useGuide(): GuideContextValue;

declare function GuideOverlay(): React$1.ReactPortal | null;

declare function GuideNotification(): React$1.ReactPortal | null;

declare const GUIDE_TARGETS: {
    readonly NAV_HOME: "nav-home";
    readonly NAV_DASHBOARD: "nav-dashboard";
    readonly NAV_SETTINGS: "nav-settings";
    readonly BTN_CREATE: "btn-create";
    readonly BTN_SAVE: "btn-save";
    readonly BTN_DELETE: "btn-delete";
    readonly INPUT_SEARCH: "input-search";
    readonly INPUT_NAME: "input-name";
};

interface ParsedGuideResponse {
    text: string;
    guide: GuideJson | null;
}
declare function parseGuideResponse(responseText: string): ParsedGuideResponse;

interface TestHighlightOptions {
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
declare const TEST_HIGHLIGHT_CLASS = "crg-test-highlight";
/**
 * Finds the container by id, scans its text nodes, wraps any matches against
 * `sentences` in animated highlight spans, and returns a cleanup function that
 * removes the highlights.
 *
 * Limitation: matching is scoped to individual text nodes, so a sentence split
 * across nested elements (e.g. `<span>foo</span> bar`) will not be matched.
 */
declare function testHighlight(options: TestHighlightOptions): () => void;
interface TestHighlightProps extends TestHighlightOptions {
    /** Optional extra dependencies that should re-trigger highlighting. */
    deps?: ReadonlyArray<unknown>;
}
/**
 * Declarative wrapper around `testHighlight`. Renders nothing; applies highlights
 * to the container identified by `containerId` on mount and re-applies whenever
 * `containerId`, `sentences`, or `deps` change.
 */
declare function TestHighlight({ containerId, sentences, caseInsensitive, duration, stagger, deps, }: TestHighlightProps): null;

/** A past snapshot of a document, used by the "이력보기" diff mode. */
interface ChatbotRevision {
    id: string;
    label: string;
    updatedAt?: string;
    html: string;
}
interface ChatbotVersion {
    id: string;
    label: string;
    updatedAt?: string;
    html: string;
    /**
     * Past snapshots of THIS document (oldest → newest), excluding the current
     * body (`html`). When present the viewer exposes the "이력보기" tab and the
     * diff selectors compare these revisions (+ the current body). When absent
     * or empty the history feature is not rendered at all.
     */
    revisions?: ChatbotRevision[];
}
interface ChatbotAnswer {
    id: string;
    question: string;
    matchKeywords?: string[];
    highlightSentences?: string[];
    versions: ChatbotVersion[];
    /**
     * Optional bot bubble text override. When set the chat bubble shows this
     * string instead of the default `"${question}" 관련 문서를 찾았어요.` template.
     *
     * The bubble text is re-read from the answer on every render, so callers can
     * mutate `chatMessage` in place (e.g. when an async RAG response arrives) and
     * trigger a re-render to update the message live without pushing a new entry.
     */
    chatMessage?: string;
    /**
     * Optional image URLs rendered below the bot bubble text. Re-read on every
     * render like `chatMessage`, so async callers can mutate it in place.
     */
    chatImages?: string[];
}
interface ChatbotMessage {
    id: string;
    role: "user" | "bot";
    text: string;
    historyId?: string;
    notFound?: boolean;
    /** Image URLs rendered below the bubble text (e.g. restored conversations). */
    images?: string[];
}
interface ChatbotHistoryEntry {
    id: string;
    question: string;
    answer: ChatbotAnswer;
    askedAt: number;
}
/** Autocomplete suggestion shown live while the user types. */
interface ChatbotSuggestion {
    id: string;
    /** Suggested question text — submitted to `/ask` when picked. */
    question: string;
    /** Optional secondary line (e.g. source path/href). */
    hint?: string | null;
}
interface ChatbotProps {
    answers: ChatbotAnswer[];
    findAnswer?: (question: string, answers: ChatbotAnswer[]) => ChatbotAnswer | null;
    diffHtml?: (previous: string, latest: string) => string;
    title?: string;
    subtitle?: string;
    placeholder?: string;
    emptyMessage?: string;
    notFoundMessage?: string;
    showSuggestions?: boolean;
    /**
     * Live autocomplete. When provided, the chat input fetches suggestions as the
     * user types (debounced) and shows them in a dropdown above the input;
     * picking one submits it to `onAsk`. Supplying this replaces the static
     * suggestion chips. Memoize the callback so the debounce effect is stable.
     */
    fetchSuggestions?: (query: string) => Promise<ChatbotSuggestion[]>;
    defaultOpen?: boolean;
    className?: string;
    onAsk?: (question: string, answer: ChatbotAnswer | null) => void;
    /**
     * Called when the user starts a new conversation via the header "+ 새 대화"
     * button. The host can use this to reset its own per-conversation state
     * (e.g. a server session id) so the next question starts a fresh session.
     */
    onNewConversation?: () => void;
    /**
     * Layout variant.
     * - `'auto'` (default): desktop layout above 768px, mobile layout below.
     * - `'desktop'`: forces side-by-side panels (chat right, viewer left).
     * - `'mobile'`: forces full-width chat + BottomSheet viewer.
     */
    layout?: "auto" | "desktop" | "mobile";
    /**
     * Messages to pre-fill the chat with on mount (e.g. restoring a previous
     * conversation after a page refresh). Read once as the initial state.
     */
    initialMessages?: ChatbotMessage[];
    /**
     * Embedded mode. When true the chat is rendered inline filling its parent
     * container (width/height 100%) instead of as a floating overlay: the launcher
     * button is hidden and the panel is always open. Works for both desktop and
     * mobile viewports. The host should wrap `<Chatbot embedded />` in a sized,
     * positioned container. The document viewer uses the BottomSheet (overlay)
     * presentation so it does not depend on side-by-side desktop space.
     */
    embedded?: boolean;
}
declare function defaultMatchAnswer(question: string, answers: ChatbotAnswer[]): ChatbotAnswer | null;
declare function Chatbot(props: ChatbotProps): react_jsx_runtime.JSX.Element;

export { Chatbot, type ChatbotAnswer, type ChatbotHistoryEntry, type ChatbotMessage, type ChatbotProps, type ChatbotRevision, type ChatbotVersion, GUIDE_TARGETS, type GuideAction, type GuideData, type GuideJson, GuideNotification, GuideOverlay, GuideProvider, type GuideStatus, type GuideStep, type GuideUIComponents, TEST_HIGHLIGHT_CLASS, TestHighlight, type TestHighlightOptions, type TestHighlightProps, defaultMatchAnswer, parseGuideResponse, testHighlight, useGuide, validateGuideJson };
