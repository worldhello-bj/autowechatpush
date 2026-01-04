/**
 * SVG Decorator System
 * Implements reusable decorative elements for article styling
 * Following the "decorator injection" pattern
 */

export interface SVGDecorator {
  id: string;
  name: string;
  svg: string;
  position?: 'before' | 'after' | 'inline';
}

/**
 * Yellow Dots Pattern (黄色圆点装饰)
 * Common in academic/official WeChat articles
 */
export const YELLOW_DOTS_DECORATOR: SVGDecorator = {
  id: 'yellow-dots',
  name: 'Yellow Dots Pattern',
  position: 'before',
  svg: `<section style="display: flex; gap: 2px; margin: 10px 0;">
    <section style="width: 5px; height: 5px; border-radius: 100%; background-color: #ffd427;"></section>
    <section style="width: 5px; height: 5px; border-radius: 100%; background-color: #ffd427;"></section>
    <section style="width: 5px; height: 5px; border-radius: 100%; background-color: #ffd427;"></section>
    <section style="width: 5px; height: 5px; border-radius: 100%; background-color: #ffd427;"></section>
    <section style="width: 5px; height: 5px; border-radius: 100%; background-color: #ffd427;"></section>
  </section>`,
};

/**
 * Red Dots Pattern (红色圆点装饰)
 */
export const RED_DOTS_DECORATOR: SVGDecorator = {
  id: 'red-dots',
  name: 'Red Dots Pattern',
  position: 'before',
  svg: `<section style="display: flex; gap: 2px; margin: 10px 0;">
    <section style="width: 5px; height: 5px; border-radius: 100%; background-color: #c60201;"></section>
    <section style="width: 5px; height: 5px; border-radius: 100%; background-color: #c60201;"></section>
    <section style="width: 5px; height: 5px; border-radius: 100%; background-color: #c60201;"></section>
    <section style="width: 5px; height: 5px; border-radius: 100%; background-color: #c60201;"></section>
    <section style="width: 5px; height: 5px; border-radius: 100%; background-color: #c60201;"></section>
  </section>`,
};

/**
 * Corner Triangle (三角装饰)
 */
export const CORNER_TRIANGLE: SVGDecorator = {
  id: 'corner-triangle',
  name: 'Corner Triangle',
  position: 'inline',
  svg: `<svg viewBox="0 0 75.29 55" style="display: block; width: 40px; height: auto;">
    <g><g><g>
      <path d="M11.87,55H8.79S1.42,54.81,0,48.77H24.64L20.08,55Z" style="fill: #d48d12; fill-rule: evenodd;"></path>
    </g><g>
      <path d="M11.36,55s13.6.58,23.56-25.79l23.75-.3S53.93,53.18,40.61,55Z" style="fill: #ffd427; fill-rule: evenodd;"></path>
    </g><g>
      <path d="M49.83,0,75.29,30.09H19.93Z" style="fill: #ffd427; fill-rule: evenodd;"></path>
    </g></g></g>
  </svg>`,
};

/**
 * Divider Line (分隔线)
 */
export const DIVIDER_LINE: SVGDecorator = {
  id: 'divider-line',
  name: 'Divider Line',
  position: 'inline',
  svg: `<section style="height: 1px; background: linear-gradient(to right, transparent, #e0e0e0, transparent); margin: 20px 0;"></section>`,
};

/**
 * Star Accent (星标装饰)
 */
export const STAR_ACCENT: SVGDecorator = {
  id: 'star-accent',
  name: 'Star Accent',
  position: 'inline',
  svg: `<section style="display: inline-block; color: #ffd427; font-size: 20px; margin: 0 5px;">★</section>`,
};

/**
 * All available decorators
 */
export const ALL_DECORATORS: SVGDecorator[] = [
  YELLOW_DOTS_DECORATOR,
  RED_DOTS_DECORATOR,
  CORNER_TRIANGLE,
  DIVIDER_LINE,
  STAR_ACCENT,
];

/**
 * Get decorator by ID
 */
export const getDecorator = (id: string): SVGDecorator | undefined => {
  return ALL_DECORATORS.find(d => d.id === id);
};

/**
 * Inject decorator into content
 */
export const injectDecorator = (
  content: string,
  decorator: SVGDecorator,
  position: 'before' | 'after' = 'before'
): string => {
  if (position === 'before') {
    return decorator.svg + content;
  } else {
    return content + decorator.svg;
  }
};

/**
 * Apply decorators to title blocks
 * Implements the "decorator injection" pattern for titles
 */
export const decorateTitle = (
  title: string,
  decoratorId?: string,
  theme?: string
): string => {
  const baseStyle = theme === 'blue-professional' 
    ? 'background-color: #1a73e8; color: #ffffff;'
    : 'background-color: #c60201; color: #ffffff;';
  
  const titleHtml = `<section style="margin: 20px 0; display: flex; align-items: center;">
    <span style="${baseStyle} padding: 5px 15px; border-radius: 0 7px 7px 0; font-weight: bold;">
      ${title}
    </span>
  </section>`;
  
  if (!decoratorId) {
    return titleHtml;
  }
  
  const decorator = getDecorator(decoratorId);
  if (!decorator) {
    return titleHtml;
  }
  
  return injectDecorator(titleHtml, decorator, decorator.position || 'before');
};
