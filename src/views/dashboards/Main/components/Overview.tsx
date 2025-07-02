import { DataTable, DebouceInput } from '@/components/shared'
import { Avatar, Dialog, Table, Tag, Tooltip } from '@/components/ui'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Td from '@/components/ui/Table/Td'
import Tr from '@/components/ui/Table/Tr'
import { COLOR_1, COLOR_2, COLOR_4 } from '@/constants/chart.constant'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { getCompanyAction, getMemberAction, getpartnerAction, getProductsAction } from '@/reduxtool/master/middleware'
import { useAppDispatch } from '@/reduxtool/store'
import { useThemeStore } from '@/store/themeStore'
import classNames from '@/utils/classNames'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { BsCake } from 'react-icons/bs'
import { FaBookmark } from 'react-icons/fa'
import { FaArrowDownLong, FaArrowUpLong } from 'react-icons/fa6'
import { IoMdShare } from 'react-icons/io'
import { MdCancel, MdCheckCircle, MdOutlineBusinessCenter } from 'react-icons/md'
import { TbBox, TbCube3dSphere, TbHeartHandshake, TbInfoCircle, TbSearch, TbUserCircle, TbUsersGroup } from 'react-icons/tb'
import { NumericFormat } from 'react-number-format'
import { useSelector } from 'react-redux'
import type { Period, StatisticCategory, StatisticData } from '../types'

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

