// src/views/account/settings/ProfileSettings.tsx (or your preferred location)

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/reduxtool/store';
import { encryptStorage } from '@/utils/secureLocalStorage';
import { config } from '@/utils/config';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import { PiUserDuotone } from 'react-icons/pi';
import dayjs from 'dayjs'; // For formatting dates

const { useEncryptApplicationStorage } = config;

// Re-use or import the StoredUser type
type StoredUser = {
    id: number;
    name: string;
    profile_pic: string | null;
    portal_email: string | null;
    email: string;
    email_verified: "true" | "false";
    joining_date: string | null;
    employee_id: string | null;
    // ... (include ALL fields from your user JSON)
    dob: string | null;
    gender: string | null;
    mobile_no: string | null;
    department_id: string | null; // Consider mapping to department name if possible
    designation_id: string | null; // Consider mapping to designation name
    status: string;
    created_at: string;
    updated_at: string;
    last_login_at: string | null;
    profile_pic_path?: string | null;
    // ... and so on for all fields
};

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="mb-4">
        <p className="text-gray-500 dark:text-gray-400 font-semibold">{label}</p>
        <p className="text-gray-700 dark:text-gray-200">
            {value !== null && value !== undefined && value !== '' ? value : 'N/A'}
        </p>
    </div>
);

const ProfileSettings = () => {
    // const userFromRedux = useSelector((state: RootState) => state.auth.user);
    const [profileData, setProfileData] = useState<StoredUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let attempts = 0;
        const maxAttempts = 3;
        const intervalTime = 200; // ms

        const fetchUserData = () => {
            let data = null;
          
                try {
                    data = encryptStorage.getItem("UserData", !useEncryptApplicationStorage) as StoredUser;
                } catch (error) {
                    console.error("Error fetching user data for profile:", error);
                }
           
            if (data) {
                setProfileData(data);
                setLoading(false);
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(fetchUserData, intervalTime);
            } else {
                console.warn("Failed to load user data after multiple attempts.");
                setLoading(false); // Stop loading even if data is not found
            }
        };

        fetchUserData();

    }, [userFromRedux]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <p>Loading profile...</p> {/* Or use a Spinner component */}
            </div>
        );
    }

    if (!profileData) {
        return (
            <Card className="p-6">
                <h4 className="mb-4">Profile Information</h4>
                <p>User data not found.</p>
            </Card>
        );
    }

    const avatarSrc = profileData.profile_pic_path || profileData.profile_pic;
    const avatarProps = {
        shape: "circle",
        size: 80,
        ...(avatarSrc ? { src: avatarSrc } : { icon: <PiUserDuotone /> }),
    };

    return (
        <div className="container mx-auto p-4">
            <Card
                header={<h3 className="font-semibold text-lg">User Profile</h3>}
                bodyClass="p-6"
            >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                    <Avatar {...avatarProps} />
                    <div>
                        <h4 className="text-2xl font-bold">{profileData.name}</h4>
                        <p className="text-gray-600 dark:text-gray-300">{profileData.email}</p>
                        <p className={`text-sm mt-1 ${profileData.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}>
                            Status: {profileData.status}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                    <DetailItem label="Employee ID" value={profileData.employee_id} />
                    <DetailItem label="Portal Email" value={profileData.portal_email} />
                    <DetailItem label="Email Verified" value={profileData.email_verified === "true" ? "Yes" : "No"} />
                    <DetailItem label="Mobile No." value={profileData.mobile_no} />
                    <DetailItem label="Joining Date" value={profileData.joining_date ? dayjs(profileData.joining_date).format('MMMM D, YYYY') : 'N/A'} />
                    <DetailItem label="Date of Birth" value={profileData.dob ? dayjs(profileData.dob).format('MMMM D, YYYY') : 'N/A'} />
                    <DetailItem label="Gender" value={profileData.gender} />
                    <DetailItem label="Department ID" value={profileData.department_id} /> {/* Consider mapping to name */}
                    <DetailItem label="Designation ID" value={profileData.designation_id} /> {/* Consider mapping to name */}
                    <DetailItem label="Created At" value={dayjs(profileData.created_at).format('MMMM D, YYYY h:mm A')} />
                    <DetailItem label="Last Updated" value={dayjs(profileData.updated_at).format('MMMM D, YYYY h:mm A')} />
                    <DetailItem label="Last Login" value={profileData.last_login_at ? dayjs(profileData.last_login_at).format('MMMM D, YYYY h:mm A') : 'N/A'} />
                    {/* Add more DetailItem components for ALL other fields you want to display */}
                    {/* For example:
                    <DetailItem label="Nationality" value={profileData.nationality} />
                    <DetailItem label="Local Address" value={profileData.local_address} />
                    ...and so on
                    */}
                </div>

                {/* Example for fields that are arrays (like certificate paths) */}
                {profileData.educational_certificate_path && profileData.educational_certificate_path.length > 0 && (
                    <div className="mt-6">
                        <h5 className="font-semibold mb-2">Educational Certificates:</h5>
                        <ul>
                            {profileData.educational_certificate_path.map((path, index) => (
                                <li key={index} className="text-sm text-gray-600 dark:text-gray-300">
                                    <a href={path} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-500">
                                        Certificate {index + 1}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

            </Card>
        </div>
    );
};

export default ProfileSettings;