/**
 * Safe JSON Parser for AI Responses
 *
 * Handles common issues from AI-generated JSON:
 * - Trailing content after closing brace
 * - Truncated/incomplete JSON
 * - Malformed arrays
 * - Missing commas
 * - Unescaped quotes in content
 */
/**
 * Safely parse JSON from AI responses with robust error handling
 * Handles common issues like trailing content, truncated JSON, malformed arrays
 */
export declare const safeParseJSON: (jsonStr: string, logger?: {
    warn: Function;
    debug: Function;
}) => any;
export default safeParseJSON;
//# sourceMappingURL=jsonParser.d.ts.map