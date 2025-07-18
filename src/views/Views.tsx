// src/components/route/Views.tsx

import { Suspense, useEffect } from 'react';
import Loading from '@/components/shared/Loading';
import AllRoutes from '@/components/route/AllRoutes';
import type { LayoutType } from '@/@types/theme';

interface ViewsProps {
    pageContainerType?: 'default' | 'gutterless' | 'contained';
    layout?: LayoutType;
}

// --- START: Keyboard Navigation Logic ---

const FOCUSABLE_SELECTOR = `a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled]), [tabindex]:not([tabindex="-1"])`;


// --- START: NEW, SMARTER shouldIgnoreEvent FUNCTION ---
/**
 * Checks if the event should be ignored. It's now smarter about custom dropdowns.
 */
const shouldIgnoreEvent = (element: HTMLElement, key: string): boolean => {
    // Standard ignores for textareas and buttons
    if (element.tagName === 'TEXTAREA' && key === 'Enter') return true;
    if (element.tagName === 'BUTTON' && (key === 'Enter' || key === ' ')) return true;
    if (element.tagName === 'SELECT' && (key === 'ArrowUp' || key === 'ArrowDown')) return true;
    
    // Check for custom combobox/dropdown components (like react-select)
    const combobox = element.closest('[role="combobox"]');
    if (combobox && (key.startsWith('Arrow') || key === 'Enter')) {
        // --- THIS IS THE CRITICAL FIX ---
        // We only ignore the event IF the dropdown menu is currently open.
        // React-select and similar libraries render a menu div with a class like "__menu".
        const isMenuOpen = document.querySelector('[class*="__menu"]');
        
        if (isMenuOpen) {
            // The menu is open, so let the component handle its own navigation.
            return true;
        }
    }
    
    // If it's a combobox but the menu is CLOSED, or it's any other element,
    // let our global navigation logic take over.
    return false;
};
// --- END: NEW, SMARTER shouldIgnoreEvent FUNCTION ---


const calculateScore = (currentRect: DOMRect, candidateRect: DOMRect, direction: string): number => {
    const horizontal_distance = Math.abs(currentRect.left - candidateRect.left);
    const vertical_distance = Math.abs(currentRect.top - candidateRect.top);

    switch (direction) {
        case 'ArrowDown':
            if (candidateRect.top <= currentRect.top) return Infinity;
            return vertical_distance + (horizontal_distance * 2);
        case 'ArrowUp':
            if (candidateRect.top >= currentRect.top) return Infinity;
            return vertical_distance + (horizontal_distance * 2);
        case 'ArrowRight':
            if (candidateRect.left <= currentRect.left) return Infinity;
            return horizontal_distance + (vertical_distance * 2);
        case 'ArrowLeft':
            if (candidateRect.left >= currentRect.left) return Infinity;
            return horizontal_distance + (vertical_distance * 2);
        default:
            return Infinity;
    }
};

const findBestCandidate = (currentElement: HTMLElement, allElements: HTMLElement[], direction: string): HTMLElement | undefined => {
    const currentRect = currentElement.getBoundingClientRect();
    let bestCandidate: { element: HTMLElement | null; score: number } = { element: null, score: Infinity };

    for (const candidateElement of allElements) {
        if (candidateElement === currentElement) continue;
        const score = calculateScore(currentRect, candidateElement.getBoundingClientRect(), direction);
        if (score < bestCandidate.score) {
            bestCandidate = { element: candidateElement, score };
        }
    }
    return bestCandidate.element || undefined;
};

// --- END: Keyboard Navigation Logic ---

const Views = (props: ViewsProps) => {
    const { pageContainerType = 'default', layout } = props;

    useEffect(() => {
        // --- KEYDOWN HANDLER ---
        const handleGlobalKeyDown = (event: KeyboardEvent) => {
            const { key } = event;
            const navigationKeys = ['Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
            if (!navigationKeys.includes(key)) return;

            const activeElement = document.activeElement as HTMLElement;
            const form = activeElement?.closest('form');
            if (!form || !activeElement) return;

            if (shouldIgnoreEvent(activeElement, key)) return;
            
            event.preventDefault();

            const allFocusableInForm = Array.from(
                form.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
            ).filter(el => el.offsetParent !== null && el.getBoundingClientRect().width > 0);

            if (allFocusableInForm.length <= 1) return;

            let nextElement: HTMLElement | undefined;
            const currentIndex = allFocusableInForm.indexOf(activeElement);

            if (key === 'Enter') {
                if (currentIndex > -1 && currentIndex < allFocusableInForm.length - 1) {
                    nextElement = allFocusableInForm[currentIndex + 1];
                } else {
                    const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]:not([disabled])');
                    if (submitButton) submitButton.click();
                }
            } else {
                nextElement = findBestCandidate(activeElement, allFocusableInForm, key);
            }

            if (nextElement) nextElement.focus();
        };

        // --- CLICK HANDLER (for mouse selection in dropdowns) ---
        const handleGlobalClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // Use role="option" for better accessibility and reliability
            const selectOption = target.closest('[role="option"]');
            
            if (selectOption) {
                const form = selectOption.closest('form');
                if (!form) return;

                // Find the main container of the select component
                const selectContainer = selectOption.closest('[class*="__control"]')?.parentElement;
                if (!selectContainer) return;

                const allFocusableInForm = Array.from(
                    form.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
                ).filter(el => el.offsetParent !== null);
                
                const currentIndex = allFocusableInForm.findIndex(el => selectContainer.contains(el));
                
                if (currentIndex > -1 && currentIndex < allFocusableInForm.length - 1) {
                    const nextElement = allFocusableInForm[currentIndex + 1];
                    setTimeout(() => nextElement.focus(), 10);
                }
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown);
        document.addEventListener('click', handleGlobalClick);

        return () => {
            document.removeEventListener('keydown', handleGlobalKeyDown);
            document.removeEventListener('click', handleGlobalClick);
        };
    }, []);

    return (
        <Suspense fallback={<Loading loading={true} />}>
            <AllRoutes pageContainerType={pageContainerType} layout={layout} />
        </Suspense>
    );
};

export default Views;