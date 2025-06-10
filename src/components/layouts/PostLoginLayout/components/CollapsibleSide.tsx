import { useEffect } from 'react' // <-- Import useEffect
import { useSelector, useDispatch } from 'react-redux' // <-- Import Redux hooks
import SideNav from '@/components/template/SideNav'
import Header from '@/components/template/Header'
import SideNavToggle from '@/components/template/SideNavToggle'
import MobileNav from '@/components/template/MobileNav'
import Search from '@/components/template/Search'
import LanguageSelector from '@/components/template/LanguageSelector'
import Notification from '@/components/template/Notification'
import UserProfileDropdown from '@/components//template/UserProfileDropdown'
import SidePanel from '@/components//template/SidePanel'
import LayoutBase from '@/components//template/LayoutBase'
import ActiveItems from '@/components/template/Notification/ActiveItems'
import Calender from '@/components/template/Notification/Calender'
import useResponsive from '@/utils/hooks/useResponsive'
import { LAYOUT_COLLAPSIBLE_SIDE } from '@/constants/theme.constant'
import { showMessage } from '@/reduxtool/lem/lemSlice' // <-- Import notification action
import { defaultMessageObj } from '@/reduxtool/lem/types' // <-- Import message object type
import { punchIn, punchOut } from '@/reduxtool/auth/authSlice' // <-- Import your new actions
import { RootState, useAppDispatch } from '@/reduxtool/store' // <-- Import your RootState type
import { TbPower } from 'react-icons/tb'
import { BiTask } from "react-icons/bi";
import type { CommonProps } from '@/@types/common'
import Tasks from '@/components/template/Notification/Task'

const CollapsibleSide = ({ children }: CommonProps) => {
    const { larger, smaller } = useResponsive()
    const dispatch = useAppDispatch()

    // --- Start of Redux Integration ---

    // 1. Get auth and punch-in status from the Redux store
    const { signedIn, punchInStatus } = useSelector(
        (state: RootState) => state.Auth
    )

    // 2. useEffect to show notification after login if not punched in
    useEffect(() => {
        // Condition: User is logged in AND their status is 'punched-out'
        if (signedIn && punchInStatus === 'punched-out') {
            dispatch(
                showMessage({
                    ...defaultMessageObj,
                    type: 'info', // 'info' or 'warning' is suitable
                    messageText: 'Welcome! Please punch-in to start your day.',
                })
            )
        }
    }, [signedIn, punchInStatus, dispatch]) // Dependency array ensures this runs only when these values change

    // 3. Handle the click event on the punch-in/out button
    const handlePunchToggle = () => {
        if (punchInStatus === 'punched-in') {
            dispatch(punchOut()) // Dispatch punch-out action
        } else {
            dispatch(punchIn()) // Dispatch punch-in action
        }
    }

    // --- End of Redux Integration ---

    const isPunchedIn = punchInStatus === 'punched-in';

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
                                        Aazovo Back Office Management System
                                    </span>
                                )}
                                <Search />
                            </>
                        }
                        headerEnd={
                            <>
                                {/* MODIFIED: Punch in and out button */}
                                <div
                                    onClick={handlePunchToggle} // <-- Added onClick handler
                                    className={`text-xs 
                                    cursor-pointer rounded-full py-2 px-3 flex gap-1 items-center transition-colors duration-200
                                    ${
                                        isPunchedIn
                                            ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-500/30'
                                            : 'bg-gray-100 dark:bg-gray-700 dark:text-white hover:bg-green-200 hover:text-black dark:hover:bg-green-200 dark:hover:text-black'
                                    }`}
                                >
                                    <TbPower size={20} />
                                    {/* Text changes based on status */}
                                    <span>
                                        {isPunchedIn ? 'Punch Out' : 'Punch In'}
                                    </span>
                                </div>
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
            </div>
        </LayoutBase>
    )
}

export default CollapsibleSide