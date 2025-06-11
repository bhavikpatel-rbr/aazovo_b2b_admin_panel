// src/components/template/UserProfileDropdown.tsx

import { useEffect, useState, useRef } from 'react'
import type { JSX } from 'react'
import { Link } from 'react-router-dom'

// UI Components
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'

// Utils & HOC
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { encryptStorage } from '@/utils/secureLocalStorage'
import { config } from '@/utils/config'

// Redux & State
import { useAppDispatch } from '@/reduxtool/store'
import { logoutAction } from '@/reduxtool/auth/middleware'

// Icons
import {
    PiUserDuotone,
    PiPulseDuotone,
    PiSignOutDuotone,
    PiCameraDuotone,
} from 'react-icons/pi'

const { useEncryptApplicationStorage } = config

// --- 1. Confirmation Modal for Image Change ---
interface ConfirmImageChangeModalProps {
    isOpen: boolean
    onClose: () => void
    newAvatarPreview: string | null
    onConfirm: () => void
    isLoading: boolean
}

const ConfirmImageChangeModal = ({
    isOpen,
    onClose,
    newAvatarPreview,
    onConfirm,
    isLoading,
}: ConfirmImageChangeModalProps) => {
    return (
        <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose}>
            <h5 className="mb-4">Confirm New Profile Picture</h5>
            <div className="text-center">
                <p className="mb-4">
                    Do you want to set this as your new profile picture?
                </p>
                <Avatar
                    size={120}
                    shape="circle"
                    src={newAvatarPreview || undefined}
                    icon={<PiUserDuotone />}
                />
            </div>
            <div className="text-right mt-6">
                <Button className="mr-2" onClick={onClose} disabled={isLoading}>
                    Cancel
                </Button>
                <Button variant="solid" loading={isLoading} onClick={onConfirm}>
                    Save Changes
                </Button>
            </div>
        </Dialog>
    )
}

// --- 2. Main Dropdown Component ---
const _UserDropdown = () => {
    const [userData, setuserData] = useState<any>(null)
    const dispatch = useAppDispatch()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // State for image change flow
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null)
    const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    // State for logout flow
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

    // --- Default Avatar Logic ---
    // If userData.avatar exists, use it. Otherwise, use the default path.
    // IMPORTANT: Make sure '/img/avatars/default-user.jpg' is a valid path in your `public` folder.
    const avatarSrc = userData?.avatar || '/img/avatars/default-user.jpg'
    const avatarProps = { src: avatarSrc }

    // --- Event Handlers for Image Change ---
    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setNewAvatarFile(file)
            setNewAvatarPreview(URL.createObjectURL(file))
            setIsConfirmModalOpen(true)
        }
        event.target.value = '' // Allow selecting the same file again
    }

    const handleConfirmUpload = () => {
        if (!newAvatarFile) return
        setIsUploading(true)
        setTimeout(() => {
            console.log('Uploading file:', newAvatarFile.name)
            toast.push(<Notification title="Avatar Updated" type="success" />)
            setIsUploading(false)
            closeAndResetModal()
        }, 1500)
    }

    const closeAndResetModal = () => {
        setIsConfirmModalOpen(false)
        if (newAvatarPreview) {
            URL.revokeObjectURL(newAvatarPreview)
        }
        setNewAvatarFile(null)
        setNewAvatarPreview(null)
    }

    // --- Event Handlers for Logout ---
    const handleSignOutClick = () => {
        setIsLogoutDialogOpen(true)
    }
    const onDialogClose = () => {
        setIsLogoutDialogOpen(false)
    }
    const onDialogConfirm = () => {
        dispatch(logoutAction())
    }

    // --- Fetch User Data on Mount ---
    useEffect(() => {
        const getUserData = () => {
            try {
                return encryptStorage.getItem('UserData',!useEncryptApplicationStorage)
            } catch (error) {
                console.error('Error getting UserData:', error)
                return null
            }
        }
        setuserData(getUserData())
    }, [])

    return (
        <>
            <Dropdown
                className="flex"
                menuClass="w-80"
                toggleClassName="flex items-center"
                renderTitle={
                    <div className="cursor-pointer flex items-center">
                        <Avatar size={32} {...avatarProps} />
                    </div>
                }
                placement="bottom-end"
            >
                <Dropdown.Item variant="header" className="!p-0">
                    <div className="flex items-start gap-4 p-4">
                        {/* Left Side: Interactive Avatar */}
                        <div
                            className="relative flex-shrink-0 rounded-full group cursor-pointer"
                            onClick={handleAvatarClick}
                        >
                            <Avatar size={60} shape="circle" {...avatarProps} />
                            <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-40 rounded-full flex items-center justify-center transition-opacity duration-200">
                                <PiCameraDuotone className="text-white text-xl opacity-0 group-hover:opacity-100" />
                            </div>
                        </div>

                        {/* Right Side: User Details */}
                        <div className="flex flex-col">
                            <div className="flex flex-col gap-1">
                                <span className="font-bold text-gray-900 dark:text-gray-100">
                                    {userData?.name || 'Super Admin'}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {userData?.email || 'admin@admin.com'}
                                </span>
                            </div>
                            <div className="mt-2 flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                <span>{userData?.role || 'N/A'}</span>
                                <span className="text-gray-300 dark:text-gray-600">|</span>
                                <span>{userData?.department || 'N/A'}</span>
                                <span className="text-gray-300 dark:text-gray-600">|</span>
                                <span>{userData?.phone || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </Dropdown.Item>

                <Dropdown.Item variant="divider" />

                <Dropdown.Item eventKey="View Profile" className="px-0">
                    <Link
                        className="flex h-full w-full px-3"
                        to="/layouts/UserProfile/ProfileSettings"
                    >
                        <span className="flex gap-2 items-center w-full">
                            <PiUserDuotone className="text-xl" />
                            <span>View My Profile</span>
                        </span>
                    </Link>
                </Dropdown.Item>
                <Dropdown.Item eventKey="Activity Log" className="px-0">
                    <Link
                        className="flex h-full w-full px-3"
                        to="/concepts/account/activity-log"
                    >
                        <span className="flex gap-2 items-center w-full">
                            <PiPulseDuotone className="text-xl" />
                            <span>Activity Log</span>
                        </span>
                    </Link>
                </Dropdown.Item>

                <Dropdown.Item variant="divider" />

                <Dropdown.Item
                    eventKey="Sign Out"
                    className="gap-2 mx-3 my-1.5 !text-red-500"
                    onClick={handleSignOutClick}
                >
                    <span className="text-xl">
                        <PiSignOutDuotone />
                    </span>
                    <span>Logout</span>
                </Dropdown.Item>
            </Dropdown>

            {/* --- 3. Hidden Input & Modals --- */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleFileSelect}
            />

            <ConfirmImageChangeModal
                isOpen={isConfirmModalOpen}
                onClose={closeAndResetModal}
                newAvatarPreview={newAvatarPreview}
                onConfirm={handleConfirmUpload}
                isLoading={isUploading}
            />

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
    )
}

const UserDropdown = withHeaderItem(_UserDropdown)

export default UserDropdown