import { useEffect, useRef } from 'react';

/**
 * Keeps a table's <thead> pinned directly underneath the sticky .top-header
 * while scrolling through the table rows, releasing it past the last row.
 */
export function useStickyThead<T extends HTMLTableSectionElement>() {
  const theadRef = useRef<T | null>(null);

  useEffect(() => {
    const updateStickyPosition = () => {
      const thead = theadRef.current;
      const table = thead?.closest('table');
      if (!thead || !table) return;

      const topHeader = document.querySelector('.top-header');
      let headerBottom = 6;
      if (topHeader) {
        const pos = window.getComputedStyle(topHeader).position;
        if (pos === 'sticky' || pos === 'fixed') {
          headerBottom = Math.max(6, topHeader.getBoundingClientRect().bottom);
        }
      }

      const tableRect = table.getBoundingClientRect();
      const maxOffset = Math.max(0, tableRect.height - thead.offsetHeight);
      const rawOffset = headerBottom - tableRect.top;

      if (rawOffset > 0 && maxOffset > 0 && tableRect.bottom > headerBottom) {
        const clamped = Math.min(rawOffset, maxOffset);
        thead.style.transform = `translate3d(0, ${clamped}px, 0)`;
        thead.classList.add('is-stuck');
      } else {
        thead.style.transform = 'translate3d(0, 0, 0)';
        thead.classList.remove('is-stuck');
      }
    };

    updateStickyPosition();
    window.addEventListener('scroll', updateStickyPosition, { passive: true });
    window.addEventListener('resize', updateStickyPosition, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateStickyPosition);
      window.removeEventListener('resize', updateStickyPosition);
    };
  }, []);

  return theadRef;
}
