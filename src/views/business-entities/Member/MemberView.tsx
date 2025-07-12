// src/views/members/MemberViewPage.tsx

import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch } from '@/reduxtool/store'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import { Avatar, Button, Card, Spinner, Tag } from '@/components/ui'
import Notification from '@/components/ui/Notification'
import Tabs from '@/components/ui/Tabs'
import toast from '@/components/ui/toast'
const { TabNav, TabList, TabContent } = Tabs

// Icons
import { BiChevronRight } from 'react-icons/bi'
import {
    TbArrowLeft,
    TbGlobe,
    TbMail,
    TbPencil,
    TbPhone,
    TbUserCircle,
} from 'react-icons/tb'

// Redux
import { getMemberByIdAction } from '@/reduxtool/master/middleware'

// --- Helper Functions & Components (Unchanged) ---

const DetailItem = ({
    label,
    value,
}: {
    label: string
    value: React.ReactNode
}) => (
    <div className="mb-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <div className="text-sm font-semibold">
            {value === '' || value === undefined || value === null ? (
                <span className="text-gray-400 dark:text-gray-500">N/A</span>
            ) : (
                value
            )}
        </div>
    </div>
)

const ListAsTags = ({
    list,
}: {
    list: (string | number)[] | undefined | null
}) => {
    if (!list || list.length === 0) {
        return <span className="text-gray-400 dark:text-gray-500">N/A</span>
    }
    return (
        <div className="flex flex-wrap gap-1">
            {list.map((item, idx) => (
                <Tag key={idx} className="text-xs">
                    {item}
                </Tag>
            ))}
        </div>
    )
}

const formatDate = (dateString?: string | null, includeTime = false) => {
    if (!dateString)
        return <span className="text-gray-400 dark:text-gray-500">N/A</span>
    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }
    if (includeTime) {
        options.hour = '2-digit'
        options.minute = '2-digit'
    }
    return new Date(dateString).toLocaleDateString('en-GB', options)
}

const renderPermission = (value?: boolean | null | string) => {
    const valStr = String(value).toLowerCase()
    if (valStr === 'true' || valStr === 'approved' || valStr === 'buy') {
        return (
            <Tag className="bg-emerald-100 text-emerald-600 capitalize">
                {valStr}
            </Tag>
        )
    }
    if (valStr === 'false') {
        return <Tag className="bg-red-100 text-red-600">No</Tag>
    }
    if (value) {
        return <span className="capitalize">{String(value)}</span>
    }
    return <span className="text-gray-400 dark:text-gray-500">N/A</span>
}

const renderLink = (url?: string | null, text?: string) => {
    if (!url)
        return <span className="text-gray-400 dark:text-gray-500">N/A</span>
    const isUrl = url.startsWith('http://') || url.startsWith('https://')
    if (isUrl) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
            >
                {text || url}
            </a>
        )
    }
    return <span className="break-all">{url}</span>
}

