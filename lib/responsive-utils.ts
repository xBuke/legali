/**
 * Responsive utilities for dynamic screen size adaptation
 */

export interface ScreenSize {
  width: number;
  height: number;
  type: 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'ultrawide';
  isLaptop: boolean;
  isSmallScreen: boolean;
}

/**
 * Detect current screen size and type
 */
export function getScreenSize(): ScreenSize {
  if (typeof window === 'undefined') {
    return {
      width: 1920,
      height: 1080,
      type: 'desktop',
      isLaptop: false,
      isSmallScreen: false,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  let type: ScreenSize['type'];
  let isLaptop = false;
  let isSmallScreen = false;

  if (width < 768) {
    type = 'mobile';
    isSmallScreen = true;
  } else if (width < 1024) {
    type = 'tablet';
    isSmallScreen = true;
  } else if (width < 1366) {
    type = 'laptop';
    isLaptop = true;
  } else if (width < 1920) {
    type = 'laptop';
    isLaptop = true;
  } else {
    type = 'ultrawide';
  }

  // Consider height for small screens
  if (height < 768) {
    isSmallScreen = true;
  }

  return {
    width,
    height,
    type,
    isLaptop,
    isSmallScreen,
  };
}

/**
 * Get responsive classes based on screen size
 */
export function getResponsiveClasses(): string {
  const screen = getScreenSize();
  const classes: string[] = [];

  // Add screen type class
  classes.push(`screen-${screen.type}`);

  // Add specific laptop classes
  if (screen.isLaptop) {
    classes.push('laptop-optimized');
    
    if (screen.width >= 1366 && screen.width < 1440) {
      classes.push('laptop-1366');
    } else if (screen.width >= 1440 && screen.width < 1920) {
      classes.push('laptop-1440');
    }
  }

  // Add small screen classes
  if (screen.isSmallScreen) {
    classes.push('small-screen');
  }

  return classes.join(' ');
}

/**
 * Apply responsive classes to document body
 */
export function applyResponsiveClasses(): void {
  if (typeof document === 'undefined') return;

  const classes = getResponsiveClasses();
  const body = document.body;

  // Remove existing responsive classes
  body.classList.remove(
    'screen-mobile',
    'screen-tablet', 
    'screen-laptop',
    'screen-desktop',
    'screen-ultrawide',
    'laptop-optimized',
    'laptop-1366',
    'laptop-1440',
    'small-screen'
  );

  // Add new classes
  classes.split(' ').forEach(cls => {
    if (cls) body.classList.add(cls);
  });
}

/**
 * Initialize responsive behavior
 */
export function initResponsive(): () => void {
  if (typeof window === 'undefined') return () => {};

  // Apply initial classes
  applyResponsiveClasses();

  // Listen for resize events
  let timeoutId: NodeJS.Timeout;
  const handleResize = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      applyResponsiveClasses();
    }, 100); // Debounce resize events
  };

  window.addEventListener('resize', handleResize);

  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
    clearTimeout(timeoutId);
  };
}

/**
 * Get optimal popup positioning based on screen size
 */
export function getPopupPosition(element: HTMLElement): {
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
} {
  const screen = getScreenSize();
  const rect = element.getBoundingClientRect();

  // For small screens, prefer bottom positioning
  if (screen.isSmallScreen) {
    return { side: 'bottom', align: 'start' };
  }

  // For laptop screens, consider available space
  if (screen.isLaptop) {
    const spaceBelow = screen.height - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow > 200 || spaceBelow > spaceAbove) {
      return { side: 'bottom', align: 'start' };
    } else {
      return { side: 'top', align: 'start' };
    }
  }

  // Default positioning
  return { side: 'bottom', align: 'start' };
}

/**
 * Check if element fits in viewport
 */
export function fitsInViewport(element: HTMLElement): boolean {
  const screen = getScreenSize();
  const rect = element.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= screen.height &&
    rect.right <= screen.width
  );
}
