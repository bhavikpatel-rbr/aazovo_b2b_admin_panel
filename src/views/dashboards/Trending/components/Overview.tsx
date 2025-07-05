import { useState, useEffect, useRef } from 'react'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import { Avatar, Button, Checkbox, Dropdown, Tooltip } from '@/components/ui'
import GrowShrinkValue from '@/components/shared/GrowShrinkValue'
import AbbreviateNumber from '@/components/shared/AbbreviateNumber'
import Chart from '@/components/shared/Chart'
import { useThemeStore } from '@/store/themeStore'
import classNames from '@/utils/classNames'
import { COLOR_1, COLOR_2, COLOR_4 } from '@/constants/chart.constant'
import { options } from '../constants'
import DataTable1 from './DataTable1'
import { NumericFormat } from 'react-number-format'
import { TbCoin, TbShoppingBagCheck, TbEye, TbProgressCheck, TbPhone, TbMail, TbChecklist, TbExchange, TbWorld, TbRadar2, TbTargetArrow, TbUsers, TbUser, TbBuilding, TbMinus, TbPlus, TbIdBadge2, TbBox, TbTag, TbInfoCircle, TbPencil, TbLink, TbSend2, TbTrash, TbDotsVertical, TbCopy, TbSwitchHorizontal, TbShare, TbBrandWhatsapp, TbClipboardCheck, TbLock } from 'react-icons/tb'
import type { ReactNode } from 'react'
import type { StatisticData, Period, StatisticCategory } from '../types'
import { COLORS } from '@/constants/chart.constant'
import { Tag } from '@/components/ui'
import IndiaIcon from "/img/countries/IN.png"
import { MdCancel, MdCheckCircle, MdOutlineBusinessCenter } from 'react-icons/md'
import { DataTable } from '@/components/shared'
import { FaBookmark, FaCircle } from 'react-icons/fa'
import { FaArrowDownLong, FaArrowUpLong } from 'react-icons/fa6'
import { BsCake } from 'react-icons/bs'
import { IoMdShare } from 'react-icons/io'
import { HiOutlineMinusCircle, HiOutlinePlusCircle } from 'react-icons/hi'
import { Link, useNavigate } from 'react-router-dom'
import Opportunities from '@/views/sales-Leads/Opportunities'
import Leads from '@/views/sales-Leads/Lead'

type StatisticCardProps = {
    title: string
    value: number | ReactNode
    icon: ReactNode
    iconClass: string
    label: StatisticCategory
    active: boolean
    onClick: (label: StatisticCategory) => void
    colorClass: string,
    activeBgColor: string,
    iconBg: string,
}

type StatisticGroupsProps = {
    data: StatisticData
}

const chartColors: Record<StatisticCategory, string> = {
    totalProfit: COLOR_1,
    totalOrder: COLOR_2,
    totalImpression: COLOR_4,
}

const StatisticCard = (props: StatisticCardProps) => {
    const {
        title,
        value,
        label,
        icon,
        iconClass,
        active,
        onClick,
        colorClass,
        activeBgColor,
        iconBg
    } = props

    return (
        <button
            className={classNames(
                'p-4 rounded-2xl cursor-pointer ltr:text-left rtl:text-right transition duration-150 outline-hidden',
                colorClass,
                active && `${activeBgColor} shadow-md`,
            )}
            onClick={() => onClick(label)}
        >
            {/* <div
                className={classNames(
                    'rounded-2xl p-4 flex flex-col justify-center',
                )}
            > */}
            <div className="flex justify-between items-center relative">
                <div className=''>
                    <div className="mb-4 !text-xs text-gray-900  font-bold ">{title}</div>
                    <h6 className="mb-1 text-gray-900">{value}</h6>
                </div>
                <div
                    className={
                        `flex items-center justify-center min-h-8 min-w-8 max-h-8 max-w-8 ${iconBg}
                            text-white rounded-full text-2xl`
                    }
                >
                    {icon}
                </div>
            </div>
            {/* </div> */}
        </button>
    )
}

const Bar = ({
    percent,
    className,
    field,
    color,
}: {
    percent: number
    className?: string
    field: string
    color: string
}) => {
    return (
        <div className="flex-1" style={{ width: `${percent}%` }}>
            <span className={`${color} dark:text-white text-xs`}>{field}</span>
            <div className={classNames('h-1.5 rounded-full', className)} />
            <div className="font-bold heading-text mt-1">{percent}% <span className='font-normal text-xs'>(110)</span></div>
        </div>
    )
}

const InfoLine: React.FC<{ icon?: React.ReactNode; text?: string | number | React.ReactNode | null; label?: string; title?: string; className?: string; boldText?: boolean }> = ({ icon, text, label, title, className, boldText }) => {
    if (text === null || text === undefined || text === "") return null;
    return (
        <div className={classNames("flex items-center gap-1 text-xs", className)}>
            {icon && <span className="text-gray-400 dark:text-gray-500 mr-1">{icon}</span>}
            {label && <span className="font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">{label}:</span>}
            <span
                className={classNames("text-gray-700 dark:text-gray-200 truncate", { "font-semibold": boldText })}
                title={title || (typeof text === 'string' || typeof text === 'number' ? String(text) : undefined)}
            >
                {text}
            </span>
        </div>
    );
};
InfoLine.defaultProps = { icon: null, text: null, label: "", title: "", className: "", boldText: false };

