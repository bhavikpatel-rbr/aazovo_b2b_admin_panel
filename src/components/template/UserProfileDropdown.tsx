// src/components/template/UserProfileDropdown.tsx

import { useEffect, useState, useRef } from "react";
import type { JSX } from "react";
import { Link } from "react-router-dom";

// UI Components
import Avatar from "@/components/ui/Avatar";
import Dropdown from "@/components/ui/Dropdown";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";

// Utils & HOC
import withHeaderItem from "@/utils/hoc/withHeaderItem";
import { encryptStorage } from "@/utils/secureLocalStorage";
import { config } from "@/utils/config";

// Redux & State
import { useAppDispatch } from "@/reduxtool/store";
import { logoutAction } from "@/reduxtool/auth/middleware";

// Icons
import {
  PiUserDuotone,
  PiPulseDuotone,
  PiSignOutDuotone,
  PiCameraDuotone,
  PiMapPinDuotone,
  PiEnvelopeSimpleDuotone,
} from "react-icons/pi";
import { IoMdCheckmarkCircle } from "react-icons/io";

const { useEncryptApplicationStorage } = config;

// --- 1. Reusable Profile Card Component ---
const UserProfileCard = ({
  userData,
  newAvatarPreview,
}: {
  userData: any;
  newAvatarPreview: string | null;
}) => {
  const avatarSrc =
    newAvatarPreview || userData?.avatar || "/img/avatars/default-user.jpg";

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="relative flex-shrink-0">
          <Avatar shape="round" size={100} src={avatarSrc} />
          <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800"></div>
        </div>
        <div className="flex flex-col gap-4 w-full">
          <div>
            <div className="flex items-center gap-2">
              <h5 className="font-bold" style={{ fontSize: '1rem'}}>
                {userData?.name || "Atkinson"}
              </h5>
              <IoMdCheckmarkCircle className="text-blue-500 text-xl" />
            </div>
            <div className="flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <PiUserDuotone /> {userData?.designtion || "Web Designer"}
              </span>
              <span className="flex items-center gap-1.5">
                <PiMapPinDuotone /> {userData?.phone || "+12365412"}
              </span>
              <span className="flex items-center gap-1.5">
                <PiEnvelopeSimpleDuotone />{" "}
                {userData?.email || "info@gmail.com"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 2. MODIFIED Confirmation Modal for Image Change (using ConfirmDialog) ---
interface ConfirmImageChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  newAvatarPreview: string | null;
  onConfirm: () => void;
  isLoading: boolean;
  userData: any;
}
const ConfirmImageChangeModal = ({
  isOpen,
  onClose,
  newAvatarPreview,
  onConfirm,
  isLoading,
  userData,
}: ConfirmImageChangeModalProps) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onRequestClose={onClose}
      onCancel={onClose}
      onConfirm={onConfirm}
      loading={isLoading}
      width={477}
      title="Profile Image Change"
      type="info"
      confirmText="Save"
    >
      <UserProfileCard
        userData={userData}
        newAvatarPreview={newAvatarPreview}
      />
    </ConfirmDialog>
  );
};

// --- 3. Main Dropdown Component ---
const _UserDropdown = () => {
  const [userData, setuserData] = useState<any>(null);
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const avatarSrc = userData?.avatar || "/img/avatars/default-user.jpg";
  const avatarProps = { src: avatarSrc };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewAvatarFile(file);
      setNewAvatarPreview(URL.createObjectURL(file));
      setIsConfirmModalOpen(true);
    }
    event.target.value = "";
  };
  const handleConfirmUpload = () => {
    if (!newAvatarFile) return;
    setIsUploading(true);
    setTimeout(() => {
      console.log("Uploading file:", newAvatarFile.name);
      toast.push(<Notification title="Avatar Updated" type="success" />);
      setIsUploading(false);
      closeAndResetModal();
    }, 1500);
  };
  const closeAndResetModal = () => {
    setIsConfirmModalOpen(false);
    if (newAvatarPreview) {
      URL.revokeObjectURL(newAvatarPreview);
    }
    setNewAvatarFile(null);
    setNewAvatarPreview(null);
  };
  const handleSignOutClick = () => {
    setIsLogoutDialogOpen(true);
  };
  const onDialogClose = () => {
    setIsLogoutDialogOpen(false);
  };
  const onDialogConfirm = () => {
    dispatch(logoutAction());
  };
  useEffect(() => {
    const getUserData = () => {
      try {
        return encryptStorage.getItem(
          "UserData",
          !useEncryptApplicationStorage
        );
      } catch (error) {
        console.error("Error getting UserData:", error);
        return null;
      }
    };
    setuserData(getUserData());
  }, []);

  return (
    <>
      <Dropdown
        className="flex"
        menuClass="w-60"
        toggleClassName="flex items-center"
        renderTitle={
          <div className="cursor-pointer flex items-center">
            <Avatar size={32} {...avatarProps} />
          </div>
        }
        placement="bottom-end"
      >
        <Dropdown.Item variant="header" className="!p-0">
          <div className="flex items-start gap-2">
            <div
              className="relative flex-shrink-0 rounded-full group cursor-pointer"
              onClick={handleAvatarClick}
            >
              <Avatar size={60} shape="circle" {...avatarProps} />
              <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-40 rounded-full flex items-center justify-center transition-opacity duration-200">
                <PiCameraDuotone className="text-white text-xl opacity-0 group-hover:opacity-100" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {userData?.name || "Super Admin"}
                </span>
              </div>
              <div className="mt-2 flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                <span>{userData?.role || "N/A"}</span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span>{userData?.department || "N/A"}</span>
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
        <Dropdown.Item variant="divider"/>
        <Dropdown.Item
          eventKey="Sign Out"
          className="gap-2"
          onClick={handleSignOutClick}
        >
          <span className="text-xl"><PiSignOutDuotone /></span>
          <span>Logout</span>
        </Dropdown.Item>
      </Dropdown>

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
        userData={userData}
      />

      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        type="danger"
        title="Confirm Logout"
        width={477}
        onClose={onDialogClose}
        onRequestClose={onDialogClose}
        onCancel={onDialogClose}
        onConfirm={onDialogConfirm}
        confirmText="Logout"
      >
        {/* <UserProfileCard userData={userData} newAvatarPreview={null} /> */}
        <p>Are you sure you want to log out?</p>
      </ConfirmDialog>
    </>
  );
};

const UserDropdown = withHeaderItem(_UserDropdown);

export default UserDropdown;