// --- Main View Component ---
const MemberViewPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const dispatch = useAppDispatch()

    const [memberData, setMemberData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!id) {
            toast.push(
                <Notification type="danger" title="Error">
                    No member ID provided in the URL.
                </Notification>,
            )
            navigate('/business-entities/member')
            return
        }

        const fetchData = async () => {
            setIsLoading(true)
            try {
                const response = await dispatch(getMemberByIdAction(id)).unwrap()
                setMemberData(response)
            } catch (error: any) {
                toast.push(
                    <Notification type="danger" title="Fetch Error">
                        {error?.message || 'Failed to load member data.'}
                    </Notification>,
                )
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [id, dispatch, navigate])

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner size={40} />
            </div>
        )
    }

    if (!memberData) {
        return (
            <Container>
                <Card className="text-center p-8">
                    <p>Member not found or failed to load.</p>
                    <Button
                        className="mt-4"
                        onClick={() => navigate('/business-entities/member')}
                    >
                        Back to List
                    </Button>
                </Card>
            </Container>
        )
    }

    const statusColorMap: Record<string, string> = {
        active: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
        inactive:
            'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
    }
    const currentStatus = (memberData.status || 'inactive').toLowerCase()

    return (
        <Container>
            <div className="flex gap-1 items-center mb-3">
                <NavLink to="/business-entities/member">
                    <h6 className="font-semibold hover:text-primary-600">
                        Member
                    </h6>
                </NavLink>
                <BiChevronRight size={22} />
                <h6 className="font-semibold text-primary">Member Profile</h6>
            </div>
            <AdaptiveCard>
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Avatar
                            size={90}
                            shape="circle"
                            src={memberData.full_profile_pic}
                            icon={<TbUserCircle />}
                        />
                        <div>
                            <h5 className="font-bold">
                                {memberData.name || 'N/A'}
                            </h5>
                            <div className="flex items-center gap-2 mb-1 text-sm">
                                <TbMail className="text-gray-400" />
                                <p>{memberData.email || 'N/A'}</p>
                            </div>
                            <div className="flex items-center gap-2 mb-1 text-sm">
                                <TbPhone className="text-gray-400" />
                                <p>
                                    {memberData.number_code} {memberData.number}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <TbGlobe className="text-gray-400" />
                                <p>{memberData.country?.name || 'N/A'}</p>
                            </div>
                            <Tag
                                className={`mt-2 ${statusColorMap[currentStatus] || ''} capitalize`}
                            >
                                {memberData.status}
                            </Tag>
                        </div>
                    </div>
                    <div className="text-xs space-y-1">
                        <p>
                            <b>Temp. Company:</b> {memberData.company_temp}
                        </p>
                        <p>
                            <b>Actual Company:</b> {memberData.company_actual}
                        </p>
                        <p>
                            <b>Business Type:</b> {memberData.business_type}
                        </p>
                        <p>
                            <b>Business Opportunity:</b>{' '}
                            {memberData.business_opportunity?.join(', ') ||
                                'N/A'}
                        </p>
                    </div>
                    <div className="text-xs space-y-1">
                        <p>
                            <b>Manager:</b>{' '}
                            {memberData.relationship_manager?.name || 'N/A'}
                        </p>
                        <p>
                            <b>Interested In:</b> {memberData.interested_in}
                        </p>
                        <p>
                            <b>Grade:</b> {memberData.member_grade}
                        </p>
                        <p>
                            <b>Dealing in Bulk:</b> {memberData.dealing_in_bulk}
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row lg:flex-col gap-2">
                        <Button
                            icon={<TbArrowLeft />}
                            onClick={() =>
                                navigate('/business-entities/member')
                            }
                        >
                            Back
                        </Button>
                        <Button
                            variant="solid"
                            icon={<TbPencil />}
                            onClick={() =>
                                navigate(`/business-entities/member-edit/${id}`)
                            }
                        >
                            Edit Member
                        </Button>
                    </div>
                </div>

                {/* Body Content */}
                <Tabs className="mt-4" defaultValue="details">
                    <TabList>
                        <TabNav value="details">Member Details</TabNav>
                        <TabNav value="favorites">Favourite Products</TabNav>
                        <TabNav value="dynamic">Dynamic Profile</TabNav>
                    </TabList>
                    <div className="mt-6">
                        <TabContent value="details">
                            <div className="flex flex-col gap-6">
                                <Card bordered>
                                    <h5 className="mb-4">
                                        Basic Information
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6">
                                        <DetailItem
                                            label="Member Code"
                                            value={memberData.member_code}
                                        />
                                        <DetailItem
                                            label="Joined Date"
                                            value={formatDate(
                                                memberData.created_at,
                                            )}
                                        />
                                        <DetailItem
                                            label="Last Updated"
                                            value={formatDate(
                                                memberData.updated_at,
                                                true,
                                            )}
                                        />
                                        <DetailItem
                                            label="Profile Completion"
                                            value={`${memberData.profile_completion}%`}
                                        />
                                    </div>
                                </Card>

                                <Card bordered>
                                    <h5 className="mb-4">
                                        Contact & Socials
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6">
                                        <DetailItem
                                            label="WhatsApp"
                                            value={`${memberData.whatsapp_country_code || ''} ${memberData.whatsApp_no || ''}`}
                                        />
                                        <DetailItem
                                            label="Alternate Email"
                                            value={memberData.alternate_email}
                                        />
                                        <DetailItem
                                            label="Website"
                                            value={renderLink(
                                                memberData.website,
                                            )}
                                        />
                                        <DetailItem
                                            label="LinkedIn"
                                            value={renderLink(
                                                memberData.linkedIn_profile,
                                            )}
                                        />
                                    </div>
                                </Card>

                                <Card bordered>
                                    <h5 className="mb-4">Address</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6">
                                        <DetailItem
                                            label="Address"
                                            value={memberData.address}
                                        />
                                        <DetailItem
                                            label="City"
                                            value={memberData.city}
                                        />
                                        <DetailItem
                                            label="State"
                                            value={memberData.state}
                                        />
                                        <DetailItem
                                            label="Country"
                                            value={memberData.country?.name}
                                        />
                                    </div>
                                </Card>

                                <Card bordered>
                                    <h5 className="mb-4">Permissions</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6">
                                        <DetailItem
                                            label="Product Upload"
                                            value={renderPermission(
                                                memberData.product_upload_permission,
                                            )}
                                        />
                                        <DetailItem
                                            label="Wall Enquiry"
                                            value={renderPermission(
                                                memberData.wall_enquiry_permission,
                                            )}
                                        />
                                        <DetailItem
                                            label="General Enquiry"
                                            value={renderPermission(
                                                memberData.enquiry_permission,
                                            )}
                                        />
                                        <DetailItem
                                            label="Trade Inquiry"
                                            value={renderPermission(
                                                memberData.trade_inquiry_allowed,
                                            )}
                                        />
                                    </div>
                                </Card>
                            </div>
                        </TabContent>

                        <TabContent value="favorites">
                            <Card bordered>
                                <h5 className="mb-4">Favourite Products</h5>
                                {memberData.favourite_products_list?.length >
                                0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {memberData.favourite_products_list.map(
                                            (product: any) => (
                                                <Card
                                                    key={product.id}
                                                    className="p-3"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar
                                                            shape="square"
                                                            size={60}
                                                            src={
                                                                product.thumb_image_full_path
                                                            }
                                                        />
                                                        <div>
                                                            <p className="font-semibold">
                                                                {product.name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        No favourite products listed.
                                    </p>
                                )}
                            </Card>
                        </TabContent>
                        
                        <TabContent value="dynamic">
                            <Card bordered>
                                <h5 className="mb-4">
                                    Dynamic Member Profiles
                                </h5>
                                {memberData.dynamic_member_profiles?.length >
                                0 ? (
                                    <div className="flex flex-col gap-6">
                                        {memberData.dynamic_member_profiles.map(
                                            (profile: any, index: number) => (
                                                <div
                                                    key={profile.id || index}
                                                    className="p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                                >
                                                    <h6 className="font-semibold mb-3">
                                                        {profile.member_type
                                                            ?.name ||
                                                            `Profile ${
                                                                index + 1
                                                            }`}
                                                    </h6>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                                                        <DetailItem
                                                            label="Brands"
                                                            value={
                                                                <ListAsTags
                                                                    list={
                                                                        profile.brand_names
                                                                    }
                                                                />
                                                            }
                                                        />
                                                        <DetailItem
                                                            label="Categories"
                                                            value={
                                                                <ListAsTags
                                                                    list={
                                                                        profile.category_names
                                                                    }
                                                                />
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        No dynamic profiles available.
                                    </p>
                                )}
                            </Card>
                        </TabContent>
                    </div>
                </Tabs>
            </AdaptiveCard>
        </Container>
    )
}

export default MemberViewPage