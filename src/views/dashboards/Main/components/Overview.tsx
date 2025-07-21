import { DataTable, DebouceInput } from '@/components/shared';
import { Avatar, Dialog, Table, Tag, Tooltip } from '@/components/ui';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Td from '@/components/ui/Table/Td';
import Tr from '@/components/ui/Table/Tr';
import { masterSelector } from '@/reduxtool/master/masterSlice';
import {
    getCompanyAction,
    getEmployeesListingAction,
    getMemberAction,
    getpartnerAction,
    getProductsAction,
} from '@/reduxtool/master/middleware';
import { useAppDispatch } from '@/reduxtool/store';
import classNames from '@/utils/classNames';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { BsCake } from 'react-icons/bs';
import { FaBookmark } from 'react-icons/fa';
import { IoMdShare } from 'react-icons/io';
import {
    MdCancel,
    MdCheckCircle,
    MdOutlineBusinessCenter,
} from 'react-icons/md';
import {
    TbBox,
    TbCube3dSphere,
    TbHeartHandshake,
    TbInfoCircle,
    TbSearch,
    TbUserCircle,
    TbUsersGroup,
} from 'react-icons/tb';
import { useSelector } from 'react-redux';
import type { CellContext } from '@tanstack/react-table';

type StatisticCategory =
    | 'Companies'
    | 'Members'
    | 'Products'
    | 'Partners'
    | 'Teams';

type StatisticCardProps = {
    title: string;
    value: number | ReactNode;
    icon: ReactNode;
    label: StatisticCategory;
    active: boolean;
    onClick: (label: StatisticCategory) => void;
    colorClass: string;
    activeBgColor: string;
    iconBg: string;
};

const StatisticCard = (props: StatisticCardProps) => {
    const {
        title,
        value,
        label,
        icon,
        active,
        onClick,
        colorClass,
        activeBgColor,
        iconBg,
    } = props;

    return (
        <button
            className={classNames(
                'p-4 rounded-2xl cursor-pointer ltr:text-left rtl:text-right transition duration-150 outline-none w-full',
                colorClass,
                active && `${activeBgColor} shadow-md`
            )}
            onClick={() => onClick(label)}
        >
            <div className="flex justify-between items-center relative">
                <div>
                    <div className="mb-4 !text-xs text-gray-900 font-bold">
                        {title}
                    </div>
                    <h6 className="mb-1 text-gray-900">{value}</h6>
                </div>
                <div
                    className={`flex items-center justify-center min-h-8 min-w-8 max-h-8 max-w-8 ${iconBg}
                            text-white rounded-full text-2xl`}
                >
                    {icon}
                </div>
            </div>
        </button>
    );
};

const Bar = ({
    percent,
    className,
    field,
    color,
    count,
}: {
    percent: number;
    className?: string;
    field: string;
    color: string;
    count: number;
}) => {
    const displayPercent = isNaN(percent) ? 0 : percent;
    return (
        <div className="flex-1">
            <span className={`${color} dark:text-white text-xs`}>{field}</span>
            <div
                className={classNames('h-1.5 rounded-full mt-1', className)}
                style={{ width: `${displayPercent}%` }}
            />
            <div className="font-bold heading-text mt-1">
                {displayPercent.toFixed(0)}%{' '}
                <span className="font-normal text-xs">({count})</span>
            </div>
        </div>
    );
};

