"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeParseJSON = void 0;
/**
 * Extract individual block objects from a JSON string
 * Returns an array of parsed block objects
 */
const extractBlocks = (jsonStr) => {
    const blocks = [];
    // Find the blocks array
    const blocksMatch = jsonStr.match(/"blocks"\s*:\s*\[/);
    if (!blocksMatch)
        return blocks;
    const blocksStart = jsonStr.indexOf(blocksMatch[0]) + blocksMatch[0].length;
    // Parse each block object individually
    let depth = 0;
    let blockStart = -1;
    let inString = false;
    let escapeNext = false;
    for (let i = blocksStart; i < jsonStr.length; i++) {
        const char = jsonStr[i];
        if (escapeNext) {
            escapeNext = false;
            continue;
        }
        if (char === '\\') {
            escapeNext = true;
            continue;
        }
        if (char === '"' && !escapeNext) {
            inString = !inString;
            continue;
        }
        if (inString)
            continue;
        if (char === '{') {
            if (depth === 0)
                blockStart = i;
            depth++;
        }
        else if (char === '}') {
            depth--;
            if (depth === 0 && blockStart !== -1) {
                const blockStr = jsonStr.substring(blockStart, i + 1);
                try {
                    const block = JSON.parse(blockStr);
                    if (block.type && block.content !== undefined) {
                        blocks.push(block);
                    }
                }
                catch (e) {
                    // Try to fix common issues in the block
                    try {
                        // Remove control characters that might cause issues
                        let fixedBlockStr = blockStr.replace(/[\x00-\x1F\x7F]/g, (c) => {
                            if (c === '\n')
                                return '\\n';
                            if (c === '\r')
                                return '\\r';
                            if (c === '\t')
                                return '\\t';
                            return '';
                        });
                        const block = JSON.parse(fixedBlockStr);
                        if (block.type && block.content !== undefined) {
                            blocks.push(block);
                        }
                    }
                    catch (e2) {
                        // Extract type and content using regex as last resort
                        const typeMatch = blockStr.match(/"type"\s*:\s*"([^"]+)"/);
                        const contentMatch = blockStr.match(/"content"\s*:\s*"([\s\S]*?)(?:"|$)/);
                        if (typeMatch) {
                            blocks.push({
                                type: typeMatch[1],
                                content: contentMatch ? contentMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : ''
                            });
                        }
                    }
                }
                blockStart = -1;
            }
        }
        else if (char === ']' && depth === 0) {
            // End of blocks array
            break;
        }
    }
    return blocks;
};
/**
 * Safely parse JSON from AI responses with robust error handling
 * Handles common issues like trailing content, truncated JSON, malformed arrays
 */
