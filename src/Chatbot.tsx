import * as React from "react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { BottomSheet, BottomSheetContent } from "./components/ui/bottom-sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { cn } from "./lib/utils";
import { TestHighlight } from "./testHighlight";
import { useMediaQuery } from "./useMediaQuery";

type ViewMode = "doc" | "history";

/** Viewport width at which the chatbot switches to mobile layout. */
const MOBILE_BREAKPOINT_QUERY = "(max-width: 768px)";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A past snapshot of a document, used by the "이력보기" diff mode. */
export interface ChatbotRevision {
  id: string;
  label: string;
  updatedAt?: string;
  html: string;
}

export interface ChatbotVersion {
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

export interface ChatbotAnswer {
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

export interface ChatbotMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  historyId?: string;
  notFound?: boolean;
  /** Image URLs rendered below the bubble text (e.g. restored conversations). */
  images?: string[];
}

export interface ChatbotHistoryEntry {
  id: string;
  question: string;
  answer: ChatbotAnswer;
  askedAt: number;
}

/** Autocomplete suggestion shown live while the user types. */
export interface ChatbotSuggestion {
  id: string;
  /** Suggested question text — submitted to `/ask` when picked. */
  question: string;
  /** Optional secondary line (e.g. source path/href). */
  hint?: string | null;
}

export interface ChatbotProps {
  answers: ChatbotAnswer[];
  findAnswer?: (
    question: string,
    answers: ChatbotAnswer[],
  ) => ChatbotAnswer | null;
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function defaultMatchAnswer(
  question: string,
  answers: ChatbotAnswer[],
): ChatbotAnswer | null {
  const normalized = question.trim().toLowerCase();
  if (!normalized) return null;
  return (
    answers.find((answer) => {
      const keywords =
        answer.matchKeywords && answer.matchKeywords.length > 0
          ? answer.matchKeywords
          : [answer.question];
      return keywords.every((kw) => normalized.includes(kw.toLowerCase()));
    }) ?? null
  );
}

let _idCounter = 0;
function makeId(prefix: string): string {
  _idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${_idCounter}`;
}

// ---------------------------------------------------------------------------
// Icons (size via SVG attributes so host's rem base doesn't matter)
// ---------------------------------------------------------------------------

function CloseIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChatIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function SendIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Mode tab (segmented control)
// ---------------------------------------------------------------------------

function ModeTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        minWidth: "76px",
        height: "32px",
        padding: "0 14px",
        borderRadius: "8px",
        border: 0,
        cursor: "pointer",
        fontSize: "13px",
        lineHeight: "20px",
        fontWeight: active ? 700 : 500,
        background: active ? "var(--crg-surface, #FFFFFF)" : "transparent",
        color: active
          ? "var(--crg-foreground, #191C1D)"
          : "var(--crg-subtle, #5C5F5F)",
        boxShadow: active
          ? "0 1px 2px rgba(0, 0, 0, 0.06), 0 0 0 1px var(--crg-border, #E1E3E3) inset"
          : "none",
        transition: "background 0.15s ease, color 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Bubble
// ---------------------------------------------------------------------------

interface BubbleProps {
  role: "user" | "bot";
  children: React.ReactNode;
  notFound?: boolean;
  active?: boolean;
  /** Tighter touch sizing for mobile. */
  isMobile?: boolean;
  /** Show "문서 보기" CTA below the message text. */
  onOpenDocument?: () => void;
}

function DocumentIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  );
}

function Bubble({
  role,
  children,
  notFound,
  active,
  isMobile,
  onOpenDocument,
}: BubbleProps) {
  const isUser = role === "user";
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          alignItems: isUser ? "flex-end" : "flex-start",
          maxWidth: isMobile ? "92%" : "84%",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "16px",
            border: 0,
            fontSize: "16px",
            lineHeight: "24px",
            fontWeight: 500,
            wordBreak: "break-word",
            background: isUser
              ? "var(--crg-brand, #2563EB)"
              : "var(--crg-muted, #EFF1F1)",
            color: isUser
              ? "var(--crg-brand-foreground, #FFFFFF)"
              : notFound
                ? "var(--crg-subtle, #5C5F5F)"
                : "var(--crg-muted-foreground, #2E3132)",
            borderBottomRightRadius: isUser ? "4px" : "16px",
            borderBottomLeftRadius: !isUser ? "4px" : "16px",
            boxShadow:
              active && !isUser
                ? "0 0 0 2px var(--crg-brand, #2563EB)"
                : "none",
          }}
        >
          {children}
        </div>
        {onOpenDocument ? (
          <button
            type="button"
            onClick={onOpenDocument}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              height: isMobile ? "40px" : "34px",
              padding: "0 14px",
              borderRadius: "10px",
              border: "1px solid var(--crg-border, #E1E3E3)",
              background: active
                ? "var(--crg-brand, #2563EB)"
                : "var(--crg-surface, #FFFFFF)",
              color: active
                ? "var(--crg-brand-foreground, #FFFFFF)"
                : "var(--crg-foreground, #191C1D)",
              cursor: "pointer",
              fontSize: "13px",
              lineHeight: "20px",
              fontWeight: 600,
            }}
          >
            <DocumentIcon size={16} />
            관련 문서 보기
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chatbot
// ---------------------------------------------------------------------------

const ROOT_CLASS = "crg-chatbot-root";

export function Chatbot(props: ChatbotProps) {
  const {
    answers,
    findAnswer = defaultMatchAnswer,
    diffHtml,
    title = "도우미",
    subtitle = "무엇이든 물어보세요.",
    placeholder = "질문을 입력하세요",
    emptyMessage = "질문을 입력하면 답변과 매뉴얼을 보여드려요.",
    notFoundMessage = "일치하는 답변을 찾지 못했어요.",
    showSuggestions = true,
    fetchSuggestions,
    defaultOpen = false,
    className,
    onAsk,
    layout = "auto",
    initialMessages,
    embedded = false,
    onNewConversation,
  } = props;

  // Resolve effective layout (auto = pick by viewport width).
  const matchesMobileQuery = useMediaQuery(MOBILE_BREAKPOINT_QUERY);
  const isMobile =
    layout === "mobile"
      ? true
      : layout === "desktop"
        ? false
        : matchesMobileQuery;

  // Embedded: render inline filling the parent (no launcher, always open).
  // The chat panel fills its container and the doc viewer uses the BottomSheet
  // overlay (side-by-side desktop panels need fixed viewport space, which an
  // inline container doesn't provide).
  const panelFull = isMobile || embedded;
  const useBottomSheetViewer = isMobile || embedded;

  const [isOpen, setIsOpen] = useState(defaultOpen);
  // In embedded mode the panel is always open regardless of the toggle state.
  const effectiveOpen = embedded || isOpen;
  const [input, setInput] = useState("");
  // Live autocomplete (only active when `fetchSuggestions` is provided).
  const [suggestions, setSuggestions] = useState<ChatbotSuggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestActive, setSuggestActive] = useState(-1);
  const [messages, setMessages] = useState<ChatbotMessage[]>(
    initialMessages ?? [],
  );
  const [history, setHistory] = useState<ChatbotHistoryEntry[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(
    null,
  );
  /** Viewer mode: "doc" shows the latest version; "history" diffs two versions. */
  const [viewMode, setViewMode] = useState<ViewMode>("doc");
  /**
   * Controls viewer visibility. False by default so the bot first shows a
   * `[문서 보기]` button; clicking that button opens the viewer
   * (side panel on desktop, BottomSheet on mobile).
   */
  const [viewerOpen, setViewerOpen] = useState(false);
  /** History mode: user-pickable left/right version IDs. */
  const [diffFromVersionId, setDiffFromVersionId] = useState<string>("");
  const [diffToVersionId, setDiffToVersionId] = useState<string>("");
  /** Doc mode: user-pickable version to render (출처 문서 셀렉터). */
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");

  const reactId = useId().replace(/:/g, "");
  const containerId = `crg-chatbot-viewer-${reactId}`;
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedEntry = useMemo(
    () => history.find((e) => e.id === selectedHistoryId) ?? null,
    [history, selectedHistoryId],
  );
  const selectedAnswer = selectedEntry?.answer ?? null;
  const versions = selectedAnswer?.versions ?? [];
  const latestVersion = versions[versions.length - 1] ?? null;

  const selectedVersion = useMemo(
    () =>
      versions.find((v) => v.id === selectedVersionId) ??
      versions[0] ??
      latestVersion,
    [versions, selectedVersionId, latestVersion],
  );

  /**
   * History timeline of the SELECTED document: its past revisions
   * (oldest → newest) plus the current body as the last item.
   * Empty when the document has no revisions — the history feature is then
   * not rendered at all.
   */
  const revisionTimeline = useMemo<ChatbotRevision[]>(() => {
    if (!selectedVersion) return [];
    const past = selectedVersion.revisions ?? [];
    if (past.length === 0) return [];
    return [
      ...past,
      {
        id: `${selectedVersion.id}:current`,
        label: "현재본",
        updatedAt: selectedVersion.updatedAt,
        html: selectedVersion.html,
      },
    ];
  }, [selectedVersion]);

  const canHistory = Boolean(diffHtml) && revisionTimeline.length >= 2;
  const isHistoryMode = viewMode === "history" && canHistory;

  // 관련 문서 목록의 내용 시그니처. RAG 처럼 답변이 비동기로 도착해
  // versions 가 나중에 채워지는(또는 교체되는) 경우를 감지한다.
  const versionsKey = versions.map((v) => v.id).join("|");

  // 관련 문서 셀렉터 바인딩: 질문이 바뀌거나 versions 가 늦게 채워져도
  // 목록과 선택값이 다시 묶이도록 한다. 기존 선택이 목록에 남아 있으면 유지.
  useEffect(() => {
    setSelectedVersionId((prev) =>
      prev && versions.some((v) => v.id === prev)
        ? prev
        : (versions[0]?.id ?? ""),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHistoryId, versionsKey]);

  // Default left/right of the diff to the second-last and last revisions of
  // the selected document. Reset whenever the selected document changes.
  useEffect(() => {
    if (revisionTimeline.length >= 2) {
      setDiffFromVersionId(revisionTimeline[revisionTimeline.length - 2].id);
      setDiffToVersionId(revisionTimeline[revisionTimeline.length - 1].id);
    } else {
      setDiffFromVersionId("");
      setDiffToVersionId("");
    }
  }, [revisionTimeline]);

  const diffFromVersion =
    revisionTimeline.find((v) => v.id === diffFromVersionId) ??
    revisionTimeline[revisionTimeline.length - 2] ??
    null;
  const diffToVersion =
    revisionTimeline.find((v) => v.id === diffToVersionId) ??
    revisionTimeline[revisionTimeline.length - 1] ??
    null;

  const renderedHtml = useMemo(() => {
    if (!selectedAnswer || versions.length === 0) return "";
    if (isHistoryMode && diffHtml && diffFromVersion && diffToVersion) {
      return diffHtml(diffFromVersion.html, diffToVersion.html);
    }
    return selectedVersion?.html ?? "";
  }, [
    selectedAnswer,
    versions,
    isHistoryMode,
    diffHtml,
    selectedVersion,
    diffFromVersion,
    diffToVersion,
  ]);

  const highlightSentences = useMemo(() => {
    if (!selectedAnswer || isHistoryMode) return [];
    return selectedAnswer.highlightSentences ?? [];
  }, [selectedAnswer, isHistoryMode]);

  // If we leave history mode (or it becomes unavailable), fall back to doc.
  useEffect(() => {
    if (!canHistory && viewMode === "history") setViewMode("doc");
  }, [canHistory, viewMode]);

  useEffect(() => {
    if (scrollAnchorRef.current) {
      scrollAnchorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, isOpen]);

  // Auto-resize the message textarea to fit content (capped via maxHeight CSS).
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [input, isOpen]);

  // Live autocomplete — debounce the input and fetch suggestions. Each run
  // aborts the previous in-flight request so only the latest query wins.
  useEffect(() => {
    if (!fetchSuggestions) return;
    const q = input.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setSuggestOpen(false);
      setSuggestActive(-1);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetchSuggestions(q)
        .then((items) => {
          if (ctrl.signal.aborted) return;
          const next = items.slice(0, 8);
          setSuggestions(next);
          setSuggestOpen(next.length > 0);
          setSuggestActive(-1);
        })
        .catch(() => {
          if (ctrl.signal.aborted) return;
          setSuggestions([]);
          setSuggestOpen(false);
        });
    }, 150);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [input, fetchSuggestions]);

  const closeSuggestions = useCallback(() => {
    setSuggestOpen(false);
    setSuggestActive(-1);
  }, []);

  const ask = useCallback(
    (rawQuestion: string) => {
      const question = rawQuestion.trim();
      if (!question) return;

      const answer = findAnswer(question, answers);
      const userMessage: ChatbotMessage = {
        id: makeId("msg"),
        role: "user",
        text: question,
      };

      let botMessage: ChatbotMessage;
      if (answer) {
        const entryId = makeId("history");
        const entry: ChatbotHistoryEntry = {
          id: entryId,
          question,
          answer,
          askedAt: Date.now(),
        };
        setHistory((prev) => [...prev, entry]);
        setSelectedHistoryId(entryId);
        setViewMode("doc");
        botMessage = {
          id: makeId("msg"),
          role: "bot",
          text:
            answer.chatMessage ?? `“${answer.question}” 관련 문서를 찾았어요.`,
          historyId: entryId,
        };
      } else {
        botMessage = {
          id: makeId("msg"),
          role: "bot",
          text: notFoundMessage,
          notFound: true,
        };
      }

      setMessages((prev) => [...prev, userMessage, botMessage]);
      setInput("");
      closeSuggestions();
      onAsk?.(question, answer);
    },
    [answers, findAnswer, notFoundMessage, onAsk, isMobile, closeSuggestions],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  // Enter to send. Skip when IME (Korean Hangul) is composing so the
  // Enter that confirms a candidate doesn't also submit the form.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const composing =
      // Modern browsers expose isComposing on the native event.
      (e.nativeEvent as KeyboardEvent).isComposing ||
      // Legacy fallback: keyCode 229 is fired while IME composition is active.
      e.keyCode === 229;
    if (composing) return;

    // Autocomplete navigation takes priority while the dropdown is open.
    if (suggestOpen && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestActive((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        closeSuggestions();
        return;
      }
      if (e.key === "Enter" && !e.shiftKey && suggestActive >= 0) {
        e.preventDefault();
        handleSuggestion(suggestions[suggestActive].question);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(input);
    }
  };

  const handleSuggestion = (question: string) => {
    setInput(question);
    ask(question);
  };

  const handleNewConversation = () => {
    setMessages([]);
    setHistory([]);
    setSelectedHistoryId(null);
    setViewMode("doc");
    setViewerOpen(false);
    setInput("");
    // Notify the host so it can reset per-conversation state (e.g. session id).
    onNewConversation?.();
  };

  const handleSelectHistory = (id: string) => {
    setSelectedHistoryId(id);
    setViewMode("doc");
    setViewerOpen(true);
  };

  /** Open viewer for a specific history entry (called from "문서 보기" buttons). */
  const handleOpenDocument = (historyId: string) => {
    setSelectedHistoryId(historyId);
    setViewMode("doc");
    setViewerOpen(true);
  };

  // Whether the *desktop* side viewer panel should occupy space.
  // (Mobile and embedded use the BottomSheet so this is false there.)
  const showSideViewer =
    !useBottomSheetViewer && viewerOpen && history.length > 0;
  const showBottomSheet =
    useBottomSheetViewer && viewerOpen && history.length > 0;

  // Reusable inline styles (so host rem base never affects the layout)
  const panelBase: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "var(--crg-surface, #FFFFFF)",
    border: "1px solid var(--crg-border, #E1E3E3)",
    borderRadius: "14px",
    boxShadow: "var(--crg-shadow-elevation-02)",
    overflow: "hidden",
    pointerEvents: "auto",
  };

  /**
   * Renders the viewer body (header + meta row + reader). Used in both the
   * desktop side panel and the mobile BottomSheet.
   *
   * @param closeButton  Optional close affordance rendered in the header.
   *                     (Mobile BottomSheet already supplies its own close.)
   */
  const renderViewerBody = (closeButton?: React.ReactNode) => (
    <>
      {/* Header: history selector + mode tabs (+ optional close) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          padding: "16px 24px",
          borderBottom: "1px solid var(--crg-border, #E1E3E3)",
          background: "var(--crg-surface, #FFFFFF)",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span
            style={{
              flexShrink: 0,
              fontSize: "13px",
              lineHeight: "20px",
              fontWeight: 600,
              color: "var(--crg-subtle, #5C5F5F)",
            }}
          >
            관련 문서
          </span>
          <div style={{ flex: 1, minWidth: 0, maxWidth: "420px" }}>
            <Select
              value={selectedVersion?.id ?? ""}
              onValueChange={setSelectedVersionId}
              disabled={versions.length === 0}
            >
              <SelectTrigger aria-label="관련 문서 선택" className="crg-w-full">
                {/* 명시적 children: 드롭다운을 열기 전(아이템 미마운트)에도
                    선택된 문서 라벨이 트리거에 표시되도록 한다. */}
                <SelectValue placeholder="관련 문서를 선택하세요">
                  {selectedVersion ? selectedVersion.label : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          {selectedAnswer ? (
            <div
              role="tablist"
              aria-label="뷰어 모드"
              style={{
                display: "inline-flex",
                padding: "4px",
                borderRadius: "10px",
                background: "var(--crg-muted, #EFF1F1)",
              }}
            >
              <ModeTab
                label="문서"
                active={!isHistoryMode}
                onClick={() => setViewMode("doc")}
              />
              {canHistory ? (
                <ModeTab
                  label="이력보기"
                  active={isHistoryMode}
                  onClick={() => setViewMode("history")}
                />
              ) : null}
            </div>
          ) : null}
          {closeButton}
        </div>
      </div>

      {/* Meta row */}
      {selectedAnswer ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "12px 24px",
            background: "var(--crg-surface-alt, #FAFAFA)",
            borderBottom: "1px solid var(--crg-border, #E1E3E3)",
            fontSize: "13px",
            lineHeight: "20px",
            fontWeight: 500,
            color: "var(--crg-subtle, #5C5F5F)",
          }}
        >
          {isHistoryMode ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color: "var(--crg-muted-foreground, #2E3132)",
                }}
              >
                비교
              </span>
              <Select
                value={diffFromVersionId}
                onValueChange={setDiffFromVersionId}
              >
                <SelectTrigger aria-label="비교 기준 이력">
                  <SelectValue>
                    {diffFromVersion
                      ? `${diffFromVersion.label}${diffFromVersion.updatedAt ? ` · ${diffFromVersion.updatedAt}` : ""}`
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {revisionTimeline.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.label}
                      {v.updatedAt ? ` · ${v.updatedAt}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span aria-hidden="true">→</span>
              <Select
                value={diffToVersionId}
                onValueChange={setDiffToVersionId}
              >
                <SelectTrigger aria-label="비교 대상 이력">
                  <SelectValue>
                    {diffToVersion
                      ? `${diffToVersion.label}${diffToVersion.updatedAt ? ` · ${diffToVersion.updatedAt}` : ""}`
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {revisionTimeline.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.label}
                      {v.updatedAt ? ` · ${v.updatedAt}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <span>
              {selectedVersion?.updatedAt
                ? `최종 수정 ${selectedVersion.updatedAt}`
                : (selectedVersion?.label ?? "")}
            </span>
          )}
          {isHistoryMode ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "8px",
                    height: "8px",
                    borderRadius: "2px",
                    background: "#22c55e",
                  }}
                  aria-hidden="true"
                />
                추가
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "8px",
                    height: "8px",
                    borderRadius: "2px",
                    background: "#ef4444",
                  }}
                  aria-hidden="true"
                />
                삭제
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* HTML reader pane */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: isMobile ? "20px 20px 40px" : "28px 36px",
        }}
      >
        {!selectedAnswer ? (
          <div
            style={{
              padding: "48px 0",
              textAlign: "center",
              fontSize: "15px",
              lineHeight: "24px",
              fontWeight: 500,
              color: "var(--crg-subtle, #5C5F5F)",
            }}
          >
            채팅에서 답변을 받으면 여기에 문서가 표시됩니다.
          </div>
        ) : (
          <>
            <div
              id={containerId}
              className="crg-chatbot-html-view"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
            {highlightSentences.length > 0 ? (
              <TestHighlight
                containerId={containerId}
                sentences={highlightSentences}
                deps={[renderedHtml]}
              />
            ) : null}
          </>
        )}
      </div>
    </>
  );

  const viewerCloseButton = (
    <button
      type="button"
      aria-label="문서 닫기"
      onClick={() => setViewerOpen(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "32px",
        height: "32px",
        padding: 0,
        borderRadius: "8px",
        border: 0,
        cursor: "pointer",
        background: "transparent",
        color: "var(--crg-icon, #8E9192)",
      }}
    >
      <CloseIcon size={20} />
    </button>
  );

  // Container layout differs between mobile (fullscreen modal) and desktop
  // (panels float above the chat bubble at the bottom-right). The container
  // is always rendered so it can slide/fade in/out with a 200ms transition.
  const containerBaseStyle: React.CSSProperties = embedded
    ? {
        // Embedded: fill the host-provided container instead of overlaying the viewport.
        position: "relative",
        width: "100%",
        height: "100%",
        zIndex: 0,
        display: "flex",
      }
    : isMobile
      ? {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          display: "flex",
        }
      : {
          position: "fixed",
          top: "24px",
          left: "24px",
          right: "24px",
          // Sits above the floating bubble (24 + 56 + 16 = 96).
          bottom: "96px",
          zIndex: 1000,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          gap: "24px",
          // Gap between desktop panels should pass clicks through to host content.
          pointerEvents: "none",
        };

  // Desktop panel slides up only a touch (popover feel from the bubble); mobile
  // slides up from the full bottom edge.
  const closedTranslate = isMobile ? "translateY(100%)" : "translateY(16px)";

  // Mobile keeps a single close affordance (X in chat header) since the chat
  // panel fills the viewport. Desktop keeps the bubble visible so the chat
  // panel "pops out" of it and the bubble doubles as a close trigger.
  // Embedded mode hides the launcher entirely (panel is always shown inline).
  const showFloatingButton = !embedded && !(isOpen && isMobile);

  return (
    <div
      className={ROOT_CLASS}
      style={embedded ? { width: "100%", height: "100%" } : undefined}
    >
      {/* Floating bubble button. Desktop: persistent toggle (Chat ↔ X).
          Mobile: shown only while the fullscreen panel is closed. */}
      {showFloatingButton ? (
        <button
          type="button"
          aria-label={isOpen ? "도우미 닫기" : "도우미 열기"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            position: "fixed",
            right: "24px",
            bottom: "24px",
            zIndex: 1001,
            width: "56px",
            height: "56px",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "9999px",
            border: 0,
            cursor: "pointer",
            background: isOpen
              ? "var(--crg-subtle, #5C5F5F)"
              : "var(--crg-brand, #2563EB)",
            color: "var(--crg-brand-foreground, #FFFFFF)",
            boxShadow: "var(--crg-shadow-elevation-02)",
            transition: "background 200ms ease-out, transform 200ms ease-out",
          }}
        >
          {isOpen ? <CloseIcon size={24} /> : <ChatIcon size={28} />}
        </button>
      ) : null}

      {/* Panels container — always rendered so it can animate open/close.
          Embedded: always visible inline (no open/close transition). */}
      <div
        role="dialog"
        aria-label={title}
        aria-hidden={!effectiveOpen}
        className={cn(ROOT_CLASS, className)}
        style={{
          ...containerBaseStyle,
          opacity: effectiveOpen ? 1 : 0,
          transform: embedded
            ? undefined
            : effectiveOpen
              ? "translateY(0)"
              : closedTranslate,
          transformOrigin: isMobile ? undefined : "bottom right",
          pointerEvents: effectiveOpen
            ? (containerBaseStyle.pointerEvents ?? "auto")
            : "none",
          transition: embedded
            ? undefined
            : "transform 200ms ease-out, opacity 200ms ease-out",
        }}
      >
        {/* Chat panel — fills its container on mobile/embedded, fixed 420px on desktop (right) */}
        <section
          aria-label="채팅"
          style={
            panelFull
              ? {
                  ...panelBase,
                  width: "100%",
                  flex: 1,
                  borderRadius: embedded ? 14 : 0,
                  border: embedded ? panelBase.border : 0,
                  boxShadow: "none",
                }
              : {
                  ...panelBase,
                  width: "420px",
                  height: "min(680px, 100%)",
                  flexShrink: 0,
                  order: 2,
                }
          }
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "12px",
              padding: isMobile ? "14px 16px" : "20px 24px",
              borderBottom: "1px solid var(--crg-border, #E1E3E3)",
              background: "var(--crg-surface-alt, #FAFAFA)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontSize: isMobile ? "17px" : "20px",
                  lineHeight: isMobile ? "24px" : "28px",
                  fontWeight: 700,
                  color: "var(--crg-foreground, #191C1D)",
                }}
              >
                {title}
              </span>
              {subtitle ? (
                <span
                  style={{
                    fontSize: "14px",
                    lineHeight: "20px",
                    fontWeight: 500,
                    color: "var(--crg-subtle, #5C5F5F)",
                  }}
                >
                  {subtitle}
                </span>
              ) : null}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {messages.length > 0 ? (
                <button
                  type="button"
                  aria-label="새 대화"
                  onClick={handleNewConversation}
                  style={{
                    height: "32px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--crg-border, #E1E3E3)",
                    cursor: "pointer",
                    background: "var(--crg-surface, #FFFFFF)",
                    color: "var(--crg-muted-foreground, #2E3132)",
                    fontSize: "13px",
                    lineHeight: "20px",
                    fontWeight: 600,
                  }}
                >
                  + 새 대화
                </button>
              ) : null}
              {/* Embedded mode has nothing to close (always-open inline panel),
                  so the X button is omitted. */}
              {!embedded ? (
                <button
                  type="button"
                  aria-label="닫기"
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    padding: 0,
                    borderRadius: "8px",
                    border: 0,
                    cursor: "pointer",
                    background: "transparent",
                    color: "var(--crg-icon, #8E9192)",
                  }}
                >
                  <CloseIcon size={20} />
                </button>
              ) : null}
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              padding: isMobile ? "12px 14px" : "16px 20px",
            }}
          >
            <div
              style={{
                display: "flex",
                minHeight: "100%",
                flexDirection: "column",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              {messages.length === 0 ? (
                <div
                  style={{
                    padding: "32px 0",
                    textAlign: "center",
                    fontSize: "14px",
                    lineHeight: "24px",
                    fontWeight: 500,
                    color: "var(--crg-subtle, #5C5F5F)",
                  }}
                >
                  {emptyMessage}
                </div>
              ) : null}
              {messages.map((msg) => {
                const isActive =
                  !!msg.historyId &&
                  msg.historyId === selectedHistoryId &&
                  viewerOpen;
                // Re-read the answer's chatMessage on every render so callers
                // can mutate it in place (async RAG answers, streamed updates)
                // and trigger a re-render to update the bubble live.
                let renderedText = msg.text;
                let renderedImages = msg.images ?? [];
                if (msg.role === "bot" && msg.historyId) {
                  const entry = history.find((e) => e.id === msg.historyId);
                  if (entry?.answer.chatMessage !== undefined) {
                    renderedText = entry.answer.chatMessage;
                  }
                  if (entry?.answer.chatImages?.length) {
                    renderedImages = entry.answer.chatImages;
                  }
                }
                // Only show "문서 보기" CTA when the answer actually has
                // versions to view. Empty versions = chat-only answer.
                const docHistoryId =
                  msg.historyId &&
                  (() => {
                    const entry = history.find((e) => e.id === msg.historyId);
                    return entry && entry.answer.versions.length > 0
                      ? msg.historyId
                      : undefined;
                  })();
                return (
                  <Bubble
                    key={msg.id}
                    role={msg.role}
                    notFound={msg.notFound}
                    active={isActive}
                    isMobile={isMobile}
                    onOpenDocument={
                      docHistoryId
                        ? () => handleOpenDocument(docHistoryId as string)
                        : undefined
                    }
                  >
                    {renderedText}
                    {renderedImages.map((imageSrc) => (
                      <img
                        key={imageSrc}
                        src={imageSrc}
                        alt=""
                        loading="lazy"
                        style={{
                          display: "block",
                          maxWidth: "100%",
                          marginTop: "8px",
                          borderRadius: "8px",
                        }}
                      />
                    ))}
                  </Bubble>
                );
              })}
              <div ref={scrollAnchorRef} />
            </div>
          </div>

          {/* Static suggestion chips — only when live autocomplete is not wired. */}
          {showSuggestions &&
          !fetchSuggestions &&
          messages.length === 0 &&
          answers.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexWrap: isMobile ? "nowrap" : "wrap",
                gap: "8px",
                padding: isMobile ? "0 14px 12px" : "0 20px 12px",
                overflowX: isMobile ? "auto" : "visible",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {answers.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleSuggestion(a.question)}
                  style={{
                    flexShrink: 0,
                    height: isMobile ? "36px" : "32px",
                    padding: "0 14px",
                    fontSize: "13px",
                    lineHeight: "20px",
                    fontWeight: 500,
                    borderRadius: "16px",
                    border: "1px solid var(--crg-border, #E1E3E3)",
                    background: "var(--crg-surface, #FFFFFF)",
                    color: "var(--crg-muted-foreground, #2E3132)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {a.question}
                </button>
              ))}
            </div>
          ) : null}

          {/* Live autocomplete dropdown — shown above the input while typing. */}
          {fetchSuggestions && suggestOpen && suggestions.length > 0 ? (
            <div
              role="listbox"
              aria-label="추천 질문"
              style={{
                margin: isMobile ? "0 14px" : "0 20px",
                maxHeight: "240px",
                overflowY: "auto",
                border: "1px solid var(--crg-border, #E1E3E3)",
                borderRadius: "10px",
                background: "var(--crg-surface, #FFFFFF)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
              }}
            >
              {suggestions.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="option"
                  aria-selected={i === suggestActive}
                  // Use onMouseDown so the click fires before the textarea blur.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestion(s.question);
                  }}
                  onMouseEnter={() => setSuggestActive(i)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 14px",
                    border: 0,
                    borderBottom:
                      i < suggestions.length - 1
                        ? "1px solid var(--crg-border, #F0F1F1)"
                        : 0,
                    background:
                      i === suggestActive
                        ? "var(--crg-muted, #F2F4F4)"
                        : "transparent",
                    color: "var(--crg-foreground, #191C1D)",
                    fontSize: "14px",
                    lineHeight: "20px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.question}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "8px",
              padding: isMobile ? "10px 14px 14px" : "12px 20px 16px",
              borderTop: "1px solid var(--crg-border, #E1E3E3)",
              background: "var(--crg-surface, #FFFFFF)",
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              // Delay so a suggestion mousedown is handled before we close.
              onBlur={() => setTimeout(closeSuggestions, 120)}
              placeholder={placeholder}
              aria-label="메시지 입력 (Enter 전송, Shift+Enter 줄바꿈)"
              rows={1}
              style={{
                flex: 1,
                minHeight: "44px",
                maxHeight: "160px",
                padding: "10px 14px",
                fontSize: "16px",
                lineHeight: "24px",
                fontWeight: 500,
                borderRadius: "10px",
                border: "1px solid var(--crg-border, #E1E3E3)",
                background: "var(--crg-surface, #FFFFFF)",
                color: "var(--crg-foreground, #191C1D)",
                outline: "none",
                resize: "none",
                fontFamily: "inherit",
                overflowY: "auto",
              }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="전송"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "44px",
                height: "44px",
                padding: 0,
                borderRadius: "10px",
                border: 0,
                cursor: input.trim() ? "pointer" : "not-allowed",
                background: input.trim()
                  ? "var(--crg-brand, #2563EB)"
                  : "var(--crg-muted, #EFF1F1)",
                color: input.trim()
                  ? "var(--crg-brand-foreground, #FFFFFF)"
                  : "var(--crg-icon, #8E9192)",
              }}
            >
              <SendIcon size={20} />
            </button>
          </form>
        </section>

        {/* Desktop-only: viewer side panel. Hidden until [문서 보기] is clicked. */}
        {showSideViewer ? (
          <section
            aria-label="문서 뷰어"
            style={{
              ...panelBase,
              flex: 1,
              minWidth: 0,
              height: "min(720px, 100%)",
              order: 1,
            }}
          >
            {renderViewerBody(viewerCloseButton)}
          </section>
        ) : null}
      </div>

      {/* Mobile-only: viewer BottomSheet. Opens when [문서 보기] is tapped. */}
      {isMobile ? (
        <BottomSheet
          open={showBottomSheet}
          onOpenChange={(open) => setViewerOpen(open)}
        >
          <BottomSheetContent
            title={selectedEntry?.question ?? "문서"}
            srDescription="선택한 이력의 문서와 변경점을 표시합니다."
          >
            {renderViewerBody(undefined)}
          </BottomSheetContent>
        </BottomSheet>
      ) : null}
    </div>
  );
}
