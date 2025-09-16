/**
 * Framer Motion TypeScript Declarations
 * Fixes for Framer Motion component prop conflicts
 */

import { HTMLMotionProps } from 'framer-motion';

declare module 'framer-motion' {
  interface HTMLMotionProps<T> extends React.HTMLAttributes<T> {
    // Allow all standard HTML attributes
    [key: string]: any;
  }
}

// Extend motion components to accept all HTML props
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'motion.div': React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement> & any, HTMLDivElement>;
      'motion.button': React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement> & any, HTMLButtonElement>;
      'motion.a': React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement> & any, HTMLAnchorElement>;
      'motion.form': React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement> & any, HTMLFormElement>;
      'motion.span': React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement> & any, HTMLSpanElement>;
      'motion.h1': React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement> & any, HTMLHeadingElement>;
      'motion.h2': React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement> & any, HTMLHeadingElement>;
      'motion.h3': React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement> & any, HTMLHeadingElement>;
      'motion.p': React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement> & any, HTMLParagraphElement>;
      'motion.section': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & any, HTMLElement>;
      'motion.article': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & any, HTMLElement>;
      'motion.header': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & any, HTMLElement>;
      'motion.footer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & any, HTMLElement>;
      'motion.nav': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & any, HTMLElement>;
      'motion.main': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & any, HTMLElement>;
      'motion.aside': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & any, HTMLElement>;
      'motion.ul': React.DetailedHTMLProps<React.HTMLAttributes<HTMLUListElement> & any, HTMLUListElement>;
      'motion.ol': React.DetailedHTMLProps<React.OlHTMLAttributes<HTMLOListElement> & any, HTMLOListElement>;
      'motion.li': React.DetailedHTMLProps<React.LiHTMLAttributes<HTMLLIElement> & any, HTMLLIElement>;
      'motion.img': React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement> & any, HTMLImageElement>;
      'motion.input': React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement> & any, HTMLInputElement>;
      'motion.textarea': React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement> & any, HTMLTextAreaElement>;
      'motion.select': React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement> & any, HTMLSelectElement>;
      'motion.label': React.DetailedHTMLProps<React.LabelHTMLAttributes<HTMLLabelElement> & any, HTMLLabelElement>;
    }
  }
}
