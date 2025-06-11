import { useEffect, useState } from 'react' // <-- Import useState
import { useSelector } from 'react-redux'
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
import ConfirmDialog from '@/components/shared/ConfirmDialog' // <-- Import ConfirmDialog
import { punchIn, punchOut } from '@/reduxtool/auth/authSlice'
import { LAYOUT_COLLAPSIBLE_SIDE } from '@/constants/theme.constant'
import { RootState, useAppDispatch } from '@/reduxtool/store'
import { TbPower } from 'react-icons/tb'
import type { CommonProps } from '@/@types/common'
import Tasks from '@/components/template/Notification/Task'

const CollapsibleSide = ({ children }: CommonProps) => {
    const { larger, smaller } = useResponsive()
    const dispatch = useAppDispatch()

    // --- Start of Redux & Dialog Integration ---

    // 1. Get auth and punch-in status from the Redux store
    const { signedIn, punchInStatus } = useSelector(
        (state: RootState) => state.Auth
    )

    // 2. NEW: State to control the punch-in dialog
    const [isPunchInDialogOpen, setIsPunchInDialogOpen] = useState(false)

    // 3. MODIFIED: useEffect to show a ConfirmDialog after login if not punched in
    useEffect(() => {
        let timer: NodeJS.Timeout | undefined;

        // Condition to trigger the dialog
        if (signedIn && punchInStatus === 'punched-out') {
            // Set a timer to open the dialog after 5 seconds
            timer = setTimeout(() => {
                setIsPunchInDialogOpen(true)
            }, 5000) // 5000 milliseconds = 5 seconds
        }

        // Cleanup function: This will run if the component unmounts
        // or if the dependencies [signedIn, punchInStatus] change.
        // It prevents the dialog from opening if the user logs out or
        // punches in manually within the 5-second window.
        return () => {
            if (timer) {
                clearTimeout(timer)
            }
        }
    }, [signedIn, punchInStatus])
    // --- END MODIFICATION ---

    // 4. NEW: Handlers for the ConfirmDialog
    const handleConfirmPunchIn = () => {
        dispatch(punchIn())
        setIsPunchInDialogOpen(false) // Close dialog on confirm
    }

    const handleCloseDialog = () => {
        setIsPunchInDialogOpen(false) // Close dialog on cancel or close
    }

    // 5. Handle the click event on the header punch-in/out button (unchanged)
    const handlePunchToggle = () => {
        if (punchInStatus === 'punched-in') {
            dispatch(punchOut())
        } else {
            dispatch(punchIn())
        }
    }

    // --- End of Integration ---

    const isPunchedIn = punchInStatus === 'punched-in'

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
                                <div
                                    onClick={handlePunchToggle}
                                    className={`text-xs 
                                    cursor-pointer rounded-full py-2 px-3 flex gap-1 items-center transition-colors duration-200
                                    ${
                                        isPunchedIn
                                            ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-500/30'
                                            : 'bg-gray-100 dark:bg-gray-700 dark:text-white hover:bg-green-200 hover:text-black dark:hover:bg-green-200 dark:hover:text-black'
                                    }`}
                                >
                                    <TbPower size={20} />
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

            {/* 6. NEW: Add the ConfirmDialog component to the layout */}
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

export default CollapsibleSide