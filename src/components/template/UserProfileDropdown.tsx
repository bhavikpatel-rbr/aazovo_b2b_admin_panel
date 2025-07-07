import { useEffect, useState, useRef } from "react";
import type { JSX } from "react";
import { Link } from "react-router-dom";

// UI Components
import Avatar from "@/components/ui/Avatar";
import Dropdown from "@/components/ui/Dropdown";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog"; // We need the base Dialog for our custom modal
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";

// Utils & HOC
import withHeaderItem from "@/utils/hoc/withHeaderItem";
import { encryptStorage } from "@/utils/secureLocalStorage";
import { config } from "@/utils/config";

// Redux & State
import { useAppDispatch } from "@/reduxtool/store";
import { logoutAction, updateUserProfilePictureAction } from "@/reduxtool/auth/middleware";

// Icons
import {
  PiUserDuotone,
  PiPulseDuotone,
  PiSignOutDuotone,
  PiCameraDuotone,
  PiUploadSimpleDuotone,
} from "react-icons/pi";
import { IoMdCheckmarkCircle } from "react-icons/io";

const { useEncryptApplicationStorage } = config;

// --- MOCK API SERVICE ---
// In a real app, this would be in a separate file (e.g., src/services/UserService.ts)
// It simulates uploading a file and getting a new URL back from the server.
const uploadProfileImage = (file: File): Promise<{ newImageUrl: string }> => {
  console.log(`Uploading file: ${file.name}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate success by returning a new random image URL
      const newImageUrl = `https://picsum.photos/200?random=${Math.random()}`;
      console.log(`File uploaded. New URL: ${newImageUrl}`);
      resolve({ newImageUrl });
    }, 1500); // 1.5-second delay to simulate network
  });
};


// --- 1. NEW - Profile Image Upload Modal Component ---
// This is a dedicated modal for a better user experience.
interface ProfileImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (file: File) => void;
  isLoading: boolean;
  userData: any;
}
const ProfileImageUploadModal = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
  userData,
}: ProfileImageUploadModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);

  const currentAvatarSrc = userData?.profile_pic_path || "/img/avatars/default-user.jpg";
  const avatarToShow = newAvatarPreview || currentAvatarSrc;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewAvatarFile(file);
      // Create a temporary URL to preview the image
      setNewAvatarPreview(URL.createObjectURL(file));
    }
    // Reset file input to allow selecting the same file again
    event.target.value = "";
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSaveClick = () => {
    if (newAvatarFile) {
      onSave(newAvatarFile);
    }
  };
  
  // Clean up the object URL when the component unmounts or preview changes
  useEffect(() => {
    return () => {
        if (newAvatarPreview) {
            URL.revokeObjectURL(newAvatarPreview);
        }
    }
  }, [newAvatarPreview])

  // Reset state when the modal is closed
  const handleClose = () => {
    setNewAvatarFile(null);
    setNewAvatarPreview(null);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      onRequestClose={handleClose}
      width={400}
    >
        <h5 className="mb-4">Change Profile Photo</h5>
        <div className="flex flex-col items-center gap-6">
            <div className="relative group">
                <Avatar size={120} shape="circle" src={avatarToShow} />
                <div 
                    className="absolute inset-0  bg-opacity-0 group-hover:bg-opacity-50 rounded-full flex items-center justify-center cursor-pointer transition-opacity"
                    onClick={handleTriggerFileInput}
                >
                    <div className="text-center text-white opacity-0 group-hover:opacity-100 p-4">
                        <PiCameraDuotone className="text-3xl mx-auto" />
                        <span className="text-xs font-semibold">Change Photo</span>
                    </div>
                </div>
            </div>

            <Button
                variant="solid"
                color="blue-600"
                icon={<PiUploadSimpleDuotone />}
                onClick={handleTriggerFileInput}
            >
                Choose an Image
            </Button>

            {/* Hidden file input is triggered by the button/avatar overlay */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleFileSelect}
            />
        </div>
        <div className="text-right mt-6">
            <Button className="mr-2" onClick={handleClose}>
                Cancel
            </Button>
            <Button
                variant="solid"
                loading={isLoading}
                disabled={!newAvatarFile || isLoading}
                onClick={handleSaveClick}
            >
                Save
            </Button>
        </div>
    </Dialog>
  );
};


// --- 2. Main Dropdown Component (Modified) ---
const _UserDropdown = () => {
  const [userData, setuserData] = useState<any>(null);
  const dispatch = useAppDispatch();
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  
  const avatarSrc = userData?.profile_pic_path || "/img/avatars/default-user.jpg";
  const avatarProps = { src: avatarSrc };
  const profileUrl = userData?.id ? `/hr-employees/employees/view/${userData.id}` : '/';

  // Fetch initial user data
  useEffect(() => {
    const getUserData = () => {
      try {
        return encryptStorage.getItem("UserData", !useEncryptApplicationStorage);
      } catch (error) {
        console.error("Error getting UserData:", error);
        return null;
      }
    };
    setuserData(getUserData());
  }, []);

  const handleOpenImageModal = () => {
    setIsImageModalOpen(true);
  };
  
  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
  };

  const handleSaveProfileImage = async (file: File) => {
    setIsUploading(true);
    
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('profile_pic', file); // 'profile_pic' is the key your backend expects

    try {
      // Step 1: Call the real API service
       await dispatch(updateUserProfilePictureAction(formData));

      // Step 2: Extract the new image URL from the API response
      // **IMPORTANT**: Adjust the path below to match your actual API response structure!
      // For example, it might be response.data.newImageUrl or response.data.user.profile_pic_path
      
      toast.push(<Notification title="Avatar Updated" type="success" />);
      handleCloseImageModal();

    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.push(<Notification title="Upload Failed" type="danger" message="Please check the console and try again."/>);
    } finally {
      setIsUploading(false);
    }
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
              // THIS NOW OPENS THE MODAL
              onClick={handleOpenImageModal}
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
                <IoMdCheckmarkCircle className="text-blue-500" />
              </div>
              <div className="mt-2 flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                <span>{userData?.department?.name || "N/A"}</span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span>{userData?.designation?.name || "N/A"}</span>
              </div>
            </div>
          </div>
        </Dropdown.Item>
        <Dropdown.Item variant="divider" />
        <Dropdown.Item eventKey="View Profile" className="px-0">
          <Link className="flex h-full w-full px-3" to={profileUrl}>
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

      {/* RENDER THE NEW MODAL */}
      <ProfileImageUploadModal
        isOpen={isImageModalOpen}
        onClose={handleCloseImageModal}
        onSave={handleSaveProfileImage}
        isLoading={isUploading}
        userData={userData}
      />

      {/* LOGOUT CONFIRMATION DIALOG (Unchanged) */}
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
        <p>Are you sure you want to log out?</p>
      </ConfirmDialog>
    </>
  );
};

const UserDropdown = withHeaderItem(_UserDropdown);

export default UserDropdown;