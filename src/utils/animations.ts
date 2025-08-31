/**
 * Advanced Animation Library
 * Comprehensive animation presets and utilities
 */

import { Variants } from 'framer-motion';
import React from 'react';

// Animation Timing Functions
export const easings = {
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  sharp: [0.4, 0, 0.6, 1],
  smooth: [0.25, 0.1, 0.25, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
} as const;

// Spring Configurations
export const springs = {
  gentle: { type: 'spring', stiffness: 100, damping: 15 },
  wobbly: { type: 'spring', stiffness: 180, damping: 12 },
  stiff: { type: 'spring', stiffness: 300, damping: 20 },
  slow: { type: 'spring', stiffness: 50, damping: 20 },
  molasses: { type: 'spring', stiffness: 20, damping: 25 },
} as const;

// Page Transition Variants
export const pageTransitions = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },
  
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: springs.gentle,
  },
  
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: springs.gentle,
  },
  
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: springs.gentle,
  },
  
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: springs.gentle,
  },
  
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: springs.stiff,
  },
  
  rotate: {
    initial: { opacity: 0, rotate: -10 },
    animate: { opacity: 1, rotate: 0 },
    exit: { opacity: 0, rotate: 10 },
    transition: springs.wobbly,
  },
};

// Stagger Children Animations
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
};

// Card Hover Animations
export const cardAnimations = {
  lift: {
    rest: {
      y: 0,
      scale: 1,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      transition: springs.gentle,
    },
    hover: {
      y: -8,
      scale: 1.02,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      transition: springs.stiff,
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 },
    },
  },
  
  glow: {
    rest: {
      boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)',
      transition: { duration: 0.3 },
    },
    hover: {
      boxShadow: '0 0 20px 5px rgba(59, 130, 246, 0.3)',
      transition: { duration: 0.3 },
    },
  },
  
  tilt: {
    rest: {
      rotateX: 0,
      rotateY: 0,
      transition: springs.gentle,
    },
    hover: {
      rotateX: -5,
      rotateY: 5,
      transition: springs.stiff,
    },
  },
};

// Button Animations
export const buttonAnimations = {
  scale: {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  },
  
  shine: {
    rest: {
      backgroundPosition: '-200% center',
      transition: { duration: 0 },
    },
    hover: {
      backgroundPosition: '200% center',
      transition: { duration: 0.8 },
    },
  },
  
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
  
  wiggle: {
    hover: {
      rotate: [0, -3, 3, -3, 3, 0],
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
    },
  },
};

// Loading Animations
export const loadingAnimations = {
  spinner: {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  },
  
  dots: {
    animate: (i: number) => ({
      y: [0, -20, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        delay: i * 0.1,
        ease: easings.easeInOut,
      },
    }),
  },
  
  bars: {
    animate: (i: number) => ({
      scaleY: [0.3, 1, 0.3],
      transition: {
        duration: 1,
        repeat: Infinity,
        delay: i * 0.1,
        ease: easings.easeInOut,
      },
    }),
  },
  
  pulse: {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [1, 0.5, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: easings.easeInOut,
      },
    },
  },
};

// Scroll Animations
export const scrollAnimations = {
  fadeInUp: {
    initial: {
      opacity: 0,
      y: 60,
    },
    whileInView: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: easings.easeOut,
      },
    },
    viewport: {
      once: true,
      amount: 0.3,
    },
  },
  
  fadeInDown: {
    initial: {
      opacity: 0,
      y: -60,
    },
    whileInView: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: easings.easeOut,
      },
    },
    viewport: {
      once: true,
      amount: 0.3,
    },
  },
  
  fadeInLeft: {
    initial: {
      opacity: 0,
      x: -60,
    },
    whileInView: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: easings.easeOut,
      },
    },
    viewport: {
      once: true,
      amount: 0.3,
    },
  },
  
  fadeInRight: {
    initial: {
      opacity: 0,
      x: 60,
    },
    whileInView: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: easings.easeOut,
      },
    },
    viewport: {
      once: true,
      amount: 0.3,
    },
  },
  
  zoomIn: {
    initial: {
      opacity: 0,
      scale: 0.5,
    },
    whileInView: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: easings.easeOut,
      },
    },
    viewport: {
      once: true,
      amount: 0.3,
    },
  },
};