const Overview = ({ data }: StatisticGroupsProps) => {
    const [selectedCategory, setSelectedCategory] = useState<StatisticCategory>('Companies')

    const [selectedPeriod, setSelectedPeriod] = useState<Period>('thisMonth')

    const sideNavCollapse = useThemeStore(
        (state) => state.layout.sideNavCollapse,
    )

    const dispatch = useAppDispatch();
    const { CompanyData, MemberData, ProductsData, partnerData } = useSelector(masterSelector);
    useEffect(() => {
        dispatch(getCompanyAction());
        dispatch(getMemberAction());
        dispatch(getProductsAction());
        dispatch(getpartnerAction());
    }, [dispatch]);


    console.log(MemberData, "MemberData");


    const statusColor = {
        Active: "bg-green-200 text-green-600 ",
        Verified: "bg-blue-200 text-blue-600",
        Pending: "bg-orange-200 text-orange-600",
        Inactive: "bg-red-200 text-red-600",
    }

    const isFirstRender = useRef(true)


    // --- Status Colors & Context ---
    const getCompanyStatusClass = (statusValue?: CompanyItem["status"]): string => {
        if (!statusValue) return "bg-gray-200 text-gray-600";
        const lowerCaseStatus = statusValue.toLowerCase();
        const companyStatusColors: Record<string, string> = {
            active: "border border-green-300 bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300",
            verified: "border border-green-300 bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300",
            pending: "border border-orange-300 bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
            inactive: "border border-red-300 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300",
            "non verified": "border border-yellow-300 bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-300",
        };
        return companyStatusColors[lowerCaseStatus] || "bg-gray-200 text-gray-600";
    };

    const companyColumns = [
        {
            header: "Company Info", accessorKey: "company_name", id: "companyInfo", size: 220, cell: ({ row }) => {
                const { company_name, ownership_type, primary_business_type, country, city, state, company_logo, company_code } = row.original;
                return (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <Avatar src={company_logo ? `https://aazovo.codefriend.in/${company_logo}` : undefined} size="sm" shape="circle" className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => company_logo && openImageViewer(company_logo)} icon={<TbUserCircle />} />
                            <div>
                                <h6 className="text-xs font-semibold"><em className="text-blue-600">{company_code || "Company Code"}</em></h6>
                                <span className="text-xs font-semibold leading-1">{company_name}</span>
                            </div>
                        </div>
                        <span className="text-xs mt-1"><b>Ownership Type:</b> {ownership_type || "N/A"}</span>
                        <span className="text-xs mt-1"><b>Primary Business Type:</b> {primary_business_type || "N/A"}</span>
                        <div className="text-xs text-gray-500">{city}, {state}, {country?.name || "N/A"}</div>
                    </div>
                );
            },
        },
        {
            header: "Contact", accessorKey: "owner_name", id: "contact", size: 180, cell: (props) => {
                const { owner_name, primary_contact_number, primary_email_id, company_website, primary_contact_number_code } = props.row.original;
                return (
                    <div className="text-xs flex flex-col gap-0.5">
                        {owner_name && (<span><b>Owner: </b> {owner_name}</span>)}
                        {primary_contact_number && (<span>{primary_contact_number_code} {primary_contact_number}</span>)}
                        {primary_email_id && (<a href={`mailto:${primary_email_id}`} className="text-blue-600 hover:underline">{primary_email_id}</a>)}
                        {company_website && (<a href={company_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{company_website}</a>)}
                    </div>
                );
            },
        },
        {
            header: "Legal IDs & Status", accessorKey: "status", id: "legal", size: 180, cell: ({ row }) => {
                const { gst_number, pan_number, status } = row.original;
                return (
                    <div className="flex flex-col gap-0.5 text-[11px]">
                        {gst_number && <div><b>GST:</b> <span className="break-all">{gst_number}</span></div>}
                        {pan_number && <div><b>PAN:</b> <span className="break-all">{pan_number}</span></div>}
                        <Tag className={`${getCompanyStatusClass(status)} capitalize mt-1 self-start !text-[11px] px-2 py-1`}>{status}</Tag>
                    </div>
                );
            },
        },
        {
            header: "Profile & Scores", accessorKey: "profile_completion", id: "profile", size: 190, cell: ({ row }) => {
                const { members_count = 0, teams_count = 0, profile_completion = 0, kyc_verified, enable_billing, due_after_3_months_date } = row.original;
                const formattedDate = due_after_3_months_date ? `${new Date(due_after_3_months_date).getDate()} ${new Date(due_after_3_months_date).toLocaleString("en-US", { month: "short" })}, ${new Date(due_after_3_months_date).getFullYear()}` : "N/A";
                return (
                    <div className="flex flex-col gap-1 text-xs">
                        <span><b>Members:</b> {members_count}</span>
                        <span><b>Teams:</b> {teams_count}</span>
                        <div className="flex gap-1 items-center"><b>KYC Verified:</b><Tooltip title={`KYC: ${kyc_verified ? "Yes" : "No"}`}>{kyc_verified ? (<MdCheckCircle className="text-green-500 text-lg" />) : (<MdCancel className="text-red-500 text-lg" />)}</Tooltip></div>
                        <div className="flex gap-1 items-center"><b>Billing:</b><Tooltip title={`Billing: ${enable_billing ? "Yes" : "No"}`}>{enable_billing ? (<MdCheckCircle className="text-green-500 text-lg" />) : (<MdCancel className="text-red-500 text-lg" />)}</Tooltip></div>
                        <span><b>Billing Due:</b> {formattedDate}</span>
                        <Tooltip title={`Profile Completion ${profile_completion}%`}>
                            <div className="h-2.5 w-full rounded-full bg-gray-300">
                                <div className="rounded-full h-2.5 bg-blue-500" style={{ width: `${profile_completion}%` }}></div>
                            </div>
                        </Tooltip>
                    </div>
                );
            },
        },
        {
            header: 'Business', accessorKey: 'wallCount',
            size: 180,
            meta: { HeaderClass: 'text-center' },
            cell: props => (
                <div className='flex flex-col gap-4 text-center items-center '>
                    <Tooltip title="Buy: 13 | Sell: 12 | Total: 25 " className='text-xs'>
                        <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs 
                                inline'>
                            Wall Listing: {props?.row?.original?.wall?.buy} | {props?.row?.original?.wall?.buy} | {props?.row?.original?.wall?.buy}
                        </div>
                    </Tooltip>
                    <Tooltip title="Offers: 34 | Demands: 12 | Total: 46" className='text-xs'>
                        <div className=' bg-orange-100 text-orange-600 rounded-md p-1.5 text-xs 
                                 inline'>
                            Opportunities: {props?.row?.original?.opportunities?.offers} | {props?.row?.original?.opportunities?.demands} | {props?.row?.original?.opportunities?.total}
                        </div>
                    </Tooltip>
                    <Tooltip title="Success: 34 | Lost: 12 | Total: 46" className='text-xs'>
                        <div className=' bg-green-100 text-green-600 rounded-md p-1.5 text-xs 
                                 inline'>
                            Leads:  {props?.row?.original?.leads?.total} | {props?.row?.original?.leads?.total} | {props?.row?.original?.leads?.total}
                        </div>
                    </Tooltip>
                </div>

            )
        },
    ]

    const memberColumns = [
        { header: "Member", accessorKey: "member_name", id: 'member', size: 180, cell: (props) => (<div className="flex flex-col gap-1"><div className="flex items-center gap-1.5"><div className="text-xs"><b className="text-xs text-blue-500"><em>70892{props.row.original.id || ""}</em></b> <br /><b className="texr-xs">{props.row.original.name || ""}</b></div></div><div className="text-xs"><div className="text-xs text-gray-500">{props.row.original.email || ""}</div><div className="text-xs text-gray-500">{props.row.original.number || ""}</div><div className="text-xs text-gray-500">{props.row.original.country?.name || ""}</div></div></div>), },
        { header: "Company", accessorKey: "company_name", id: 'company', size: 200, cell: (props) => (<div className="ml-2 rtl:mr-2 text-xs"><b className="text-xs "><em className="text-blue-500">{props.row.original.company_id_actual || ""}</em></b><div className="text-xs flex gap-1"><MdCheckCircle size={20} className="text-green-500" /><b className="">{props.row.original.company_name || "Unique Enterprise"}</b></div></div>), },
        { header: "Status", accessorKey: "member_status", id: 'status', size: 140, cell: (props) => { const { status: member_status, created_at } = props.row.original; return (<div className="flex flex-col text-xs"><Tag className={`${statusColor[member_status as keyof typeof statusColor]} inline capitalize`}>{member_status || ""}</Tag><span className="mt-0.5"><div className="text-[10px] text-gray-500 mt-0.5">Joined Date: {new Date(created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", }).replace(/ /g, "/") || "N/A"}</div></span></div>); }, },
        { header: "Profile", accessorKey: "profile_completion", id: 'profile', size: 220, cell: (props) => (<div className="text-xs flex flex-col"><span><b>RM: </b>{props.row.original.name || ""}</span><span><b>Grade: {props.row.original.member_grade || ""}</b></span><span><b>Business Opportunity: {props.row.original.business_opportunity || ""}</b></span><Tooltip title={`Profile: ${props.row.original.profile_completion || 0}%`}><div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${props.row.original.profile_completion || 0}%`, }}></div></div></Tooltip></div>), },
        { header: "Preferences", accessorKey: "associated_brands", id: 'preferences', size: 300, cell: (props) => { const [isOpen, setIsOpen] = useState<boolean>(false); const openDialog = () => setIsOpen(true); const closeDialog = () => setIsOpen(false); return (<div className="flex flex-col gap-1"><span className="text-xs"><b className="text-xs">Business Type: {props.row.original.business_type || ""}</b></span><span className="text-xs flex items-center gap-1"><span onClick={openDialog}><TbInfoCircle size={16} className="text-blue-500 cursor-pointer" /></span><b className="text-xs">Brands: {props.row.original.brand_name || ""}</b></span><span className="text-xs"><span className="text-[11px]"><b className="text-xs">Interested: </b>{props.row.original.interested_in}</span></span><Dialog width={620} isOpen={isOpen} onRequestClose={closeDialog} onClose={closeDialog}><h6>Dynamic Profile</h6><Table className="mt-6"><thead className="bg-gray-100 rounded-md"><Tr><Td width={130}>Member Type</Td><Td>Brands</Td><Td>Category</Td><Td>Sub Category</Td></Tr></thead><tbody><Tr><Td>INS - PREMIUM</Td><Td><span className="flex gap-0.5 flex-wrap"><Tag>Apple</Tag><Tag>Samsung</Tag><Tag>POCO</Tag></span></Td><Td><Tag>Electronics</Tag></Td><Td><span className="flex gap-0.5 flex-wrap"><Tag>Mobile</Tag><Tag>Laptop</Tag></span></Td></Tr></tbody></Table></Dialog></div>); }, },
        {
            header: 'Business', accessorKey: 'wallCount',
            size: 180,
            meta: { HeaderClass: 'text-center' },
            cell: props => (
                <div className='flex flex-col gap-4 text-center items-center '>
                    <Tooltip title="Buy: 13 | Sell: 12 | Total: 25 " className='text-xs'>
                        <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs 
                                inline'>
                            Wall Listing: {props?.row?.original?.wall?.buy} | {props?.row?.original?.wall?.buy} | {props?.row?.original?.wall?.buy}
                        </div>
                    </Tooltip>
                    <Tooltip title="Offers: 34 | Demands: 12 | Total: 46" className='text-xs'>
                        <div className=' bg-orange-100 text-orange-600 rounded-md p-1.5 text-xs 
                                 inline'>
                            Opportunities: {props?.row?.original?.opportunities?.offers} | {props?.row?.original?.opportunities?.demands} | {props?.row?.original?.opportunities?.total}
                        </div>
                    </Tooltip>
                    <Tooltip title="Success: 34 | Lost: 12 | Total: 46" className='text-xs'>
                        <div className=' bg-green-100 text-green-600 rounded-md p-1.5 text-xs 
                                 inline'>
                            Leads:  {props?.row?.original?.leads?.total} | {props?.row?.original?.leads?.total} | {props?.row?.original?.leads?.total}
                        </div>
                    </Tooltip>
                </div>

            )
        },
    ]

    const productStatusColor = {
        active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
        inactive: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-100", // Changed Inactive to Slate
        pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100",
        draft: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-100", // Changed Draft to Violet
        rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
    };

    const productColumns = [
        { header: "ID", accessorKey: "id", size: 60, meta: { tdClass: "text-center", thClass: "text-center" }, cell: ({ getValue }) => getValue().toString().padStart(6, '0'), },
        {
            header: "Product", id: "productInfo", size: 300, cell: (props: CellContext<ProductItem, any>) => (
                <div className="flex items-center gap-3">
                    <Avatar size={30} shape="circle" src={props.row.original.thumbImageFullPath || undefined} icon={<TbBox />} className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => props.row.original.thumbImageFullPath && openImageViewer(props.row.original.thumbImageFullPath)}></Avatar>
                    <Tooltip title={props.row.original.name}>
                        <div className="truncate"><span className="font-semibold hover:text-blue-600 cursor-pointer" onClick={() => openViewDetailModal(props.row.original)}>{props.row.original.name}</span><div className="text-xs text-gray-500">SKU: {props.row.original.skuCode || "-"}</div></div>
                    </Tooltip>
                </div>
            ),
        },
        { header: "Category", accessorKey: "categoryName", cell: (props) => props.row.original.categoryName || "-", },
        { header: "Sub Cat", accessorKey: "subCategoryName", cell: (props) => props.row.original.subCategoryName || "-", },
        { header: "Brand", accessorKey: "brandName", cell: (props) => props.row.original.brandName || "-", },
        { header: "Status", accessorKey: "status", cell: (props: CellContext<ProductItem, any>) => (<Tag className={`${productStatusColor[props.row.original.status] || "bg-gray-200"} capitalize font-semibold border-0`}>{props.row.original.status}</Tag>), },
        {
            header: 'Business', accessorKey: 'wallCount',
            size: 180,
            meta: { HeaderClass: 'text-center' },
            cell: props => (
                <div className='flex flex-col gap-4 text-center items-center '>
                    <Tooltip title="Buy: 13 | Sell: 12 | Total: 25 " className='text-xs'>
                        <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs 
                                inline'>
                            Wall Listing: {props?.row?.original?.wall?.buy} | {props?.row?.original?.wall?.buy} | {props?.row?.original?.wall?.buy}
                        </div>
                    </Tooltip>
                    <Tooltip title="Offers: 34 | Demands: 12 | Total: 46" className='text-xs'>
                        <div className=' bg-orange-100 text-orange-600 rounded-md p-1.5 text-xs 
                                 inline'>
                            Opportunities: {props?.row?.original?.opportunities?.offers} | {props?.row?.original?.opportunities?.demands} | {props?.row?.original?.opportunities?.total}
                        </div>
                    </Tooltip>
                    <Tooltip title="Success: 34 | Lost: 12 | Total: 46" className='text-xs'>
                        <div className=' bg-green-100 text-green-600 rounded-md p-1.5 text-xs 
                                 inline'>
                            Leads:  {props?.row?.original?.leads?.total} | {props?.row?.original?.leads?.total} | {props?.row?.original?.leads?.total}
                        </div>
                    </Tooltip>
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

    ]
    const getPartnerStatusClass = (statusValue): string => {
        if (!statusValue) return "bg-gray-200 text-gray-600";
        const lowerCaseStatus = statusValue.toLowerCase();
        const partnerStatusColors: Record<string, string> = {
            active: "bg-green-200 text-green-600 dark:bg-green-500/20 dark:text-green-300",
            verified: "bg-blue-200 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
            pending: "bg-orange-200 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
            inactive: "bg-red-200 text-red-600 dark:bg-red-500/20 dark:text-red-300",
            "non verified": "bg-yellow-200 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-300",
        };
        return partnerStatusColors[lowerCaseStatus] || "bg-gray-200 text-gray-600";
    };

    const partnerColumns = [
        {
            header: "Partner Info", accessorKey: "partner_name", id: 'partnerInfo', size: 220, cell: ({ row }) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <Avatar src={row.original.partner_logo ? `https://aazovo.codefriend.in/${row.original.partner_logo}` : ''} size="md" shape="circle" className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => openImageViewer(row.original.partner_logo || null)} icon={<TbUserCircle />} />
                        <div>
                            <h6 className="text-xs font-semibold">{row.original.partner_code}</h6>
                            <span className="text-xs font-semibold">{row.original.partner_name}</span>
                        </div>
                    </div>
                    <span className="text-xs mt-1"><b>Type:</b> {row.original.ownership_type}</span>
                    <div className="text-xs text-gray-500">{row.original.city}, {row.original.state}, {row.original.country?.name}</div>
                </div>
            ),
        },
        {
            header: "Contact", accessorKey: "owner_name", id: 'contact', size: 180, cell: ({ row }) => (
                <div className="text-xs flex flex-col gap-0.5">
                    {row.original.owner_name && <span><b>Owner:</b> {row.original.owner_name}</span>}
                    {row.original.primary_contact_number && <span>{row.original.primary_contact_number_code} {row.original.primary_contact_number}</span>}
                    {row.original.primary_email_id && <a href={`mailto:${row.original.primary_email_id}`} className="text-blue-600 hover:underline">{row.original.primary_email_id}</a>}
                    {row.original.partner_website && <a href={row.original.partner_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{row.original.partner_website}</a>}
                </div>
            )
        },
        {
            header: "Legal IDs & Status", size: 180, accessorKey: 'status', id: 'legal', cell: ({ row }) => (
                <div className="flex flex-col gap-1 text-[10px]">
                    {row.original.gst_number && <div><b>GST:</b> <span className="break-all">{row.original.gst_number}</span></div>}
                    {row.original.pan_number && <div><b>PAN:</b> <span className="break-all">{row.original.pan_number}</span></div>}
                    <Tag className={`${getPartnerStatusClass(row.original.status)} capitalize mt-1 self-start !text-[10px] px-1.5 py-0.5`}>{row.original.status}</Tag>
                </div>
            )
        },
        {
            header: "Profile & Scores", size: 190, accessorKey: 'profile_completion', id: 'profile', cell: ({ row }) => (
                <div className="flex flex-col gap-1.5 text-xs">
                    <span><b>Teams:</b> {row.original.teams_count || 0}</span>
                    <div className="flex gap-1 items-center"><b>KYC Verified:</b><Tooltip title={`KYC: ${row.original.kyc_verified ? 'Yes' : 'No'}`}>{row.original.kyc_verified ? <MdCheckCircle className="text-green-500 text-lg" /> : <MdCancel className="text-red-500 text-lg" />}</Tooltip></div>
                    <Tooltip title={`Profile Completion ${row.original.profile_completion}%`}>
                        <div className="h-2.5 w-full rounded-full bg-gray-300"><div className="rounded-full h-2.5 bg-blue-500" style={{ width: `${row.original.profile_completion}%` }}></div></div>
                    </Tooltip>
                </div>
            )
        }, {
            header: 'Business', accessorKey: 'wallCount',
            size: 180,
            meta: { HeaderClass: 'text-center' },
            cell: props => (
                <div className='flex flex-col gap-4 text-center items-center '>
                    <Tooltip title="Buy: 13 | Sell: 12 | Total: 25 " className='text-xs'>
                        <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs 
                                inline'>
                            Wall Listing: {props?.row?.original?.wall?.buy} | {props?.row?.original?.wall?.buy} | {props?.row?.original?.wall?.buy}
                        </div>
                    </Tooltip>
                    <Tooltip title="Offers: 34 | Demands: 12 | Total: 46" className='text-xs'>
                        <div className=' bg-orange-100 text-orange-600 rounded-md p-1.5 text-xs 
                                 inline'>
                            Opportunities: {props?.row?.original?.opportunities?.offers} | {props?.row?.original?.opportunities?.demands} | {props?.row?.original?.opportunities?.total}
                        </div>
                    </Tooltip>
                    <Tooltip title="Success: 34 | Lost: 12 | Total: 46" className='text-xs'>
                        <div className=' bg-green-100 text-green-600 rounded-md p-1.5 text-xs 
                                 inline'>
                            Leads:  {props?.row?.original?.leads?.total} | {props?.row?.original?.leads?.total} | {props?.row?.original?.leads?.total}
                        </div>
                    </Tooltip>
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
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 rounded-2xl py-3 mt-4 ">
                        <StatisticCard
                            title="Companies"
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value="16"
                                    prefix={''}
                                    thousandSeparator={true}
                                />
                            }
                            iconClass="bg-sky-200"
                            icon={<MdOutlineBusinessCenter className='h-5' />}
                            label="Companies"
                            active={selectedCategory === 'Companies'}
                            onClick={() => setSelectedCategory('Companies')}
                            colorClass="bg-red-100"
                            activeBgColor="bg-red-200"
                            iconBg="bg-red-400"
                        />
                        <StatisticCard
                            title="Members"
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value="68"
                                    thousandSeparator={true}
                                />
                            }
                            iconClass="bg-emerald-200"
                            icon={<TbUserCircle className='h-5' />}
                            label="Members"
                            active={selectedCategory === 'Members'}
                            onClick={() => setSelectedCategory('Members')}
                            colorClass="bg-green-100"
                            activeBgColor="bg-green-200"
                            iconBg="bg-green-400"
                        />
                        <StatisticCard
                            title="Products"
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value="12"
                                    prefix={''}
                                    thousandSeparator={true}
                                />
                            }
                            iconClass="bg-purple-200"
                            icon={<TbCube3dSphere className='h-5' />}
                            label="Products"
                            active={selectedCategory === 'Products'}
                            onClick={() => setSelectedCategory('Products')}
                            colorClass="bg-blue-100"
                            activeBgColor="bg-blue-200"
                            iconBg="bg-blue-400"
                        />
                        {/* <StatisticCard
                            title="Wall Listings"
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
                            label="Wall Listings"
                            active={selectedCategory === 'Wall Listings'}
                            // compareFrom={data.totalProfit[selectedPeriod].comparePeriod}
                            onClick={() => setSelectedCategory('Wall Listings')}
                            colorClass="bg-violet-100"
                            activeBgColor="bg-violet-200"
                            iconBg="bg-violet-400"
                        /> */}
                        <StatisticCard
                            title="Partners"
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value="23"
                                    thousandSeparator={true}
                                />
                            }
                            // growShrink={data.totalOrder[selectedPeriod].growShrink}
                            iconClass="bg-emerald-200"
                            icon={<TbHeartHandshake className='h-5' />}
                            label="Partners"
                            active={selectedCategory === 'Partners'}
                            // compareFrom={data.totalProfit[selectedPeriod].comparePeriod}
                            onClick={() => setSelectedCategory('Partners')}
                            colorClass="bg-pink-100"
                            activeBgColor="bg-pink-200"
                            iconBg="bg-pink-400"
                        />
                        <StatisticCard
                            title="Teams"
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
                            icon={<TbUsersGroup className='h-5' />}
                            label="Teams"
                            active={selectedCategory === 'Teams'}
                            // compareFrom={data.totalProfit[selectedPeriod].comparePeriod}
                            onClick={() => setSelectedCategory('Teams')}
                            colorClass="bg-orange-100"
                            activeBgColor="bg-orange-200"
                            iconBg="bg-orange-400"
                        />
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

                        {/* Company Starts */}
                        {selectedCategory === 'Companies' && (
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
                                        {/* <Bar
                                            field="Active"
                                            percent={20}
                                            color='text-[#28a745]'
                                            className="bg-[#28a745] dark:opacity-70"
                                        /> */}
                                        {/* <Bar
                                            field="Inactive"
                                            percent={28}
                                            color='text-[#6c757d]'
                                            className="bg-[#6c757d] dark:opacity-70"
                                        /> */}
                                        {/* <Bar
                                            field="Pending"
                                            percent={32}
                                            color='text-[#ffc107]'
                                            className="bg-[#ffc107] dark:opacity-70"
                                        /> */}
                                        <Bar
                                            field="Verified"
                                            percent={20}
                                            color='text-[#20c997]'
                                            className="bg-[#20c997] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Non Verified"
                                            percent={20}
                                            color='text-[#e74c3c]'
                                            className="bg-[#e74c3c] dark:opacity-70"
                                        />
                                        {/* <Bar
                                            field="Offerer"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        /> */}
                                        <Bar
                                            field="Eligible"
                                            percent={20}
                                            color='text-[#fd7e14]'
                                            className="bg-[#fd7e14] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Not Eligible"
                                            percent={20}
                                            color='text-[#ffc107]'
                                            className="bg-[#ffc107] dark:opacity-70"
                                        />
                                        {/* <Bar
                                            field="Avg Score"
                                            percent={20}
                                            color='text-gray-500'
                                            className="bg-gray-500 dark:opacity-70"
                                        /> */}
                                    </div>
                                </div>

                                <div className='mt-8 block  gap-2'>
                                    <div className='flex justify-between items-center'>
                                        <h6 className='mb-3'>Company Leaderboard</h6>
                                        {/* <div className='flex gap-2 items-center text-sm'>
                                            <h6 className='text-sm'>Health Score</h6>
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
                                        </div> */}
                                    </div>
                                    <DebouceInput
                                        // ref={ref}
                                        className="w-full mb-2"
                                        placeholder="Quick Search..."
                                        suffix={<TbSearch className="text-lg" />}
                                    />
                                    <DataTable
                                        columns={companyColumns}
                                        data={CompanyData?.data || []}
                                    // loading={isLoading}
                                    />

                                    {/* Note :- Success (%) = ( Success / Total Leads ) * 100 */}
                                    {/* Note :- Trust  = ( Company Activity, response rate and verification */}
                                </div>
                            </div>

                        )}
                        {/* Company Ends */}

                        {/* Members  */}
                        {selectedCategory === 'Members' && (
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
                                            field="Active"
                                            percent={20}
                                            color='text-[#28a745]'
                                            className="bg-[#28a745] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Disabled"
                                            percent={28}
                                            color='text-[#6c757d]'
                                            className="bg-[#6c757d] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Unregistered"
                                            percent={20}
                                            color='text-[#e74c3c]'
                                            className="bg-[#e74c3c] dark:opacity-70"
                                        />
                                    </div>
                                </div>

                                <div className='mt-8 block  gap-2'>
                                    <div className='flex justify-between items-center'>
                                        <h6 className='mb-3'>Members Leaderboard</h6>
                                        {/* <div className='flex gap-2 items-center text-sm'>
                                            <h6 className='text-sm'>Activity Level</h6>
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
                                        </div> */}
                                    </div>
                                    <DebouceInput
                                        // ref={ref}
                                        className="w-full mb-2"
                                        placeholder="Quick Search..."
                                        suffix={<TbSearch className="text-lg" />}
                                    />
                                    <DataTable
                                        columns={memberColumns}
                                        data={MemberData?.data || []}
                                    // loading={isLoading}
                                    />

                                    {/* Note :- Success (%) = ( Success / Total Leads ) * 100 */}
                                    {/* Note :- Trust  = ( Company Activity, response rate and verification */}
                                </div>
                            </div>
                        )}
                        {/* Members Ends */}

                        {/* Products  */}
                        {selectedCategory === 'Products' && (
                            <div>
                                <div className='lg:flex gap-2 justify-between mt-4'>
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
                                            field="Pending"
                                            percent={32}
                                            color='text-[#ffc107]'
                                            className="bg-[#ffc107] dark:opacity-70"
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
                                        {/* <Bar
                                            field="Activity Score"
                                            percent={20}
                                            color='text-gray-500'
                                            className="bg-gray-500 dark:opacity-70"
                                        /> */}
                                    </div>
                                </div>

                                <div className='mt-8 block  gap-2'>
                                    <div className='flex justify-between items-center'>
                                        <h6 className='mb-3'>Products Leaderboard</h6>
                                        {/* <div className='flex gap-2 items-center text-sm'>
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
                                        </div> */}
                                    </div>
                                    <DebouceInput
                                        // ref={ref}
                                        className="w-full mb-2"
                                        placeholder="Quick Search..."
                                        suffix={<TbSearch className="text-lg" />}
                                    />
                                    <DataTable
                                        columns={productColumns}
                                        data={ProductsData || []}
                                    // loading={isLoading}
                                    />

                                    {/* Note :- Success (%) = ( Success / Total Leads ) * 100 */}
                                    {/* Note :- Trust  = ( Company Activity, response rate and verification */}
                                </div>
                            </div>
                        )}
                        {/* Products Ends */}

                        {/* Wall Listing  */}
                        {selectedCategory === 'Wall Listings' && (
                            <div>
                                <div className='lg:flex gap-2 justify-between mt-4'>
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
                                    // loading={isLoading}
                                    />

                                    {/* Note :- Success (%) = ( Success / Total Leads ) * 100 */}
                                    {/* Note :- Trust  = ( Company Activity, response rate and verification */}
                                </div>
                            </div>
                        )}
                        {/* Wall Listing Ends */}
                        {/* Partners  */}
                        {selectedCategory === 'Partners' && (
                            <div>
                                <div className='lg:flex gap-2 justify-between mt-4'>
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
                                            field="Active"
                                            percent={20}
                                            color='text-[#2ecc71]'
                                            className="bg-[#2ecc71] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Unregistered"
                                            percent={20}
                                            color='text-[#e74c3c]'
                                            className="bg-[#e74c3c] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Disabled"
                                            percent={28}
                                            color='text-[#6c757d]'
                                            className="bg-[#6c757d] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Verified"
                                            percent={20}
                                            color='text-[#6610f2]'
                                            className="bg-[#6610f2] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Unverified"
                                            percent={20}
                                            color='text-[#fd7e14]'
                                            className="bg-[#fd7e14] dark:opacity-70"
                                        />
                                        {/* <Bar
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
                                        /> */}
                                    </div>
                                </div>

                                <div className='mt-8 block  gap-2'>
                                    <div className='flex justify-between items-center'>
                                        <h6 className='mb-3'>Partners Leaderboard</h6>
                                        {/* <div className='flex gap-2 items-center text-sm'>
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
                                        </div> */}
                                    </div>
                                    <DebouceInput
                                        // ref={ref}
                                        className="w-full mb-2"
                                        placeholder="Quick Search..."
                                        suffix={<TbSearch className="text-lg" />}
                                    />
                                    <DataTable
                                        columns={partnerColumns}
                                        data={partnerData?.data || []}
                                    // loading={isLoading}
                                    />

                                    {/* Note :- Success (%) = ( Success / Total Leads ) * 100 */}
                                    {/* Note :- Trust  = ( Company Activity, response rate and verification */}
                                </div>
                            </div>
                        )}
                        {/* Partners */}
                        {/* Teams  */}
                        {selectedCategory === 'Teams' && (
                            <div>
                                <div className='lg:flex gap-2 justify-between mt-4'>
                                    <div className='whitespace-nowrap pr-4 border-r border-r-gray-200'>
                                        <span className=' font-semibold text-black dark:text-white'>Growth Rate</span>
                                        <div className='flex gap-1 items-center'>
                                            <h3>17%</h3>
                                            <span className='text-green-600 text-lg'><FaArrowUpLong /></span>
                                        </div>
                                    </div>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
                                        <Bar
                                            field="Active"
                                            percent={20}
                                            color='text-[#2ecc71]'
                                            className="bg-[#2ecc71] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Disabled"
                                            percent={28}
                                            color='text-[#e74c3c]'
                                            className="bg-[#e74c3c] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Blocked"
                                            percent={20}
                                            color='text-[#fd7e14]'
                                            className="bg-[#fd7e14] dark:opacity-70"
                                        />
                                        <Bar
                                            field="On Notice"
                                            percent={32}
                                            color='text-[#ffc107]'
                                            className="bg-[#ffc107] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Departments"
                                            percent={28}
                                            color='text-[#6c757d]'
                                            className="bg-[#6c757d] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Designations"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        {/* <Bar
                                            field="Inactive"
                                            percent={20}
                                            color='text-[#e74c3c]'
                                            className="bg-[#e74c3c] dark:opacity-70"
                                        />
                                         
                                        <Bar
                                            field="Unapproved"
                                            percent={20}
                                            color='text-[#fd7e14]'
                                            className="bg-[#fd7e14] dark:opacity-70"
                                        />
                                        
                                        <Bar
                                            field="Resigned"
                                            percent={20}
                                            color='text-[#28a745]'
                                            className="bg-[#28a745] dark:opacity-70"
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
                                        /> */}
                                    </div>
                                </div>

                                <div className='mt-8 block  gap-2'>
                                    <div className='flex justify-between items-center'>
                                        <h6 className='mb-6'>Team Leaderboard</h6>
                                        {/* <div className='flex gap-2 items-center text-sm'>
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
                                        </div> */}
                                    </div>
                                    <DataTable
                                        columns={teamColumns}
                                        data={wallListingData}
                                    // loading={isLoading}
                                    />

                                    {/* Note :- Success (%) = ( Success / Total Leads ) * 100 */}
                                    {/* Note :- Trust  = ( Company Activity, response rate and verification */}
                                </div>
                            </div>
                        )}
                        {/* Teams */}


                    </Card>
                </section>

            </section>
        </Card>
    )
}

export default Overview
