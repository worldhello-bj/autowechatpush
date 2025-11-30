/**
 * Safe JSON Parser for AI Responses
 * 
 * Handles common issues from AI-generated JSON:
 * - Trailing content after closing brace
 * - Truncated/incomplete JSON
 * - Malformed arrays
 * - Missing commas
 */

/**
 * Safely parse JSON from AI responses with robust error handling
 * Handles common issues like trailing content, truncated JSON, malformed arrays
 */
export const safeParseJSON = (jsonStr: string, logger?: { warn: Function; debug: Function }): any => {
  const log = {
    warn: logger?.warn || console.warn.bind(console),
    debug: logger?.debug || console.log.bind(console)
  };

  // First attempt: direct parse
  try {
    return JSON.parse(jsonStr);
  } catch (firstError) {
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
  } catch (secondError) {
    log.debug('Second JSON parse attempt failed, trying deeper cleanup...');
  }
  
  // Third attempt: fix common array issues
  // Sometimes AI returns extra content inside arrays or misplaced commas
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
          if (char === '[') bracketCount++;
          else if (char === ']') bracketCount--;
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
  } catch (thirdError) {
    log.debug('Third JSON parse attempt failed, trying regex extraction...');
  }
  
  // Fourth attempt: extract and rebuild the essential parts using regex
  try {
    const titleMatch = cleanedStr.match(/"title"\s*:\s*"([^"\\]*(\\.[^"\\]*)*)"/);
    const digestMatch = cleanedStr.match(/"digest"\s*:\s*"([^"\\]*(\\.[^"\\]*)*)"/);
    
    // Try to extract valid blocks
    const blocksRegex = /\{"type"\s*:\s*"([^"]+)"[^}]*"content"\s*:\s*"([^"\\]*(\\.[^"\\]*)*)"/g;
    const blocks: any[] = [];
    let match;
    while ((match = blocksRegex.exec(cleanedStr)) !== null) {
      blocks.push({
        type: match[1],
        content: match[2].replace(/\\"/g, '"').replace(/\\n/g, '\n')
      });
    }
    
    if (titleMatch && blocks.length > 0) {
      log.warn('Reconstructed article from partial JSON parse');
      return {
        title: titleMatch[1].replace(/\\"/g, '"'),
        digest: digestMatch ? digestMatch[1].replace(/\\"/g, '"') : '',
        blocks: blocks
      };
    }
  } catch (fourthError) {
    log.debug('Fourth JSON parse attempt (regex) failed');
  }
  
  // All attempts failed, throw the original error
  throw new Error(`Unable to parse JSON after multiple attempts. Raw length: ${jsonStr.length}`);
};

export default safeParseJSON;
