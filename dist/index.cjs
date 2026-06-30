'use strict';

var React6 = require('react');
var jsxRuntime = require('react/jsx-runtime');
var reactDom = require('react-dom');
var reactSlot = require('@radix-ui/react-slot');
var classVarianceAuthority = require('class-variance-authority');
var clsx = require('clsx');
var tailwindMerge = require('tailwind-merge');
var DialogPrimitive = require('@radix-ui/react-dialog');
var SelectPrimitive = require('@radix-ui/react-select');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React6__namespace = /*#__PURE__*/_interopNamespace(React6);
var DialogPrimitive__namespace = /*#__PURE__*/_interopNamespace(DialogPrimitive);
var SelectPrimitive__namespace = /*#__PURE__*/_interopNamespace(SelectPrimitive);

// src/GuideContext.tsx

// src/types.ts
function validateGuideJson(data) {
  if (typeof data !== "object" || data === null) return false;
  const obj = data;
  if (typeof obj.guide !== "object" || obj.guide === null) return false;
  const guide = obj.guide;
  if (!Array.isArray(guide.steps) || guide.steps.length === 0) return false;
  if (typeof guide.id !== "string") return false;
  return guide.steps.every((step) => {
    if (typeof step !== "object" || step === null) return false;
    const s = step;
    return typeof s.targetId === "string" && typeof s.action === "string" && typeof s.message === "string";
  });
}
var initialState = {
  status: "idle",
  guideId: null,
  title: "",
  cancelable: true,
  steps: [],
  currentStepIndex: 0,
  error: null
};
function reducer(state, action) {
  switch (action.type) {
    case "START_GUIDE":
      return {
        ...initialState,
        status: "active",
        guideId: action.payload.guide.id,
        title: action.payload.guide.title ?? "",
        cancelable: action.payload.guide.cancelable,
        steps: action.payload.guide.steps,
        currentStepIndex: 0
      };
    case "NEXT_STEP": {
      const next = state.currentStepIndex + 1;
      if (next >= state.steps.length) {
        return { ...state, status: "completed" };
      }
      return { ...state, currentStepIndex: next, status: "active" };
    }
    case "PREV_STEP": {
      const prev = Math.max(0, state.currentStepIndex - 1);
      return { ...state, currentStepIndex: prev, status: "active" };
    }
    case "GO_TO_STEP":
      if (action.payload < 0 || action.payload >= state.steps.length) return state;
      return { ...state, currentStepIndex: action.payload, status: "active" };
    case "WAITING_TARGET":
      return { ...state, status: "waiting-target" };
    case "TARGET_FOUND":
      return { ...state, status: "active" };
    case "CANCEL":
      return { ...state, status: "cancelled" };
    case "COMPLETE":
      return { ...state, status: "completed" };
    case "RESET":
      return initialState;
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}
var GuideContext = React6.createContext(null);
function GuideProvider({ children, components }) {
  const ui = React6.useMemo(() => components ?? {}, [components]);
  const [state, dispatch] = React6.useReducer(reducer, initialState);
  const currentStep = React6.useMemo(
    () => state.steps[state.currentStepIndex] ?? null,
    [state.steps, state.currentStepIndex]
  );
  const startGuide = React6.useCallback((json) => {
    if (!validateGuideJson(json)) {
      dispatch({ type: "SET_ERROR", payload: "Invalid guide JSON" });
      return;
    }
    dispatch({ type: "START_GUIDE", payload: json });
  }, []);
  const advance = React6.useCallback(() => dispatch({ type: "NEXT_STEP" }), []);
  const goBack = React6.useCallback(() => dispatch({ type: "PREV_STEP" }), []);
  const cancel = React6.useCallback(() => dispatch({ type: "CANCEL" }), []);
  const reset = React6.useCallback(() => dispatch({ type: "RESET" }), []);
  const goToStep = React6.useCallback(
    (index) => dispatch({ type: "GO_TO_STEP", payload: index }),
    []
  );
  const setWaiting = React6.useCallback(() => dispatch({ type: "WAITING_TARGET" }), []);
  const setFound = React6.useCallback(() => dispatch({ type: "TARGET_FOUND" }), []);
  const value = React6.useMemo(
    () => ({
      ...state,
      currentStep,
      startGuide,
      advance,
      goBack,
      cancel,
      reset,
      goToStep,
      setWaiting,
      setFound,
      ui
    }),
    [
      state,
      currentStep,
      startGuide,
      advance,
      goBack,
      cancel,
      reset,
      goToStep,
      setWaiting,
      setFound,
      ui
    ]
  );
  return /* @__PURE__ */ jsxRuntime.jsx(GuideContext.Provider, { value, children });
}
function useGuide() {
  const ctx = React6.useContext(GuideContext);
  if (!ctx) throw new Error("useGuide must be used within GuideProvider");
  return ctx;
}
var twMerge = tailwindMerge.extendTailwindMerge({ prefix: "crg-" });
function cn(...inputs) {
  return twMerge(clsx.clsx(inputs));
}
var buttonVariants = classVarianceAuthority.cva(
  "crg-inline-flex crg-items-center crg-justify-center crg-whitespace-nowrap crg-rounded-md crg-text-sm crg-font-medium crg-transition-colors crg-cursor-pointer crg-border-0 disabled:crg-pointer-events-none disabled:crg-opacity-50",
  {
    variants: {
      variant: {
        primary: "crg-bg-brand crg-text-brand-foreground hover:crg-bg-brand/90",
        secondary: "crg-bg-muted crg-text-muted-foreground hover:crg-bg-muted/80",
        ghost: "crg-bg-transparent crg-text-icon hover:crg-text-foreground crg-p-1 crg-leading-none"
      },
      size: {
        default: "crg-h-9 crg-px-4 crg-py-2",
        icon: "crg-h-7 crg-w-7 crg-text-lg"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
);
var Button = React6__namespace.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? reactSlot.Slot : "button";
    return /* @__PURE__ */ jsxRuntime.jsx(
      Comp,
      {
        className: cn(buttonVariants({ variant, size, className })),
        ref,
        ...props
      }
    );
  }
);
Button.displayName = "Button";

// src/tooltipPosition.ts
var TOOLTIP_WIDTH = 320;
var GAP = 12;
var EDGE_MARGIN = 16;
function pickBestDirection(rect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaces = {
    bottom: vh - (rect.top + rect.height),
    top: rect.top,
    right: vw - (rect.left + rect.width),
    left: rect.left
  };
  return Object.entries(spaces).sort((a, b) => b[1] - a[1])[0][0];
}
function clampX(x) {
  const vw = window.innerWidth;
  return Math.max(EDGE_MARGIN, Math.min(x, vw - TOOLTIP_WIDTH - EDGE_MARGIN));
}
function getTooltipPosition(rect, position, padding) {
  const dir = position === "auto" ? pickBestDirection(rect) : position;
  const centerX = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
  switch (dir) {
    case "bottom":
      return {
        position: "fixed",
        top: rect.top + rect.height + padding + GAP,
        left: clampX(centerX),
        width: TOOLTIP_WIDTH
      };
    case "top":
      return {
        position: "fixed",
        bottom: window.innerHeight - rect.top + padding + GAP,
        left: clampX(centerX),
        width: TOOLTIP_WIDTH
      };
    case "right":
      return {
        position: "fixed",
        top: rect.top + rect.height / 2,
        left: rect.left + rect.width + padding + GAP,
        width: TOOLTIP_WIDTH,
        transform: "translateY(-50%)"
      };
    case "left":
      return {
        position: "fixed",
        top: rect.top + rect.height / 2,
        left: rect.left - padding - GAP - TOOLTIP_WIDTH,
        width: TOOLTIP_WIDTH,
        transform: "translateY(-50%)"
      };
    default:
      return {
        position: "fixed",
        top: rect.top + rect.height + padding + GAP,
        left: clampX(centerX),
        width: TOOLTIP_WIDTH
      };
  }
}
function useElementRect(element) {
  const [rect, setRect] = React6.useState(null);
  const rafRef = React6.useRef(0);
  const update = React6.useCallback(() => {
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
  React6.useEffect(() => {
    if (!element) {
      setRect(null);
      return;
    }
    update();
    const ro = new ResizeObserver(update);
    ro.observe(element);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      cancelAnimationFrame(rafRef.current);
    };
  }, [element, update]);
  return rect;
}
var TARGET_TIMEOUT = 1e4;
function useTargetElement(targetId, waitForTarget = true, scrollTo = true) {
  const [element, setElement] = React6.useState(null);
  const [searching, setSearching] = React6.useState(false);
  const [timedOut, setTimedOut] = React6.useState(false);
  const observerRef = React6.useRef(null);
  const timerRef = React6.useRef(null);
  React6.useEffect(() => {
    setElement(null);
    setSearching(false);
    setTimedOut(false);
    if (!targetId) return;
    const found = document.querySelector(`[data-guide-id="${targetId}"]`);
    if (found) {
      setElement(found);
      if (scrollTo) found.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!waitForTarget) return;
    setSearching(true);
    observerRef.current = new MutationObserver(() => {
      const el = document.querySelector(`[data-guide-id="${targetId}"]`);
      if (el) {
        observerRef.current?.disconnect();
        if (timerRef.current) clearTimeout(timerRef.current);
        setElement(el);
        setSearching(false);
        if (scrollTo) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-guide-id"]
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
var Z_BACKDROP = 99999;
var Z_TOOLTIP = 1e5;
function getClipPath(rect, pad) {
  const t = rect.top - pad;
  const l = rect.left - pad;
  const r = rect.left + rect.width + pad;
  const b = rect.top + rect.height + pad;
  return `polygon(0% 0%, 0% 100%, ${l}px 100%, ${l}px ${t}px, ${r}px ${t}px, ${r}px ${b}px, ${l}px ${b}px, ${l}px 100%, 100% 100%, 100% 0%)`;
}
var ACTION_HINTS = {
  "highlight-and-click": "\uD574\uB2F9 \uC601\uC5ED\uC744 \uD074\uB9AD\uD558\uC138\uC694",
  "highlight-only": "",
  "auto-click": "\uC790\uB3D9\uC73C\uB85C \uC9C4\uD589\uB429\uB2C8\uB2E4...",
  input: ""
};
function DefaultButton({
  variant,
  onClick,
  children
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(Button, { variant, onClick, children });
}
function GuideOverlay() {
  const { status, currentStep, steps, currentStepIndex, cancelable, advance, goBack, cancel, ui } = useGuide();
  const renderButton = ui.renderButton ? ui.renderButton : (props) => /* @__PURE__ */ jsxRuntime.jsx(DefaultButton, { ...props });
  const { element, searching, timedOut } = useTargetElement(
    status === "idle" || status === "completed" || status === "cancelled" ? null : currentStep?.targetId ?? null,
    currentStep?.waitForTarget ?? true,
    currentStep?.scrollTo ?? true
  );
  const rect = useElementRect(element);
  const pad = currentStep?.highlightPadding ?? 8;
  React6.useEffect(() => {
    if (currentStep?.action === "highlight-and-click" && element && status === "active") {
      const handler = () => setTimeout(advance, 50);
      element.addEventListener("click", handler);
      return () => element.removeEventListener("click", handler);
    }
  }, [currentStep, element, status, advance]);
  React6.useEffect(() => {
    if (currentStep?.action === "auto-click" && element && status === "active") {
      const timer = setTimeout(() => {
        element.click();
        advance();
      }, currentStep.delay ?? 800);
      return () => clearTimeout(timer);
    }
  }, [currentStep, element, status, advance]);
  React6.useEffect(() => {
    if (currentStep?.action === "input" && element && status === "active") {
      element.focus();
    }
  }, [currentStep, element, status]);
  if (status === "idle" || status === "completed" || status === "cancelled") return null;
  const loadingClass = cn(
    "crg-fixed crg-top-1/2 crg-left-1/2 -crg-translate-x-1/2 -crg-translate-y-1/2",
    "crg-bg-surface crg-rounded-2xl crg-shadow-crg-tooltip",
    "crg-px-8 crg-py-6 crg-text-[15px] crg-text-subtle"
  );
  if (searching) {
    return reactDom.createPortal(
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: loadingClass, style: { zIndex: Z_TOOLTIP }, children: "\uD654\uBA74\uC744 \uC900\uBE44\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4..." }),
      document.body
    );
  }
  if (timedOut) {
    return reactDom.createPortal(
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: loadingClass, style: { zIndex: Z_TOOLTIP }, children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "crg-mb-4", children: "\uC694\uC18C\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4" }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "crg-flex crg-justify-end crg-gap-2", children: [
          renderButton({ variant: "secondary", onClick: cancel, children: "\uAC00\uC774\uB4DC \uC885\uB8CC" }),
          renderButton({ variant: "primary", onClick: advance, children: "\uAC74\uB108\uB6F0\uAE30" })
        ] })
      ] }),
      document.body
    );
  }
  if (!rect) return null;
  const tooltipPos = getTooltipPosition(rect, currentStep?.tooltipPosition ?? "auto", pad);
  const hint = ACTION_HINTS[currentStep?.action ?? ""] ?? "";
  const isLast = currentStepIndex === steps.length - 1;
  const isFirst = currentStepIndex === 0;
  const showNav = currentStep?.action === "highlight-only" || currentStep?.action === "input";
  const backdropStyle = {
    zIndex: Z_BACKDROP,
    background: "rgba(0, 0, 0, var(--crg-backdrop-opacity, 0.55))",
    clipPath: getClipPath(rect, pad)
  };
  const highlightStyle = {
    zIndex: Z_BACKDROP,
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2
  };
  const tooltipStyle = {
    zIndex: Z_TOOLTIP,
    ...tooltipPos
  };
  return reactDom.createPortal(
    /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "div",
        {
          className: "crg-fixed crg-inset-0 crg-transition-[clip-path] crg-duration-300 crg-ease-in-out",
          style: backdropStyle,
          onClick: cancelable ? cancel : void 0
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        "div",
        {
          className: cn(
            "crg-fixed crg-pointer-events-none crg-rounded crg-transition-all crg-duration-300 crg-ease-in-out",
            "crg-border-2 crg-border-solid crg-shadow-crg-highlight"
          ),
          style: { ...highlightStyle, borderColor: "var(--crg-brand, #4F46E5)" }
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsxs(
        "div",
        {
          className: "crg-fixed crg-box-border crg-bg-surface crg-rounded-2xl crg-shadow-crg-tooltip crg-px-6 crg-py-5",
          style: tooltipStyle,
          children: [
            /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "crg-flex crg-justify-between crg-items-center crg-mb-3", children: [
              /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "crg-text-[13px] crg-text-subtle crg-font-semibold", children: [
                currentStepIndex + 1,
                " / ",
                steps.length
              ] }),
              cancelable && /* @__PURE__ */ jsxRuntime.jsx(Button, { variant: "ghost", size: "icon", onClick: cancel, "aria-label": "\uAC00\uC774\uB4DC \uB2EB\uAE30", children: "\u2715" })
            ] }),
            /* @__PURE__ */ jsxRuntime.jsx("div", { className: "crg-text-[15px] crg-leading-relaxed crg-text-foreground crg-mb-4", children: currentStep?.message }),
            hint && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "crg-text-[13px] crg-text-brand crg-mb-3 crg-font-medium", children: hint }),
            showNav && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "crg-flex crg-justify-end crg-gap-2", children: [
              !isFirst && renderButton({ variant: "secondary", onClick: goBack, children: "\uC774\uC804" }),
              renderButton({
                variant: "primary",
                onClick: advance,
                children: currentStep?.action === "input" ? "\uC785\uB825 \uC644\uB8CC" : isLast ? "\uC644\uB8CC" : "\uB2E4\uC74C"
              })
            ] })
          ]
        }
      )
    ] }),
    document.body
  );
}
var TOAST_ZINDEX = 100001;
function GuideNotification() {
  const { status, reset, ui } = useGuide();
  const [visible, setVisible] = React6.useState(false);
  const [lastStatus, setLastStatus] = React6.useState(status);
  React6.useEffect(() => {
    if (status === "completed" || status === "cancelled") {
      setLastStatus(status);
      if (ui.showToast) {
        const message = status === "completed" ? "\uAC00\uC774\uB4DC\uB97C \uC644\uB8CC\uD588\uC2B5\uB2C8\uB2E4!" : "\uAC00\uC774\uB4DC\uAC00 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.";
        const type = status === "completed" ? "success" : "info";
        ui.showToast(message, type);
        setTimeout(reset, 300);
        return;
      }
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(reset, 300);
      }, 3e3);
      return () => clearTimeout(timer);
    }
  }, [status, reset, ui]);
  if (ui.showToast) return null;
  if (status !== "completed" && status !== "cancelled" && !visible) return null;
  const isCompleted = lastStatus === "completed";
  return reactDom.createPortal(
    /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        className: cn(
          "crg-fixed crg-bottom-6 crg-left-1/2 -crg-translate-x-1/2",
          "crg-rounded-xl crg-px-7 crg-py-3.5",
          "crg-text-[15px] crg-font-medium crg-text-white",
          "crg-shadow-toast crg-transition-all crg-duration-300 crg-ease-in-out",
          isCompleted ? "crg-bg-success" : "crg-bg-subtle",
          visible ? "crg-opacity-100 crg-translate-y-0" : "crg-opacity-0 crg-translate-y-2.5 crg-pointer-events-none"
        ),
        style: { zIndex: TOAST_ZINDEX },
        children: isCompleted ? "\uAC00\uC774\uB4DC\uB97C \uC644\uB8CC\uD588\uC2B5\uB2C8\uB2E4!" : "\uAC00\uC774\uB4DC\uAC00 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
      }
    ),
    document.body
  );
}