const Overview = ({ data }: StatisticGroupsProps) => {
    const [selectedCategory, setSelectedCategory] = useState<StatisticCategory>('Opportunity')

    const [selectedPeriod, setSelectedPeriod] = useState<Period>('thisMonth')

    const sideNavCollapse = useThemeStore(
        (state) => state.layout.sideNavCollapse,
    )

    const statusColor = {
        Active: "bg-green-200 text-green-600",
        Verified: "bg-blue-200 text-blue-600",
        Pending: "bg-orange-200 text-orange-600",
        Inactive: "bg-red-200 text-red-600",
    }

    const isFirstRender = useRef(true)

    const opportunitiesData = [
        {
            id: "OPP001", opportunity_id: "SPB-001", product_name: "Eco-Friendly Water Bottles - 1L Capacity, Stainless Steel, Various Colors",
            status: "active", opportunity_status: "New", match_score: 75, created_date: "2024-03-01T10:00:00Z",
            buy_listing_id: "BUY-ECO-01", sell_listing_id: "SELL-ECO-02", spb_role: "Seller",
            product_category: "Lifestyle", product_subcategory: "Drinkware", brand: "EcoLife",
            product_specs: "India, USA", quantity: 150, product_status_listing: "In Stock", want_to: "Sell",
            company_name: "GreenSource Supplies Ltd.", company_id: "GS001", member_name: "Alice Green", member_id: "MEM001",
            member_email: "alice@greensource.com", member_phone: "555-1111", member_type: "Premium",
            price_match_type: "Range", quantity_match_listing: "Partial", location_match: "National", matches_found_count: 5,
            last_updated: "2024-03-02T11:00:00Z", assigned_to: "Team Eco", notes: "Seller has bulk stock. Prefers long-term partnership.", listing_url: "https://example.com/ecobottle"
        },
        {
            id: "OPP002", opportunity_id: "SPB-002", product_name: "Handcrafted Leather Wallets - Bi-fold & Tri-fold",
            status: "pending", opportunity_status: "Shortlisted", match_score: 92, created_date: "2024-03-05T14:30:00Z",
            buy_listing_id: "BUY-LTHR-03", sell_listing_id: "SELL-LTHR-04", spb_role: "Buyer",
            product_category: "Accessories", product_subcategory: "Wallets", brand: "Artisan Craft Co.",
            product_specs: "China, Canada", quantity: 50, product_status_listing: "Low Stock", want_to: "Buy",
            company_name: "Luxury Goods Incorporated", company_id: "LG002", member_name: "Robert 'Bob' Vance", member_id: "MEM002",
            member_email: "bob.v@luxurygoods.inc", member_phone: "555-2222", member_type: "INS-PREMIUM",
            price_match_type: "Exact", quantity_match_listing: "Sufficient", location_match: "Local", matches_found_count: 2,
            last_updated: "2024-03-06T09:15:00Z", assigned_to: "Team Luxe", notes: "Buyer interested in long-term supply. Requires sample.", listing_url: "https://example.com/leatherwallet"
        },
        {
            id: "OPP003", opportunity_id: "SPB-003", product_name: "Smart Home Security System - Pro Kit with 4 Cameras",
            status: "on_hold", opportunity_status: "Converted", match_score: 88, created_date: "2024-02-20T16:00:00Z",
            buy_listing_id: "BUY-SEC-05", sell_listing_id: "SELL-SEC-06", spb_role: "Seller",
            product_category: "Electronics", product_subcategory: "Home Security", brand: "SecureHome Plus",
            product_specs: "Europe", quantity: 5, product_status_listing: "In Stock", want_to: "Sell",
            company_name: "SafeTech Solutions Global", company_id: "STS003", member_name: "Carol Danvers (Captain)", member_id: "MEM003",
            member_email: "carol.d@safetechglobal.net", member_phone: "555-3333", member_type: "Standard",
            price_match_type: "Exact", quantity_match_listing: "Sufficient", location_match: "National", matches_found_count: 8,
            last_updated: "2024-03-01T10:00:00Z", assigned_to: "Team Secure", notes: "Deal closed, awaiting full payment and shipment coordination.", listing_url: "https://example.com/securitysystempro"
        },
        {
            id: "OPP004", opportunity_id: "OPP-S-004", product_name: "Refurbished iPhone 13 Pro - 256GB",
            status: "active", opportunity_status: "New", match_score: 85, created_date: "2024-03-10T12:00:00Z",
            sell_listing_id: "SELL-IPHONE-07", spb_role: "Seller",
            product_category: "Electronics", product_subcategory: "Mobile Phones", brand: "Apple",
            product_specs: "New Zealand", quantity: 20, product_status_listing: "In Stock", want_to: "Sell",
            company_name: "GadgetCycle Ltd.", company_id: "GC004", member_name: "Mike Wheeler", member_id: "MEM004",
            member_email: "mike@gadgetcycle.com", member_phone: "555-4444", member_type: "Premium",
            matches_found_count: 3,
            last_updated: "2024-03-11T10:00:00Z", assigned_to: "Team Mobile", notes: "Good condition, competitive price.", listing_url: "https://example.com/iphone13pro"
        },
        {
            id: "OPP005", opportunity_id: "OPP-B-005", product_name: "Bulk Order - Organic Coffee Beans",
            status: "pending", opportunity_status: "Shortlisted", match_score: 70, created_date: "2024-03-12T09:30:00Z",
            buy_listing_id: "BUY-COFFEE-08", spb_role: "Buyer",
            product_category: "Groceries", product_subcategory: "Coffee", brand: "Any (Organic)",
            product_specs: "Africa", quantity: 100, want_to: "Buy",
            company_name: "The Daily Grind Cafe", company_id: "DGC005", member_name: "Eleven Hopper", member_id: "MEM005",
            member_email: "el@dailygrind.coffee", member_phone: "555-5555", member_type: "INS-PREMIUM",
            matches_found_count: 4,
            last_updated: "2024-03-12T17:00:00Z", assigned_to: "Team Cafe", notes: "Urgent requirement for new blend.", listing_url: "https://example.com/organiccoffeebeans"
        }
    ];

    const opportunitiesColumns = [
        {
            id: 'expander',
            header: () => null,
            size: 40,
            cell: ({ row }) => (
                <Tooltip title={row.getIsExpanded() ? "Collapse" : "Expand Details"}>
                    <Button
                        shape="circle"
                        variant="subtle"
                        size="xs"
                        icon={row.getIsExpanded() ? <TbMinus /> : <TbPlus />}
                        onClick={row.getToggleExpandedHandler()}
                    />
                </Tooltip>
            )
        },
        {
            header: "Products",
            accessorKey: "opportunity_id",
            size: 300,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-start gap-3">
                        <Avatar size={38} shape="circle" className="mt-1 bg-primary-500 text-white text-base flex-shrink-0">
                            {item.product_name?.substring(0, 2).toUpperCase()}
                        </Avatar>
                        <div className="flex flex-col">
                            <Link to={`/sales-leads/opportunity/detail/${item.id}`} className="font-semibold text-sm text-primary-600 hover:underline dark:text-primary-400 mb-0.5">
                                {item.opportunity_id}
                            </Link>
                            <Tooltip title={item.product_name}>
                                <span className="text-xs text-gray-700 dark:text-gray-200 truncate block max-w-[240px]">
                                    {item.product_name?.slice(0, 15)}
                                    {item.product_name && item.product_name.length > 1 ? "…" : ""}
                                </span>
                            </Tooltip>
                            <Tag className={` capitalize text-[10px] px-1.5 py-0.5 mt-1 self-start`}>{item.status}</Tag>
                        </div>
                    </div>
                )
            }
        },
        {
            header: "Company, Member & Role",
            accessorKey: "company_name",
            size: 280,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="text-xs">
                        <div className="mb-1.5 flex items-center">
                            <TbBuilding size={14} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-800 dark:text-gray-100 truncate" title={item.company_name}>{item.company_name}</span>
                                {item.company_id && <span className="text-gray-500 dark:text-gray-400 text-[11px]">{item.company_id}</span>}
                            </div>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-1.5 flex items-center">
                            <TbUser size={14} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-700 dark:text-gray-200 truncate" title={item.member_name}>{item.member_name}</span>
                                <div className="flex items-center">
                                    {item.member_id && <span className="text-gray-500 dark:text-gray-400 text-[11px] mr-1.5">{item.member_id}</span>}
                                    <Tag className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-300 text-[9px] px-1 py-0.5 align-middle whitespace-nowrap">
                                        {item.member_type}
                                    </Tag>
                                </div>
                            </div>
                        </div>
                        {item.spb_role && (
                            <Tag className={classNames("mt-1.5 capitalize text-xs px-2 py-0.5", item.spb_role === "Seller" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" : "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300")}>
                                <TbUsers className="inline mr-1 text-sm align-middle" /> {item.spb_role}
                            </Tag>
                        )}
                    </div>
                )
            }
        },
        {
            header: "Key Details & Matching",
            accessorKey: "match_score",
            size: 260,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="text-xs space-y-1">
                        <InfoLine icon={<TbPhone size={13} />} text={item.member_phone || 'N/A'} />
                        <InfoLine icon={<TbMail size={13} />} text={item.member_email ? <a href={`mailto:${item.member_email}`} className="text-blue-500 hover:underline">{item.member_email}</a> : 'N/A'} />
                        <div className="pt-1 mt-1 border-t dark:border-gray-600">
                            <InfoLine icon={<TbChecklist size={13} />} label="Qty" text={item.quantity ?? 'N/A'} />
                            <InfoLine icon={<TbProgressCheck size={13} />} label="Stock" text={item.product_status_listing ?? 'N/A'} />
                            <InfoLine icon={<TbExchange size={13} />} label="Want To" text={item.want_to ?? 'N/A'} />
                        </div>
                        <div className="pt-1 mt-1 border-t dark:border-gray-600">
                            <InfoLine icon={<TbWorld size={13} />} label="Specs" text={item.product_specs ? (item.product_specs.length > 20 ? item.product_specs.substring(0, 17) + "..." : item.product_specs) : 'N/A'} title={item.product_specs} />
                            <InfoLine icon={<TbRadar2 size={13} />} label="Matches" text={item.matches_found_count ?? 'N/A'} />
                            <InfoLine icon={<TbTargetArrow size={13} />} label="Score" text={`${item.match_score}%`} />
                        </div>
                    </div>
                )
            }
        },
        {
            header: "Timestamps & Status",
            accessorKey: "created_date",
            size: 170,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="text-xs space-y-1.5">
                        {/* <FormattedDate label="Created" dateString={item.created_date} /> */}
                        <div className="flex items-center gap-1">
                            {/* <InfoLine icon={<TbProgressCheck size={14} />} label="Opp." /> */}
                            <Tag className={`capitalize text-[10px] px-1.5 py-0.5 whitespace-nowrap`}>{item.opportunity_status}</Tag>
                        </div>
                    </div>
                )
            }
        },
        {
            header: "Quick Actions",
            id: "action_spb",
            size: 90,
            cell: () => (
                <div className="flex items-center justify-end gap-1">
                    <div className="flex items-center justify-center gap-1">
                        <Tooltip title="Copy">
                            <div
                                className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`}
                                role="button"
                            >
                                <TbCopy />
                            </div>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <div
                                className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`}
                                role="button"
                            >
                                <TbPencil />
                            </div>
                        </Tooltip>
                        <Tooltip title="View">
                            <div
                                className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`}
                                role="button"
                            >
                                <TbEye />
                            </div>
                        </Tooltip>
                        <Tooltip title="Share">
                            <Dropdown renderTitle={
                                <div
                                    className={`text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400`}
                                >
                                    <TbShare />
                                </div>
                            }>
                                <Dropdown.Item><div className="flex gap-2 items-center text-sm"><TbBrandWhatsapp size={20} /> Whatsapp</div></Dropdown.Item>
                                <Dropdown.Item><div className="flex gap-2 items-center text-sm"><TbMail size={20} /> Email</div></Dropdown.Item>
                            </Dropdown>
                        </Tooltip>
                        <Tooltip title="More">
                            <Dropdown renderTitle={
                                <div
                                    className={`text-xl cursor-pointer select-none text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-400`}
                                    role="button"
                                >
                                    <TbDotsVertical />
                                </div>
                            }>
                                <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                    <div className="flex gap-2 items-center text-xs"><TbPhone size={20} /> Contact Now</div>
                                </Dropdown.Item>
                                <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                    <div className="flex gap-2 items-center text-xs"><TbLink size={20} /> Share Link</div>
                                </Dropdown.Item>
                                <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                    <div className="flex gap-2 items-center text-xs"><TbClipboardCheck size={20} /> Copy SPB</div>
                                </Dropdown.Item>
                                <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                    <div className="flex gap-2 items-center text-xs"><TbLock size={20} /> Lock Match</div>
                                </Dropdown.Item>
                                <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                    <div className="flex gap-2 items-center text-xs"><TbTrash size={20} /> Delete</div>
                                </Dropdown.Item>
                            </Dropdown>

                        </Tooltip>
                    </div>
                </div>
            )
        },
    ]
    const [expanded, setExpanded] = useState({})
    const ExpandedOpportunityDetails = ({ row: { original: item } }) => {
        const navigate = useNavigate();
        return (
            <>
                <Card bordered className="m-1 my-2 rounded-lg">
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="space-y-1.5 pr-3 md:border-r md:dark:border-gray-600">
                            <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Opportunity Snapshot</h6>
                            <InfoLine icon={<TbIdBadge2 size={14} />} label="Opp. ID" text={item.opportunity_id} className="font-medium text-sm" />
                            <InfoLine icon={<TbBox size={14} />} label="Product" text={item.product_name?.slice(0, 15) + (item.product_name && item.product_name.length > 1 ? "…" : "")} className="font-medium text-sm" />
                            <InfoLine icon={<TbTag size={14} />} label="Category" text={`${(item.product_category || 'N/A').toString().slice(0, 15) + ((item.product_category && item.product_category.length > 15) ? "…" : "")}${item.product_subcategory ? ` > ${item.product_subcategory.slice(0, 15) + (item.product_subcategory.length > 15 ? "…" : "")}` : ''}`} />
                            <InfoLine icon={<TbTag size={14} />} label="Brand" text={item.brand ? item.brand.slice(0, 15) + (item.brand.length > 15 ? "…" : "") : 'N/A'} />
                            {item.product_specs && <InfoLine icon={<TbInfoCircle size={14} />} label="Specs" text={item.product_specs} />}
                            <InfoLine icon={<TbChecklist size={14} />} label="Quantity" text={item.quantity?.toString() || 'N/A'} />
                            <InfoLine icon={<TbProgressCheck size={14} />} label="Product Status" text={item.product_status_listing || 'N/A'} />
                            <InfoLine icon={<TbExchange size={14} />} label="Intent/Role" />
                        </div>
                        <div className="space-y-1.5 pr-3 md:border-r md:dark:border-gray-600">
                            <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Company & Member</h6>
                            <div className="p-2 border rounded dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm mb-2">
                                <div className="flex items-center">
                                    {item.company_id && <span className="font-semibold text-gray-500 dark:text-gray-400 text-[11px] mr-1">{item.company_id} |</span>}
                                    <InfoLine icon={<TbBuilding size={14} />} text={item.company_name} className="font-semibold" />
                                </div>
                            </div>
                            <div className="p-2 border rounded dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm">
                                <div className="flex items-center">
                                    {item.member_id && <span className="font-semibold text-gray-500 dark:text-gray-400 text-[11px] mr-1">{item.member_id} |</span>}
                                    <InfoLine icon={<TbUser size={14} />} text={item.member_name} className="font-semibold" />
                                </div>
                                <InfoLine text={item.member_type} className="ml-5 text-indigo-600 dark:text-indigo-400 font-medium" />
                                {item.member_email && <InfoLine icon={<TbMail size={14} />} text={<a href={`mailto:${item.member_email}`} className="text-blue-500 hover:underline">{item.member_email}</a>} />}
                                {item.member_phone && <InfoLine icon={<TbPhone size={14} />} text={item.member_phone} />}
                            </div>
                            {item.listing_url && <InfoLine icon={<TbLink size={14} />} label="Listing" text={<a href={item.listing_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block max-w-[180px]" title={item.listing_url}>{item.listing_url}</a>} />}
                        </div>
                        <div className="space-y-1.5">
                            <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Match & Lifecycle</h6>
                            <InfoLine icon={<TbRadar2 size={14} />} label="Other Matched Found" text={'5, 6'} />
                            {/* <InfoLine icon={<TbTargetArrow size={14}/>} label="Match Score" text={`${item.match_score}%`} /> */}
                            <InfoLine icon={<TbTargetArrow size={14} />} label="Match Score" text={`92%, 91%`} />
                            <div className="flex items-center gap-2">
                                <InfoLine icon={<TbProgressCheck size={14} />} label="Opp. Status" />
                                <Tag className={`capitalize`}>{item.opportunity_status}</Tag>
                            </div>
                            <div className="pt-2 mt-2 border-t dark:border-gray-600">
                                <h6 className="text-sm font-semibold mb-1">Actions</h6>
                                <div className="flex items-center gap-2">
                                    <Tooltip title="Edit">
                                        <div
                                            className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
                                            role="button"
                                        >
                                            <TbPencil />
                                        </div>
                                    </Tooltip>
                                    <Tooltip title="View">
                                        <div
                                            className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                                            role="button"
                                        >
                                            <TbEye />
                                        </div>
                                    </Tooltip>
                                    <Tooltip title="Make Offer / Demand">
                                        <div
                                            className="text-xl cursor-pointer select-none text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                                            role="button"
                                        >
                                            <TbSend2 />
                                        </div>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <div
                                            className="text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                                            role="button"
                                        >
                                            <TbTrash />
                                        </div>
                                    </Tooltip>
                                    <div
                                        className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                                        role="button"
                                    >
                                        <Dropdown renderTitle={<TbDotsVertical />}>
                                            <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                                <div className="flex gap-2 text-xs">Accept</div>
                                            </Dropdown.Item>
                                            <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                                <div className="flex gap-2 text-xs">Counter</div>
                                            </Dropdown.Item>
                                            <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                                <div className="flex gap-2 text-xs">Reject</div>
                                            </Dropdown.Item>
                                            <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                                <div className="flex gap-2 text-xs">Contact Now</div>
                                            </Dropdown.Item>
                                            <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                                <div className="flex gap-2 text-xs">Add in Active</div>
                                            </Dropdown.Item>
                                            <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                                <div className="flex gap-2 text-xs">Add Schedule</div>
                                            </Dropdown.Item>
                                            <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                                <div className="flex gap-2 text-xs">Add Task</div>
                                            </Dropdown.Item>
                                            <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                                <div className="flex gap-2 text-xs">View Alert</div>
                                            </Dropdown.Item>
                                        </Dropdown>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </Card>
                <Card bordered className="m-1 my-2 rounded-lg">
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="space-y-1.5 pr-3 md:border-r md:dark:border-gray-600">
                            <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Opportunity Snapshot</h6>
                            <InfoLine icon={<TbIdBadge2 size={14} />} label="Opp. ID" text="DEMO-98765" className="font-medium text-sm" />
                            <InfoLine icon={<TbBox size={14} />} label="Product" text="Demo Product Name…" className="font-medium text-sm" />
                            <InfoLine icon={<TbTag size={14} />} label="Category" text="DemoCat > DemoSubcat" />
                            <InfoLine icon={<TbTag size={14} />} label="Brand" text="DemoBrand" />
                            <InfoLine icon={<TbInfoCircle size={14} />} label="Specs" text="Demo Specs, Example, Test" />
                            <InfoLine icon={<TbChecklist size={14} />} label="Quantity" text="1234" />
                            <InfoLine icon={<TbProgressCheck size={14} />} label="Product Status" text="Demo Status" />
                            <InfoLine icon={<TbExchange size={14} />} label="Intent/Role" text="DemoRole" />
                        </div>
                        <div className="space-y-1.5 pr-3 md:border-r md:dark:border-gray-600">
                            <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Company & Member</h6>
                            <div className="p-2 border rounded dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm mb-2">
                                <div className="flex items-center">
                                    <span className="font-semibold text-gray-500 dark:text-gray-400 text-[11px] mr-1">DEMO-COMP |</span>
                                    <InfoLine icon={<TbBuilding size={14} />} text="Demo Company Inc." className="font-semibold" />
                                </div>
                            </div>
                            <div className="p-2 border rounded dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm">
                                <div className="flex items-center">
                                    <span className="font-semibold text-gray-500 dark:text-gray-400 text-[11px] mr-1">DEMO-MEM |</span>
                                    <InfoLine icon={<TbUser size={14} />} text="Demo Member" className="font-semibold" />
                                </div>
                                <InfoLine text="DEMO-TYPE" className="ml-5 text-indigo-600 dark:text-indigo-400 font-medium" />
                                <InfoLine icon={<TbMail size={14} />} text={<a href="mailto:demo@demo.com" className="text-blue-500 hover:underline">demo@demo.com</a>} />
                                <InfoLine icon={<TbPhone size={14} />} text="111-2222" />
                            </div>
                            <InfoLine icon={<TbLink size={14} />} label="Listing" text={<a href="https://demo-listing.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block max-w-[180px]" title="https://demo-listing.com">https://demo-listing.com</a>} />
                        </div>
                        <div className="space-y-1.5">
                            <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Match & Lifecycle</h6>
                            <InfoLine icon={<TbRadar2 size={14} />} label="Other Matched Found" text="77, 88" />
                            <InfoLine icon={<TbTargetArrow size={14} />} label="Match Score" text="98%, 97%" />
                            <div className="flex items-center gap-2">
                                <InfoLine icon={<TbProgressCheck size={14} />} label="Opp. Status" />
                                <Tag className="bg-green-200 text-green-700 capitalize">DemoStatus</Tag>
                            </div>
                            <div className="pt-2 mt-2 border-t dark:border-gray-600">
                                <h6 className="text-sm font-semibold mb-1">Actions</h6>
                                <div className="flex items-center gap-2">
                                    <Tooltip title="Edit">
                                        <div
                                            className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
                                            role="button"
                                        >
                                            <TbPencil />
                                        </div>
                                    </Tooltip>
                                    <Tooltip title="Clone">
                                        <div
                                            className="text-xl cursor-pointer select-none text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                                            role="button"
                                        >
                                            <TbCopy />
                                        </div>
                                    </Tooltip>
                                    <Tooltip title="Change Status">
                                        <div
                                            className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                                            role="button"
                                        >
                                            <TbSwitchHorizontal />
                                        </div>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <div
                                            className="text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                                            role="button"
                                        >
                                            <TbTrash />
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </>
        );
    }

    const companyData = [
        {
            name: 'Global Tech Supplies',
            type: 'Manufacture',
            interested: 'Sell',
            category: 'Electronics',
            brands: ['Apple', 'Samsung'],
            country: 'India',
            trustRatio: '87%',
            successRatio: '87%',
            noOfMember: 12,
            wallCount: 3,
            success: 3,
            lost: 4,
            buy: 2,
            sell: 1,
            opportunity: 7,
            offers: 3,
            demands: 4,
            leads: 14,
            deals: 6,
            risk: 'Low',
            action: 'View',
            status: 'Active',
            progress: 85,
            subRows: [
                {
                    productName: 'Iphone 14 Pro Max',
                    brand: 'Apple',
                    category: 'Electronics',
                    subCategory: 'Mobile',
                    status: 'Active',
                },
                {
                    productName: 'Iphone 14 Pro Max',
                    brand: 'Apple',
                    category: 'Electronics',
                    subCategory: 'Mobile',
                    status: 'Active',
                },
            ]
        },
        {
            name: 'Nova Agro Imports',
            type: 'Distributor',
            interested: 'Buy',
            category: 'Agriculture',
            brands: ['Bayer', 'Syngenta'],
            country: 'Brazil',
            trustRatio: '92%',
            successRatio: '90%',
            noOfMember: 8,
            wallCount: 2,
            success: 5,
            lost: 1,
            buy: 3,
            sell: 0,
            opportunity: 6,
            offers: 2,
            demands: 4,
            leads: 11,
            deals: 7,
            risk: 'Very Low',
            action: 'View',
            status: 'Active',
            progress: 78,
        },
        {
            name: 'IronShield Industries',
            type: 'Manufacturer',
            interested: 'Sell',
            category: 'Metals',
            brands: ['JSW', 'Tata Steel'],
            country: 'India',
            trustRatio: '80%',
            successRatio: '76%',
            noOfMember: 15,
            wallCount: 4,
            success: 6,
            lost: 3,
            buy: 0,
            sell: 4,
            opportunity: 9,
            offers: 5,
            demands: 4,
            leads: 18,
            deals: 9,
            risk: 'Medium',
            action: 'View',
            status: 'Pending',
            progress: 68,
        },
        {
            name: 'Medico HealthCare Pvt Ltd',
            type: 'Retailer',
            interested: 'Buy',
            category: 'Pharmaceuticals',
            brands: ['Cipla', 'Dr. Reddy'],
            country: 'India',
            trustRatio: '85%',
            successRatio: '82%',
            noOfMember: 6,
            wallCount: 1,
            success: 2,
            lost: 2,
            buy: 2,
            sell: 0,
            opportunity: 4,
            offers: 1,
            demands: 3,
            leads: 6,
            deals: 3,
            risk: 'Low',
            action: 'View',
            status: 'Active',
            progress: 71,
        },
        {
            name: 'AutoTech Exporters Ltd',
            type: 'Exporter',
            interested: 'Sell',
            category: 'Automobile Parts',
            brands: ['Bosch', 'Denso'],
            country: 'Germany',
            trustRatio: '90%',
            successRatio: '88%',
            noOfMember: 10,
            wallCount: 2,
            success: 7,
            lost: 2,
            buy: 1,
            sell: 5,
            opportunity: 10,
            offers: 6,
            demands: 4,
            leads: 20,
            deals: 12,
            risk: 'Very Low',
            action: 'View',
            status: 'Inactive',
            progress: 89,
        },
    ];

    const companyColumns = [
        {
            id: 'expander',
            header: "",
            cell: (props) => {
                return (
                    <>
                        <button
                            className="text-xl"
                            {...{
                                onClick: props.row.getToggleExpandedHandler(),
                            }}
                        >
                            {props.row.getIsExpanded() ? (
                                <HiOutlineMinusCircle />
                            ) : (
                                <HiOutlinePlusCircle />
                            )}
                        </button>
                    </>
                )
            },
        },
        {
            header: 'Products',
            accessorKey: 'name',
            enableSorting: true,
            size: 230,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <h6 className="text-xs">Macbook M4</h6>
                    <span className="text-xs flex gap-1">
                        ({"Matches: 5"})
                    </span>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Buyers: </h6> 3/3
                    </span>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Sellers: </h6> 2/3
                    </span>
                </div>
            )
        },
        {
            header: 'Matched',
            accessorKey: 'brands',
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Brands:</h6> {props.row.original.brands?.map(val => {
                            return <span>{val}, </span>
                        })}
                    </span>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Category:</h6> {props.row.original.category}
                    </span>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Interested:</h6> {props.row.original.interested}
                    </span>
                </div>
            )
        },
        {
            header: 'Verified', accessorKey: 'verified',
            size: 100,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <span className="flex flex-wrap gap-1 text-xs">
                        <h6 className="text-sm">Members:</h6> {props.row.original.noOfMember}/43 (34%)
                    </span>
                    <div className='flex gap-1 items-center'>
                        <Tooltip title="KYC Verification : 48%" className='text-xs'>
                            <div className=' border border-gray-300 rounded-md py-1 px-1.5 text-xs flex items-center gap-1'>
                                <MdCheckCircle className='text-green-500 text-lg' />
                                <span>13/27</span>
                            </div>
                        </Tooltip>
                        <Tooltip title="Enable Billing" className='text-xs'><MdCancel className='text-red-500 text-lg' /></Tooltip>
                    </div>
                    <Tooltip className='text-xs' title={`Profile Completion ${props.row.original.progress}%`}>
                        <div className='h-1.5 w-28 rounded-full bg-gray-300'>
                            <div className={`font-bold rounded-full h-1.5 bg-blue-500 heading-text mt-1`}
                                style={{ width: props.row.original.progress + "%" }}
                            ></div>
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Walls', accessorKey: 'wallCount',
            cell: props => (
                <div>
                    <Tooltip title="Buy: 13 | Sell: 12 | Total: 25 " className='text-xs'>
                        <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            13 | 12 | 25
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Opportunities', accessorKey: 'opportunity',
            size: 170,
            cell: props => (
                <div>
                    <Tooltip title="Offers: 34 | Demands: 12 | Total: 46" className='text-xs'>
                        <div className=' bg-orange-100 text-orange-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            34 | 12 | 46
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Leads', accessorKey: 'leads',
            size: 180,
            cell: props => (
                <div>
                    <Tooltip title="Success: 34 | Lost: 12 | Total: 46" className='text-xs'>
                        <div className=' bg-green-100 text-green-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            34 | 12 | 46
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Ratio', accessorKey: 'trustRatio',
            size: 180,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <Tag className="flex gap-1 text-[10px]">
                        <h6 className="text-[10px]">Success:</h6> {props.row.original.successRatio}
                    </Tag>
                    <Tag className="flex gap-1 text-[10px]">
                        <h6 className="text-[10px]">Trust:</h6> {props.getValue()}
                    </Tag>
                    <Tag className="flex gap-1 text-[10px] flex-wrap">
                        <h6 className="text-[10px]">Health Score:</h6> 80%
                    </Tag>
                </div>
            )
        },

    ]

    const memberData = [
        {
            name: 'Global Tech Supplies',
            type: 'Manufacture',
            interested: 'Sell',
            category: 'Electronics',
            brands: ['Apple', 'Samsung'],
            country: 'India',
            trustRatio: '87%',
            successRatio: '87%',
            noOfMember: 12,
            wallCount: 3,
            success: 3,
            lost: 4,
            buy: 2,
            sell: 1,
            opportunity: 7,
            offers: 3,
            demands: 4,
            leads: 14,
            deals: 6,
            risk: 'Low',
            action: 'View',
            status: 'Active',
            progress: 85,
        },
        {
            name: 'Nova Agro Imports',
            type: 'Distributor',
            interested: 'Buy',
            category: 'Agriculture',
            brands: ['Bayer', 'Syngenta'],
            country: 'Brazil',
            trustRatio: '92%',
            successRatio: '90%',
            noOfMember: 8,
            wallCount: 2,
            success: 5,
            lost: 1,
            buy: 3,
            sell: 0,
            opportunity: 6,
            offers: 2,
            demands: 4,
            leads: 11,
            deals: 7,
            risk: 'Very Low',
            action: 'View',
            status: 'Active',
            progress: 78,
        },
        {
            name: 'IronShield Industries',
            type: 'Manufacturer',
            interested: 'Sell',
            category: 'Metals',
            brands: ['JSW', 'Tata Steel'],
            country: 'India',
            trustRatio: '80%',
            successRatio: '76%',
            noOfMember: 15,
            wallCount: 4,
            success: 6,
            lost: 3,
            buy: 0,
            sell: 4,
            opportunity: 9,
            offers: 5,
            demands: 4,
            leads: 18,
            deals: 9,
            risk: 'Medium',
            action: 'View',
            status: 'Pending',
            progress: 68,
        },
        {
            name: 'Medico HealthCare Pvt Ltd',
            type: 'Retailer',
            interested: 'Buy',
            category: 'Pharmaceuticals',
            brands: ['Cipla', 'Dr. Reddy'],
            country: 'India',
            trustRatio: '85%',
            successRatio: '82%',
            noOfMember: 6,
            wallCount: 1,
            success: 2,
            lost: 2,
            buy: 2,
            sell: 0,
            opportunity: 4,
            offers: 1,
            demands: 3,
            leads: 6,
            deals: 3,
            risk: 'Low',
            action: 'View',
            status: 'Active',
            progress: 71,
        },
        {
            name: 'AutoTech Exporters Ltd',
            type: 'Exporter',
            interested: 'Sell',
            category: 'Automobile Parts',
            brands: ['Bosch', 'Denso'],
            country: 'Germany',
            trustRatio: '90%',
            successRatio: '88%',
            noOfMember: 10,
            wallCount: 2,
            success: 7,
            lost: 2,
            buy: 1,
            sell: 5,
            opportunity: 10,
            offers: 6,
            demands: 4,
            leads: 20,
            deals: 12,
            risk: 'Very Low',
            action: 'View',
            status: 'Inactive',
            progress: 89,
        },
    ];

    const memberColumns = [

        {
            header: 'Sales Person (RM)',
            accessorKey: 'name',
            enableSorting: true,
            size: 230,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <h6 className="text-xs">Janhvi Kapoor</h6>
                    <span className="text-xs flex">
                        <h6 className="text-xs"></h6> ({"XYZ Company Name"})
                    </span>
                    <span className="text-xs flex gap-1">9582850192</span>
                    <span className="text-xs flex gap-1">xyz@gmail.com</span>
                    <span className="text-xs">
                        <Tag className={statusColor[props.row.original.status]}> {props.row.original.status}</Tag>
                    </span>
                    {/* <span >Status: {props.row.original.status}</span> */}
                </div>
            )
        },
        {
            header: 'Preferences',
            accessorKey: 'brands',
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <span className="text-xs ">
                        <h6 className="text-xs inline">Brands:</h6> {props.row.original.brands?.map(val => {
                            return <span>{val}, </span>
                        })}
                    </span>
                    <span className="text-xs ">
                        <h6 className="text-xs inline">Category:</h6> {props.row.original.category}
                    </span>
                    <span className="text-xs ">
                        <h6 className="text-xs inline">Products: </h6>Iphone, Airpods, Macbook
                    </span>
                </div>
            )
        },
        {
            header: 'Count', accessorKey: 'leads',
            size: 180,
            cell: props => (
                <div>
                    <Tooltip title="Success: 34 | Lost: 12 | Total: 46" className='text-xs'>
                        <div className=' bg-green-100 text-green-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            34 | 12 | 46
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Follow-Ups', accessorKey: 'wallCount',
            cell: props => (
                <div>
                    <Tooltip title="New: 13 | Follow-Up: 12 | Total: 25 " className='text-xs'>
                        <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            13 | 12 | 25
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Total', accessorKey: 'opportunity',
            size: 160,
            cell: props => (
                <div>
                    <Tooltip title="Qty: 34 | Value: $15,67,832" className='text-xs'>
                        <div className=' bg-orange-100 text-orange-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            34 | $15,67,832
                        </div>
                    </Tooltip>
                </div>
            )
        },

        {
            header: 'Average & Ratio', accessorKey: 'trustRatio',
            size: 190,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <Tag className="flex gap-1 text-[10px]">
                        <h6 className="text-[10px]">Response Time :</h6>3.2 hours
                    </Tag>
                    <Tag className="flex gap-1 text-[10px]">
                        <h6 className="text-[10px]">Closing Time :</h6>4.5 days
                    </Tag>
                    <Tag className="flex gap-1 text-[10px] flex-wrap">
                        <h6 className="text-[10px]">Conversion Rate :</h6> 70%
                    </Tag>
                    <Tag className="flex gap-1 text-[10px] flex-wrap bg-green-200">
                        <h6 className="text-[10px]">Grade :</h6> A
                    </Tag>
                </div>
            )
        },

    ]

    const productData = [
        {
            name: 'Global Tech Supplies',
            type: 'Manufacture',
            interested: 'Sell',
            category: 'Electronics',
            brands: ['Apple', 'Samsung'],
            country: 'India',
            trustRatio: '87%',
            successRatio: '87%',
            noOfMember: 12,
            wallCount: 3,
            success: 3,
            lost: 4,
            buy: 2,
            sell: 1,
            opportunity: 7,
            offers: 3,
            demands: 4,
            leads: 14,
            deals: 6,
            risk: 'Low',
            action: 'View',
            status: 'Active',
            progress: 85,
        },
        {
            name: 'Nova Agro Imports',
            type: 'Distributor',
            interested: 'Buy',
            category: 'Agriculture',
            brands: ['Bayer', 'Syngenta'],
            country: 'Brazil',
            trustRatio: '92%',
            successRatio: '90%',
            noOfMember: 8,
            wallCount: 2,
            success: 5,
            lost: 1,
            buy: 3,
            sell: 0,
            opportunity: 6,
            offers: 2,
            demands: 4,
            leads: 11,
            deals: 7,
            risk: 'Very Low',
            action: 'View',
            status: 'Active',
            progress: 78,
        },
        {
            name: 'IronShield Industries',
            type: 'Manufacturer',
            interested: 'Sell',
            category: 'Metals',
            brands: ['JSW', 'Tata Steel'],
            country: 'India',
            trustRatio: '80%',
            successRatio: '76%',
            noOfMember: 15,
            wallCount: 4,
            success: 6,
            lost: 3,
            buy: 0,
            sell: 4,
            opportunity: 9,
            offers: 5,
            demands: 4,
            leads: 18,
            deals: 9,
            risk: 'Medium',
            action: 'View',
            status: 'Pending',
            progress: 68,
        },
        {
            name: 'Medico HealthCare Pvt Ltd',
            type: 'Retailer',
            interested: 'Buy',
            category: 'Pharmaceuticals',
            brands: ['Cipla', 'Dr. Reddy'],
            country: 'India',
            trustRatio: '85%',
            successRatio: '82%',
            noOfMember: 6,
            wallCount: 1,
            success: 2,
            lost: 2,
            buy: 2,
            sell: 0,
            opportunity: 4,
            offers: 1,
            demands: 3,
            leads: 6,
            deals: 3,
            risk: 'Low',
            action: 'View',
            status: 'Active',
            progress: 71,
        },
        {
            name: 'AutoTech Exporters Ltd',
            type: 'Exporter',
            interested: 'Sell',
            category: 'Automobile Parts',
            brands: ['Bosch', 'Denso'],
            country: 'Germany',
            trustRatio: '90%',
            successRatio: '88%',
            noOfMember: 10,
            wallCount: 2,
            success: 7,
            lost: 2,
            buy: 1,
            sell: 5,
            opportunity: 10,
            offers: 6,
            demands: 4,
            leads: 20,
            deals: 12,
            risk: 'Very Low',
            action: 'View',
            status: 'Inactive',
            progress: 89,
        },
    ];

    const productColumns = [
        {
            header: 'Product Info',
            accessorKey: 'name',
            enableSorting: true,
            size: 230,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    {/* Product Name */}
                    <div className="flex items-start gap-2">
                        <Avatar src={IndiaIcon} size="sm" />
                        <div>
                            <h6 className="text-xs mb-0.5">Product Name</h6>
                            <span className="text-xs">
                                <Tag className={statusColor[props.row.original.status]}> {props.row.original.status}</Tag>
                            </span>
                        </div>
                    </div>
                    {/* <span >Status: {props.row.original.status}</span> */}
                </div>
            )
        },
        {
            header: 'Brand/Category',
            accessorKey: 'brand',
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Brands:</h6> {props.row.original.brands?.map(val => {
                            return <span>{val}, </span>
                        })}
                    </span>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Category:</h6> {props.row.original.category}
                    </span>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Subcategory:</h6> {props.row.original.interested}
                    </span>
                </div>
            )
        },
        {
            header: 'Walls', accessorKey: 'wallCount',
            cell: props => (
                <div>
                    <Tooltip title="Buy: 13 | Sell: 12 | Total: 25 " className='text-xs'>
                        <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            13 | 12 | 25
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Opportunities', accessorKey: 'opportunity',
            size: 160,
            cell: props => (
                <div>
                    <Tooltip title="Offers: 34 | Demands: 12 | Total: 46" className='text-xs'>
                        <div className=' bg-orange-100 text-orange-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            34 | 12 | 46
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Leads', accessorKey: 'leads',
            size: 180,
            cell: props => (
                <div>
                    <Tooltip title="Success: 34 | Lost: 12 | Total: 46" className='text-xs'>
                        <div className=' bg-green-100 text-green-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            34 | 12 | 46
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Ratio', accessorKey: 'trustRatio',
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <Tag className="flex gap-1 text-[10px]">
                        <h6 className="text-[10px]">Success:</h6> {props.row.original.successRatio}
                    </Tag>
                    <Tag className="flex gap-1 text-[10px] flex-wrap">
                        <h6 className="text-[10px]">Engagement:</h6> 80%
                    </Tag>
                </div>
            )
        },

    ]

    const wallListingData = [
        {
            name: 'Global Tech Supplies',
            type: 'Manufacture',
            interested: 'Sell',
            category: 'Electronics',
            brands: ['Apple', 'Samsung'],
            country: 'India',
            trustRatio: '87%',
            successRatio: '87%',
            noOfMember: 12,
            wallCount: 3,
            success: 3,
            lost: 4,
            buy: 2,
            sell: 1,
            opportunity: 7,
            offers: 3,
            demands: 4,
            leads: 14,
            deals: 6,
            risk: 'Low',
            action: 'View',
            status: 'Active',
            progress: 85,
        },
        {
            name: 'Nova Agro Imports',
            type: 'Distributor',
            interested: 'Buy',
            category: 'Agriculture',
            brands: ['Bayer', 'Syngenta'],
            country: 'Brazil',
            trustRatio: '92%',
            successRatio: '90%',
            noOfMember: 8,
            wallCount: 2,
            success: 5,
            lost: 1,
            buy: 3,
            sell: 0,
            opportunity: 6,
            offers: 2,
            demands: 4,
            leads: 11,
            deals: 7,
            risk: 'Very Low',
            action: 'View',
            status: 'Active',
            progress: 78,
        },
        {
            name: 'IronShield Industries',
            type: 'Manufacturer',
            interested: 'Sell',
            category: 'Metals',
            brands: ['JSW', 'Tata Steel'],
            country: 'India',
            trustRatio: '80%',
            successRatio: '76%',
            noOfMember: 15,
            wallCount: 4,
            success: 6,
            lost: 3,
            buy: 0,
            sell: 4,
            opportunity: 9,
            offers: 5,
            demands: 4,
            leads: 18,
            deals: 9,
            risk: 'Medium',
            action: 'View',
            status: 'Pending',
            progress: 68,
        },
        {
            name: 'Medico HealthCare Pvt Ltd',
            type: 'Retailer',
            interested: 'Buy',
            category: 'Pharmaceuticals',
            brands: ['Cipla', 'Dr. Reddy'],
            country: 'India',
            trustRatio: '85%',
            successRatio: '82%',
            noOfMember: 6,
            wallCount: 1,
            success: 2,
            lost: 2,
            buy: 2,
            sell: 0,
            opportunity: 4,
            offers: 1,
            demands: 3,
            leads: 6,
            deals: 3,
            risk: 'Low',
            action: 'View',
            status: 'Active',
            progress: 71,
        },
        {
            name: 'AutoTech Exporters Ltd',
            type: 'Exporter',
            interested: 'Sell',
            category: 'Automobile Parts',
            brands: ['Bosch', 'Denso'],
            country: 'Germany',
            trustRatio: '90%',
            successRatio: '88%',
            noOfMember: 10,
            wallCount: 2,
            success: 7,
            lost: 2,
            buy: 1,
            sell: 5,
            opportunity: 10,
            offers: 6,
            demands: 4,
            leads: 20,
            deals: 12,
            risk: 'Very Low',
            action: 'View',
            status: 'Inactive',
            progress: 89,
        },
    ];

    const wallListingColumns = [
        {
            header: 'Member Info',
            accessorKey: 'name',
            enableSorting: true,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <h6 className="text-xs">{props.getValue()}</h6>
                    <span className="text-xs flex">
                        <h6 className="text-xs"></h6> ({"XYZ Company Name"})
                    </span>
                    <span className="text-xs flex gap-1">9582850192</span>
                    <span className="text-xs flex gap-1">xyz@gmail.com</span>
                </div>
            )
        },
        {
            header: 'Frequent Walls',
            accessorKey: 'brand',
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <span className="text-xs flex gap-1">
                        <b className="text-xs text-black dark:text-white font-semibold">Brands:</b> {props.row.original.brands?.map(val => {
                            return <span>{val}, </span>
                        })}
                    </span>
                    <span className="text-xs flex gap-1">
                        <b className="text-xs text-black dark:text-white font-semibold">Category:</b> {props.row.original.category}
                    </span>
                    <span className="text-xs flex gap-1">
                        <b className="text-xs text-black dark:text-white font-semibold">Subcategory:</b> {props.row.original.interested}
                    </span>
                    <span className="text-xs  gap-1">
                        <b className="text-xs text-black dark:text-white font-semibold">Products: </b>Iphone 14, Samsung s25
                    </span>
                </div>
            )
        },
        {
            header: 'Count', accessorKey: 'wallCount',
            cell: props => (
                <div>
                    <Tooltip title="Buy: 13 | Sell: 12 | Total: 25 " className='text-xs'>
                        <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            13 | 12 | 25
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Qty', accessorKey: 'wallCount',
            cell: props => (
                <div>
                    <Tooltip title="Buy: 23 | Sell: 8 | Total: 31" className='text-xs'>
                        <div className=' bg-stone-200 text-stone-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            23 | 8 | 31
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Opportunity', accessorKey: 'verified',
            cell: props => (
                <div className='flex flex-col gap-2.5'>
                    <div className='flex gap-1 items-center mb-0.5'>
                        <Tooltip title="Matched: 18 | Total Walls: 31" className='text-xs'>
                            <div className=' bg-violet-100 text-violet-600 rounded-md p-1.5 text-xs 
                                shadow-md inline'>
                                18 | 27
                            </div>
                        </Tooltip>
                    </div>
                    <div className='flex gap-1 items-center mb-0.5'>
                        <Tooltip title="Offers: 18 | Demands: 31" className='text-xs'>
                            <div className=' bg-pink-100 text-pink-600 rounded-md p-1.5 text-xs 
                                shadow-md inline'>
                                18 | 27
                            </div>
                        </Tooltip>
                    </div>
                    <div className='flex gap-1 items-center mb-0.5'>
                        <Tooltip title="Leads: 18 | Deals: 31" className='text-xs'>
                            <div className=' bg-green-100 text-green-600 rounded-md p-1.5 text-xs 
                                shadow-md inline'>
                                18 | 27
                            </div>
                        </Tooltip>
                    </div>
                </div>
            )
        },
        {
            header: 'Connect', accessorKey: 'leads',
            cell: props => (
                <div className='flex flex-col gap-0.5'>
                    <Tooltip title="Buy: 23 | Sell: 8 | Total Enquiry: 31" className='text-xs'>
                        <div className=' bg-orange-100 text-orange-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            23 | 8 | 31
                        </div>
                    </Tooltip>
                    <div className='flex gap-2 items-center mt-3 text-orange-400'>
                        <Tooltip title="Total Shares: 12" wrapperClass="flex gap-1 text-xs">
                            <IoMdShare className="text-base" />
                            <span>12</span>
                        </Tooltip>
                        <Tooltip title="Total Bookmarks: 8" wrapperClass="flex flex-row gap-1 text-xs">
                            <FaBookmark className="text-base" />
                            <span>8</span>
                        </Tooltip>
                    </div>
                </div>
            )
        },
        {
            header: 'Ratio', accessorKey: 'trustRatio',
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <Tag className="flex gap-1 text-xs flex-wrap">
                        <h6 className="text-xs">Approach:</h6> 80%
                    </Tag>
                    <Tag className="flex gap-1 text-xs">
                        <h6 className="text-xs">Conversion:</h6> {props.row.original.successRatio}
                    </Tag>
                    <span className="flex gap-1 text-xs flex-wrap">
                        Minimum Buying strong seller profile, focus on selling
                    </span>
                </div>
            )
        },

    ]
    const partnerColumns = [
        {
            header: 'Partner Info',
            accessorKey: 'name',
            enableSorting: true,
            size: 230,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <h6 className="text-xs">{props.getValue()}</h6>
                    <span className="text-xs flex">
                        <h6 className="text-xs"></h6> ({"XYZ Company Name"})
                    </span>
                    <span className="text-xs flex gap-1">{props.row.original.type}</span>
                    <span className="text-xs flex gap-1">xyz@gmail.com</span>
                    <span className="text-xs flex gap-1">India</span>
                </div>
            )
        },
        {
            header: 'Preferences',
            accessorKey: 'brands',
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Brands:</h6> {props.row.original.brands?.map(val => {
                            return <span>{val}, </span>
                        })}
                    </span>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Category:</h6> {props.row.original.category}
                    </span>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Interested:</h6> {props.row.original.interested}
                    </span>
                </div>
            )
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: props => (
                <span className="text-xs">
                    <Tag className={statusColor[props.row.original.status]}> {props.row.original.status}</Tag>
                </span>
            )
        },
        {
            header: 'Verified',
            accessorKey: 'status',
            size: 100,
            cell: props => (
                <span className="text-xs">
                    <Tag className={statusColor[props.row.original.status]}> Yes</Tag>
                </span>
            )
        },
        {
            header: 'Team',
            accessorKey: 'status',
            size: 80,
            cell: props => (
                <span className="text-xs flex items-center justify-center rounded-full bg-blue-100 
                text-blue-600 font-semibold w-8 h-8">7</span>
            )
        },
        {
            header: 'Joined Date',
            accessorKey: 'status',
            cell: props => (
                <span className="text-xs">10 May, 2025</span>
            )
        },
        {
            header: 'Score', accessorKey: 'trustRatio',
            size: 180,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <Tag className="flex gap-1 text-[10px] flex-wrap">
                        <h6 className="text-[10px]">Trust Score:</h6> 80%
                    </Tag>
                    <span className="flex gap-1 text-xs flex-wrap">
                        Minimum Buying strong seller profile, focus on selling
                    </span>
                </div>
            )
        },

    ]
    const teamColumns = [
        {
            header: 'Team Info',
            accessorKey: 'name',
            enableSorting: true,
            size: 190,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <div className='flex gap-2 items-center'>
                        <Tooltip title="Birthday : 23 May">
                            <BsCake className=" bg-red-200 h-5 w-5 p-1 text-red-600 rounded-sm " />
                        </Tooltip>
                        <h6 className="text-xs">Raman Ojha</h6>
                    </div>
                    <span className="text-xs flex">
                        <h6 className="text-xs"></h6> {"IT Department"}
                    </span>
                    <span className="text-xs flex gap-1">Frontend Developer</span>
                    <span className="text-xs flex gap-1">xyz@gmail.com</span>
                    <span className="text-xs flex gap-1">+91 8923572494</span>
                </div>
            )
        },
        {
            header: 'Assigned',
            accessorKey: 'brands',
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Brands:</h6> {props.row.original.brands?.map(val => {
                            return <span>{val}, </span>
                        })}
                    </span>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Category:</h6> {props.row.original.category}
                    </span>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Subcategory:</h6> {props.row.original.subcategory}
                    </span>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Country:</h6> {props.row.original.country}
                    </span>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Product:</h6> {props.row.original.product}
                    </span>
                </div>
            )
        },
        {
            header: 'Status',
            accessorKey: 'status',
            size: 110,
            cell: props => (
                <span className="text-xs">
                    <span className="text-xs">
                        <h6 className="text-xs mt-1">Joined:</h6> 10 Mar, 2025
                    </span>
                    <br />
                    <Tag className={statusColor[props.row.original.status]}> {props.row.original.status}</Tag>
                </span>
            )
        },
        {
            header: 'Activity',
            accessorKey: 'status',
            size: 150,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <span className="text-xs mb-1">
                        <h6 className="text-xs">Last Active : </h6> 12 Mar, 2024 10:00 PM
                    </span>
                    <Tooltip title="Present: 24 | Leaves: 2" className='text-xs'>
                        <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            P: 24 | L: 2
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Performance',
            accessorKey: 'status',
            size: 150,
            cell: props => (
                <div className='flex flex-col gap-3'>
                    <div>
                        <Tooltip title="Completed: 23 | Pending: 4" className='text-xs'>
                            <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs 
                                shadow-md inline'>
                                Task : 23 | 4
                            </div>
                        </Tooltip>
                    </div>
                    <div>
                        <Tooltip title="Buy: 12 | Sell: 11 | Total: 23" className='text-xs'>
                            <div className=' bg-pink-100 text-pink-600 rounded-md p-1.5 text-xs 
                                shadow-md inline'>
                                Listing : 12 | 11 | 23
                            </div>
                        </Tooltip>
                    </div>
                    <div>
                        <Tooltip title="Offer: 12 | Demand: 11 | Total: 23" className='text-xs'>
                            <div className=' bg-violet-100 text-violet-600 rounded-md p-1.5 text-xs 
                                shadow-md inline'>
                                O & D : 12 | 11 | 23
                            </div>
                        </Tooltip>
                    </div>
                    <div>
                        <Tooltip title="Success: 4 | Lost: 10 | Total: 14" className='text-xs'>
                            <div className=' bg-green-100 text-green-600 rounded-md p-1.5 text-xs 
                                shadow-md inline'>
                                Leads : 4 | 10 | 14
                            </div>
                        </Tooltip>
                    </div>
                    <Tag className="text-xs flex flex-wrap text-[10px]">
                        <h6 className="text-[10px]">Performance Score : </h6>
                        <span> 79%</span>
                    </Tag>
                </div>
            )
        },

    ]

    useEffect(() => {
        if (!sideNavCollapse && isFirstRender.current) {
            isFirstRender.current = false
            return
        }

        if (!isFirstRender.current) {
            window.dispatchEvent(new Event('resize'))
        }
    }, [sideNavCollapse])

    return (
        <Card>
            <div className="flex items-center justify-between">
                <h4>Overview</h4>
                <div className='flex gap-2'>
                    <Select
                        className="w-auto"
                        size="sm"
                        defaultValue={{ label: "All Country", value: "All Country" }}
                        options={[
                            { label: "All Country", value: "AllCountry" },
                            {
                                label: (
                                    <div className='flex items-center gap-2 mr-6'>
                                        <img src="/img/countries/IN.png" className='h-6 w-6' />
                                        <span>India</span>
                                    </div>
                                ),
                                value: "India"
                            },
                            {
                                label: (
                                    <div className='flex items-center gap-2 mr-6'>
                                        <img src="/img/countries/UK.png" className='h-6 w-6' />
                                        <span>UK</span>
                                    </div>
                                ),
                                value: "UK"
                            },
                            {
                                label: (
                                    <div className='flex items-center gap-2 mr-6'>
                                        <img src="/img/countries/US.png" className='h-6 w-6' />
                                        <span>US</span>
                                    </div>
                                ),
                                value: "US"
                            },
                        ]}
                    />
                    <Select
                        className="min-w-[140px]"
                        size="sm"
                        defaultValue={{ label: "All Category", value: "All" }}
                        options={[
                            { label: "All Category", value: "AllCategory" },
                            { label: "Electronics", value: "Electronics" },
                            { label: "Engineering", value: "Engineering" },
                            { label: "Plastic", value: "Plastic" },
                            { label: "Food", value: "Food" },
                        ]}
                    />
                </div>
            </div>

            <section className='block  gap-4 w-full'>
                <section >
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-2 rounded-2xl py-3 mt-4 ">
                        <StatisticCard
                            title="Opportunity"
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value="12"
                                    prefix={''}
                                    thousandSeparator={true}
                                />
                            }
                            iconClass="bg-sky-200"
                            icon={<MdOutlineBusinessCenter className='h-5' />}
                            label="Opportunity"
                            active={selectedCategory === 'Opportunity'}
                            onClick={() => setSelectedCategory('Opportunity')}
                            colorClass="bg-red-100"
                            activeBgColor="bg-red-200"
                            iconBg="bg-red-400"
                        />
                        <StatisticCard
                            title="Leads"
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value="12"
                                    prefix={''}
                                    thousandSeparator={true}
                                />
                            }
                            iconClass="bg-emerald-200"
                            icon={<TbShoppingBagCheck className='h-5' />}
                            label="Leads"
                            active={selectedCategory === 'Leads'}
                            onClick={() => setSelectedCategory('Leads')}
                            colorClass="bg-green-100"
                            activeBgColor="bg-green-200"
                            iconBg="bg-green-400"
                        />
                        {/* <StatisticCard
                            title="Leads"
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value="68"
                                    thousandSeparator={true}
                                />
                            }
                            iconClass="bg-emerald-200"
                            icon={<TbShoppingBagCheck className='h-5' />}
                            label="Leads"
                            active={selectedCategory === 'Leads'}
                            onClick={() => setSelectedCategory('Leads')}
                            colorClass="bg-green-100"
                            activeBgColor="bg-green-200"
                            iconBg="bg-green-400"
                        /> */}
                        {/* <StatisticCard
                            title="Accounts"
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value="12"
                                    prefix={''}
                                    thousandSeparator={true}
                                />
                            }
                            iconClass="bg-purple-200"
                            icon={<TbEye className='h-5' />}
                            label="Accounts"
                            active={selectedCategory === 'Accounts'}
                            onClick={() => setSelectedCategory('Accounts')}
                            colorClass="bg-blue-100"
                            activeBgColor="bg-blue-200"
                            iconBg="bg-blue-400"
                        /> */}
                        {/* <StatisticCard
                            title="Tasks"
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value="23"
                                    thousandSeparator={true}
                                />
                            }
                            // growShrink={data.totalOrder[selectedPeriod].growShrink}
                            iconClass="bg-emerald-200"
                            icon={<TbShoppingBagCheck className='h-5' />}
                            label="Tasks"
                            active={selectedCategory === 'Tasks'}
                            // compareFrom={data.totalProfit[selectedPeriod].comparePeriod}
                            onClick={() => setSelectedCategory('Tasks')}
                            colorClass="bg-pink-100"
                            activeBgColor="bg-pink-200"
                            iconBg="bg-pink-400"
                        /> */}
                        {/* <StatisticCard
                            title="Web Analytics"
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value="12"
                                    prefix={''}
                                    thousandSeparator={true}
                                />
                            }
                            // growShrink={data.totalProfit[selectedPeriod].growShrink}
                            iconClass="bg-sky-200"
                            icon={<TbCoin className='h-5' />}
                            label="Web Analytics"
                            active={selectedCategory === 'Web Analytics'}
                            // compareFrom={data.totalProfit[selectedPeriod].comparePeriod}
                            onClick={() => setSelectedCategory('Web Analytics')}
                            colorClass="bg-violet-100"
                            activeBgColor="bg-violet-200"
                            iconBg="bg-violet-400"
                        />
                        <StatisticCard
                            title="Marketing"
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value="12"
                                    prefix={''}
                                    thousandSeparator={true}
                                />
                            }
                            // growShrink={data.totalImpression[selectedPeriod].growShrink}
                            iconClass="bg-purple-200"
                            icon={<TbEye className='h-5' />}
                            label="Marketing"
                            active={selectedCategory === 'Marketing'}
                            // compareFrom={data.totalProfit[selectedPeriod].comparePeriod}
                            onClick={() => setSelectedCategory('Marketing')}
                            colorClass="bg-orange-100"
                            activeBgColor="bg-orange-200"
                            iconBg="bg-orange-400"
                        /> */}
                    </div>
                    <Card bodyClass='px-4 py-3'>
                        <div className="flex items-center justify-between">
                            <h6 className='capitalize'>{selectedCategory} summary</h6>
                            <Select
                                className="min-w-[140px]"
                                size="sm"
                                defaultValue={{ label: "All", value: "All" }}
                                options={[
                                    { label: "All", value: "All" },
                                    { label: "Today", value: "Today" },
                                    { label: "Weekly", value: "Weekly" },
                                    { label: "Monthly", value: "Monthly" },
                                    { label: "3 Months", value: "3 Months" },
                                    { label: "6 Months", value: "6 Months" },
                                    { label: "This Year", value: "This Year" },
                                ]}
                            />
                        </div>

                        {/* Opportunity Starts */}
                        {selectedCategory === 'Opportunity' && (
                            <div>
                                <div className='lg:flex  gap-2 justify-between mt-4'>
                                    <div className='whitespace-nowrap pr-4 border-r border-r-gray-200'>
                                        <span className=' font-semibold text-black dark:text-white'>Growth Rate</span>
                                        <div className='flex gap-1 items-center'>
                                            <h3>22%</h3>
                                            <span className='text-green-600 text-lg'><FaArrowUpLong /></span>
                                        </div>
                                    </div>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
                                        <Bar
                                            field="Total"
                                            percent={20}
                                            color='text-[#6610f2]'
                                            className="bg-[#6610f2] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Active"
                                            percent={20}
                                            color='text-[#28a745]'
                                            className="bg-[#28a745] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Inactive"
                                            percent={28}
                                            color='text-[#6c757d]'
                                            className="bg-[#6c757d] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Converted"
                                            percent={32}
                                            color='text-[#ffc107]'
                                            className="bg-[#ffc107] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Lost"
                                            percent={20}
                                            color='text-[#e74c3c]'
                                            className="bg-[#e74c3c] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Dropped"
                                            percent={20}
                                            color='text-[#2ecc71]'
                                            className="bg-[#2ecc71] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Offers"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Demands"
                                            percent={20}
                                            color='text-[#fd7e14]'
                                            className="bg-[#fd7e14] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Avg Conversion"
                                            percent={20}
                                            color='text-[#20c997]'
                                            className="bg-[#20c997] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Avg Score"
                                            percent={20}
                                            color='text-gray-500'
                                            className="bg-gray-500 dark:opacity-70"
                                        />
                                    </div>
                                </div>

                                <div className='mt-8 block  gap-2'>
                                    <div className='flex justify-between items-center'>
                                        <h6 className='mb-6'>Opportunity Leaderboard</h6>
                                        <div className='flex gap-2 items-center text-sm'>
                                            <h6 className='text-sm'>Match Score</h6>
                                            {/* <Select
                                                className="min-w-[140px]"
                                                size="sm"
                                                defaultValue={{ label: "All", value: "All" }}
                                                options={[
                                                    { label: "75% - 100%", value: "75-100" },
                                                    { label: "50% - 74%", value: "50-74" },
                                                    { label: "25% - 49%", value: "25-49" },
                                                    { label: "0% - 24%", value: "0-24" },
                                                ]}
                                            /> */}
                                        </div>
                                    </div>
                                    {/* <DataTable1
                                        columns={opportunitiesColumns}
                                        data={opportunitiesData}
                                        onExpandedChange={() => setExpanded}
                                        getRowCanExpand={() => true}
                                        renderSubComponent={({ row }) => <ExpandedOpportunityDetails row={row} />}
                                    /> */}
                                    <Opportunities isDashboard={true} />

                                    {/* Note :- Success (%) = ( Success / Total Leads ) * 100 */}
                                    {/* Note :- Trust  = ( Company Activity, response rate and verification */}
                                </div>
                            </div>

                        )}
                        {/* Opportunity Ends */}

                        {/* Leads  */}
                        {selectedCategory === 'Leads' && (
                            <div>
                                <div className='lg:flex gap-2 justify-between mt-4'>
                                    <div className='whitespace-nowrap pr-4 border-r border-r-gray-200'>
                                        <span className=' font-semibold text-black dark:text-white'>Growth Rate</span>
                                        <div className='flex gap-1 items-center'>
                                            <h3>2%</h3>
                                            <span className='text-red-600 text-lg'><FaArrowDownLong /></span>
                                        </div>
                                    </div>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
                                        <Bar
                                            field="Total"
                                            percent={20}
                                            color='text-[#6610f2]'
                                            className="bg-[#6610f2] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Recently"
                                            percent={20}
                                            color='text-[#2ecc71]'
                                            className="bg-[#2ecc71] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Completed"
                                            percent={20}
                                            color='text-[#e74c3c]'
                                            className="bg-[#e74c3c] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Cancelled"
                                            percent={20}
                                            color='text-[#28a745]'
                                            className="bg-[#28a745] dark:opacity-70"
                                        />
                                        <Bar
                                            field="In-Progress"
                                            percent={28}
                                            color='text-[#6c757d]'
                                            className="bg-[#6c757d] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Converted"
                                            percent={32}
                                            color='text-[#ffc107]'
                                            className="bg-[#ffc107] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Follow-ups"
                                            percent={20}
                                            color='text-[#fd7e14]'
                                            className="bg-[#fd7e14] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Top Products"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Top Category"
                                            percent={20}
                                            color='text-gray-500'
                                            className="bg-gray-500 dark:opacity-70"
                                        />
                                        <Bar
                                            field="Top Brands"
                                            percent={20}
                                            color="text-[#6610f2]"
                                            className="bg-[#6610f2] dark:opacity-70"
                                        />
                                    </div>
                                </div>

                                <div className='mt-8 block  gap-2'>
                                    <div className='flex justify-between items-center'>
                                        <h6 className='mb-6'>Leads Leaderboard</h6>
                                        <div className='flex gap-2 items-center text-sm'>
                                            <h6 className='text-sm'>Conversion Rate</h6>
                                            {/* <Select
                                                className="min-w-[140px]"
                                                size="sm"
                                                defaultValue={{ label: "All", value: "All" }}
                                                options={[
                                                    { label: "75% - 100%", value: "75-100" },
                                                    { label: "50% - 74%", value: "50-74" },
                                                    { label: "25% - 49%", value: "25-49" },
                                                    { label: "0% - 24%", value: "0-24" },
                                                ]}
                                            /> */}
                                        </div>
                                    </div>
                                    {/* <DataTable
                                        columns={memberColumns}
                                        data={memberData}
                                    // loading={isLoading}
                                    /> */}
                                    <Leads isDashboard={true} />

                                    {/* Note :- Success (%) = ( Success / Total Leads ) * 100 */}
                                    {/* Note :- Trust  = ( Company Activity, response rate and verification */}
                                </div>
                            </div>
                        )}
                        {/* Leads Ends */}

                        {/* Accounts  */}
                        {selectedCategory === 'Accounts' && (
                            <div>
                                {/* <div className='lg:flex gap-2 justify-between mt-4'>
                                    <div className='whitespace-nowrap pr-4 border-r border-r-gray-200'>
                                        <span className=' font-semibold text-black dark:text-white'>Growth Rate</span>
                                        <div className='flex gap-1 items-center'>
                                            <h3>17%</h3>
                                            <span className='text-green-600 text-lg'><FaArrowUpLong /></span>
                                        </div>
                                    </div>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
                                        <Bar
                                            field="Total"
                                            percent={20}
                                            color='text-[#6610f2]'
                                            className="bg-[#6610f2] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Active"
                                            percent={20}
                                            color='text-[#28a745]'
                                            className="bg-[#28a745] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Inactive"
                                            percent={28}
                                            color='text-[#6c757d]'
                                            className="bg-[#6c757d] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Categories(3/5)"
                                            percent={20}
                                            color='text-[#2ecc71]'
                                            className="bg-[#2ecc71] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Brands(2/6)"
                                            percent={20}
                                            color='text-[#e74c3c]'
                                            className="bg-[#e74c3c] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Wall"
                                            percent={32}
                                            color='text-[#ffc107]'
                                            className="bg-[#ffc107] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Leads"
                                            percent={20}
                                            color='text-[#fd7e14]'
                                            className="bg-[#fd7e14] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Opportunity"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Activity Score"
                                            percent={20}
                                            color='text-gray-500'
                                            className="bg-gray-500 dark:opacity-70"
                                        />
                                    </div>
                                </div>

                                <div className='mt-8 block  gap-2'>
                                    <div className='flex justify-between items-center'>
                                        <h6 className='mb-6'>Products Leaderboard</h6>
                                        <div className='flex gap-2 items-center text-sm'>
                                            <h6 className='text-sm'>Engagement Score</h6>
                                            <Select
                                                className="min-w-[140px]"
                                                size="sm"
                                                defaultValue={{ label: "All", value: "All" }}
                                                options={[
                                                    { label: "75% - 100%", value: "75-100" },
                                                    { label: "50% - 74%", value: "50-74" },
                                                    { label: "25% - 49%", value: "25-49" },
                                                    { label: "0% - 24%", value: "0-24" },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                    <DataTable
                                        columns={productColumns}
                                        data={productData}
                                    />

                                </div> */}
                            </div>
                        )}
                        {/* Accounts Ends */}

                        {/* Tasks  */}
                        {selectedCategory === 'Tasks' && (
                            <div>
                                {/* <div className='lg:flex gap-2 justify-between mt-4'>
                                    <div className='whitespace-nowrap pr-4 border-r border-r-gray-200'>
                                        <span className=' font-semibold text-black dark:text-white'>Growth Rate</span>
                                        <div className='flex gap-1 items-center'>
                                            <h3>13%</h3>
                                            <span className='text-green-600 text-lg'><FaArrowUpLong /></span>
                                        </div>
                                    </div>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
                                        <Bar
                                            field="Total"
                                            percent={20}
                                            color='text-[#6610f2]'
                                            className="bg-[#6610f2] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Verified"
                                            percent={20}
                                            color='text-[#6610f2]'
                                            className="bg-[#6610f2] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Active"
                                            percent={20}
                                            color='text-[#2ecc71]'
                                            className="bg-[#2ecc71] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Inactive"
                                            percent={20}
                                            color='text-[#e74c3c]'
                                            className="bg-[#e74c3c] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Pending"
                                            percent={32}
                                            color='text-[#ffc107]'
                                            className="bg-[#ffc107] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Blocked"
                                            percent={20}
                                            color='text-[#fd7e14]'
                                            className="bg-[#fd7e14] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Category"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Type"
                                            percent={20}
                                            color='text-[#28a745]'
                                            className="bg-[#28a745] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Recent"
                                            percent={28}
                                            color='text-[#6c757d]'
                                            className="bg-[#6c757d] dark:opacity-70"
                                        />
                                        <Bar
                                            field="International"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="National"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                    </div>
                                </div>

                                <div className='mt-8 block  gap-2'>
                                    <div className='flex justify-between items-center'>
                                        <h6 className='mb-6'>Partners Leaderboard</h6>
                                        <div className='flex gap-2 items-center text-sm'>
                                            <h6 className='text-sm'>Trust Score</h6>
                                            <Select
                                                className="min-w-[140px]"
                                                size="sm"
                                                defaultValue={{ label: "All", value: "All" }}
                                                options={[
                                                    { label: "75% - 100%", value: "75-100" },
                                                    { label: "50% - 74%", value: "50-74" },
                                                    { label: "25% - 49%", value: "25-49" },
                                                    { label: "0% - 24%", value: "0-24" },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                    <DataTable
                                        columns={partnerColumns}
                                        data={wallListingData}
                                    />

                                </div> */}
                            </div>
                        )}
                        {/* Tasks */}

                        {/* Web Analytics  */}
                        {selectedCategory === 'Web Analytics' && (
                            <div>
                                {/* <div className='lg:flex gap-2 justify-between mt-4'>
                                    <div className='whitespace-nowrap pr-4 border-r border-r-gray-200'>
                                        <span className=' font-semibold text-black dark:text-white'>Growth Rate</span>
                                        <div className='flex gap-1 items-center'>
                                            <h3>34%</h3>
                                            <span className='text-green-600 text-lg'><FaArrowUpLong /></span>
                                        </div>
                                    </div>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
                                        <Bar
                                            field="Total"
                                            percent={20}
                                            color='text-[#6610f2]'
                                            className="bg-[#6610f2] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Buy"
                                            percent={20}
                                            color='text-[#28a745]'
                                            className="bg-[#28a745] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Sell"
                                            percent={28}
                                            color='text-[#6c757d]'
                                            className="bg-[#6c757d] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Active"
                                            percent={20}
                                            color='text-[#2ecc71]'
                                            className="bg-[#2ecc71] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Inactive"
                                            percent={20}
                                            color='text-[#e74c3c]'
                                            className="bg-[#e74c3c] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Pending"
                                            percent={32}
                                            color='text-[#ffc107]'
                                            className="bg-[#ffc107] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Reject"
                                            percent={20}
                                            color='text-[#fd7e14]'
                                            className="bg-[#fd7e14] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Category"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Subcat"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Brand"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Product"
                                            percent={20}
                                            color='text-gray-500'
                                            className="bg-gray-500 dark:opacity-70"
                                        />
                                        <Bar
                                            field="Members"
                                            percent={20}
                                            color='text-gray-500'
                                            className="bg-gray-500 dark:opacity-70"
                                        />
                                    </div>
                                </div>

                                <div className='mt-8 block  gap-2'>
                                    <div className='flex justify-between items-center'>
                                        <h6 className='mb-6'>Wall Listings Leaderboard</h6>
                                        <div className='flex gap-2 items-center text-sm'>
                                            <h6 className='text-sm'>Conversion Ratio</h6>
                                            <Select
                                                className="min-w-[140px]"
                                                size="sm"
                                                defaultValue={{ label: "All", value: "All" }}
                                                options={[
                                                    { label: "High", value: "" },
                                                    { label: "Medium", value: "" },
                                                    { label: "Low", value: "" },
                                                    { label: "High Buyers", value: "" },
                                                    { label: "Pure Seller", value: "" },
                                                    { label: "Balanced", value: "" },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                    <DataTable
                                        columns={wallListingColumns}
                                        data={wallListingData}
                                    />

                                </div> */}
                            </div>
                        )}
                        {/* Web Analytics Ends */}

                        {/* Marketing  */}
                        {selectedCategory === 'Marketing' && (
                            <div>
                                {/* <div className='lg:flex gap-2 justify-between mt-4'>
                                    <div className='whitespace-nowrap pr-4 border-r border-r-gray-200'>
                                        <span className=' font-semibold text-black dark:text-white'>Growth Rate</span>
                                        <div className='flex gap-1 items-center'>
                                            <h3>17%</h3>
                                            <span className='text-green-600 text-lg'><FaArrowUpLong /></span>
                                        </div>
                                    </div>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
                                        <Bar
                                            field="Total"
                                            percent={20}
                                            color='text-[#6610f2]'
                                            className="bg-[#6610f2] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Active"
                                            percent={20}
                                            color='text-[#2ecc71]'
                                            className="bg-[#2ecc71] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Inactive"
                                            percent={20}
                                            color='text-[#e74c3c]'
                                            className="bg-[#e74c3c] dark:opacity-70"
                                        />
                                        <Bar
                                            field="On Leave"
                                            percent={32}
                                            color='text-[#ffc107]'
                                            className="bg-[#ffc107] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Unapproved"
                                            percent={20}
                                            color='text-[#fd7e14]'
                                            className="bg-[#fd7e14] dark:opacity-70"
                                        />
                                        <Bar
                                            field="New Joinee"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Resigned"
                                            percent={20}
                                            color='text-[#28a745]'
                                            className="bg-[#28a745] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Departments"
                                            percent={28}
                                            color='text-[#6c757d]'
                                            className="bg-[#6c757d] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Task"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Performance"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                    </div>
                                </div>

                                <div className='mt-8 block  gap-2'>
                                    <div className='flex justify-between items-center'>
                                        <h6 className='mb-6'>Team Leaderboard</h6>
                                        <div className='flex gap-2 items-center text-sm'>
                                            <h6 className='text-sm'>Performance Score</h6>
                                            <Select
                                                className="min-w-[140px]"
                                                size="sm"
                                                defaultValue={{ label: "All", value: "All" }}
                                                options={[
                                                    { label: "75% - 100%", value: "75-100" },
                                                    { label: "50% - 74%", value: "50-74" },
                                                    { label: "25% - 49%", value: "25-49" },
                                                    { label: "0% - 24%", value: "0-24" },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                    <DataTable
                                        columns={teamColumns}
                                        data={wallListingData}
                                    />
                                </div> */}
                            </div>
                        )}
                        {/* Marketing */}


                    </Card>
                </section>

            </section>
        </Card>
    )
}

export default Overview
