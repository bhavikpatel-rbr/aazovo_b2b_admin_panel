import SideNav from '@/components/template/SideNav'
import Header from '@/components/template/Header'
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
import useResponsive from '@/utils/hooks/useResponsive'
import { LAYOUT_COLLAPSIBLE_SIDE } from '@/constants/theme.constant'
import type { CommonProps } from '@/@types/common'
import ActiveItems from '@/components/template/Notification/ActiveItems'
import Calender from '@/components/template/Notification/Calender'
import { TbPower } from 'react-icons/tb'

const CollapsibleSide = ({ children }: CommonProps) => {
    const { larger, smaller } = useResponsive()

    return (
        <LayoutBase
            type={LAYOUT_COLLAPSIBLE_SIDE}
            className="app-layout-collapsible-side flex flex-auto flex-col"
        >
            <div className="flex flex-auto min-w-0">
                {larger.lg && <SideNav />}
                <div className="flex flex-col flex-auto min-h-screen min-w-0 relative w-full">
                    <Header
                        className="shadow-sm dark:shadow-2xl"
                        headerStart={
                            <>
                                {smaller.lg && <MobileNav />}
                                {larger.lg && <SideNavToggle />}
                                {larger.lg && (
                                    <span className="text-lg font-bold text-gray-900 dark:text-gray-300 mr-2 hidden lg:inline">
                                        {' '}
                                        {/* Added text with styling */}
                                        Aazovo Back Office Management System
                                    </span>
                                )}
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
                                <div className='text-2xl header-action-item header-action-item-hoverable'>
                                    <BiTask />
                                </div>
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
            </div>
        </LayoutBase>
    )
}

export default CollapsibleSide