// src/targetRegistry.ts
var GUIDE_TARGETS = {
  NAV_HOME: "nav-home",
  NAV_DASHBOARD: "nav-dashboard",
  NAV_SETTINGS: "nav-settings",
  BTN_CREATE: "btn-create",
  BTN_SAVE: "btn-save",
  BTN_DELETE: "btn-delete",
  INPUT_SEARCH: "input-search",
  INPUT_NAME: "input-name"
};

// src/parseGuideResponse.ts
function parseGuideResponse(responseText) {
  const codeBlockRegex = /```guide\s*\n?([\s\S]*?)\n?```/;
  const match = responseText.match(codeBlockRegex);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (validateGuideJson(parsed)) {
        return {
          text: responseText.replace(codeBlockRegex, "").trim(),
          guide: parsed
        };
      }
    } catch {
    }
  }
  try {
    const parsed = JSON.parse(responseText);
    if (validateGuideJson(parsed)) {
      return { text: "", guide: parsed };
    }
  } catch {
  }
  return { text: responseText, guide: null };
}
var TEST_HIGHLIGHT_CLASS = "crg-test-highlight";
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function testHighlight(options) {
  const {
    containerId,
    sentences,
    caseInsensitive = false,
    duration = 800,
    stagger = 120
  } = options;
  if (typeof document === "undefined") return () => {
  };
  const container = document.getElementById(containerId);
  if (!container) return () => {
  };
  const phrases = Array.from(new Set(sentences.map((s) => s.trim()).filter(Boolean))).sort(
    (a, b) => b.length - a.length
  );
  if (phrases.length === 0) return () => {
  };
  const regex = new RegExp(phrases.map(escapeRegExp).join("|"), caseInsensitive ? "gi" : "g");
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      let parent = node.parentNode;
      while (parent && parent !== container) {
        if (parent instanceof HTMLElement) {
          if (parent.classList.contains(TEST_HIGHLIGHT_CLASS)) return NodeFilter.FILTER_REJECT;
          if (parent.tagName === "SCRIPT" || parent.tagName === "STYLE") {
            return NodeFilter.FILTER_REJECT;
          }
        }
        parent = parent.parentNode;
      }
      return node.nodeValue && node.nodeValue.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const textNodes = [];
  let cursor = walker.nextNode();
  while (cursor) {
    textNodes.push(cursor);
    cursor = walker.nextNode();
  }
  const created = [];
  textNodes.forEach((node) => {
    const text = node.nodeValue ?? "";
    regex.lastIndex = 0;
    if (!regex.test(text)) return;
    regex.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (start > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, start)));
      }
      const mark = document.createElement("span");
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
      parent.replaceChild(document.createTextNode(el.textContent ?? ""), el);
      parent.normalize();
    });
  };
}
function TestHighlight({
  containerId,
  sentences,
  caseInsensitive,
  duration,
  stagger,
  deps
}) {
  const sentencesKey = sentences.join("");
  React6.useEffect(() => {
    return testHighlight({ containerId, sentences, caseInsensitive, duration, stagger });
  }, [containerId, sentencesKey, caseInsensitive, duration, stagger, ...deps ?? []]);
  return null;
}
var BottomSheet = DialogPrimitive__namespace.Root;
function CloseGlyph({ size = 20 }) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
        /* @__PURE__ */ jsxRuntime.jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
      ]
    }
  );
}
var BottomSheetOverlay = React6__namespace.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
  DialogPrimitive__namespace.Overlay,
  {
    ref,
    className: cn(
      "crg-fixed crg-inset-0 crg-z-[1090] crg-bg-black/40",
      "data-[state=open]:crg-opacity-100 data-[state=closed]:crg-opacity-0",
      "crg-transition-opacity crg-duration-200 crg-ease-out",
      className
    ),
    ...props
  }
));
BottomSheetOverlay.displayName = DialogPrimitive__namespace.Overlay.displayName;
var BottomSheetContent = React6__namespace.forwardRef(({ className, children, title, srDescription, hideClose, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsxs(DialogPrimitive__namespace.Portal, { children: [
  /* @__PURE__ */ jsxRuntime.jsx(BottomSheetOverlay, {}),
  /* @__PURE__ */ jsxRuntime.jsxs(
    DialogPrimitive__namespace.Content,
    {
      ref,
      className: cn(
        "crg-fixed crg-z-[1100] crg-left-0 crg-right-0 crg-bottom-0",
        "crg-h-[100vh] crg-max-h-[100vh]",
        "crg-flex crg-flex-col",
        "crg-bg-surface",
        "crg-rounded-t-[20px]",
        "crg-shadow-elevation-03",
        "crg-outline-none",
        "data-[state=open]:crg-translate-y-0",
        "data-[state=closed]:crg-translate-y-full",
        "crg-transition-transform crg-duration-200 crg-ease-out",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "crg-flex crg-justify-center crg-pt-[10px] crg-pb-[6px]", children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "crg-h-[4px] crg-w-[44px] crg-rounded-full crg-bg-border" }) }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "crg-flex crg-items-center crg-justify-between crg-px-[20px] crg-pb-[12px]", children: [
          /* @__PURE__ */ jsxRuntime.jsx(DialogPrimitive__namespace.Title, { asChild: true, children: /* @__PURE__ */ jsxRuntime.jsx("span", { className: "crg-text-[16px] crg-leading-[24px] crg-font-bold crg-text-foreground", children: title ?? "\xA0" }) }),
          !hideClose ? /* @__PURE__ */ jsxRuntime.jsx(DialogPrimitive__namespace.Close, { asChild: true, children: /* @__PURE__ */ jsxRuntime.jsx(
            "button",
            {
              type: "button",
              "aria-label": "\uB2EB\uAE30",
              className: cn(
                "crg-inline-flex crg-items-center crg-justify-center",
                "crg-h-[32px] crg-w-[32px] crg-rounded-[8px] crg-border-0",
                "crg-bg-transparent crg-text-icon hover:crg-text-foreground",
                "crg-cursor-pointer"
              ),
              children: /* @__PURE__ */ jsxRuntime.jsx(CloseGlyph, { size: 20 })
            }
          ) }) : null
        ] }),
        srDescription ? /* @__PURE__ */ jsxRuntime.jsx(DialogPrimitive__namespace.Description, { className: "crg-sr-only", children: srDescription }) : null,
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "crg-flex-1 crg-min-h-0 crg-flex crg-flex-col", children })
      ]
    }
  )
] }));
BottomSheetContent.displayName = DialogPrimitive__namespace.Content.displayName;
var Select = SelectPrimitive__namespace.Root;
var SelectValue = SelectPrimitive__namespace.Value;
function ChevronDownIcon({ size = 16 }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsxRuntime.jsx("polyline", { points: "6 9 12 15 18 9" })
    }
  );
}
function CheckIcon({ size = 16 }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsxRuntime.jsx("polyline", { points: "20 6 9 17 4 12" })
    }
  );
}
var SelectTrigger = React6__namespace.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsxs(
  SelectPrimitive__namespace.Trigger,
  {
    ref,
    className: cn(
      "crg-inline-flex crg-h-[36px] crg-items-center crg-justify-between crg-gap-[8px]",
      "crg-rounded-[8px] crg-border crg-border-solid crg-border-border crg-bg-surface",
      "crg-px-[12px] crg-text-[14px] crg-leading-[20px] crg-font-medium crg-text-foreground",
      "crg-cursor-pointer crg-outline-none",
      "data-[state=open]:crg-border-brand focus-visible:crg-border-brand",
      "disabled:crg-cursor-not-allowed disabled:crg-opacity-50",
      "[&>span]:crg-line-clamp-1",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsxRuntime.jsx(SelectPrimitive__namespace.Icon, { asChild: true, children: /* @__PURE__ */ jsxRuntime.jsx("span", { className: "crg-text-icon", children: /* @__PURE__ */ jsxRuntime.jsx(ChevronDownIcon, { size: 16 }) }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive__namespace.Trigger.displayName;
var SelectContent = React6__namespace.forwardRef(
  ({ className, children, position = "popper", sideOffset = 6, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(SelectPrimitive__namespace.Portal, { children: /* @__PURE__ */ jsxRuntime.jsx(
    SelectPrimitive__namespace.Content,
    {
      ref,
      position,
      sideOffset,
      className: cn(
        // BottomSheet(Radix Dialog, modal) 안에서 쓰일 때 body 가 pointer-events: none 이
        // 되므로, body 로 포털되는 드롭다운에 명시적으로 auto 를 줘야 옵션 클릭이 된다.
        "crg-z-[1100] crg-pointer-events-auto crg-min-w-[var(--radix-select-trigger-width)] crg-overflow-hidden",
        "crg-rounded-[10px] crg-border crg-border-solid crg-border-border crg-bg-surface",
        "crg-shadow-elevation-02",
        "crg-text-[14px] crg-leading-[20px] crg-text-foreground",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsxRuntime.jsx(SelectPrimitive__namespace.Viewport, { className: "crg-p-[6px]", children })
    }
  ) })
);
SelectContent.displayName = SelectPrimitive__namespace.Content.displayName;
var SelectItem = React6__namespace.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsxs(
  SelectPrimitive__namespace.Item,
  {
    ref,
    className: cn(
      "crg-relative crg-flex crg-w-full crg-items-center crg-gap-[8px]",
      "crg-rounded-[6px] crg-px-[10px] crg-py-[8px]",
      "crg-text-[14px] crg-leading-[20px] crg-text-foreground crg-cursor-pointer",
      "crg-outline-none crg-select-none",
      "data-[highlighted]:crg-bg-muted data-[highlighted]:crg-text-foreground",
      "data-[state=checked]:crg-text-brand data-[state=checked]:crg-font-semibold",
      "data-[disabled]:crg-pointer-events-none data-[disabled]:crg-opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntime.jsx("span", { className: "crg-inline-flex crg-h-[16px] crg-w-[16px] crg-items-center crg-justify-center crg-text-brand", children: /* @__PURE__ */ jsxRuntime.jsx(SelectPrimitive__namespace.ItemIndicator, { children: /* @__PURE__ */ jsxRuntime.jsx(CheckIcon, { size: 16 }) }) }),
      /* @__PURE__ */ jsxRuntime.jsx(SelectPrimitive__namespace.ItemText, { asChild: true, children: /* @__PURE__ */ jsxRuntime.jsx("span", { className: "crg-flex-1 crg-truncate crg-text-left", children }) })
    ]
  }
));
SelectItem.displayName = SelectPrimitive__namespace.Item.displayName;
function useMediaQuery(query) {
  const [matches, setMatches] = React6.useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });
  React6.useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches("matches" in e ? e.matches : e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}
var MOBILE_BREAKPOINT_QUERY = "(max-width: 768px)";
function defaultMatchAnswer(question, answers) {
  const normalized = question.trim().toLowerCase();
  if (!normalized) return null;
  return answers.find((answer) => {
    const keywords = answer.matchKeywords && answer.matchKeywords.length > 0 ? answer.matchKeywords : [answer.question];
    return keywords.every((kw) => normalized.includes(kw.toLowerCase()));
  }) ?? null;
}
var _idCounter = 0;
function makeId(prefix) {
  _idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${_idCounter}`;
}
function CloseIcon({ size = 24 }) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
        /* @__PURE__ */ jsxRuntime.jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
      ]
    }
  );
}
function ChatIcon({ size = 28 }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" })
    }
  );
}
function SendIcon({ size = 20 }) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M22 2L11 13" }),
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M22 2l-7 20-4-9-9-4 20-7z" })
      ]
    }
  );
}
function ModeTab({
  label,
  active,
  onClick
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "button",
    {
      type: "button",
      role: "tab",
      "aria-selected": active,
      onClick,
      style: {
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
        color: active ? "var(--crg-foreground, #191C1D)" : "var(--crg-subtle, #5C5F5F)",
        boxShadow: active ? "0 1px 2px rgba(0, 0, 0, 0.06), 0 0 0 1px var(--crg-border, #E1E3E3) inset" : "none",
        transition: "background 0.15s ease, color 0.15s ease"
      },
      children: label
    }
  );
}
function DocumentIcon({ size = 16 }) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
        /* @__PURE__ */ jsxRuntime.jsx("polyline", { points: "14 2 14 8 20 8" }),
        /* @__PURE__ */ jsxRuntime.jsx("line", { x1: "9", y1: "13", x2: "15", y2: "13" }),
        /* @__PURE__ */ jsxRuntime.jsx("line", { x1: "9", y1: "17", x2: "15", y2: "17" })
      ]
    }
  );
}
function Bubble({
  role,
  children,
  notFound,
  active,
  isMobile,
  onOpenDocument
}) {
  const isUser = role === "user";
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      style: {
        display: "flex",
        width: "100%",
        justifyContent: isUser ? "flex-end" : "flex-start"
      },
      children: /* @__PURE__ */ jsxRuntime.jsxs(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            alignItems: isUser ? "flex-end" : "flex-start",
            maxWidth: isMobile ? "92%" : "84%"
          },
          children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              "div",
              {
                style: {
                  padding: "10px 14px",
                  borderRadius: "16px",
                  border: 0,
                  fontSize: "16px",
                  lineHeight: "24px",
                  fontWeight: 500,
                  wordBreak: "break-word",
                  background: isUser ? "var(--crg-brand, #2563EB)" : "var(--crg-muted, #EFF1F1)",
                  color: isUser ? "var(--crg-brand-foreground, #FFFFFF)" : notFound ? "var(--crg-subtle, #5C5F5F)" : "var(--crg-muted-foreground, #2E3132)",
                  borderBottomRightRadius: isUser ? "4px" : "16px",
                  borderBottomLeftRadius: !isUser ? "4px" : "16px",
                  boxShadow: active && !isUser ? "0 0 0 2px var(--crg-brand, #2563EB)" : "none"
                },
                children
              }
            ),
            onOpenDocument ? /* @__PURE__ */ jsxRuntime.jsxs(
              "button",
              {
                type: "button",
                onClick: onOpenDocument,
                style: {
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  height: isMobile ? "40px" : "34px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--crg-border, #E1E3E3)",
                  background: active ? "var(--crg-brand, #2563EB)" : "var(--crg-surface, #FFFFFF)",
                  color: active ? "var(--crg-brand-foreground, #FFFFFF)" : "var(--crg-foreground, #191C1D)",
                  cursor: "pointer",
                  fontSize: "13px",
                  lineHeight: "20px",
                  fontWeight: 600
                },
                children: [
                  /* @__PURE__ */ jsxRuntime.jsx(DocumentIcon, { size: 16 }),
                  "\uAD00\uB828 \uBB38\uC11C \uBCF4\uAE30"
                ]
              }
            ) : null
          ]
        }
      )
    }
  );
}
var ROOT_CLASS = "crg-chatbot-root";
function Chatbot(props) {
  const {
    answers,
    findAnswer = defaultMatchAnswer,
    diffHtml,
    title = "\uB3C4\uC6B0\uBBF8",
    subtitle = "\uBB34\uC5C7\uC774\uB4E0 \uBB3C\uC5B4\uBCF4\uC138\uC694.",
    placeholder = "\uC9C8\uBB38\uC744 \uC785\uB825\uD558\uC138\uC694",
    emptyMessage = "\uC9C8\uBB38\uC744 \uC785\uB825\uD558\uBA74 \uB2F5\uBCC0\uACFC \uB9E4\uB274\uC5BC\uC744 \uBCF4\uC5EC\uB4DC\uB824\uC694.",
    notFoundMessage = "\uC77C\uCE58\uD558\uB294 \uB2F5\uBCC0\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC5B4\uC694.",
    showSuggestions = true,
    fetchSuggestions,
    defaultOpen = false,
    className,
    onAsk,
    layout = "auto",
    initialMessages,
    embedded = false,
    onNewConversation
  } = props;
  const matchesMobileQuery = useMediaQuery(MOBILE_BREAKPOINT_QUERY);
  const isMobile = layout === "mobile" ? true : layout === "desktop" ? false : matchesMobileQuery;
  const panelFull = isMobile || embedded;
  const useBottomSheetViewer = isMobile || embedded;
  const [isOpen, setIsOpen] = React6.useState(defaultOpen);
  const effectiveOpen = embedded || isOpen;
  const [input, setInput] = React6.useState("");
  const [suggestions, setSuggestions] = React6.useState([]);
  const [suggestOpen, setSuggestOpen] = React6.useState(false);
  const [suggestActive, setSuggestActive] = React6.useState(-1);
  const [messages, setMessages] = React6.useState(
    initialMessages ?? []
  );
  const [history, setHistory] = React6.useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = React6.useState(
    null
  );
  const [viewMode, setViewMode] = React6.useState("doc");
  const [viewerOpen, setViewerOpen] = React6.useState(false);
  const [diffFromVersionId, setDiffFromVersionId] = React6.useState("");
  const [diffToVersionId, setDiffToVersionId] = React6.useState("");
  const [selectedVersionId, setSelectedVersionId] = React6.useState("");
  const reactId = React6.useId().replace(/:/g, "");
  const containerId = `crg-chatbot-viewer-${reactId}`;
  const scrollAnchorRef = React6.useRef(null);
  const textareaRef = React6.useRef(null);
  const selectedEntry = React6.useMemo(
    () => history.find((e) => e.id === selectedHistoryId) ?? null,
    [history, selectedHistoryId]
  );
  const selectedAnswer = selectedEntry?.answer ?? null;
  const versions = selectedAnswer?.versions ?? [];
  const latestVersion = versions[versions.length - 1] ?? null;
  const selectedVersion = React6.useMemo(
    () => versions.find((v) => v.id === selectedVersionId) ?? versions[0] ?? latestVersion,
    [versions, selectedVersionId, latestVersion]
  );
  const revisionTimeline = React6.useMemo(() => {
    if (!selectedVersion) return [];
    const past = selectedVersion.revisions ?? [];
    if (past.length === 0) return [];
    return [
      ...past,
      {
        id: `${selectedVersion.id}:current`,
        label: "\uD604\uC7AC\uBCF8",
        updatedAt: selectedVersion.updatedAt,
        html: selectedVersion.html
      }
    ];
  }, [selectedVersion]);
  const canHistory = Boolean(diffHtml) && revisionTimeline.length >= 2;
  const isHistoryMode = viewMode === "history" && canHistory;
  const versionsKey = versions.map((v) => v.id).join("|");
  React6.useEffect(() => {
    setSelectedVersionId(
      (prev) => prev && versions.some((v) => v.id === prev) ? prev : versions[0]?.id ?? ""
    );
  }, [selectedHistoryId, versionsKey]);
  React6.useEffect(() => {
    if (revisionTimeline.length >= 2) {
      setDiffFromVersionId(revisionTimeline[revisionTimeline.length - 2].id);
      setDiffToVersionId(revisionTimeline[revisionTimeline.length - 1].id);
    } else {
      setDiffFromVersionId("");
      setDiffToVersionId("");
    }
  }, [revisionTimeline]);
  const diffFromVersion = revisionTimeline.find((v) => v.id === diffFromVersionId) ?? revisionTimeline[revisionTimeline.length - 2] ?? null;
  const diffToVersion = revisionTimeline.find((v) => v.id === diffToVersionId) ?? revisionTimeline[revisionTimeline.length - 1] ?? null;
  const renderedHtml = React6.useMemo(() => {
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
    diffToVersion
  ]);
  const highlightSentences = React6.useMemo(() => {
    if (!selectedAnswer || isHistoryMode) return [];
    return selectedAnswer.highlightSentences ?? [];
  }, [selectedAnswer, isHistoryMode]);
  React6.useEffect(() => {
    if (!canHistory && viewMode === "history") setViewMode("doc");
  }, [canHistory, viewMode]);
  React6.useEffect(() => {
    if (scrollAnchorRef.current) {
      scrollAnchorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end"
      });
    }
  }, [messages, isOpen]);
  React6.useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [input, isOpen]);
  React6.useEffect(() => {
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
      fetchSuggestions(q).then((items) => {
        if (ctrl.signal.aborted) return;
        const next = items.slice(0, 8);
        setSuggestions(next);
        setSuggestOpen(next.length > 0);
        setSuggestActive(-1);
      }).catch(() => {
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
  const closeSuggestions = React6.useCallback(() => {
    setSuggestOpen(false);
    setSuggestActive(-1);
  }, []);
  const ask = React6.useCallback(
    (rawQuestion) => {
      const question = rawQuestion.trim();
      if (!question) return;
      const answer = findAnswer(question, answers);
      const userMessage = {
        id: makeId("msg"),
        role: "user",
        text: question
      };
      let botMessage;
      if (answer) {
        const entryId = makeId("history");
        const entry = {
          id: entryId,
          question,
          answer,
          askedAt: Date.now()
        };
        setHistory((prev) => [...prev, entry]);
        setSelectedHistoryId(entryId);
        setViewMode("doc");
        botMessage = {
          id: makeId("msg"),
          role: "bot",
          text: answer.chatMessage ?? `\u201C${answer.question}\u201D \uAD00\uB828 \uBB38\uC11C\uB97C \uCC3E\uC558\uC5B4\uC694.`,
          historyId: entryId
        };
      } else {
        botMessage = {
          id: makeId("msg"),
          role: "bot",
          text: notFoundMessage,
          notFound: true
        };
      }
      setMessages((prev) => [...prev, userMessage, botMessage]);
      setInput("");
      closeSuggestions();
      onAsk?.(question, answer);
    },
    [answers, findAnswer, notFoundMessage, onAsk, isMobile, closeSuggestions]
  );
  const handleSubmit = (e) => {
    e.preventDefault();
    ask(input);
  };
  const handleKeyDown = (e) => {
    const composing = (
      // Modern browsers expose isComposing on the native event.
      e.nativeEvent.isComposing || // Legacy fallback: keyCode 229 is fired while IME composition is active.
      e.keyCode === 229
    );
    if (composing) return;
    if (suggestOpen && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestActive((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestActive((i) => i <= 0 ? suggestions.length - 1 : i - 1);
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
  const handleSuggestion = (question) => {
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
    onNewConversation?.();
  };
  const handleOpenDocument = (historyId) => {
    setSelectedHistoryId(historyId);
    setViewMode("doc");
    setViewerOpen(true);
  };
  const showSideViewer = !useBottomSheetViewer && viewerOpen && history.length > 0;
  const showBottomSheet = useBottomSheetViewer && viewerOpen && history.length > 0;
  const panelBase = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "var(--crg-surface, #FFFFFF)",
    border: "1px solid var(--crg-border, #E1E3E3)",
    borderRadius: "14px",
    boxShadow: "var(--crg-shadow-elevation-02)",
    overflow: "hidden",
    pointerEvents: "auto"
  };
  const renderViewerBody = (closeButton) => /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          padding: "16px 24px",
          borderBottom: "1px solid var(--crg-border, #E1E3E3)",
          background: "var(--crg-surface, #FFFFFF)"
        },
        children: [
          /* @__PURE__ */ jsxRuntime.jsxs(
            "div",
            {
              style: {
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                gap: "10px"
              },
              children: [
                /* @__PURE__ */ jsxRuntime.jsx(
                  "span",
                  {
                    style: {
                      flexShrink: 0,
                      fontSize: "13px",
                      lineHeight: "20px",
                      fontWeight: 600,
                      color: "var(--crg-subtle, #5C5F5F)"
                    },
                    children: "\uAD00\uB828 \uBB38\uC11C"
                  }
                ),
                /* @__PURE__ */ jsxRuntime.jsx("div", { style: { flex: 1, minWidth: 0, maxWidth: "420px" }, children: /* @__PURE__ */ jsxRuntime.jsxs(
                  Select,
                  {
                    value: selectedVersion?.id ?? "",
                    onValueChange: setSelectedVersionId,
                    disabled: versions.length === 0,
                    children: [
                      /* @__PURE__ */ jsxRuntime.jsx(SelectTrigger, { "aria-label": "\uAD00\uB828 \uBB38\uC11C \uC120\uD0DD", className: "crg-w-full", children: /* @__PURE__ */ jsxRuntime.jsx(SelectValue, { placeholder: "\uAD00\uB828 \uBB38\uC11C\uB97C \uC120\uD0DD\uD558\uC138\uC694", children: selectedVersion ? selectedVersion.label : void 0 }) }),
                      /* @__PURE__ */ jsxRuntime.jsx(SelectContent, { children: versions.map((v) => /* @__PURE__ */ jsxRuntime.jsx(SelectItem, { value: v.id, children: v.label }, v.id)) })
                    ]
                  }
                ) })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsxs(
            "div",
            {
              style: { display: "inline-flex", alignItems: "center", gap: "8px" },
              children: [
                selectedAnswer ? /* @__PURE__ */ jsxRuntime.jsxs(
                  "div",
                  {
                    role: "tablist",
                    "aria-label": "\uBDF0\uC5B4 \uBAA8\uB4DC",
                    style: {
                      display: "inline-flex",
                      padding: "4px",
                      borderRadius: "10px",
                      background: "var(--crg-muted, #EFF1F1)"
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntime.jsx(
                        ModeTab,
                        {
                          label: "\uBB38\uC11C",
                          active: !isHistoryMode,
                          onClick: () => setViewMode("doc")
                        }
                      ),
                      canHistory ? /* @__PURE__ */ jsxRuntime.jsx(
                        ModeTab,
                        {
                          label: "\uC774\uB825\uBCF4\uAE30",
                          active: isHistoryMode,
                          onClick: () => setViewMode("history")
                        }
                      ) : null
                    ]
                  }
                ) : null,
                closeButton
              ]
            }
          )
        ]
      }
    ),
    selectedAnswer ? /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        style: {
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
          color: "var(--crg-subtle, #5C5F5F)"
        },
        children: [
          isHistoryMode ? /* @__PURE__ */ jsxRuntime.jsxs(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap"
              },
              children: [
                /* @__PURE__ */ jsxRuntime.jsx(
                  "span",
                  {
                    style: {
                      fontWeight: 600,
                      color: "var(--crg-muted-foreground, #2E3132)"
                    },
                    children: "\uBE44\uAD50"
                  }
                ),
                /* @__PURE__ */ jsxRuntime.jsxs(
                  Select,
                  {
                    value: diffFromVersionId,
                    onValueChange: setDiffFromVersionId,
                    children: [
                      /* @__PURE__ */ jsxRuntime.jsx(SelectTrigger, { "aria-label": "\uBE44\uAD50 \uAE30\uC900 \uC774\uB825", children: /* @__PURE__ */ jsxRuntime.jsx(SelectValue, { children: diffFromVersion ? `${diffFromVersion.label}${diffFromVersion.updatedAt ? ` \xB7 ${diffFromVersion.updatedAt}` : ""}` : void 0 }) }),
                      /* @__PURE__ */ jsxRuntime.jsx(SelectContent, { children: revisionTimeline.map((v) => /* @__PURE__ */ jsxRuntime.jsxs(SelectItem, { value: v.id, children: [
                        v.label,
                        v.updatedAt ? ` \xB7 ${v.updatedAt}` : ""
                      ] }, v.id)) })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntime.jsx("span", { "aria-hidden": "true", children: "\u2192" }),
                /* @__PURE__ */ jsxRuntime.jsxs(
                  Select,
                  {
                    value: diffToVersionId,
                    onValueChange: setDiffToVersionId,
                    children: [
                      /* @__PURE__ */ jsxRuntime.jsx(SelectTrigger, { "aria-label": "\uBE44\uAD50 \uB300\uC0C1 \uC774\uB825", children: /* @__PURE__ */ jsxRuntime.jsx(SelectValue, { children: diffToVersion ? `${diffToVersion.label}${diffToVersion.updatedAt ? ` \xB7 ${diffToVersion.updatedAt}` : ""}` : void 0 }) }),
                      /* @__PURE__ */ jsxRuntime.jsx(SelectContent, { children: revisionTimeline.map((v) => /* @__PURE__ */ jsxRuntime.jsxs(SelectItem, { value: v.id, children: [
                        v.label,
                        v.updatedAt ? ` \xB7 ${v.updatedAt}` : ""
                      ] }, v.id)) })
                    ]
                  }
                )
              ]
            }
          ) : /* @__PURE__ */ jsxRuntime.jsx("span", { children: selectedVersion?.updatedAt ? `\uCD5C\uC885 \uC218\uC815 ${selectedVersion.updatedAt}` : selectedVersion?.label ?? "" }),
          isHistoryMode ? /* @__PURE__ */ jsxRuntime.jsxs(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexShrink: 0
              },
              children: [
                /* @__PURE__ */ jsxRuntime.jsxs(
                  "span",
                  {
                    style: {
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntime.jsx(
                        "span",
                        {
                          style: {
                            display: "inline-block",
                            width: "8px",
                            height: "8px",
                            borderRadius: "2px",
                            background: "#22c55e"
                          },
                          "aria-hidden": "true"
                        }
                      ),
                      "\uCD94\uAC00"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntime.jsxs(
                  "span",
                  {
                    style: {
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntime.jsx(
                        "span",
                        {
                          style: {
                            display: "inline-block",
                            width: "8px",
                            height: "8px",
                            borderRadius: "2px",
                            background: "#ef4444"
                          },
                          "aria-hidden": "true"
                        }
                      ),
                      "\uC0AD\uC81C"
                    ]
                  }
                )
              ]
            }
          ) : null
        ]
      }
    ) : null,
    /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        style: {
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: isMobile ? "20px 20px 40px" : "28px 36px"
        },
        children: !selectedAnswer ? /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            style: {
              padding: "48px 0",
              textAlign: "center",
              fontSize: "15px",
              lineHeight: "24px",
              fontWeight: 500,
              color: "var(--crg-subtle, #5C5F5F)"
            },
            children: "\uCC44\uD305\uC5D0\uC11C \uB2F5\uBCC0\uC744 \uBC1B\uC73C\uBA74 \uC5EC\uAE30\uC5D0 \uBB38\uC11C\uAC00 \uD45C\uC2DC\uB429\uB2C8\uB2E4."
          }
        ) : /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            "div",
            {
              id: containerId,
              className: "crg-chatbot-html-view",
              dangerouslySetInnerHTML: { __html: renderedHtml }
            }
          ),
          highlightSentences.length > 0 ? /* @__PURE__ */ jsxRuntime.jsx(
            TestHighlight,
            {
              containerId,
              sentences: highlightSentences,
              deps: [renderedHtml]
            }
          ) : null
        ] })
      }
    )
  ] });
  const viewerCloseButton = /* @__PURE__ */ jsxRuntime.jsx(
    "button",
    {
      type: "button",
      "aria-label": "\uBB38\uC11C \uB2EB\uAE30",
      onClick: () => setViewerOpen(false),
      style: {
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
        color: "var(--crg-icon, #8E9192)"
      },
      children: /* @__PURE__ */ jsxRuntime.jsx(CloseIcon, { size: 20 })
    }
  );
  const containerBaseStyle = embedded ? {
    // Embedded: fill the host-provided container instead of overlaying the viewport.
    position: "relative",
    width: "100%",
    height: "100%",
    zIndex: 0,
    display: "flex"
  } : isMobile ? {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1e3,
    display: "flex"
  } : {
    position: "fixed",
    top: "24px",
    left: "24px",
    right: "24px",
    // Sits above the floating bubble (24 + 56 + 16 = 96).
    bottom: "96px",
    zIndex: 1e3,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    gap: "24px",
    // Gap between desktop panels should pass clicks through to host content.
    pointerEvents: "none"
  };
  const closedTranslate = isMobile ? "translateY(100%)" : "translateY(16px)";
  const showFloatingButton = !embedded && !(isOpen && isMobile);
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: ROOT_CLASS,
      style: embedded ? { width: "100%", height: "100%" } : void 0,
      children: [
        showFloatingButton ? /* @__PURE__ */ jsxRuntime.jsx(
          "button",
          {
            type: "button",
            "aria-label": isOpen ? "\uB3C4\uC6B0\uBBF8 \uB2EB\uAE30" : "\uB3C4\uC6B0\uBBF8 \uC5F4\uAE30",
            "aria-expanded": isOpen,
            onClick: () => setIsOpen((prev) => !prev),
            style: {
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
              background: isOpen ? "var(--crg-subtle, #5C5F5F)" : "var(--crg-brand, #2563EB)",
              color: "var(--crg-brand-foreground, #FFFFFF)",
              boxShadow: "var(--crg-shadow-elevation-02)",
              transition: "background 200ms ease-out, transform 200ms ease-out"
            },
            children: isOpen ? /* @__PURE__ */ jsxRuntime.jsx(CloseIcon, { size: 24 }) : /* @__PURE__ */ jsxRuntime.jsx(ChatIcon, { size: 28 })
          }
        ) : null,
        /* @__PURE__ */ jsxRuntime.jsxs(
          "div",
          {
            role: "dialog",
            "aria-label": title,
            "aria-hidden": !effectiveOpen,
            className: cn(ROOT_CLASS, className),
            style: {
              ...containerBaseStyle,
              opacity: effectiveOpen ? 1 : 0,
              transform: embedded ? void 0 : effectiveOpen ? "translateY(0)" : closedTranslate,
              transformOrigin: isMobile ? void 0 : "bottom right",
              pointerEvents: effectiveOpen ? containerBaseStyle.pointerEvents ?? "auto" : "none",
              transition: embedded ? void 0 : "transform 200ms ease-out, opacity 200ms ease-out"
            },
            children: [
              /* @__PURE__ */ jsxRuntime.jsxs(
                "section",
                {
                  "aria-label": "\uCC44\uD305",
                  style: panelFull ? {
                    ...panelBase,
                    width: "100%",
                    flex: 1,
                    borderRadius: embedded ? 14 : 0,
                    border: embedded ? panelBase.border : 0,
                    boxShadow: "none"
                  } : {
                    ...panelBase,
                    width: "420px",
                    height: "min(680px, 100%)",
                    flexShrink: 0,
                    order: 2
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntime.jsxs(
                      "div",
                      {
                        style: {
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "12px",
                          padding: isMobile ? "14px 16px" : "20px 24px",
                          borderBottom: "1px solid var(--crg-border, #E1E3E3)",
                          background: "var(--crg-surface-alt, #FAFAFA)"
                        },
                        children: [
                          /* @__PURE__ */ jsxRuntime.jsxs(
                            "div",
                            {
                              style: {
                                display: "flex",
                                flexDirection: "column",
                                gap: "2px",
                                minWidth: 0
                              },
                              children: [
                                /* @__PURE__ */ jsxRuntime.jsx(
                                  "span",
                                  {
                                    style: {
                                      fontSize: isMobile ? "17px" : "20px",
                                      lineHeight: isMobile ? "24px" : "28px",
                                      fontWeight: 700,
                                      color: "var(--crg-foreground, #191C1D)"
                                    },
                                    children: title
                                  }
                                ),
                                subtitle ? /* @__PURE__ */ jsxRuntime.jsx(
                                  "span",
                                  {
                                    style: {
                                      fontSize: "14px",
                                      lineHeight: "20px",
                                      fontWeight: 500,
                                      color: "var(--crg-subtle, #5C5F5F)"
                                    },
                                    children: subtitle
                                  }
                                ) : null
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "4px" }, children: [
                            messages.length > 0 ? /* @__PURE__ */ jsxRuntime.jsx(
                              "button",
                              {
                                type: "button",
                                "aria-label": "\uC0C8 \uB300\uD654",
                                onClick: handleNewConversation,
                                style: {
                                  height: "32px",
                                  padding: "0 12px",
                                  borderRadius: "8px",
                                  border: "1px solid var(--crg-border, #E1E3E3)",
                                  cursor: "pointer",
                                  background: "var(--crg-surface, #FFFFFF)",
                                  color: "var(--crg-muted-foreground, #2E3132)",
                                  fontSize: "13px",
                                  lineHeight: "20px",
                                  fontWeight: 600
                                },
                                children: "+ \uC0C8 \uB300\uD654"
                              }
                            ) : null,
                            !embedded ? /* @__PURE__ */ jsxRuntime.jsx(
                              "button",
                              {
                                type: "button",
                                "aria-label": "\uB2EB\uAE30",
                                onClick: () => setIsOpen(false),
                                style: {
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
                                  color: "var(--crg-icon, #8E9192)"
                                },
                                children: /* @__PURE__ */ jsxRuntime.jsx(CloseIcon, { size: 20 })
                              }
                            ) : null
                          ] })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntime.jsx(
                      "div",
                      {
                        style: {
                          flex: 1,
                          minHeight: 0,
                          overflowY: "auto",
                          padding: isMobile ? "12px 14px" : "16px 20px"
                        },
                        children: /* @__PURE__ */ jsxRuntime.jsxs(
                          "div",
                          {
                            style: {
                              display: "flex",
                              minHeight: "100%",
                              flexDirection: "column",
                              justifyContent: "flex-end",
                              gap: "12px"
                            },
                            children: [
                              messages.length === 0 ? /* @__PURE__ */ jsxRuntime.jsx(
                                "div",
                                {
                                  style: {
                                    padding: "32px 0",
                                    textAlign: "center",
                                    fontSize: "14px",
                                    lineHeight: "24px",
                                    fontWeight: 500,
                                    color: "var(--crg-subtle, #5C5F5F)"
                                  },
                                  children: emptyMessage
                                }
                              ) : null,
                              messages.map((msg) => {
                                const isActive = !!msg.historyId && msg.historyId === selectedHistoryId && viewerOpen;
                                let renderedText = msg.text;
                                let renderedImages = msg.images ?? [];
                                if (msg.role === "bot" && msg.historyId) {
                                  const entry = history.find((e) => e.id === msg.historyId);
                                  if (entry?.answer.chatMessage !== void 0) {
                                    renderedText = entry.answer.chatMessage;
                                  }
                                  if (entry?.answer.chatImages?.length) {
                                    renderedImages = entry.answer.chatImages;
                                  }
                                }
                                const docHistoryId = msg.historyId && (() => {
                                  const entry = history.find((e) => e.id === msg.historyId);
                                  return entry && entry.answer.versions.length > 0 ? msg.historyId : void 0;
                                })();
                                return /* @__PURE__ */ jsxRuntime.jsxs(
                                  Bubble,
                                  {
                                    role: msg.role,
                                    notFound: msg.notFound,
                                    active: isActive,
                                    isMobile,
                                    onOpenDocument: docHistoryId ? () => handleOpenDocument(docHistoryId) : void 0,
                                    children: [
                                      renderedText,
                                      renderedImages.map((imageSrc) => /* @__PURE__ */ jsxRuntime.jsx(
                                        "img",
                                        {
                                          src: imageSrc,
                                          alt: "",
                                          loading: "lazy",
                                          style: {
                                            display: "block",
                                            maxWidth: "100%",
                                            marginTop: "8px",
                                            borderRadius: "8px"
                                          }
                                        },
                                        imageSrc
                                      ))
                                    ]
                                  },
                                  msg.id
                                );
                              }),
                              /* @__PURE__ */ jsxRuntime.jsx("div", { ref: scrollAnchorRef })
                            ]
                          }
                        )
                      }
                    ),
                    showSuggestions && !fetchSuggestions && messages.length === 0 && answers.length > 0 ? /* @__PURE__ */ jsxRuntime.jsx(
                      "div",
                      {
                        style: {
                          display: "flex",
                          flexWrap: isMobile ? "nowrap" : "wrap",
                          gap: "8px",
                          padding: isMobile ? "0 14px 12px" : "0 20px 12px",
                          overflowX: isMobile ? "auto" : "visible",
                          WebkitOverflowScrolling: "touch"
                        },
                        children: answers.map((a) => /* @__PURE__ */ jsxRuntime.jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => handleSuggestion(a.question),
                            style: {
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
                              whiteSpace: "nowrap"
                            },
                            children: a.question
                          },
                          a.id
                        ))
                      }
                    ) : null,
                    fetchSuggestions && suggestOpen && suggestions.length > 0 ? /* @__PURE__ */ jsxRuntime.jsx(
                      "div",
                      {
                        role: "listbox",
                        "aria-label": "\uCD94\uCC9C \uC9C8\uBB38",
                        style: {
                          margin: isMobile ? "0 14px" : "0 20px",
                          maxHeight: "240px",
                          overflowY: "auto",
                          border: "1px solid var(--crg-border, #E1E3E3)",
                          borderRadius: "10px",
                          background: "var(--crg-surface, #FFFFFF)",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.10)"
                        },
                        children: suggestions.map((s, i) => /* @__PURE__ */ jsxRuntime.jsx(
                          "button",
                          {
                            type: "button",
                            role: "option",
                            "aria-selected": i === suggestActive,
                            onMouseDown: (e) => {
                              e.preventDefault();
                              handleSuggestion(s.question);
                            },
                            onMouseEnter: () => setSuggestActive(i),
                            style: {
                              display: "block",
                              width: "100%",
                              textAlign: "left",
                              padding: "10px 14px",
                              border: 0,
                              borderBottom: i < suggestions.length - 1 ? "1px solid var(--crg-border, #F0F1F1)" : 0,
                              background: i === suggestActive ? "var(--crg-muted, #F2F4F4)" : "transparent",
                              color: "var(--crg-foreground, #191C1D)",
                              fontSize: "14px",
                              lineHeight: "20px",
                              fontWeight: 500,
                              cursor: "pointer"
                            },
                            children: /* @__PURE__ */ jsxRuntime.jsx(
                              "span",
                              {
                                style: {
                                  display: "block",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap"
                                },
                                children: s.question
                              }
                            )
                          },
                          s.id
                        ))
                      }
                    ) : null,
                    /* @__PURE__ */ jsxRuntime.jsxs(
                      "form",
                      {
                        onSubmit: handleSubmit,
                        style: {
                          display: "flex",
                          alignItems: "flex-end",
                          gap: "8px",
                          padding: isMobile ? "10px 14px 14px" : "12px 20px 16px",
                          borderTop: "1px solid var(--crg-border, #E1E3E3)",
                          background: "var(--crg-surface, #FFFFFF)"
                        },
                        children: [
                          /* @__PURE__ */ jsxRuntime.jsx(
                            "textarea",
                            {
                              ref: textareaRef,
                              value: input,
                              onChange: (e) => setInput(e.target.value),
                              onKeyDown: handleKeyDown,
                              onBlur: () => setTimeout(closeSuggestions, 120),
                              placeholder,
                              "aria-label": "\uBA54\uC2DC\uC9C0 \uC785\uB825 (Enter \uC804\uC1A1, Shift+Enter \uC904\uBC14\uAFC8)",
                              rows: 1,
                              style: {
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
                                overflowY: "auto"
                              }
                            }
                          ),
                          /* @__PURE__ */ jsxRuntime.jsx(
                            "button",
                            {
                              type: "submit",
                              disabled: !input.trim(),
                              "aria-label": "\uC804\uC1A1",
                              style: {
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "44px",
                                height: "44px",
                                padding: 0,
                                borderRadius: "10px",
                                border: 0,
                                cursor: input.trim() ? "pointer" : "not-allowed",
                                background: input.trim() ? "var(--crg-brand, #2563EB)" : "var(--crg-muted, #EFF1F1)",
                                color: input.trim() ? "var(--crg-brand-foreground, #FFFFFF)" : "var(--crg-icon, #8E9192)"
                              },
                              children: /* @__PURE__ */ jsxRuntime.jsx(SendIcon, { size: 20 })
                            }
                          )
                        ]
                      }
                    )
                  ]
                }
              ),
              showSideViewer ? /* @__PURE__ */ jsxRuntime.jsx(
                "section",
                {
                  "aria-label": "\uBB38\uC11C \uBDF0\uC5B4",
                  style: {
                    ...panelBase,
                    flex: 1,
                    minWidth: 0,
                    height: "min(720px, 100%)",
                    order: 1
                  },
                  children: renderViewerBody(viewerCloseButton)
                }
              ) : null
            ]
          }
        ),
        isMobile ? /* @__PURE__ */ jsxRuntime.jsx(
          BottomSheet,
          {
            open: showBottomSheet,
            onOpenChange: (open) => setViewerOpen(open),
            children: /* @__PURE__ */ jsxRuntime.jsx(
              BottomSheetContent,
              {
                title: selectedEntry?.question ?? "\uBB38\uC11C",
                srDescription: "\uC120\uD0DD\uD55C \uC774\uB825\uC758 \uBB38\uC11C\uC640 \uBCC0\uACBD\uC810\uC744 \uD45C\uC2DC\uD569\uB2C8\uB2E4.",
                children: renderViewerBody(void 0)
              }
            )
          }
        ) : null
      ]
    }
  );
}

exports.Chatbot = Chatbot;
exports.GUIDE_TARGETS = GUIDE_TARGETS;
exports.GuideNotification = GuideNotification;
exports.GuideOverlay = GuideOverlay;
exports.GuideProvider = GuideProvider;
exports.TEST_HIGHLIGHT_CLASS = TEST_HIGHLIGHT_CLASS;
exports.TestHighlight = TestHighlight;
exports.defaultMatchAnswer = defaultMatchAnswer;
exports.parseGuideResponse = parseGuideResponse;
exports.testHighlight = testHighlight;
exports.useGuide = useGuide;
exports.validateGuideJson = validateGuideJson;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map