// 动画配置
export const animationConfig = {
  // 动画时长
  duration: {
    FAST: 0.2,
    NORMAL: 0.3,
    SLOW: 0.5,
    VERY_SLOW: 0.8
  },

  // 动画延迟
  delay: {
    NONE: 0,
    SHORT: 0.1,
    MEDIUM: 0.2,
    LONG: 0.3
  },

  // 弹簧配置
  spring: {
    GENTLE: { stiffness: 120, damping: 14 },
    WOBBLY: { stiffness: 180, damping: 12 },
    STIFF: { stiffness: 300, damping: 25 },
    SLOW: { stiffness: 280, damping: 60 }
  },

  // 缓动函数
  easing: {
    EASE_IN_OUT: [0.4, 0, 0.2, 1],
    EASE_OUT: [0, 0, 0.2, 1],
    EASE_IN: [0.4, 0, 1, 1],
    EASE_OUT_BACK: [0.34, 1.56, 0.64, 1],
    EASE_IN_BACK: [0.36, 0, 0.66, -0.56]
  },

  // 动画变体
  variants: {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 }
    }
  }
}; 