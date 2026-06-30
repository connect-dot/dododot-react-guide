export { GuideProvider, useGuide } from "./GuideContext";
export { GuideOverlay } from "./GuideOverlay";
export { GuideNotification } from "./GuideNotification";
export { validateGuideJson } from "./types";
export { GUIDE_TARGETS } from "./targetRegistry";
export { parseGuideResponse } from "./parseGuideResponse";
export {
  testHighlight,
  TestHighlight,
  TEST_HIGHLIGHT_CLASS,
} from "./testHighlight";
export { Chatbot, defaultMatchAnswer } from "./Chatbot";

export type {
  GuideStep,
  GuideJson,
  GuideData,
  GuideAction,
  GuideStatus,
  GuideUIComponents,
} from "./types";
export type { TestHighlightOptions, TestHighlightProps } from "./testHighlight";
export type {
  ChatbotProps,
  ChatbotAnswer,
  ChatbotVersion,
  ChatbotRevision,
  ChatbotMessage,
  ChatbotHistoryEntry,
} from "./Chatbot";
