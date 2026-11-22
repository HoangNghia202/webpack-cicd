declare module '*.module.scss' {
  const classes: Record<string, string>;
  export default classes;
}
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
declare module '*.svg' {
  import type { FC, SVGProps } from 'react';
  const Component: FC<SVGProps<SVGSVGElement>>;
  export default Component;
}
declare module '*.svg?url' {
  const src: string;
  export default src;
}
declare module '*.svg?inline' {
  const src: string;
  export default src;
}
declare module '*?raw' {
  const content: string;
  export default content;
}
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.jpg' {
  const src: string;
  export default src;
}
declare module '*.jpeg' {
  const src: string;
  export default src;
}
declare module '*.gif' {
  const src: string;
  export default src;
}
declare module '*.webp' {
  const src: string;
  export default src;
}
