// src/components/template/UserProfileDropdown.tsx

import { useState } from 'react'; // <-- Import useState
import Avatar from '@/components/ui/Avatar';
import Dropdown from '@/components/ui/Dropdown';
import ConfirmDialog from '@/components/shared/ConfirmDialog'; // <-- Import ConfirmDialog
import withHeaderItem from '@/utils/hoc/withHeaderItem';
import { useSessionUser } from '@/store/authStore';
import { Link, useNavigate } from 'react-router-dom';
import {
    PiUserDuotone,
    PiGearDuotone,
    PiPulseDuotone,
    PiSignOutDuotone,
} from 'react-icons/pi';
import { useAuth } from '@/auth';
import type { JSX } from 'react';
import { logoutAction } from '@/reduxtool/auth/middleware';
import { useAppDispatch } from '@/reduxtool/store';

type DropdownList = {
    label: string;
    path: string;
    icon: JSX.Element;
};

const dropdownItemList: DropdownList[] = [
    {
        label: 'Profile',
        path: '/concepts/account/settings',
        icon: <PiUserDuotone />,
    },
    {
        label: 'Activity Log',
        path: '/concepts/account/activity-log',
        icon: <PiPulseDuotone />,
    },
];

const _UserDropdown = () => {
    const { avatar, userName, email } = useSessionUser((state) => state.user);
    const dispatch = useAppDispatch();
    // const { signOut } = useAuth() // The template likely wires this up in the layout

    // --- FIX: Add state to control the confirmation dialog ---
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

    const handleSignOutClick = () => {
        setIsLogoutDialogOpen(true); // Open the dialog instead of logging out directly
    };

    const onDialogClose = () => {
        setIsLogoutDialogOpen(false); // Close the dialog
    };

    const onDialogConfirm = () => {
        // This is the actual logout logic
        dispatch(logoutAction());
        // No need to close the dialog, the app will unmount and redirect
    };

    const avatarProps = {
        ...(avatar ? { src: avatar } : { icon: <PiUserDuotone /> }),
    };

    return (
        <>
            <Dropdown
                className="flex"
                toggleClassName="flex items-center"
                renderTitle={
                    <div className="cursor-pointer flex items-center">
                        <Avatar size={32} {...avatarProps} />
                    </div>
                }
                placement="bottom-end"
            >
                <Dropdown.Item variant="header">
                    <div className="py-2 px-3 flex items-center gap-3">
                        <Avatar {...avatarProps} />
                        <div>
                            <div className="font-bold text-gray-900 dark:text-gray-100">
                                {userName || 'Anonymous'}
                            </div>
                            <div className="text-xs">
                                {email || 'No email available'}
                            </div>
                        </div>
                    </div>
                </Dropdown.Item>
                <Dropdown.Item variant="divider" />
                {dropdownItemList.map((item) => (
                    <Dropdown.Item
                        key={item.label}
                        eventKey={item.label}
                        className="px-0"
                    >
                        <Link
                            className="flex h-full w-full px-2"
                            to={item.path}
                        >
                            <span className="flex gap-2 items-center w-full">
                                <span className="text-xl">{item.icon}</span>
                                <span>{item.label}</span>
                            </span>
                        </Link>
                    </Dropdown.Item>
                ))}
                <Dropdown.Item variant="divider" />
                <Dropdown.Item
                    eventKey="Sign Out"
                    className="gap-2"
                    // --- FIX: Trigger the dialog on click ---
                    onClick={handleSignOutClick}
                >
                    <span className="text-xl">
                        <PiSignOutDuotone />
                    </span>
                    <span>Logout</span>
                </Dropdown.Item>
            </Dropdown>

            {/* --- FIX: Add the confirmation dialog component --- */}
            <ConfirmDialog
                isOpen={isLogoutDialogOpen}
                type="warning"
                title="Logout"
                onClose={onDialogClose}
                onRequestClose={onDialogClose}
                onCancel={onDialogClose}
                onConfirm={onDialogConfirm}
            >
                <p>Are you sure you want to log out?</p>
            </ConfirmDialog>
        </>
    );
};

// NOTE: The logic in useAuth().signOut is likely what handles the actual logout.
// The template wires this up so when the side nav item is clicked, it calls signOut,
// which in turn should be modified to show this dialog. For simplicity, we've put
// the dialog logic here, and the redux action will trigger the state change.

const UserDropdown = withHeaderItem(_UserDropdown);

export default UserDropdown;