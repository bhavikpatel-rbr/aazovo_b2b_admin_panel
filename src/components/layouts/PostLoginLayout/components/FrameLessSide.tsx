// src/layouts/FrameLessSide.tsx

import SideNav from '@/components/template/SideNav'
import Header from '@/components/template/Header'
import FrameLessGap from '@/components/template/FrameLessGap'
import SideNavToggle from '@/components/template/SideNavToggle'
import MobileNav from '@/components/template/MobileNav'
import Search from '@/components/template/Search'
import LanguageSelector from '@/components/template/LanguageSelector'
import { LiaUserCheckSolid } from "react-icons/lia";
import { LuCalendarCheck } from "react-icons/lu";
import { IoCalendarOutline } from "react-icons/io5";
import { BiTask } from "react-icons/bi";
import Notification from '@/components/template/Notification'
import UserProfileDropdown from '@/components//template/UserProfileDropdown'
import SidePanel from '@/components//template/SidePanel'
import LayoutBase from '@/components//template/LayoutBase'
import classNames from '@/utils/classNames'
import useScrollTop from '@/utils/hooks/useScrollTop'
import useResponsive from '@/utils/hooks/useResponsive'
import { LAYOUT_FRAMELESS_SIDE } from '@/constants/theme.constant'
import type { CommonProps } from '@/@types/common'
import type { FooterPageContainerType } from '@/components/template/Footer'
import { TbPower } from 'react-icons/tb'
import ActiveItems from '@/components/template/Notification/ActiveItems'
import Calender from '@/components/template/Notification/Calender'
import Tasks from '@/components/template/Notification/Task'

const FrameLessSide = ({ children }: CommonProps) => {
    const { isSticky } = useScrollTop()

    const { larger, smaller } = useResponsive()

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
                        pageBackgroundType === 'plain' &&
                            'bg-white dark:bg-gray-900',
                    )}
                >
                    <main className="h-full">
                        <div
                            className={classNames(
                                pageContainerDefaultClass,
                                pageContainerType !== 'gutterless' &&
                                    pageContainerGutterClass,
                                pageContainerType === 'contained' &&
                                    'container mx-auto',
                                !footer && 'pb-0 sm:pb-0 md:pb-0',
                            )}
                        >
                            <PageContainerHeader
                                {...header}
                                gutterLess={pageContainerType === 'gutterless'}
                            />
                            <PageContainerBody
                                pageContainerType={pageContainerType}
                            >
                                {children}
                            </PageContainerBody>
                        </div>
                    </main>
                    <PageContainerFooter
                        footer={footer}
                        pageContainerType={
                            pageContainerType as FooterPageContainerType
                        }
                    />
                </div>
            )}
        >
            <div className="flex flex-auto min-w-0">
                {larger.lg && (
                    <SideNav
                        background={false}
                        className={classNames('contrast-dark pt-6')}
                        contentClass="h-[calc(100vh-8rem)]"
                        mode="dark"
                    />
                )}
                <FrameLessGap className="min-h-screen min-w-0 relative w-full">
                    {/* FIX: Added z-40 to elevate this container's stacking context */}
                    <div className="bg-white dark:bg-gray-900 flex flex-col flex-1 h-full rounded-2xl z-40">
                        <Header
                            className={classNames(
                                'rounded-t-2xl dark:bg-gray-900',
                                isSticky && 'shadow-sm rounded-none!',
                            )}
                            headerStart={
                                <>
                                    {smaller.lg && <MobileNav />}
                                    {larger.lg && <SideNavToggle />}
                                    <span className="text-lg font-bold text-gray-900 dark:text-gray-300 mr-2 hidden lg:inline">
                                        {' '}
                                        Aazovo Back Office Management System
                                    </span>
                                    <Search />
                                </>
                            }
                        headerEnd={
                            <>
                                {/* Puch in and out button */}
                                <div className='text-xs bg-gray-100 dark:bg-gray-700 dark:text-white 
                                    hover:bg-green-200 hover:text-black 
                                    dark:hover:bg-green-200 dark:hover:text-black 
                                    cursor-pointer rounded-full py-2 px-3 flex gap-1 items-center'>
                                    <TbPower size={20} />
                                    <span>Punch in</span>
                                </div>
                                <Notification />
                                <ActiveItems />
                                <Calender />
                                <Tasks />
                                {/* <LanguageSelector/> */}
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
        </LayoutBase>
    )
}

export default FrameLessSide