const Overview = () => {
    const [selectedCategory, setSelectedCategory] =
        useState<StatisticCategory>('Companies');
    const dispatch = useAppDispatch();
    const {
        CompanyData,
        MemberData,
        ProductsData,
        partnerData,
        EmployeesList: Employees,
    } = useSelector(masterSelector);
console.log("ProductsData", ProductsData);

    useEffect(() => {
        dispatch(getCompanyAction());
        dispatch(getMemberAction());
        dispatch(getProductsAction());
        dispatch(getpartnerAction());
        dispatch(getEmployeesListingAction());
    }, [dispatch]);

    const statusColor = {
        Active: 'bg-green-200 text-green-600',
        Verified: 'bg-blue-200 text-blue-600',
        Pending: 'bg-orange-200 text-orange-600',
        Inactive: 'bg-red-200 text-red-600',
    };

    const getCompanyStatusClass = (statusValue?: string): string => {
        if (!statusValue) return 'bg-gray-200 text-gray-600';
        const lowerCaseStatus = statusValue.toLowerCase();
        const companyStatusColors: Record<string, string> = {
            active: 'border border-green-300 bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300',
            verified: 'border border-green-300 bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300',
            pending: 'border border-orange-300 bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300',
            inactive: 'border border-red-300 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300',
            'non verified': 'border border-yellow-300 bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-300',
        };
        return (
            companyStatusColors[lowerCaseStatus] || 'bg-gray-200 text-gray-600'
        );
    };

    const companyColumns = [
        { header: 'Company Info', accessorKey: 'company_name', id: 'companyInfo', size: 220, cell: ({ row }: any) => { const { company_name, ownership_type, primary_business_type, country, city, state, company_logo, company_code } = row.original; return ( <div className="flex flex-col"> <div className="flex items-center gap-2"> <Avatar src={company_logo ? `${company_logo}` : undefined} size="sm" shape="circle" icon={<TbUserCircle />} /> <div> <h6 className="text-xs font-semibold"><em className="text-blue-600">{company_code || "N/A"}</em></h6> <span className="text-xs font-semibold leading-1">{company_name}</span> </div> </div> <span className="text-xs mt-1"><b>Ownership Type:</b> {ownership_type || "N/A"}</span> <span className="text-xs mt-1"><b>Primary Business Type:</b> {primary_business_type || "N/A"}</span> <div className="text-xs text-gray-500">{city}, {state}, {country?.name || "N/A"}</div> </div> ); }, },
        { header: 'Contact', accessorKey: 'owner_name', id: 'contact', size: 180, cell: (props: any) => { const { owner_name, primary_contact_number, primary_email_id, company_website, primary_contact_number_code } = props.row.original; return ( <div className="text-xs flex flex-col gap-0.5"> {owner_name && (<span><b>Owner: </b> {owner_name}</span>)} {primary_contact_number && (<span>{primary_contact_number_code} {primary_contact_number}</span>)} {primary_email_id && (<a href={`mailto:${primary_email_id}`} className="text-blue-600 hover:underline">{primary_email_id}</a>)} {company_website && (<a href={company_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{company_website}</a>)} </div> ); }, },
        { header: 'Legal IDs & Status', accessorKey: 'status', id: 'legal', size: 180, cell: ({ row }: any) => { const { gst_number, pan_number, status } = row.original; return ( <div className="flex flex-col gap-0.5 text-[11px]"> {gst_number && <div><b>GST:</b> <span className="break-all">{gst_number}</span></div>} {pan_number && <div><b>PAN:</b> <span className="break-all">{pan_number}</span></div>} <Tag className={`${getCompanyStatusClass(status)} capitalize mt-1 self-start !text-[11px] px-2 py-1`}>{status}</Tag> </div> ); }, },
        { header: 'Profile & Scores', accessorKey: 'profile_completion', id: 'profile', size: 190, cell: ({ row }: any) => { const { members_count = 0, teams_count = 0, profile_completion = 0, kyc_verified, enable_billing, due_after_3_months_date } = row.original; const formattedDate = due_after_3_months_date ? dayjs(due_after_3_months_date).format('D MMM, YYYY') : "N/A"; return ( <div className="flex flex-col gap-1 text-xs"> <span><b>Members:</b> {members_count}</span> <span><b>Teams:</b> {teams_count}</span> <div className="flex gap-1 items-center"><b>KYC Verified:</b><Tooltip title={`KYC: ${kyc_verified ? "Yes" : "No"}`}>{kyc_verified ? (<MdCheckCircle className="text-green-500 text-lg" />) : (<MdCancel className="text-red-500 text-lg" />)}</Tooltip></div> <div className="flex gap-1 items-center"><b>Billing:</b><Tooltip title={`Billing: ${enable_billing ? "Yes" : "No"}`}>{enable_billing ? (<MdCheckCircle className="text-green-500 text-lg" />) : (<MdCancel className="text-red-500 text-lg" />)}</Tooltip></div> <span><b>Billing Due:</b> {formattedDate}</span> <Tooltip title={`Profile Completion ${profile_completion}%`}> <div className="h-2.5 w-full rounded-full bg-gray-300"> <div className="rounded-full h-2.5 bg-blue-500" style={{ width: `${profile_completion}%` }}></div> </div> </Tooltip> </div> ); }, },
        { header: 'Business', accessorKey: 'wallCount', size: 180, meta: { HeaderClass: 'text-center' }, cell: (props: any) => ( <div className='flex flex-col gap-4 text-center items-center '> <Tooltip title={`Buy: ${props.row.original?.wall?.buy || 0} | Sell: ${props.row.original?.wall?.sell || 0} | Total: ${props.row.original?.wall?.total || 0}`} className='text-xs'> <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs inline'> Wall Listing: {props?.row?.original?.wall?.buy || 0} | {props?.row?.original?.wall?.sell || 0} | {props?.row?.original?.wall?.total || 0} </div> </Tooltip> <Tooltip title={`Offers: ${props.row.original?.opportunities?.offers || 0} | Demands: ${props.row.original?.opportunities?.demands || 0} | Total: ${props.row.original?.opportunities?.total || 0}`} className='text-xs'> <div className=' bg-orange-100 text-orange-600 rounded-md p-1.5 text-xs inline'> Opportunities: {props?.row?.original?.opportunities?.offers || 0} | {props?.row?.original?.opportunities?.demands || 0} | {props?.row?.original?.opportunities?.total || 0} </div> </Tooltip> <Tooltip title={`Success: ${props.row.original?.leads?.success || 0} | Lost: ${props.row.original?.leads?.lost || 0} | Total: ${props.row.original?.leads?.total || 0}`} className='text-xs'> <div className=' bg-green-100 text-green-600 rounded-md p-1.5 text-xs inline'> Leads: {props?.row?.original?.leads?.success || 0} | {props?.row?.original?.leads?.lost || 0} | {props?.row?.original?.leads?.total || 0} </div> </Tooltip> </div> ) },
    ];

    const memberColumns = [
        { header: "Member", accessorKey: "member_name", id: 'member', size: 180, cell: (props: any) => (<div className="flex flex-col gap-1"><div className="flex items-center gap-1.5"><div className="text-xs"><b className="text-xs text-blue-500"><em>{props.row.original.id || ""}</em></b> <br /><b className="texr-xs">{props.row.original.name || ""}</b></div></div><div className="text-xs"><div className="text-xs text-gray-500">{props.row.original.email || ""}</div><div className="text-xs text-gray-500">{props.row.original.number || ""}</div><div className="text-xs text-gray-500">{props.row.original.country?.name || ""}</div></div></div>), },
        { header: "Company", accessorKey: "company_name", id: 'company', size: 200, cell: (props: any) => (<div className="ml-2 rtl:mr-2 text-xs"><b className="text-xs "><em className="text-blue-500">{props.row.original.company_id_actual || ""}</em></b><div className="text-xs flex gap-1"><MdCheckCircle size={20} className="text-green-500" /><b className="">{props.row.original.company_name || "Unique Enterprise"}</b></div></div>), },
        { header: "Status", accessorKey: "member_status", id: 'status', size: 140, cell: (props: any) => { const { status: member_status, created_at } = props.row.original; return (<div className="flex flex-col text-xs"><Tag className={`${statusColor[member_status as keyof typeof statusColor]} inline capitalize`}>{member_status || ""}</Tag><span className="mt-0.5"><div className="text-[10px] text-gray-500 mt-0.5">Joined Date: {dayjs(created_at).format('D MMM, YYYY') || "N/A"}</div></span></div>); }, },
        { header: "Profile", accessorKey: "profile_completion", id: 'profile', size: 220, cell: (props: any) => (<div className="text-xs flex flex-col"><span><b>RM: </b>{props.row.original.name || ""}</span><span><b>Grade: {props.row.original.member_grade || ""}</b></span><span><b>Business Opportunity: {props.row.original.business_opportunity || ""}</b></span><Tooltip title={`Profile: ${props.row.original.profile_completion || 0}%`}><div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${props.row.original.profile_completion || 0}%`, }}></div></div></Tooltip></div>), },
        { header: "Preferences", accessorKey: "associated_brands", id: 'preferences', size: 300, cell: (props: any) => { const [isOpen, setIsOpen] = useState<boolean>(false); const openDialog = () => setIsOpen(true); const closeDialog = () => setIsOpen(false); return (<div className="flex flex-col gap-1"><span className="text-xs"><b className="text-xs">Business Type: {props.row.original.business_type || ""}</b></span><span className="text-xs flex items-center gap-1"><span onClick={openDialog}><TbInfoCircle size={16} className="text-blue-500 cursor-pointer" /></span><b className="text-xs">Brands: {props.row.original.brand_name || ""}</b></span><span className="text-xs"><span className="text-[11px]"><b className="text-xs">Interested: </b>{props.row.original.interested_in}</span></span><Dialog width={620} isOpen={isOpen} onRequestClose={closeDialog} onClose={closeDialog}><h6>Dynamic Profile</h6><Table className="mt-6"><thead className="bg-gray-100 rounded-md"><Tr><Td width={130}>Member Type</Td><Td>Brands</Td><Td>Category</Td><Td>Sub Category</Td></Tr></thead><tbody><Tr><Td>INS - PREMIUM</Td><Td><span className="flex gap-0.5 flex-wrap"><Tag>Apple</Tag><Tag>Samsung</Tag><Tag>POCO</Tag></span></Td><Td><Tag>Electronics</Tag></Td><Td><span className="flex gap-0.5 flex-wrap"><Tag>Mobile</Tag><Tag>Laptop</Tag></span></Td></Tr></tbody></Table></Dialog></div>); }, },
        { header: 'Business', accessorKey: 'wallCount', size: 180, meta: { HeaderClass: 'text-center' }, cell: (props: any) => ( <div className='flex flex-col gap-4 text-center items-center '> <Tooltip title={`Buy: ${props.row.original?.wall?.buy || 0} | Sell: ${props.row.original?.wall?.sell || 0} | Total: ${props.row.original?.wall?.total || 0}`} className='text-xs'> <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs inline'> Wall Listing: {props?.row?.original?.wall?.buy || 0} | {props?.row?.original?.wall?.sell || 0} | {props?.row?.original?.wall?.total || 0} </div> </Tooltip> <Tooltip title={`Offers: ${props.row.original?.opportunities?.offers || 0} | Demands: ${props.row.original?.opportunities?.demands || 0} | Total: ${props.row.original?.opportunities?.total || 0}`} className='text-xs'> <div className=' bg-orange-100 text-orange-600 rounded-md p-1.5 text-xs inline'> Opportunities: {props?.row?.original?.opportunities?.offers || 0} | {props?.row?.original?.opportunities?.demands || 0} | {props?.row?.original?.opportunities?.total || 0} </div> </Tooltip> <Tooltip title={`Success: ${props.row.original?.leads?.success || 0} | Lost: ${props.row.original?.leads?.lost || 0} | Total: ${props.row.original?.leads?.total || 0}`} className='text-xs'> <div className=' bg-green-100 text-green-600 rounded-md p-1.5 text-xs inline'> Leads: {props?.row?.original?.leads?.success || 0} | {props?.row?.original?.leads?.lost || 0} | {props?.row?.original?.leads?.total || 0} </div> </Tooltip> </div> ) },
    ];

    const productStatusColor: Record<string, string> = {
        active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100',
        inactive: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-100',
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100',
        draft: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-100',
        rejected: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100',
    };

    const productColumns = [
        { header: "ID", accessorKey: "id", size: 60, meta: { tdClass: "text-center", thClass: "text-center" }, cell: ({ getValue }: any) => getValue().toString().padStart(6, '0'), },
        { header: "Product", id: "productInfo", size: 300, cell: (props: any) => ( <div className="flex items-center gap-3"> <Avatar size={30} shape="circle" src={props.row.original.thumbImageFullPath || undefined} icon={<TbBox />} /> <Tooltip title={props.row.original.name}> <div className="truncate"><span className="font-semibold">{props.row.original.name}</span><div className="text-xs text-gray-500">SKU: {props.row.original.skuCode || "-"}</div></div> </Tooltip> </div> ), },
        { header: "Category", accessorKey: "categoryName", cell: (props: any) => props.row.original.category.name || "-", },
        { header: "Sub Cat", accessorKey: "subCategoryName", cell: (props: any) => props.row.original?.sub_category?.name || "-", },
        { header: "Brand", accessorKey: "brandName", cell: (props: any) => props.row.original.brandName || "-", },
        { header: "Status", accessorKey: "status", cell: (props: any) => (<Tag className={`${productStatusColor[props.row.original.status] || "bg-gray-200"} capitalize font-semibold border-0`}>{props.row.original.status}</Tag>), },
        { header: 'Business', accessorKey: 'wallCount', size: 180, meta: { HeaderClass: 'text-center' }, cell: (props: any) => ( <div className='flex flex-col gap-4 text-center items-center '> <Tooltip title={`Buy: ${props.row.original?.wall?.buy || 0} | Sell: ${props.row.original?.wall?.sell || 0} | Total: ${props.row.original?.wall?.total || 0}`} className='text-xs'> <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs inline'> Wall Listing: {props?.row?.original?.wall?.buy || 0} | {props?.row?.original?.wall?.sell || 0} | {props?.row?.original?.wall?.total || 0} </div> </Tooltip> <Tooltip title={`Offers: ${props.row.original?.opportunities?.offers || 0} | Demands: ${props.row.original?.opportunities?.demands || 0} | Total: ${props.row.original?.opportunities?.total || 0}`} className='text-xs'> <div className=' bg-orange-100 text-orange-600 rounded-md p-1.5 text-xs inline'> Opportunities: {props?.row?.original?.opportunities?.offers || 0} | {props?.row?.original?.opportunities?.demands || 0} | {props?.row?.original?.opportunities?.total || 0} </div> </Tooltip> <Tooltip title={`Success: ${props.row.original?.leads?.success || 0} | Lost: ${props.row.original?.leads?.lost || 0} | Total: ${props.row.original?.leads?.total || 0}`} className='text-xs'> <div className=' bg-green-100 text-green-600 rounded-md p-1.5 text-xs inline'> Leads: {props?.row?.original?.leads?.success || 0} | {props?.row?.original?.leads?.lost || 0} | {props?.row?.original?.leads?.total || 0} </div> </Tooltip> </div> ) },
    ];

    const getPartnerStatusClass = (statusValue: string): string => {
        if (!statusValue) return 'bg-gray-200 text-gray-600';
        const lowerCaseStatus = statusValue.toLowerCase();
        const partnerStatusColors: Record<string, string> = {
            active: 'bg-green-200 text-green-600 dark:bg-green-500/20 dark:text-green-300',
            verified: 'bg-blue-200 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300',
            pending: 'bg-orange-200 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300',
            inactive: 'bg-red-200 text-red-600 dark:bg-red-500/20 dark:text-red-300',
            'non verified': 'bg-yellow-200 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-300',
        };
        return partnerStatusColors[lowerCaseStatus] || 'bg-gray-200 text-gray-600';
    };

    const partnerColumns = [
        { header: "Partner Info", accessorKey: "partner_name", id: 'partnerInfo', size: 220, cell: ({ row }: any) => ( <div className="flex flex-col"> <div className="flex items-center gap-2"> <Avatar src={row.original.partner_logo ? `${row.original.partner_logo}` : ''} size="md" shape="circle" icon={<TbUserCircle />} /> <div> <h6 className="text-xs font-semibold">{row.original.partner_code}</h6> <span className="text-xs font-semibold">{row.original.partner_name}</span> </div> </div> <span className="text-xs mt-1"><b>Type:</b> {row.original.ownership_type}</span> <div className="text-xs text-gray-500">{row.original.city}, {row.original.state}, {row.original.country?.name}</div> </div> ), },
        { header: "Contact", accessorKey: "owner_name", id: 'contact', size: 180, cell: ({ row }: any) => ( <div className="text-xs flex flex-col gap-0.5"> {row.original.owner_name && <span><b>Owner:</b> {row.original.owner_name}</span>} {row.original.primary_contact_number && <span>{row.original.primary_contact_number_code} {row.original.primary_contact_number}</span>} {row.original.primary_email_id && <a href={`mailto:${row.original.primary_email_id}`} className="text-blue-600 hover:underline">{row.original.primary_email_id}</a>} {row.original.partner_website && <a href={row.original.partner_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{row.original.partner_website}</a>} </div> ) },
        { header: "Legal IDs & Status", size: 180, accessorKey: 'status', id: 'legal', cell: ({ row }: any) => ( <div className="flex flex-col gap-1 text-[10px]"> {row.original.gst_number && <div><b>GST:</b> <span className="break-all">{row.original.gst_number}</span></div>} {row.original.pan_number && <div><b>PAN:</b> <span className="break-all">{row.original.pan_number}</span></div>} <Tag className={`${getPartnerStatusClass(row.original.status)} capitalize mt-1 self-start !text-[10px] px-1.5 py-0.5`}>{row.original.status}</Tag> </div> ) },
        { header: "Profile & Scores", size: 190, accessorKey: 'profile_completion', id: 'profile', cell: ({ row }: any) => ( <div className="flex flex-col gap-1.5 text-xs"> <span><b>Teams:</b> {row.original.teams_count || 0}</span> <div className="flex gap-1 items-center"><b>KYC Verified:</b><Tooltip title={`KYC: ${row.original.kyc_verified ? 'Yes' : 'No'}`}>{row.original.kyc_verified ? <MdCheckCircle className="text-green-500 text-lg" /> : <MdCancel className="text-red-500 text-lg" />}</Tooltip></div> <Tooltip title={`Profile Completion ${row.original.profile_completion}%`}> <div className="h-2.5 w-full rounded-full bg-gray-300"><div className="rounded-full h-2.5 bg-blue-500" style={{ width: `${row.original.profile_completion}%` }}></div></div> </Tooltip> </div> ) },
        { header: 'Business', accessorKey: 'wallCount', size: 180, meta: { HeaderClass: 'text-center' }, cell: (props: any) => ( <div className='flex flex-col gap-4 text-center items-center '> <Tooltip title={`Buy: ${props.row.original?.wall?.buy || 0} | Sell: ${props.row.original?.wall?.sell || 0} | Total: ${props.row.original?.wall?.total || 0}`} className='text-xs'> <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs inline'> Wall Listing: {props?.row?.original?.wall?.buy || 0} | {props?.row?.original?.wall?.sell || 0} | {props?.row?.original?.wall?.total || 0} </div> </Tooltip> <Tooltip title={`Offers: ${props.row.original?.opportunities?.offers || 0} | Demands: ${props.row.original?.opportunities?.demands || 0} | Total: ${props.row.original?.opportunities?.total || 0}`} className='text-xs'> <div className=' bg-orange-100 text-orange-600 rounded-md p-1.5 text-xs inline'> Opportunities: {props?.row?.original?.opportunities?.offers || 0} | {props?.row?.original?.opportunities?.demands || 0} | {props?.row?.original?.opportunities?.total || 0} </div> </Tooltip> <Tooltip title={`Success: ${props.row.original?.leads?.success || 0} | Lost: ${props.row.original?.leads?.lost || 0} | Total: ${props.row.original?.leads?.total || 0}`} className='text-xs'> <div className=' bg-green-100 text-green-600 rounded-md p-1.5 text-xs inline'> Leads: {props?.row?.original?.leads?.success || 0} | {props?.row?.original?.leads?.lost || 0} | {props?.row?.original?.leads?.total || 0} </div> </Tooltip> </div> ) },
    ];

    const employeeStatusColor = {
        active: 'bg-blue-500',
        inactive: 'bg-emerald-500',
        on_leave: 'bg-amber-500',
        terminated: 'bg-red-500',
    };

    const teamColumns = [
        { header: "Status", accessorKey: "status", cell: (props: any) => { const { status } = props.row.original || {}; const displayStatus = status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toLowerCase()) || ''; return (<Tag className={`${employeeStatusColor[displayStatus as keyof typeof employeeStatusColor]} text-white capitalize`}>{displayStatus}</Tag>); }, },
        { header: "Name", accessorKey: "name", cell: (props: any) => { const { name, email, mobile_number, profile_pic_path } = props.row.original || {}; return (<div className="flex items-center"><Avatar size={28} shape="circle" src={profile_pic_path} icon={<TbUserCircle />}>{!profile_pic_path ? name?.charAt(0).toUpperCase() : ""}</Avatar><div className="ml-2 rtl:mr-2"><span className="font-semibold">{name}</span><div className="text-xs text-gray-500">{email}</div><div className="text-xs text-gray-500">{mobile_number}</div></div></div>); }, },
        { header: "Designation", accessorKey: "designation_id", size: 200, cell: (props: any) => { const data = props.row.original || {}; return (<div className="flex items-center"><div className="ml-2 rtl:mr-2"><span className="font-semibold">{data?.designation?.name ?? "N/A"}</span></div></div>); }, },
        { header: "Department", accessorKey: "department", size: 200, cell: (props: any) => { const { department } = props.row.original || {}; return (<div className="flex items-center"><div className="ml-2 rtl:mr-2"><span className="font-semibold">{department?.name ?? "N/A"}</span></div></div>); }, },
        { header: "Roles", accessorKey: "roles", cell: (props: any) => { const { roles } = props.row.original || {}; return (<div className="flex flex-wrap gap-1 text-xs">{roles?.map((role: any) => (<Tag key={role.id} className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 text-[10px]">{role?.name || ""}</Tag>))}</div>) }, },
        { header: "Joined At", accessorKey: "date_of_joining", size: 200, cell: (props: any) => props?.row?.original?.date_of_joining ? <span className="text-xs"> {dayjs(props?.row?.original?.date_of_joining).format("D MMM YYYY, h:mm A")}</span> : '-' },
        { header: 'Business', accessorKey: 'wallCount', size: 180, meta: { HeaderClass: 'text-center' }, cell: (props: any) => ( <div className='flex flex-col gap-4 text-center items-center '> <Tooltip title={`Buy: ${props.row.original?.wall?.buy || 0} | Sell: ${props.row.original?.wall?.sell || 0} | Total: ${props.row.original?.wall?.total || 0}`} className='text-xs'> <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs inline'> Wall Listing: {props?.row?.original?.wall?.buy || 0} | {props?.row?.original?.wall?.sell || 0} | {props?.row?.original?.wall?.total || 0} </div> </Tooltip> <Tooltip title={`Offers: ${props.row.original?.opportunities?.offers || 0} | Demands: ${props.row.original?.opportunities?.demands || 0} | Total: ${props.row.original?.opportunities?.total || 0}`} className='text-xs'> <div className=' bg-orange-100 text-orange-600 rounded-md p-1.5 text-xs inline'> Opportunities: {props?.row?.original?.opportunities?.offers || 0} | {props?.row?.original?.opportunities?.demands || 0} | {props?.row?.original?.opportunities?.total || 0} </div> </Tooltip> <Tooltip title={`Success: ${props.row.original?.leads?.success || 0} | Lost: ${props.row.original?.leads?.lost || 0} | Total: ${props.row.original?.leads?.total || 0}`} className='text-xs'> <div className=' bg-green-100 text-green-600 rounded-md p-1.5 text-xs inline'> Leads: {props?.row?.original?.leads?.success || 0} | {props?.row?.original?.leads?.lost || 0} | {props?.row?.original?.leads?.total || 0} </div> </Tooltip> </div> ) },
    ];

    const companyCounts = CompanyData?.counts;
    const totalCompanies = companyCounts?.total || 0;

    return (
        <Card>
            <div className="flex items-center justify-between">
                <h4>Overview</h4>
            </div>

            <section className="block gap-4 w-full">
                <section>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 rounded-2xl py-3 mt-4">
                        <StatisticCard
                            title="Companies"
                            value={CompanyData?.counts?.total || 0}
                            icon={<MdOutlineBusinessCenter className="h-5" />}
                            label="Companies"
                            active={selectedCategory === 'Companies'}
                            onClick={() => setSelectedCategory('Companies')}
                            colorClass="bg-red-100"
                            activeBgColor="bg-red-200"
                            iconBg="bg-red-400"
                        />
                        <StatisticCard
                            title="Members"
                            value={MemberData?.counts?.total || 0}
                            icon={<TbUserCircle className="h-5" />}
                            label="Members"
                            active={selectedCategory === 'Members'}
                            onClick={() => setSelectedCategory('Members')}
                            colorClass="bg-green-100"
                            activeBgColor="bg-green-200"
                            iconBg="bg-green-400"
                        />
                        <StatisticCard
                            title="Products"
                            value={ProductsData?.counts?.total || 0}
                            icon={<TbCube3dSphere className="h-5" />}
                            label="Products"
                            active={selectedCategory === 'Products'}
                            onClick={() => setSelectedCategory('Products')}
                            colorClass="bg-blue-100"
                            activeBgColor="bg-blue-200"
                            iconBg="bg-blue-400"
                        />
                        <StatisticCard
                            title="Partners"
                            value={partnerData?.counts?.total || 0}
                            icon={<TbHeartHandshake className="h-5" />}
                            label="Partners"
                            active={selectedCategory === 'Partners'}
                            onClick={() => setSelectedCategory('Partners')}
                            colorClass="bg-pink-100"
                            activeBgColor="bg-pink-200"
                            iconBg="bg-pink-400"
                        />
                        <StatisticCard
                            title="Teams"
                            value={Employees?.counts?.total || 0}
                            icon={<TbUsersGroup className="h-5" />}
                            label="Teams"
                            active={selectedCategory === 'Teams'}
                            onClick={() => setSelectedCategory('Teams')}
                            colorClass="bg-orange-100"
                            activeBgColor="bg-orange-200"
                            iconBg="bg-orange-400"
                        />
                    </div>
                    <Card bodyClass="px-4 py-3">
                        <div className="flex items-center justify-between">
                            <h6 className="capitalize">
                                {selectedCategory} summary
                            </h6>
                            <Select
                                className="min-w-[140px]"
                                size="sm"
                                defaultValue={{ label: 'All', value: 'All' }}
                                options={[ { label: 'All', value: 'All' }, { label: 'Today', value: 'Today' }, { label: 'Weekly', value: 'Weekly' }, { label: 'Monthly', value: 'Monthly' }, { label: '3 Months', value: '3 Months' }, { label: '6 Months', value: '6 Months' }, { label: 'This Year', value: 'This Year' }, ]}
                            />
                        </div>

                        {selectedCategory === 'Companies' && companyCounts && (
                            <div>
                                <div className="lg:pl-4 flex items-center gap-1 w-full mt-4">
                                    <Bar field="Total" percent={(companyCounts.total / totalCompanies) * 100 || 0} count={companyCounts.total} color="text-[#6610f2]" className="bg-[#6610f2] dark:opacity-70" />
                                    <Bar field="Verified" percent={(companyCounts.verified / totalCompanies) * 100 || 0} count={companyCounts.verified} color="text-[#20c997]" className="bg-[#20c997] dark:opacity-70" />
                                    <Bar field="Non Verified" percent={(companyCounts.non_verified / totalCompanies) * 100 || 0} count={companyCounts.non_verified} color="text-[#e74c3c]" className="bg-[#e74c3c] dark:opacity-70" />
                                    <Bar field="Eligible" percent={(companyCounts.eligible / totalCompanies) * 100 || 0} count={companyCounts.eligible} color="text-[#fd7e14]" className="bg-[#fd7e14] dark:opacity-70" />
                                    <Bar field="Not Eligible" percent={(companyCounts.not_eligible / totalCompanies) * 100 || 0} count={companyCounts.not_eligible} color="text-[#ffc107]" className="bg-[#ffc107] dark:opacity-70" />
                                </div>
                                <div className="mt-8 block gap-2">
                                    <h6 className="mb-3">Company Leaderboard</h6>
                                    <DebouceInput className="w-full mb-2" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} />
                                    <DataTable columns={companyColumns} data={CompanyData?.data || []} />
                                </div>
                            </div>
                        )}

                        {selectedCategory === 'Members' && (
                             <div>
                                <div className='lg:flex gap-2 justify-between mt-4'>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
                                        <Bar field="Total" percent={(MemberData?.counts?.total / MemberData?.counts?.total) * 100 || 0} count={MemberData?.counts?.total || 0} color='text-[#6610f2]' className="bg-[#6610f2] dark:opacity-70" />
                                        <Bar field="Active" percent={(MemberData?.counts?.active / MemberData?.counts?.total) * 100 || 0} count={MemberData?.counts?.active || 0} color='text-[#28a745]' className="bg-[#28a745] dark:opacity-70" />
                                        <Bar field="Disabled" percent={(MemberData?.counts?.disabled / MemberData?.counts?.total) * 100 || 0} count={MemberData?.counts?.disabled || 0} color='text-[#6c757d]' className="bg-[#6c757d] dark:opacity-70" />
                                        <Bar field="Unregistered" percent={(MemberData?.counts?.unregistered / MemberData?.counts?.total) * 100 || 0} count={MemberData?.counts?.unregistered || 0} color='text-[#e74c3c]' className="bg-[#e74c3c] dark:opacity-70" />
                                    </div>
                                </div>
                                <div className='mt-8 block  gap-2'>
                                    <h6 className='mb-3'>Members Leaderboard</h6>
                                    <DebouceInput className="w-full mb-2" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} />
                                    <DataTable columns={memberColumns} data={MemberData?.data || []} />
                                </div>
                            </div>
                        )}
                        
                        {selectedCategory === 'Products' && ProductsData?.counts && (
                            <div>
                                <div className='lg:flex gap-2 justify-between mt-4'>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
                                        <Bar field="Total" percent={(ProductsData.counts.total / ProductsData.counts.total) * 100 || 0} count={ProductsData.counts.total} color='text-[#6610f2]' className="bg-[#6610f2] dark:opacity-70" />
                                        <Bar field="Active" percent={(ProductsData.counts.active / ProductsData.counts.total) * 100 || 0} count={ProductsData.counts.active} color='text-[#28a745]' className="bg-[#28a745] dark:opacity-70" />
                                        <Bar field="Inactive" percent={(ProductsData.counts.inactive / ProductsData.counts.total) * 100 || 0} count={ProductsData.counts.inactive} color='text-[#6c757d]' className="bg-[#6c757d] dark:opacity-70" />
                                        <Bar field="Pending" percent={(ProductsData.counts.pending / ProductsData.counts.total) * 100 || 0} count={ProductsData.counts.pending} color='text-[#ffc107]' className="bg-[#ffc107] dark:opacity-70" />
                                        <Bar field="Categories" percent={(ProductsData.counts.categories / ProductsData.counts.total) * 100 || 0} count={ProductsData.counts.categories} color='text-[#2ecc71]' className="bg-[#2ecc71] dark:opacity-70" />
                                        <Bar field="Brands" percent={(ProductsData.counts.brands / ProductsData.counts.total) * 100 || 0} count={ProductsData.counts.brands} color='text-[#e74c3c]' className="bg-[#e74c3c] dark:opacity-70" />
                                        <Bar field="Wall" percent={(ProductsData.counts.wall / ProductsData.counts.total) * 100 || 0} count={ProductsData.counts.wall} color='text-[#ffc107]' className="bg-[#ffc107] dark:opacity-70" />
                                        <Bar field="Leads" percent={(ProductsData.counts.leads / ProductsData.counts.total) * 100 || 0} count={ProductsData.counts.leads} color='text-[#fd7e14]' className="bg-[#fd7e14] dark:opacity-70" />
                                        <Bar field="Opportunity" percent={(ProductsData.counts.opportunity / ProductsData.counts.total) * 100 || 0} count={ProductsData.counts.opportunity} color='text-[#007bff]' className="bg-[#007bff] dark:opacity-70" />
                                    </div>
                                </div>
                                <div className='mt-8 block  gap-2'>
                                    <h6 className='mb-3'>Products Leaderboard</h6>
                                    <DebouceInput className="w-full mb-2" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} />
                                    <DataTable columns={productColumns} data={ProductsData?.data || []} />
                                </div>
                            </div>
                        )}
                        
                        {selectedCategory === 'Partners' && partnerData?.counts && (
                            <div>
                                <div className='lg:flex gap-2 justify-between mt-4'>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
                                        <Bar field="Total" percent={(partnerData.counts.total / partnerData.counts.total) * 100 || 0} count={partnerData.counts.total} color='text-[#6610f2]' className="bg-[#6610f2] dark:opacity-70" />
                                        <Bar field="Active" percent={(partnerData.counts.active / partnerData.counts.total) * 100 || 0} count={partnerData.counts.active} color='text-[#2ecc71]' className="bg-[#2ecc71] dark:opacity-70" />
                                        <Bar field="Unregistered" percent={(partnerData.counts.unregistered / partnerData.counts.total) * 100 || 0} count={partnerData.counts.unregistered} color='text-[#e74c3c]' className="bg-[#e74c3c] dark:opacity-70" />
                                        <Bar field="Disabled" percent={(partnerData.counts.disabled / partnerData.counts.total) * 100 || 0} count={partnerData.counts.disabled} color='text-[#6c757d]' className="bg-[#6c757d] dark:opacity-70" />
                                        <Bar field="Verified" percent={(partnerData.counts.verified / partnerData.counts.total) * 100 || 0} count={partnerData.counts.verified} color='text-[#6610f2]' className="bg-[#6610f2] dark:opacity-70" />
                                        <Bar field="Unverified" percent={(partnerData.counts.unverified / partnerData.counts.total) * 100 || 0} count={partnerData.counts.unverified} color='text-[#fd7e14]' className="bg-[#fd7e14] dark:opacity-70" />
                                    </div>
                                </div>
                                <div className='mt-8 block  gap-2'>
                                    <h6 className='mb-3'>Partners Leaderboard</h6>
                                    <DebouceInput className="w-full mb-2" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} />
                                    <DataTable columns={partnerColumns} data={partnerData?.data || []} />
                                </div>
                            </div>
                        )}
                        
                        {selectedCategory === 'Teams' && Employees?.counts && (
                            <div>
                                <div className='lg:flex gap-2 justify-between mt-4'>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
                                        <Bar field="Active" percent={(Employees.counts.active / Employees.counts.total) * 100 || 0} count={Employees.counts.active} color='text-[#2ecc71]' className="bg-[#2ecc71] dark:opacity-70" />
                                        <Bar field="Disabled" percent={(Employees.counts.disabled / Employees.counts.total) * 100 || 0} count={Employees.counts.disabled} color='text-[#e74c3c]' className="bg-[#e74c3c] dark:opacity-70" />
                                        <Bar field="Blocked" percent={(Employees.counts.blocked / Employees.counts.total) * 100 || 0} count={Employees.counts.blocked} color='text-[#fd7e14]' className="bg-[#fd7e14] dark:opacity-70" />
                                        <Bar field="On Notice" percent={(Employees.counts.onnotice / Employees.counts.total) * 100 || 0} count={Employees.counts.onnotice} color='text-[#ffc107]' className="bg-[#ffc107] dark:opacity-70" />
                                        <Bar field="Departments" percent={(Employees.counts.department / Employees.counts.total) * 100 || 0} count={Employees.counts.department} color='text-[#6c757d]' className="bg-[#6c757d] dark:opacity-70" />
                                        <Bar field="Designations" percent={(Employees.counts.designation / Employees.counts.total) * 100 || 0} count={Employees.counts.designation} color='text-[#007bff]' className="bg-[#007bff] dark:opacity-70" />
                                    </div>
                                </div>
                                <div className='mt-8 block  gap-2'>
                                    <h6 className='mb-6'>Team Leaderboard</h6>
                                    <DataTable columns={teamColumns} data={Employees?.data?.data || []} />
                                </div>
                            </div>
                        )}
                    </Card>
                </section>
            </section>
        </Card>
    );
};

export default Overview;