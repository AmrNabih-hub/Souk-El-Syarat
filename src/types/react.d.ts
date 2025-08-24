/// <reference types="react" />
/// <reference types="react-dom" />

import * as React from 'react';

declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
    interface ElementClass extends React.Component<any> {
      render(): React.ReactNode;
    }
    interface ElementAttributesProperty {
      props: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }

    interface IntrinsicElements {
      // HTML Elements
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
      button: React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        HTMLButtonElement
      >;
      h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h3: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h4: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h5: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h6: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      a: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;
      img: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
      input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
      form: React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;
      label: React.DetailedHTMLProps<React.LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>;
      select: React.DetailedHTMLProps<
        React.SelectHTMLAttributes<HTMLSelectElement>,
        HTMLSelectElement
      >;
      option: React.DetailedHTMLProps<
        React.OptionHTMLAttributes<HTMLOptionElement>,
        HTMLOptionElement
      >;
      textarea: React.DetailedHTMLProps<
        React.TextareaHTMLAttributes<HTMLTextAreaElement>,
        HTMLTextAreaElement
      >;
      ul: React.DetailedHTMLProps<React.HTMLAttributes<HTMLUListElement>, HTMLUListElement>;
      ol: React.DetailedHTMLProps<React.OlHTMLAttributes<HTMLOListElement>, HTMLOListElement>;
      li: React.DetailedHTMLProps<React.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>;
      nav: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      section: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      header: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      footer: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      main: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      article: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      aside: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;

      // SVG Elements
      svg: React.SVGProps<SVGSVGElement>;
      path: React.SVGProps<SVGPathElement>;
      circle: React.SVGProps<SVGCircleElement>;
      rect: React.SVGProps<SVGRectElement>;
      line: React.SVGProps<SVGLineElement>;
      polygon: React.SVGProps<SVGPolygonElement>;
      polyline: React.SVGProps<SVGPolylineElement>;
      text: React.SVGProps<SVGTextElement>;
      g: React.SVGProps<SVGGElement>;
      defs: React.SVGProps<SVGDefsElement>;
      use: React.SVGProps<SVGUseElement>;

      // Catch-all for other elements
      [elemName: string]: unknown;
    }
  }

  // Re-export React types for global access
  namespace React {
    type MouseEvent<T = Element> = React.MouseEvent<T>;
    type ChangeEvent<T = Element> = React.ChangeEvent<T>;
    type FormEvent<T = Element> = React.FormEvent<T>;
    type KeyboardEvent<T = Element> = React.KeyboardEvent<T>;
    type FocusEvent<T = Element> = React.FocusEvent<T>;
    type TouchEvent<T = Element> = React.TouchEvent<T>;
    type WheelEvent<T = Element> = React.WheelEvent<T>;
    type AnimationEvent<T = Element> = React.AnimationEvent<T>;
    type TransitionEvent<T = Element> = React.TransitionEvent<T>;
  }
}

// Module augmentation for React
declare module 'react' {
  export interface FC<P = {}> extends React.FunctionComponent<P> {}
  export interface Component<P = {}, S = {}> extends React.Component<P, S> {}

  // Ensure useState is properly exported
  export function useState<S>(
    initialState: S | (() => S)
  ): [S, React.Dispatch<React.SetStateAction<S>>];
  export function useState<S = undefined>(): [
    S | undefined,
    React.Dispatch<React.SetStateAction<S | undefined>>,
  ];

  // Ensure useEffect and other hooks are properly exported
  export function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
  export function useCallback<T extends (...args: unknown[]) => any>(
    callback: T,
    deps: React.DependencyList
  ): T;
  export function useMemo<T>(factory: () => T, deps: React.DependencyList): T;
  export function useRef<T>(initialValue: T): React.MutableRefObject<T>;
  export function useRef<T>(initialValue: T | null): React.RefObject<T>;
  export function useRef<T = undefined>(): React.MutableRefObject<T | undefined>;

  // Event types
  export type MouseEvent<T = Element> = React.MouseEvent<T>;
  export type ChangeEvent<T = Element> = React.ChangeEvent<T>;
  export type FormEvent<T = Element> = React.FormEvent<T>;
  export type KeyboardEvent<T = Element> = React.KeyboardEvent<T>;
  export type FocusEvent<T = Element> = React.FocusEvent<T>;
}

export {};