// Text Animations
export const textAnimations = {
  typewriter: {
    initial: { width: 0 },
    animate: {
      width: '100%',
      transition: {
        duration: 2,
        ease: 'linear',
      },
    },
  },
  
  letterByLetter: {
    container: {
      initial: {},
      animate: {
        transition: {
          staggerChildren: 0.05,
        },
      },
    },
    letter: {
      initial: {
        opacity: 0,
        y: 20,
      },
      animate: {
        opacity: 1,
        y: 0,
        transition: springs.gentle,
      },
    },
  },
  
  wordByWord: {
    container: {
      initial: {},
      animate: {
        transition: {
          staggerChildren: 0.1,
        },
      },
    },
    word: {
      initial: {
        opacity: 0,
        x: -20,
      },
      animate: {
        opacity: 1,
        x: 0,
        transition: springs.gentle,
      },
    },
  },
  
  gradient: {
    animate: {
      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      transition: {
        duration: 5,
        ease: 'linear',
        repeat: Infinity,
      },
    },
  },
};

// Modal/Overlay Animations
export const modalAnimations = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },
  
  modal: {
    initial: {
      opacity: 0,
      scale: 0.9,
      y: 20,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: springs.stiff,
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: { duration: 0.2 },
    },
  },
  
  drawer: {
    left: {
      initial: { x: '-100%' },
      animate: { x: 0 },
      exit: { x: '-100%' },
      transition: springs.stiff,
    },
    right: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' },
      transition: springs.stiff,
    },
    top: {
      initial: { y: '-100%' },
      animate: { y: 0 },
      exit: { y: '-100%' },
      transition: springs.stiff,
    },
    bottom: {
      initial: { y: '100%' },
      animate: { y: 0 },
      exit: { y: '100%' },
      transition: springs.stiff,
    },
  },
};

// Notification Animations
export const notificationAnimations = {
  slideIn: {
    initial: {
      x: 320,
      opacity: 0,
    },
    animate: {
      x: 0,
      opacity: 1,
      transition: springs.stiff,
    },
    exit: {
      x: 320,
      opacity: 0,
      transition: { duration: 0.2 },
    },
  },
  
  pop: {
    initial: {
      scale: 0,
      opacity: 0,
    },
    animate: {
      scale: 1,
      opacity: 1,
      transition: springs.wobbly,
    },
    exit: {
      scale: 0,
      opacity: 0,
      transition: { duration: 0.2 },
    },
  },
  
  bounce: {
    initial: {
      y: -100,
      opacity: 0,
    },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 25,
      },
    },
    exit: {
      y: -100,
      opacity: 0,
      transition: { duration: 0.2 },
    },
  },
};

// Gesture Animations
export const gestureAnimations = {
  swipe: {
    swipeLeft: {
      x: -300,
      opacity: 0,
      transition: { duration: 0.3 },
    },
    swipeRight: {
      x: 300,
      opacity: 0,
      transition: { duration: 0.3 },
    },
  },
  
  drag: {
    dragConstraints: {
      top: -50,
      left: -50,
      right: 50,
      bottom: 50,
    },
    dragElastic: 0.2,
    dragTransition: {
      bounceStiffness: 600,
      bounceDamping: 20,
    },
  },
  
  pinch: {
    whilePinch: {
      scale: 1.2,
      transition: { duration: 0.2 },
    },
  },
};

// Parallax Effect Helper
export const createParallaxAnimation = (offset: number = 50) => ({
  initial: { y: -offset },
  animate: {
    y: offset,
    transition: {
      duration: 0.5,
      ease: 'linear',
    },
  },
});

// Custom Hook for Complex Animations
export const useComplexAnimation = (
  variants: Variants,
  dependencies: any[] = []
) => {
  const [animationState, setAnimationState] = React.useState('initial');
  
  React.useEffect(() => {
    setAnimationState('animate');
  }, dependencies);
  
  return {
    variants,
    initial: 'initial',
    animate: animationState,
    exit: 'exit',
  };
};

// Export all animations
export default {
  easings,
  springs,
  pageTransitions,
  staggerContainer,
  staggerItem,
  cardAnimations,
  buttonAnimations,
  loadingAnimations,
  scrollAnimations,
  textAnimations,
  modalAnimations,
  notificationAnimations,
  gestureAnimations,
  createParallaxAnimation,
  useComplexAnimation,
};
