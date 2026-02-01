/**
 * Material Library Content - 素材库内容
 *
 * Pre-built text templates and copywriting materials for quick insertion.
 * Organized by category for easy access.
 */
export interface TextMaterial {
    id: string;
    name: string;
    nameZh: string;
    category: TextMaterialCategory;
    content: string;
    tags: string[];
}
export type TextMaterialCategory = 'opening' | 'closing' | 'transition' | 'cta' | 'quote' | 'greeting' | 'announcement' | 'promotion';
export declare const allMaterials: TextMaterial[];
export declare const getMaterialsByCategory: (category: TextMaterialCategory) => TextMaterial[];
export declare const searchMaterials: (keyword: string) => TextMaterial[];
//# sourceMappingURL=materialLibraryContent.d.ts.map