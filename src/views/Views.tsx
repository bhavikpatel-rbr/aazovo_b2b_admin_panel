import { Suspense } from 'react'
import Loading from '@/components/shared/Loading'
import AllRoutes from '@/components/route/AllRoutes'
import type { LayoutType } from '@/@types/theme'

interface ViewsProps {
    pageContainerType?: 'default' | 'gutterless' | 'contained'
    layout?: LayoutType
}

const Views = (props: ViewsProps) => {
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
    )
}

export default Views
