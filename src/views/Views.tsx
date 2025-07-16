// src/components/route/Views.tsx

import { Suspense, useEffect } from 'react'; // <--- 1. Import useEffect
import Loading from '@/components/shared/Loading';
import AllRoutes from '@/components/route/AllRoutes';
import type { LayoutType } from '@/@types/theme';

interface ViewsProps {
    pageContainerType?: 'default' | 'gutterless' | 'contained';
    layout?: LayoutType;
}

// 2. Define the types for focusable elements we care about
type FocusableElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
  | HTMLButtonElement;

const Views = (props: ViewsProps) => {
    // 3. Add the global event listener logic inside a useEffect hook
    useEffect(() => {
        const handleGlobalKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Enter' || event.shiftKey) {
                return;
            }

            const activeElement = document.activeElement as HTMLElement;
            const form = activeElement?.closest('form');
            if (!form) {
                return;
            }

            const isSpecialElement = 
                activeElement.tagName.toLowerCase() === 'button' ||
                (activeElement.tagName.toLowerCase() === 'input' && ['submit', 'reset', 'button', 'checkbox'].includes((activeElement as HTMLInputElement).type)) ||
                activeElement.closest('.react-select__control');

            if (isSpecialElement) {
                return;
            }

            event.preventDefault();

            const focusableElementsSelector = 'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([type="button"]):not([disabled]), [tabindex]:not([tabindex="-1"])';
            
            const allFocusableInForm = Array.from(
                form.querySelectorAll<FocusableElement>(focusableElementsSelector)
            ).filter(el => el.offsetParent !== null);

            const currentIndex = allFocusableInForm.indexOf(activeElement as FocusableElement);
            const nextElement = allFocusableInForm[currentIndex + 1];

            if (nextElement) {
                nextElement.focus();
            } else {
                const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]:not([disabled]), button:not([type="button"]):not([disabled])');
                if (submitButton) {
                    submitButton.click();
                }
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown);

        return () => {
            document.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, []); // The empty dependency array [] ensures this effect runs only once.


    // 4. Your original component return statement remains unchanged.
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center w-full h-full">
                    <div className='relative h-[200px] w-[200px] flex items-center justify-center'>
                        <div className='flex object-center'>
                            <img src="/img/logo/Aazovo-01.png" alt="" className='w-[100px] dark:filter-[invert(1)] animate-ping' />
                        </div>
                    </div>
                </div>
            }
        >
            <AllRoutes {...props} />
        </Suspense>
    );
};

export default Views;