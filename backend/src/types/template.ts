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
  
  // 统计信息
  statistics?: {
    totalBlocks: number;
    textRegions: number;
    imageBlocks: number;
    codeBlocks: number;
  };
}