const safeParseJSON = (jsonStr, logger) => {
    const log = {
        warn: logger?.warn || console.warn.bind(console),
        debug: logger?.debug || console.log.bind(console)
    };
    // First attempt: direct parse
    try {
        return JSON.parse(jsonStr);
    }
    catch (firstError) {
        log.debug('First JSON parse attempt failed, trying cleanup...');
    }
    // Second attempt: clean trailing content after last closing brace
    let cleanedStr = jsonStr;
    const lastBrace = cleanedStr.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < cleanedStr.length - 1) {
        cleanedStr = cleanedStr.substring(0, lastBrace + 1);
        log.warn('Cleaned trailing content from JSON response');
    }
    try {
        return JSON.parse(cleanedStr);
    }
    catch (secondError) {
        log.debug('Second JSON parse attempt failed, trying block-by-block extraction...');
    }
    // Third attempt: Extract blocks individually and rebuild the object
    try {
        const titleMatch = cleanedStr.match(/"title"\s*:\s*"([^"]*(\\.[^"]*)*)"/);
        const digestMatch = cleanedStr.match(/"digest"\s*:\s*"([^"]*(\\.[^"]*)*)"/);
        const blocks = extractBlocks(cleanedStr);
        if (titleMatch && blocks.length > 0) {
            log.warn(`Reconstructed article with ${blocks.length} blocks from malformed JSON`);
            return {
                title: titleMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
                digest: digestMatch ? digestMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : '',
                blocks: blocks
            };
        }
    }
    catch (thirdError) {
        log.debug('Third JSON parse attempt (block extraction) failed');
    }
    // Fourth attempt: fix common array issues with bracket counting
    try {
        // Find the blocks array and fix it
        const blocksMatch = cleanedStr.match(/"blocks"\s*:\s*\[/);
        if (blocksMatch) {
            // Find the corresponding closing bracket for blocks array
            const blocksStart = cleanedStr.indexOf(blocksMatch[0]) + blocksMatch[0].length;
            let bracketCount = 1;
            let blocksEnd = blocksStart;
            let inString = false;
            let escapeNext = false;
            for (let i = blocksStart; i < cleanedStr.length && bracketCount > 0; i++) {
                const char = cleanedStr[i];
                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }
                if (char === '\\') {
                    escapeNext = true;
                    continue;
                }
                if (char === '"') {
                    inString = !inString;
                    continue;
                }
                if (!inString) {
                    if (char === '[')
                        bracketCount++;
                    else if (char === ']')
                        bracketCount--;
                }
                blocksEnd = i;
            }
            // If we found the end, truncate the blocks array properly
            if (bracketCount === 0) {
                const beforeBlocks = cleanedStr.substring(0, blocksStart);
                const blocksContent = cleanedStr.substring(blocksStart, blocksEnd);
                const afterBlocks = cleanedStr.substring(blocksEnd);
                // Fix the blocks content - remove any trailing incomplete objects
                let fixedBlocksContent = blocksContent;
                // Find the last complete object (ends with })
                const lastCompleteObj = fixedBlocksContent.lastIndexOf('}');
                if (lastCompleteObj !== -1) {
                    // Check if there's incomplete content after the last complete object
                    const afterLastObj = fixedBlocksContent.substring(lastCompleteObj + 1).trim();
                    if (afterLastObj && afterLastObj !== ',' && afterLastObj !== ']') {
                        fixedBlocksContent = fixedBlocksContent.substring(0, lastCompleteObj + 1);
                        log.warn('Removed incomplete block from array');
                    }
                }
                // Remove trailing commas before ]
                fixedBlocksContent = fixedBlocksContent.replace(/,\s*$/, '');
                cleanedStr = beforeBlocks + fixedBlocksContent + afterBlocks;
            }
        }
        return JSON.parse(cleanedStr);
    }
    catch (fourthError) {
        log.debug('Fourth JSON parse attempt failed, trying regex extraction...');
    }
    // Fifth attempt: extract and rebuild the essential parts using regex (most aggressive)
    try {
        const titleMatch = cleanedStr.match(/"title"\s*:\s*"([^"]*(\\.[^"]*)*)"/);
        const digestMatch = cleanedStr.match(/"digest"\s*:\s*"([^"]*(\\.[^"]*)*)"/);
        // Try multiple regex patterns for block extraction
        const blocks = [];
        // Pattern 1: Standard block format
        const pattern1 = /\{\s*\"type\"\s*:\s*\"([^\"]+)\"\s*,\s*\"content\"\s*:\s*\"((?:[^\\\"]|\\.)*)\"\s*\}/g;
        let match;
        while ((match = pattern1.exec(cleanedStr)) !== null) {
            blocks.push({
                type: match[1],
                content: match[2].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
            });
        }
        // Pattern 2: Reversed order (content before type)
        if (blocks.length === 0) {
            const pattern2 = /\{\s*\"content\"\s*:\s*\"((?:[^\\\"]|\\.)*)\"\s*,\s*\"type\"\s*:\s*\"([^\"]+)\"\s*\}/g;
            while ((match = pattern2.exec(cleanedStr)) !== null) {
                blocks.push({
                    type: match[2],
                    content: match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n')
                });
            }
        }
        if (titleMatch && blocks.length > 0) {
            log.warn(`Reconstructed article with ${blocks.length} blocks using regex extraction`);
            return {
                title: titleMatch[1].replace(/\\"/g, '"'),
                digest: digestMatch ? digestMatch[1].replace(/\\"/g, '"') : '',
                blocks: blocks
            };
        }
    }
    catch (fifthError) {
        log.debug('Fifth JSON parse attempt (regex) failed');
    }
    // All attempts failed, throw the original error with more context
    const previewLength = 200;
    const jsonPreview = jsonStr.length > previewLength ? jsonStr.substring(0, previewLength) + '...' : jsonStr;
    throw new Error(`Unable to parse JSON after multiple attempts. Raw length: ${jsonStr.length}. Preview: ${jsonPreview}`);
};
exports.safeParseJSON = safeParseJSON;
exports.default = exports.safeParseJSON;
//# sourceMappingURL=jsonParser.js.map