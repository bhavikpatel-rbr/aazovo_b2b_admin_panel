import { lazy, Suspense } from 'react'
import {
    LAYOUT_COLLAPSIBLE_SIDE,
    LAYOUT_STACKED_SIDE,
    LAYOUT_TOP_BAR_CLASSIC,
    LAYOUT_FRAMELESS_SIDE,
    LAYOUT_CONTENT_OVERLAY,
    LAYOUT_BLANK,
} from '@/constants/theme.constant'
import Loading from '@/components/shared/Loading'
import type { CommonProps } from '@/@types/common'
import type { LazyExoticComponent, JSX } from 'react'
import type { LayoutType } from '@/@types/theme'

type Layouts = Record<
    string,
    LazyExoticComponent<<T extends CommonProps>(props: T) => JSX.Element>
>

interface PostLoginLayoutProps extends CommonProps {
    layoutType: LayoutType
}

const layouts: Layouts = {
    [LAYOUT_COLLAPSIBLE_SIDE]: lazy(
        () => import('./components/CollapsibleSide'),
    ),
    [LAYOUT_STACKED_SIDE]: lazy(() => import('./components/StackedSide')),
    [LAYOUT_TOP_BAR_CLASSIC]: lazy(() => import('./components/TopBarClassic')),
    [LAYOUT_FRAMELESS_SIDE]: lazy(() => import('./components/FrameLessSide')),
    [LAYOUT_CONTENT_OVERLAY]: lazy(() => import('./components/ContentOverlay')),
    [LAYOUT_BLANK]: lazy(() => import('./components/Blank')),
}

const PostLoginLayout = ({ layoutType, children }: PostLoginLayoutProps) => {
    const AppLayout = layouts[layoutType] ?? layouts[Object.keys(layouts)[0]]

    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center w-[100vw] h-[100vh]">
                    <div className='relative h-[500px] w-[500px] flex items-center justify-center'>
                        <div className=' absolute border-9 border-primary border-b-0 border-r-0 animate-spin rounded-full h-[360px] w-[360px]'></div>
                        <div className='flex object-center'>
                            <img src="/img/logo/Aazovo-02.png" alt="" className='w-[220px] dark:filter-[invert(1)]' />
                        </div>
                    </div>
                </div>
            }
        >
            <AppLayout>{children}</AppLayout>
        </Suspense>
    )
}

export default PostLoginLayout
