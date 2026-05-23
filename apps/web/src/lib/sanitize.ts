import type { Config } from "dompurify";

/**
 * Sanitizes user-generated content before rendering in the DOM.
 * Strips ALL HTML tags and attributes — plain text only.
 * This prevents XSS attacks from malicious message content.
 *
 * Only runs in the browser (DOMPurify requires a DOM).
 * Server-side rendering returns the raw string unchanged —
 * actual rendering only happens in the browser anyway.
 */

const PLAIN_TEXT_CONFIG: Config = {
  ALLOWED_TAGS:  [],   // no HTML tags allowed
  ALLOWED_ATTR:  [],   // no attributes allowed
};

export function sanitizeMessage(content: string): string {
  // Guard: DOMPurify only works in browser environment
  if (typeof window === "undefined") {
    return content;
  }

  // Lazy import to avoid SSR issues
  const DOMPurify = require("dompurify");
  return DOMPurify.sanitize(content, PLAIN_TEXT_CONFIG) as string;
}

/**
 * Sanitize with limited safe HTML (bold, italic, links).
 * Use this only for system messages, never for user chat content.
 */
export function sanitizeHtml(content: string): string {
  if (typeof window === "undefined") {
    return content;
  }
  const DOMPurify = require("dompurify");
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS:  ["b", "i", "em", "strong", "a"],
    ALLOWED_ATTR:  ["href", "target"],
  }) as string;
}