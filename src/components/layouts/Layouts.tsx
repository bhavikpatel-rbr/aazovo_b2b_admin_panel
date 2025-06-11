import { Suspense } from 'react'
import Loading from '@/components/shared/Loading'
import type { CommonProps } from '@/@types/common'
import { useAuth } from '@/auth'
import { useThemeStore } from '@/store/themeStore'
import PostLoginLayout from './PostLoginLayout'
import PreLoginLayout from './PreLoginLayout'
import { useSelector } from 'react-redux'
import { authSelector } from '@/reduxtool/auth/authSlice'

const Layout = ({ children }: CommonProps) => {
    const layoutType = useThemeStore((state) => state.layout.type)
    const user = useSelector(authSelector)

    return (
        <Suspense
            fallback={
                <div className="flex flex-auto flex-col h-[100vh]">
                    <div className="flex items-center justify-center w-[100vw] h-[100vh]">
                        <div className='relative h-[500px] w-[500px] flex items-center justify-center'>
                            <div className=' absolute border-9 border-primary border-b-0 border-r-0 animate-spin rounded-full h-[360px] w-[360px]'></div>
                            <div className='flex object-center'>
                                <img src="/img/logo/Aazovo-02.png" alt="" className='w-[220px] dark:filter-[invert(1)]' />
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            {user.token ? (
                <PostLoginLayout layoutType={layoutType}>
                    {children}
                </PostLoginLayout>
            ) : (
                <PreLoginLayout>{children}</PreLoginLayout>
            )}
        </Suspense>
    )
}

export default Layout
