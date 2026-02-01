export interface TextRegion {
  id: string;
  index: number;
  type: string;
  originalText: string;
  chineseSequence: string;
  htmlContent: string;
  level?: number;
  marker: string;
  generatedChinese?: string;
}

export interface TemplateBlockAnnotation {
  blockIndex: number;
  blockType: string;
  semanticRole: string;  // e.g., "main_title", "subtitle", "body_paragraph", "conclusion"
  contentGuidance: string; // AI-generated guidance for what content should go here
  structuralContext: string; // How this block relates to others
}

export interface UserTemplate {
  id: string;
  userId: string;       // 所属用户ID
  name: string;
  createdAt: number;
  updatedAt: number;
  preview?: string;     // 简短描述
  sourceUrl?: string;   // 来源URL
  
  // 核心模板数据
  originalHtml: string; 
  textRegions: TextRegion[]; 
  svgBlocks?: Array<{id: string, content: string}>;
  
  // AI生成的结构注释 (帮助AI理解模板结构)
  structureAnnotations?: TemplateBlockAnnotation[];
  annotationStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  
  // 统计信息
  statistics?: {
    totalBlocks: number;
    textRegions: number;
    imageBlocks: number;
    codeBlocks: number;
  };
}
