// src/views/members/MemberViewPage.tsx

import React, { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch } from '@/reduxtool/store'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import { Button, Card, Tag, Avatar } from '@/components/ui'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Tabs from '@/components/ui/Tabs'
const { TabNav, TabList, TabContent } = Tabs

// Icons
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
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { Spinner } from '@/components/ui'
import { useSelector } from 'react-redux'
import { BiChevronRight } from 'react-icons/bi'

// --- Helper Functions & Components ---

// Renders a single label-value pair with consistent styling
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

// Renders an array of strings as a collection of Tags
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

// Formats a date string for display
const formatDate = (dateString?: string | null, includeTime = false) => {
    if (!dateString)
        return <span className="text-gray-400 dark:text-gray-500">N/A</span>
    try {
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
    } catch (error) {
        return 'Invalid Date'
    }
}

// Renders a boolean value as 'Yes' or 'No'
const renderBoolean = (value?: boolean | null | string) => {
    if (value === true || value === '1')
        return <Tag className="bg-emerald-100 text-emerald-600">Yes</Tag>
    if (value === false || value === '0')
        return <Tag className="bg-red-100 text-red-600">No</Tag>
    return <span className="text-gray-400 dark:text-gray-500">N/A</span>
}

// Renders a URL as a clickable link
const renderLink = (url?: string | null, text?: string) => {
    if (!url)
        return <span className="text-gray-400 dark:text-gray-500">N/A</span>
    const isUrl =
        typeof url === 'string' &&
        (url.startsWith('http://') || url.startsWith('https://'))
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

    const { status: masterLoadingStatus } = useSelector(masterSelector)

    useEffect(() => {
        if (!id) {
            toast.push(
                <Notification type="danger" title="Error">
                    No member ID provided.
                </Notification>,
            )
            navigate('/business-entities/member')
            return
        }

        const fetchMember = async () => {
            setIsLoading(true)
            try {
                const response = await dispatch(
                    getMemberByIdAction(id),
                ).unwrap()
                if (response) {
                    setMemberData(response)
                } else {
                    toast.push(
                        <Notification type="danger" title="Fetch Error">
                            Failed to load member data.
                        </Notification>,
                    )
                    navigate('/business-entities/member')
                }
            } catch (error: any) {
                toast.push(
                    <Notification type="danger" title="Fetch Error">
                        {error?.message || 'An error occurred.'}
                    </Notification>,
                )
                navigate('/business-entities/member')
            } finally {
                setIsLoading(false)
            }
        }

        fetchMember()
    }, [id, dispatch, navigate])

    if (isLoading || masterLoadingStatus === 'loading') {
        return (
            <Container className="h-full">
                <div className="flex justify-center items-center min-h-[500px]">
                    <Spinner size={40} />
                </div>
            </Container>
        )
    }

    if (!memberData) {
        return (
            <Container>
                <Card className="text-center p-8">
                    <p>Member not found.</p>
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
        disabled:
            'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
        unregistered:
            'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100',
    }
    const currentStatus = (memberData.status || 'unregistered').toLowerCase()

    return (
        <Container>
            <div className="flex gap-1 items-center mb-3">
                <NavLink to="/business-entities/member">
                    <h6 className="font-semibold hover:text-primary-600">
                        Member
                    </h6>
                </NavLink>
                <BiChevronRight size={22} />
                <h6 className="font-semibold text-primary flex items-center gap-2">
                    Member Profile
                </h6>
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
                        <div className="text-xs">
                            <h5 className="font-bold">
                                {memberData.name || 'N/A'}
                            </h5>
                            {/* <p className="text-gray-500">{memberData.email || 'No email'}</p> */}
                            <div className="flex items-center gap-2 mb-1">
                                <TbMail className="text-gray-400" />{' '}
                                <p>{memberData.email}</p>
                            </div>
                            {memberData.number && (
                                <div className="flex items-center gap-2 mb-1">
                                    <TbPhone className="text-gray-400" />{' '}
                                    <p>
                                        {memberData.number_code}{' '}
                                        {memberData.number}
                                    </p>
                                </div>
                            )}
                            <div className="flex items-center gap-2 m">
                                <TbGlobe className="text-gray-400" />{' '}
                                <p>{memberData.country?.name}</p>
                            </div>
                            <Tag
                                className={`mt-1 ${statusColorMap[currentStatus] || statusColorMap['unregistered']} capitalize`}
                            >
                                {memberData.status || 'N/A'}
                            </Tag>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                        <div className="flex gap-1">
                            <b className="font-semibold">Temp. Company: </b>
                            <span>{memberData?.company_temp}</span>
                        </div>
                        <div className="flex gap-1">
                            <b className="font-semibold">Actual Company: </b>
                            <span>{memberData?.company_id_actual}</span>
                        </div>
                        <div className="flex gap-1">
                            <b className="font-semibold">Business Type: </b>
                            <span>{memberData?.business_type}</span>
                        </div>
                        <div className="flex gap-1">
                            <b className="font-semibold text-nowrap">
                                Business Opportunity:{' '}
                            </b>
                            {/* <span>{memberData?.business_opportunity}</span> */}
                            <span className="text-wrap">
                                {Array.isArray(memberData?.business_opportunity)
                                    ? memberData?.business_opportunity.join(
                                          ', ',
                                      )
                                    : ''}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                        <div className="flex gap-1">
                            <b className="font-semibold">
                                Relationship Manager:{' '}
                            </b>
                            <span>
                                {memberData?.relationship_manager?.name}
                            </span>
                        </div>
                        <div className="flex gap-1">
                            <b className="font-semibold">
                                Interested Category:{' '}
                            </b>
                            <span>{memberData?.interested_in}</span>
                        </div>
                        <div className="flex gap-1">
                            <b className="font-semibold">Grade: </b>
                            <span>{memberData?.member_grade}</span>
                        </div>
                        <div className="flex gap-1">
                            <b className="font-semibold">Dealing in Bulk: </b>
                            <span>{memberData?.dealing_in_bulk}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button
                            icon={<TbArrowLeft />}
                            onClick={() =>
                                navigate('/business-entities/member')
                            }
                        >
                            Back to List
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
                <Tabs className="mt-2">
                    <TabList>
                        <TabNav value="tab1">Member Details</TabNav>
                        <TabNav value="tab2">Wall Inquiry</TabNav>
                        <TabNav value="tab3">Offer & Demand</TabNav>
                        <TabNav value="tab4">Leads</TabNav>
                        <TabNav value="tab5">Favourite Products</TabNav>
                        <TabNav value="tab6">Dynamic Profile</TabNav>
                    </TabList>

                    <div className="mt-8 flex flex-col gap-6">
                        <Card bordered>
                            <h5 className="mb-4">Basic Information</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1">
                                <DetailItem
                                    label="Member ID"
                                    value={memberData.id}
                                />
                                <DetailItem
                                    label="Joined Date"
                                    value={formatDate(memberData.created_at)}
                                />
                                <DetailItem
                                    label="Last Updated"
                                    value={formatDate(
                                        memberData.updated_at,
                                        true,
                                    )}
                                />
                                <DetailItem
                                    label="Interested In"
                                    value={memberData.interested_in}
                                />
                            </div>
                        </Card>

                        <Card bordered>
                            <h5 className="mb-4">Contact Information</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1">
                                <DetailItem
                                    label="Primary Number"
                                    value={`${memberData.number_code || ''} ${memberData.number || ''}`}
                                />
                                <DetailItem
                                    label="WhatsApp Number"
                                    value={memberData.whatsApp_no}
                                />
                                <DetailItem
                                    label="Alternate Number"
                                    value={`${memberData.alternate_contact_number_code || ''} ${memberData.alternate_contact_number || ''}`}
                                />
                                <DetailItem
                                    label="Alternate Email"
                                    value={memberData.alternate_email}
                                />
                                <DetailItem
                                    label="Landline Number"
                                    value={memberData.landline_number}
                                />
                                <DetailItem
                                    label="Fax Number"
                                    value={memberData.fax_number}
                                />
                            </div>
                        </Card>

                        <Card bordered>
                            <h5 className="mb-4">Company & Business</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1">
                                <DetailItem
                                    label="Temp. Company Name"
                                    value={memberData.company_temp}
                                />
                                <DetailItem
                                    label="Actual Company Name"
                                    value={memberData.company_actual}
                                />
                                <DetailItem
                                    label="Business Type"
                                    value={memberData.business_type}
                                />
                                <DetailItem
                                    label="Business Opportunity"
                                    value={memberData.business_opportunity}
                                />
                                <DetailItem
                                    label="Member Grade"
                                    value={memberData.member_grade}
                                />
                                <DetailItem
                                    label="Dealing in Bulk"
                                    value={memberData.dealing_in_bulk}
                                />
                                <DetailItem
                                    label="Relationship Manager"
                                    value={
                                        memberData.relationship_manager?.name
                                    }
                                />
                            </div>
                        </Card>

                        <Card bordered>
                            <h5 className="mb-4">Address & Location</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1">
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
                                    label="Pincode"
                                    value={memberData.pincode}
                                />
                                <DetailItem
                                    label="Country"
                                    value={memberData.country?.name}
                                />
                                <DetailItem
                                    label="Continent"
                                    value={memberData.continent?.name}
                                />
                            </div>
                        </Card>

                        <Card bordered>
                            <h5 className="mb-4">Social & Web Presence</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
                                <DetailItem
                                    label="Website"
                                    value={renderLink(memberData.website)}
                                />
                                <DetailItem
                                    label="LinkedIn"
                                    value={renderLink(
                                        memberData.linkedIn_profile,
                                    )}
                                />
                                <DetailItem
                                    label="Facebook"
                                    value={renderLink(
                                        memberData.facebook_profile,
                                    )}
                                />
                                <DetailItem
                                    label="Instagram"
                                    value={renderLink(
                                        memberData.instagram_handle,
                                        `@${memberData.instagram_handle}`,
                                    )}
                                />
                                <DetailItem
                                    label="Skype ID"
                                    value={memberData.skype_id}
                                />
                                <DetailItem
                                    label="WeChat ID"
                                    value={memberData.wechat_id}
                                />
                            </div>
                        </Card>

                        <Card bordered>
                            <h5 className="mb-4">Permissions</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1">
                                <DetailItem
                                    label="Product Upload"
                                    value={renderBoolean(
                                        memberData.product_upload_permission,
                                    )}
                                />
                                <DetailItem
                                    label="Wall Enquiry"
                                    value={renderBoolean(
                                        memberData.wall_enquiry_permission,
                                    )}
                                />
                                <DetailItem
                                    label="Enquiry Permission"
                                    value={renderBoolean(
                                        memberData.enquiry_permission,
                                    )}
                                />
                                <DetailItem
                                    label="Trade Inquiry"
                                    value={renderBoolean(
                                        memberData.trade_inquiry_allowed,
                                    )}
                                />
                            </div>
                        </Card>

                        {memberData.dynamic_member_profiles?.length > 0 && (
                            <Card bordered>
                                <h5 className="mb-4">
                                    Dynamic Member Profiles
                                </h5>
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
                                                        `Profile ${index + 1}`}
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
                                                    <DetailItem
                                                        label="Sub-categories"
                                                        value={
                                                            <ListAsTags
                                                                list={
                                                                    profile.sub_category_names
                                                                }
                                                            />
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>
                </Tabs>
            </AdaptiveCard>
        </Container>
    )
}

export default MemberViewPage
