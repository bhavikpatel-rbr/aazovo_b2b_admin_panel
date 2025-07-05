// src/layouts/FrameLessSide.tsx

import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import SideNav from '@/components/template/SideNav'
import Header from '@/components/template/Header'
import FrameLessGap from '@/components/template/FrameLessGap'
import SideNavToggle from '@/components/template/SideNavToggle'
import MobileNav from '@/components/template/MobileNav'
import Search from '@/components/template/Search'
import Notification from '@/components/template/Notification'
import UserProfileDropdown from '@/components/template/UserProfileDropdown'
import SidePanel from '@/components/template/SidePanel'
import LayoutBase from '@/components/template/LayoutBase'
import ActiveItems from '@/components/template/Notification/ActiveItems'
import Calender from '@/components/template/Notification/Calender'
import Tasks from '@/components/template/Notification/Task'
import useResponsive from '@/utils/hooks/useResponsive'
import useScrollTop from '@/utils/hooks/useScrollTop'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { punchIn, punchOut } from '@/reduxtool/auth/authSlice'
import { RootState, useAppDispatch } from '@/reduxtool/store'
import classNames from '@/utils/classNames'
import { TbPower } from 'react-icons/tb'
import type { CommonProps } from '@/@types/common'
import { LAYOUT_FRAMELESS_SIDE } from '@/constants/theme.constant'

const FrameLessSide = ({ children }: CommonProps) => {
    const { larger, smaller } = useResponsive()
    const { isSticky } = useScrollTop()
    const dispatch = useAppDispatch()

    const { signedIn, punchInStatus } = useSelector((state: RootState) => state.Auth)

    const [isPunchInDialogOpen, setIsPunchInDialogOpen] = useState(false)
    const [promptHasBeenShown, setPromptHasBeenShown] = useState(false)

    useEffect(() => {
        if (!signedIn) {
            setPromptHasBeenShown(false)
        }
    }, [signedIn])

    const handleConfirmPunchIn = () => {
        dispatch(punchIn())
        setIsPunchInDialogOpen(false)
    }

    const handleCloseDialog = () => {
        setIsPunchInDialogOpen(false)
    }

    const handlePunchToggle = () => {
        if (punchInStatus === 'punched-in') {
            dispatch(punchOut())
        } else {
            dispatch(punchIn())
        }
    }

    const isPunchedIn = punchInStatus === 'punched-in'

    return (
        <LayoutBase
            adaptiveCardActive
            type={LAYOUT_FRAMELESS_SIDE}
            className="app-layout-frameless-side flex flex-auto flex-col bg-gray-950"
            pageContainerReassemble={({
                pageContainerType,
                pageBackgroundType,
                pageContainerGutterClass,
                children,
                footer,
                header,
                defaultClass,
                pageContainerDefaultClass,
                PageContainerBody,
                PageContainerFooter,
                PageContainerHeader,
            }) => (
                <div
                    className={classNames(
                        defaultClass,
                        'rounded-2xl',
                        pageBackgroundType === 'plain' && 'bg-white dark:bg-gray-900'
                    )}
                >
                    <main className="h-full">
                        <div
                            className={classNames(
                                pageContainerDefaultClass,
                                pageContainerType !== 'gutterless' && pageContainerGutterClass,
                                pageContainerType === 'contained' && 'container mx-auto',
                                !footer && 'pb-0 sm:pb-0 md:pb-0'
                            )}
                        >
                            <PageContainerHeader
                                {...header}
                                gutterLess={pageContainerType === 'gutterless'}
                            />
                            <PageContainerBody pageContainerType={pageContainerType}>
                                {children}
                            </PageContainerBody>
                        </div>
                    </main>
                    <PageContainerFooter
                        footer={footer}
                        pageContainerType={pageContainerType}
                    />
                </div>
            )}
        >
            <div className="flex flex-auto min-w-0 ">
                {larger.lg && (
                    <SideNav
                        background={false}
                        className={classNames('contrast-dark pt-6 pb-5')}
                        contentClass="h-[calc(100vh-8rem)]"
                        mode="dark"
                    />
                )}
                <FrameLessGap className="min-h-screen min-w-0 relative w-full">
                    <div className="bg-white dark:bg-gray-900 flex flex-col flex-1 h-full rounded-2xl z-40">
                        <Header
                            className={classNames(
                                'rounded-t-2xl dark:bg-gray-900',
                                isSticky && 'shadow-sm rounded-none!'
                            )}
                            headerStart={
                                <>
                                    {smaller.lg && <MobileNav />}
                                    {larger.lg && <SideNavToggle />}
                                    <span className="text-lg font-bold text-gray-900 dark:text-gray-300 mr-2 hidden lg:inline">
                                        Aazovo Back Office Management System
                                    </span>
                                    <Search />
                                </>
                            }
                            headerEnd={
                                <>
                                    {/* <div
                                        onClick={handlePunchToggle}
                                        className={`text-xs cursor-pointer rounded-full py-2 px-3 flex gap-1 items-center transition-colors duration-200
                                            ${isPunchedIn
                                                ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-500/30'
                                                : 'bg-gray-100 dark:bg-gray-700 dark:text-white hover:bg-green-200 hover:text-black dark:hover:bg-green-200 dark:hover:text-black'
                                            }`}
                                    >
                                        <TbPower size={20} />
                                        <span>{isPunchedIn ? 'Punch Out' : 'Punch In'}</span>
                                    </div> */}
                                    <Notification />
                                    <ActiveItems />
                                    <Calender />
                                    <Tasks />
                                    <SidePanel />
                                    <UserProfileDropdown hoverable={false} />
                                </>
                            }
                        />
                        <div className="h-full flex flex-auto flex-col">
                            {children}
                        </div>
                    </div>
                </FrameLessGap>
            </div>

            <ConfirmDialog
                isOpen={isPunchInDialogOpen}
                type="info"
                title="Welcome!"
                onClose={handleCloseDialog}
                onRequestClose={handleCloseDialog}
                onCancel={handleCloseDialog}
                onConfirm={handleConfirmPunchIn}
                confirmText="Punch In"
                cancelText="Later"
            >
                <p>Please Punch In to start your day.</p>
            </ConfirmDialog>
        </LayoutBase>
    )
}

export default FrameLessSide
