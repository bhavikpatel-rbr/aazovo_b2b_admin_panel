// src/views/your-path/SubscribersListing.tsx

import React, {
    useState,
    useMemo,
    useCallback,
    Ref,
    useEffect,
} from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { useForm, Controller }
from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

// Extend dayjs with the plugins
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard';
import Container from '@/components/shared/Container';
import DataTable from '@/components/shared/DataTable';
import Button from '@/components/ui/Button';
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';
import DebouceInput from '@/components/shared/DebouceInput';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Drawer, Form, FormItem, Input, DatePicker, Tooltip, Tag, Select, Card } from '@/components/ui';
import Avatar from '@/components/ui/Avatar';

// Icons
import {
    TbSearch,
    TbFilter,
    TbCloudUpload,
    TbReload,
    TbPlus,
    TbPencil,
    TbTrash,
    TbUserCircle,
    TbMail,
    TbPhone,
    TbCalendarEvent,
    TbTag,
    TbWorld,
    TbToggleRight,
    TbStar,
    TbFileText,
    TbCaravan,
    TbUserStar,
    TbMailForward,
    TbCalendarCancel,
    TbAlignBoxCenterBottom,
    TbMailbox,
    TbSend
} from 'react-icons/tb';

// Types
import type { OnSortParam, ColumnDef } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';
import { SelectOption } from '../RequestFeedback/RequestAndFeedback';

// Redux
import { useAppDispatch } from '@/reduxtool/store';
import { addSubscriberAction, editSubscriberAction, getSubscribersAction,
submitExportReasonAction} from '@/reduxtool/master/middleware';
import { masterSelector } from '@/reduxtool/master/masterSlice';
import { useSelector } from 'react-redux';
import { el } from '@fullcalendar/core/internal-common';

// --- Define Types ---

// Type for data coming directly from API
export type ApiSubscriberItem = {
    id: number | string;
    email: string;
    name?: string | null;
    mobile?: string | null;
    created_at: string;
    updated_at?: string;
    member_id?: number | string | null;
    status: string;
    subscription_type?: string | null;
    source?: string | null;
    rating?: number | string | null;
    note?: string | null;
    reason?: string | null;
};

// --- Define Subscriber Item Type (Mapped for UI and Form) ---
export type SubscriberItem = {
    id: number | string;
    email: string;
    name: string;
    mobile_no: string;
    subscribedDate: Date;
    subscriptionType: string;
    source: string;
    status: string;
    rating: number | null;
    note: string;
    unsubscribeReason: string;
    raw_created_at: string;
    raw_updated_at?: string;
};

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
    dateRange: z.array(z.date().nullable()).length(2).nullable().optional(),
    status: z.string().optional().nullable(), // MODIFIED: Added status filter
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Zod Schema for Add/Edit Subscriber Form ---
export const SUBSCRIPTION_TYPE_OPTIONS: SelectOption[] = [
    { label: "Newsletter", value: "Newsletter" },
    { label: "Promotions", value: "Promotions" },
    { label: "Product Updates", value: "Product Updates" },
    { label: "Others", value: "Others" },
];
const subscriptionTypeValues = SUBSCRIPTION_TYPE_OPTIONS.map(opt => opt.value) as [string, ...string[]];

export const STATUS_OPTIONS: SelectOption[] = [
    { label: "Active", value: "Active" },
    { label: "Unsubscribed", value: "Unsubscribed" },
    { label: "Bounced", value: "Bounced" },
];
const statusValues = STATUS_OPTIONS.map(opt => opt.value) as [string, ...string[]];

// Options for the filter dropdown, including an "All" option
export const FILTER_STATUS_OPTIONS: SelectOption[] = [
    { label: "All Statuses", value: "" }, // Use empty string to signify no filter for status
    ...STATUS_OPTIONS,
];

export const statusColors: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
    Unsubscribed: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
    Bounced: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100',
    default: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const addEditSubscriberFormSchema = z.object({
    email: z.string().min(1, "Email is required.").email("Invalid email address."),
    name: z.string().min(1, "Name is required.").max(100),
    mobile_no: z.string().min(1, "Mobile number is required.").max(20),
    subscribedDate: z.date({ required_error: "Subscription date is required." }),
    subscriptionType: z.enum(subscriptionTypeValues, { required_error: "Subscription type is required." }),
    source: z.string().min(1, "Source is required.").max(100),
    status: z.enum(statusValues, { required_error: "Status is required." }),
    rating: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
        z.number().min(1).max(5).optional().nullable()
    ),
    note: z.string().max(1000).optional().nullable(),
    unsubscribeReason: z.string().max(255).optional().nullable(),
}).refine(data => !(data.status === 'Unsubscribed' && !data.unsubscribeReason?.trim()), {
    message: "Unsubscribe reason is required if status is 'Unsubscribed'.",
    path: ["unsubscribeReason"],
});

type AddEditSubscriberFormData = z.infer<typeof addEditSubscriberFormSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z.string().min(1, "Reason for export is required.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS = [
    'ID', 'Name', 'Email', 'Mobile No',
    'Subscribed Date', 'Subscription Type', 'Source',
    'Status', 'Rating', 'Notes', 'Unsubscribe Reason'
];
const CSV_KEYS: (keyof SubscriberItem)[] = [
    'id', 'name', 'email', 'mobile_no',
    'subscribedDate', 'subscriptionType', 'source',
    'status', 'rating', 'note', 'unsubscribeReason'
];

function exportSubscribersToCsv(filename: string, rows: SubscriberItem[]) {
    if (!rows || !rows.length) {
        toast.push(<Notification title="No Data" type="info" duration={2000}>Nothing to export.</Notification>);
        return false;
    }
    const separator = ',';
    const csvContent =
        CSV_HEADERS.join(separator) +
        '\n' +
        rows
            .map((row) => {
                return CSV_KEYS.map((k) => {
                    let cell = row[k] as any;
                    if (cell === null || cell === undefined) {
                        cell = '';
                    } else if (cell instanceof Date) {
                        cell = dayjs(cell).format('YYYY-MM-DD HH:mm:ss');
                    } else {
                        cell = String(cell).replace(/"/g, '""');
                    }
                    if (String(cell).search(/("|,|\n)/g) >= 0) {
                        cell = `"${cell}"`;
                    }
                    return cell;
                }).join(separator);
            })
            .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
    }
    toast.push(<Notification title="Export Failed" type="danger" duration={3000}>Browser does not support this feature.</Notification>);
    return false;
}


// --- SubscriberSearch Component ---
type SubscriberSearchProps = {
    onInputChange: (value: string) => void;
    ref?: Ref<HTMLInputElement>;
};
const SubscriberSearch = React.forwardRef<HTMLInputElement, SubscriberSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                className="w-full"
                placeholder="Quick Search (ID, Email, Name, Mobile)..."
                suffix={<TbSearch className="text-lg" />}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e.target.value)}
            />
        );
    }
);
SubscriberSearch.displayName = 'SubscriberSearch';

// --- SubscriberTableTools Component ---
const SubscriberTableTools = ({
    onSearchChange,
    onFilter,
    onExport,
    onClearFilters
}: {
    onSearchChange: (query: string) => void;
    onFilter: () => void;
    onExport: () => void;
    onClearFilters: () => void;
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
            <div className="flex-grow">
                <SubscriberSearch onInputChange={onSearchChange} />
            </div>
            <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
                <Tooltip title="Clear Filters">
                    <Button icon={<TbReload />} onClick={onClearFilters}></Button>
                </Tooltip>
                <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">
                    Filter
                </Button>
                <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">
                    Export
                </Button>
            </div>
        </div>
    );
};
SubscriberTableTools.displayName = 'SubscriberTableTools';

// --- Main SubscribersListing Component ---
const SubscribersListing = () => {
    const dispatch = useAppDispatch();

    const {
        rawApiSubscribers = { data: [], counts: {} },
        status: masterLoadingStatus = 'idle',
        error: masterError = null,
    } = useSelector(masterSelector);

    const [isAddEditDrawerOpen, setIsAddEditDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<SubscriberItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<SubscriberItem | null>(null);
    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);

    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(
        filterFormSchema.parse({}) // Initializes with dateRange: undefined, status: undefined
    );
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: 'desc', key: 'subscribedDate' },
        query: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
    const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);


    useEffect(() => {
        dispatch(getSubscribersAction());
    }, [dispatch]);

    useEffect(() => {
        if (masterLoadingStatus === 'failed' && masterError) {
            const errorMessage = typeof masterError === 'string' ? masterError : 'Failed to load subscribers.';
            toast.push(<Notification title="Loading Error" type="danger" duration={4000}>{errorMessage}</Notification>);
        }
    }, [masterLoadingStatus, masterError]);

    const formMethods = useForm<AddEditSubscriberFormData>({
        resolver: zodResolver(addEditSubscriberFormSchema),
        mode: "onChange",
    });
    const { control, handleSubmit, reset, formState: { errors, isValid }, watch } = formMethods;
    const currentStatusWatch = watch("status"); // Renamed to avoid conflict

    const exportReasonFormMethods = useForm<ExportReasonFormData>({
        resolver: zodResolver(exportReasonSchema),
        defaultValues: { reason: "" },
        mode: "onChange",
    });

    const filterFormMethods = useForm<FilterFormData>({
        resolver: zodResolver(filterFormSchema),
        // defaultValues will be set from filterCriteria when opening the drawer
    });

    const mappedSubscribers = useMemo((): SubscriberItem[] => {
        if (!Array.isArray(rawApiSubscribers?.data) || rawApiSubscribers?.data.length === 0) return [];
        return rawApiSubscribers.data.map((apiItem: ApiSubscriberItem): SubscriberItem | null => {
            if (!apiItem || !apiItem.created_at || !apiItem.email || !apiItem.status) return null;
            return {
                id: apiItem.id,
                email: apiItem.email,
                name: apiItem.name || '',
                mobile_no: apiItem.mobile || '',
                subscribedDate: new Date(apiItem.created_at),
                subscriptionType: apiItem.subscription_type || SUBSCRIPTION_TYPE_OPTIONS[0].value,
                source: apiItem.source || '',
                status: apiItem.status,
                rating: apiItem.rating ? (typeof apiItem.rating === 'string' ? parseInt(apiItem.rating, 10) : apiItem.rating) : null,
                note: apiItem.note || '',
                unsubscribeReason: apiItem.reason || '',
                raw_created_at: apiItem.created_at,
                raw_updated_at: apiItem.updated_at,
            };
        }).filter(item => item !== null) as SubscriberItem[];
    }, [rawApiSubscribers?.data]);

    const defaultFormValues: AddEditSubscriberFormData = useMemo(() => ({
        email: "",
        name: "",
        mobile_no: "",
        subscribedDate: new Date(),
        subscriptionType: SUBSCRIPTION_TYPE_OPTIONS[0].value,
        source: "",
        status: STATUS_OPTIONS[0].value,
        rating: null,
        note: "",
        unsubscribeReason: "",
    }), []);

    const openAddDrawer = useCallback(() => {
        reset(defaultFormValues);
        setEditingItem(null);
        setIsAddEditDrawerOpen(true);
    }, [reset, defaultFormValues]);

    const openEditDrawer = useCallback((item: SubscriberItem) => {
        setEditingItem(item);
         console.log("data0", item);
        reset({
            email: item.email,
            name: item.name,
            mobile_no: item.mobile_no,
            subscribedDate: item.subscribedDate,
            subscriptionType: item.subscriptionType,
            source: item.source,
            status: item.status,
            rating: item.rating,
            note: item.note,
            unsubscribeReason: item.unsubscribeReason,
        });
        setIsAddEditDrawerOpen(true);
    }, [reset]);

    const closeAddEditDrawer = useCallback(() => {
        setEditingItem(null);
        setIsAddEditDrawerOpen(false);
    }, []);

    const onSubmitHandler = async (data: AddEditSubscriberFormData) => {
       
        let apiPayload = {}
        setIsSubmitting(true);

        if (editingItem) {
            apiPayload = {
                _method: "PUT",
            email: data.email,
            name: data.name,
            mobile: data.mobile_no,
            created_at: dayjs(data.subscribedDate).toISOString(),
            subscription_type: data.subscriptionType,
            source: data.source,
            status: data.status,
            rating: data.rating ? Number(data.rating) : null,
            note: data.note || null,
            reason: data.status === 'Unsubscribed' ? (data.unsubscribeReason || null) : null,

        };
        }else{
apiPayload = {
            email: data.email,
            name: data.name,
            mobile: data.mobile_no,
            created_at: dayjs(data.subscribedDate).toISOString(),
            subscription_type: data.subscriptionType,
            source: data.source,
            status: data.status,
            rating: data.rating ? Number(data.rating) : null,
            note: data.note || null,
            reason: data.status === 'Unsubscribed' ? (data.unsubscribeReason || null) : null,
        };
        }
        

        try {
            if (editingItem) {
                await dispatch(editSubscriberAction({ id: editingItem.id, formData: apiPayload })).unwrap();
                toast.push(<Notification title="Subscriber Updated" type="success" />);
            } else {
                await dispatch(addSubscriberAction(apiPayload)).unwrap();
                toast.push(<Notification title="Subscriber Added" type="success" />);
            }
            closeAddEditDrawer();
            dispatch(getSubscribersAction());
        } catch (e: any) {
            console.log("e",e);
            
            const errorMessage = e?.response?.data?.message || e?.message || (editingItem ? "Update Failed" : "Add Failed");
            toast.push(<Notification title={editingItem ? "Update Failed" : "Add Failed"} type="danger">{errorMessage}</Notification>);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = useCallback((item: SubscriberItem) => {
        setItemToDelete(item);
        setSingleDeleteConfirmOpen(true);
    }, []);

    const onConfirmSingleDelete = useCallback(async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        setSingleDeleteConfirmOpen(false);
        try {
            console.log("Mock Dispatch deleteSubscriberAction with ID:", itemToDelete.id);
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.push(<Notification title="Subscriber Deleted" type="success" >{`Subscriber "${itemToDelete.name}" deleted.`}</Notification>);
            dispatch(getSubscribersAction());
        } catch (e: any) {
            toast.push(<Notification title="Delete Failed" type="danger">{(e as Error).message}</Notification>);
        } finally {
            setIsDeleting(false);
            setItemToDelete(null);
        }
    }, [dispatch, itemToDelete]);


    const openFilterDrawer = useCallback(() => {
        filterFormMethods.reset(filterCriteria); // Set form with current filter values
        setIsFilterDrawerOpen(true);
    }, [filterFormMethods, filterCriteria]);

    const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);

    const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
        setTableData((prev) => ({ ...prev, ...data }));
    }, []);

    const onApplyFiltersSubmit = useCallback((data: FilterFormData) => {
        setFilterCriteria(data);
        handleSetTableData({ pageIndex: 1 });
        closeFilterDrawer();
    }, [handleSetTableData, closeFilterDrawer]);

    const onClearFilters = useCallback(() => {
        const defaultFilters = filterFormSchema.parse({}); // { dateRange: undefined, status: undefined }
        filterFormMethods.reset(defaultFilters);
        setFilterCriteria(defaultFilters);
        setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" }));
    }, [filterFormMethods]);

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData: SubscriberItem[] = cloneDeep(mappedSubscribers);

        // Date Range Filter
        if (filterCriteria.dateRange && (filterCriteria.dateRange[0] || filterCriteria.dateRange[1])) {
            const [startDate, endDate] = filterCriteria.dateRange;
            const start = startDate && dayjs(startDate).isValid() ? dayjs(startDate).startOf('day') : null;
            const end = endDate && dayjs(endDate).isValid() ? dayjs(endDate).endOf('day') : null;

            processedData = processedData.filter(item => {
                if (isNaN(item.subscribedDate.getTime())) return false;
                const itemDate = dayjs(item.subscribedDate);
                if (start && end) return itemDate.isBetween(start, end, 'day', '[]');
                if (start) return itemDate.isSameOrAfter(start, 'day');
                if (end) return itemDate.isSameOrBefore(end, 'day');
                return true;
            });
        }

        // MODIFIED: Status Filter
        if (filterCriteria.status && filterCriteria.status !== "") { // Check for non-empty string
            processedData = processedData.filter(item => item.status === filterCriteria.status);
        }

        // Search Query Filter
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter((item) =>
                String(item.id).toLowerCase().includes(query) ||
                item.email.toLowerCase().includes(query) ||
                item.name.toLowerCase().includes(query) ||
                item.mobile_no.toLowerCase().includes(query)
            );
        }

        // Sorting
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && processedData.length > 0 && processedData[0].hasOwnProperty(key)) {
            processedData.sort((a, b) => {
                let aVal = a[key as keyof SubscriberItem] as any;
                let bVal = b[key as keyof SubscriberItem] as any;

                if (aVal instanceof Date && bVal instanceof Date) {
                    if (isNaN(aVal.getTime())) return order === 'asc' ? 1 : -1;
                    if (isNaN(bVal.getTime())) return order === 'asc' ? -1 : 1;
                    return order === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
                }
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return order === 'asc' ? aVal - bVal : bVal - aVal;
                }
                const strA = String(aVal ?? '').toLowerCase();
                const strB = String(bVal ?? '').toLowerCase();
                return order === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
            });
        }

        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number;
        const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        const dataForPage = processedData.slice(startIndex, startIndex + pageSize);

        return {
            pageData: dataForPage,
            total: currentTotal,
            allFilteredAndSortedData: processedData,
        };
    }, [mappedSubscribers, tableData, filterCriteria]);


    const handleOpenExportReasonModal = useCallback(() => {
        if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) {
          toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
          return;
        }
        exportReasonFormMethods.reset({ reason: "" });
        setIsExportReasonModalOpen(true);
    }, [allFilteredAndSortedData, exportReasonFormMethods]);

    const handleConfirmExportWithReason = useCallback(async (data: ExportReasonFormData) => {
        setIsSubmittingExportReason(true);
        const moduleName = "Subscribers";
        const timestamp = dayjs().format('YYYYMMDD_HHmmss');
        const fileName = `subscribers_export_${timestamp}.csv`;
        try {
             await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName, file_name: fileName })).unwrap();
            toast.push(<Notification title="Export Reason Submitted" type="success" />);
            exportSubscribersToCsv(fileName, allFilteredAndSortedData);
            setIsExportReasonModalOpen(false);
        } catch (error: any) {
            toast.push(<Notification title="Operation Failed" type="danger" >{(error as Error).message || "Could not complete export."}</Notification>);
        }
        finally { setIsSubmittingExportReason(false); }
    }, [dispatch, allFilteredAndSortedData]);


    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => {
        handleSetTableData({ pageSize: Number(value), pageIndex: 1 });
    }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query, pageIndex: 1 }), [handleSetTableData]);

    const columns: ColumnDef<SubscriberItem>[] = useMemo(
        () => [
            {
                header: "Subscriber Info",
                accessorKey: "name",
                cell: (props) => {
                    const rowData = props.row.original;
                    return (
                        <div className="flex items-center gap-2">
                             <Avatar size="sm" shape="circle" className="mr-1">{rowData.name?.[0]?.toUpperCase()}</Avatar>
                            <div className="flex flex-col gap-0.5">
                                <span className="font-semibold">{rowData.name}</span>
                                <div className="text-xs text-gray-500">{rowData.email}</div>
                                <div className="text-xs text-gray-500">{rowData.mobile_no}</div>
                            </div>
                        </div>
                    );
                },
            },
            {
                header: 'Type',
                accessorKey: 'subscriptionType',
                enableSorting: true,
                cell: (props) => <Tag className="capitalize whitespace-nowrap">{props.getValue() as string || "N/A"}</Tag>
            },
            {
                header: 'Source',
                accessorKey: 'source',
                enableSorting: true,
                cell: (props) => <span>{props.getValue() as string || "N/A"}</span>
            },
            {
                header: "Status",
                accessorKey: "status",
                cell: (props) => {
                    const statusVal = props.getValue() as string;
                    return (
                        <Tag className={`capitalize whitespace-nowrap  text-center ${statusColors[statusVal] || statusColors.default}`}>
                            {statusVal || "N/A"}
                        </Tag>
                    );
                },
            },
            {
                header: 'Subscribed Date',
                accessorKey: 'subscribedDate',
                enableSorting: true,
                size: 180,
                cell: (props) => {
                    const date = props.row.original.subscribedDate;
                    return !isNaN(date.getTime()) ? <span className='text-xs'>{dayjs(date).format('MMM DD, YYYY hh:mm A')}</span> : 'Invalid Date';
                }
            },
             {
                header: "Rating",
                accessorKey: "rating",
                enableSorting: true,
                size: 80,
                cell: (props) => props.getValue() ? <span className="flex items-center gap-1"><TbStar className="text-amber-500" />{`${props.getValue()}`}</span> : "N/A"
            },
            {
                header: "Action",
                id: "action",
                size: 120,
                meta: { HeaderClass: "text-center" },
                cell: (props) => (
                    <div className='flex gap-1 items-center pr-1.5'>
                        <Tooltip title="Edit Subscriber">
                            <div className="text-xl cursor-pointer text-gray-500 hover:text-emerald-600" onClick={() => openEditDrawer(props.row.original)} role="button"><TbPencil /></div>
                        </Tooltip>
                        <Tooltip title="Send Test Email">
                            <div className="text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600" role="button">
                                <TbMailForward size={18} />
                            </div>
                        </Tooltip>
                        <Tooltip title="Add to Campaign">
                            <div className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600" role="button">
                                <TbAlignBoxCenterBottom size={17} />
                            </div>
                        </Tooltip>
                        <Tooltip title="Email Log">
                            <div className="text-xl cursor-pointer select-none text-gray-500 hover:text-red-600" role="button">
                                <TbMailbox size={18} />
                            </div>
                        </Tooltip>
                        <Tooltip title="Send Now">
                            <div className="text-xl cursor-pointer select-none text-gray-500 hover:text-red-600" role="button">
                                <TbSend size={18} />
                            </div>
                        </Tooltip>
                    </div>
                ),
            },
        ],
        [openEditDrawer, handleDeleteClick]
    );

    const tableIsLoading = masterLoadingStatus === "loading" || isDeleting;

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h5 className="mb-2 sm:mb-0">Subscribers</h5>
                        <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New</Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-4 gap-2">
                        <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200 dark:border-blue-700/60">
                            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-500 dark:text-blue-200"><TbCaravan size={24} /></div>
                            <div><h6 className="text-blue-500 dark:text-blue-200">{rawApiSubscribers?.counts?.total || 0}</h6><span className="font-semibold text-xs">Total</span></div>
                        </Card>
                         <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-violet-200 dark:border-violet-700/60">
                            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 dark:bg-violet-500/20 text-violet-500 dark:text-violet-200"><TbUserStar size={24} /></div>
                            <div><h6 className="text-violet-500 dark:text-violet-200">{rawApiSubscribers?.counts?.new || 0}</h6><span className="font-semibold text-xs">New</span></div>
                        </Card>
                        <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-200 dark:border-green-700/60">
                            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 dark:bg-green-500/20 text-green-500 dark:text-green-200"><TbMailForward size={24} /></div>
                            <div><h6 className="text-green-500 dark:text-green-200">{rawApiSubscribers?.counts?.active || 0}</h6><span className="font-semibold text-xs">Active</span></div>
                        </Card>
                        <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200 dark:border-red-700/60">
                            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-200"><TbCalendarCancel size={24} /></div>
                            <div><h6 className="text-red-500 dark:text-red-200">{rawApiSubscribers?.counts?.unsubscribed || 0}</h6><span className="font-semibold text-xs">Unsubscribed</span></div>
                        </Card>
                    </div>

                    <SubscriberTableTools
                        onClearFilters={onClearFilters}
                        onSearchChange={handleSearchChange}
                        onFilter={openFilterDrawer}
                        onExport={handleOpenExportReasonModal}
                    />
                    <div className="mt-4 flex-grow overflow-auto">
                        <DataTable
                            columns={columns}
                            data={pageData}
                            loading={tableIsLoading}
                            pagingData={{
                                total: total,
                                pageIndex: tableData.pageIndex as number,
                                pageSize: tableData.pageSize as number,
                            }}
                            selectable={false}
                            onPaginationChange={handlePaginationChange}
                            onSelectChange={handleSelectChange}
                            onSort={handleSort}
                            noData={!tableIsLoading && pageData.length === 0}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            <Drawer
                title={editingItem ? "Edit Subscriber" : "Add New Subscriber"}
                width={520}
                isOpen={isAddEditDrawerOpen}
                onClose={closeAddEditDrawer}
                onRequestClose={closeAddEditDrawer}
                footer={
                    <div className="w-full flex gap-2 justify-end">
                        <Button size="sm" type="button" onClick={closeAddEditDrawer} disabled={isSubmitting}>Cancel</Button>
                        <Button
                            size="sm"
                            variant="solid"
                            type="submit"
                            form="addEditSubscriberForm"
                            loading={isSubmitting}
                            disabled={!isValid || isSubmitting}
                        >
                            {isSubmitting ? (editingItem ? 'Saving...' : 'Adding...') : (editingItem ? 'Save Changes' : 'Add Subscriber')}
                        </Button>
                    </div>
                }
            >
                <Form id="addEditSubscriberForm" onSubmit={handleSubmit(onSubmitHandler)} className="flex flex-col gap-y-4">
                    <FormItem label={<div>Email<span className="text-red-500"> *</span></div>} invalid={!!errors.email} errorMessage={errors.email?.message}>
                        <Controller name="email" control={control} render={({ field }) => <Input {...field} type='email' placeholder='Enter Email Address' prefix={<TbMail />} />} />
                    </FormItem>
                    <FormItem label={<div>Name<span className="text-red-500"> *</span></div>} invalid={!!errors.name} errorMessage={errors.name?.message}>
                        <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder='Enter Name' prefix={<TbUserCircle />} />} />
                    </FormItem>
                    <div className='md:grid grid-cols-2 gap-3'>
                        <FormItem label={<div>Mobile No.<span className="text-red-500"> *</span></div>} invalid={!!errors.mobile_no} errorMessage={errors.mobile_no?.message}>
                            <Controller name="mobile_no" control={control} render={({ field }) => <Input {...field} type='tel' placeholder='Enter Mobile No.' prefix={<TbPhone />} />} />
                        </FormItem>
                        <FormItem label={<div>Subscription Date<span className="text-red-500"> *</span></div>} invalid={!!errors.subscribedDate} errorMessage={errors.subscribedDate?.message}>
                            <Controller name="subscribedDate" control={control} render={({ field }) => <DatePicker {...field} placeholder='Pick Subscription Date' value={field.value} />} />
                        </FormItem>
                    </div>
                    <div className='md:grid grid-cols-2 gap-3'>
                        <FormItem label={<div>Subscription Type<span className="text-red-500"> *</span></div>} invalid={!!errors.subscriptionType} errorMessage={errors.subscriptionType?.message}>
                             <Controller name="subscriptionType" control={control} render={({ field }) => (
                                <Select {...field} placeholder="Select Subscription Type" options={SUBSCRIPTION_TYPE_OPTIONS} value={SUBSCRIPTION_TYPE_OPTIONS.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} />
                            )} />
                        </FormItem>
                        <FormItem label={<div>Source<span className="text-red-500"> *</span></div>} invalid={!!errors.source} errorMessage={errors.source?.message}>
                            <Controller name="source" control={control} render={({ field }) => <Input {...field} placeholder='Enter Source (e.g., Website, Facebook)' prefix={<TbWorld />} />} />
                        </FormItem>
                    </div>
                    <div className='md:grid grid-cols-2 gap-3'>
                        <FormItem label={<div>Status<span className="text-red-500"> *</span></div>} invalid={!!errors.status} errorMessage={errors.status?.message}>
                            <Controller name="status" control={control} render={({ field }) => (
                                <Select {...field} placeholder="Select Status" options={STATUS_OPTIONS} value={STATUS_OPTIONS.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} />
                            )} />
                        </FormItem>
                        <FormItem label="Rating (1-5)" invalid={!!errors.rating} errorMessage={errors.rating?.message}>
                            <Controller name="rating" control={control} render={({ field }) => <Input {...field} type="number" min="1" max="5" placeholder='Enter Rating (Optional)' value={field.value ?? ""} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} prefix={<TbStar />} />} />
                        </FormItem>
                    </div>
                     {currentStatusWatch === 'Unsubscribed' && ( // MODIFIED: used renamed watch variable
                        <FormItem label={<div>Unsubscribe Reason<span className="text-red-500"> *</span></div>} invalid={!!errors.unsubscribeReason} errorMessage={errors.unsubscribeReason?.message}>
                            <Controller name="unsubscribeReason" control={control} render={({ field }) => <Input {...field} placeholder='Describe unsubscribe reason' textArea rows={3} />} />
                        </FormItem>
                    )}
                    <FormItem label="Notes" invalid={!!errors.note} errorMessage={errors.note?.message}>
                        <Controller name="note" control={control} render={({ field }) => <Input {...field} placeholder='Write a note (Optional)' textArea rows={3} prefix={<TbFileText />} />} />
                    </FormItem>
                </Form>
            </Drawer>

            {/* MODIFIED: Filter Drawer */}
            <Drawer
                title="Filters"
                isOpen={isFilterDrawerOpen}
                onClose={closeFilterDrawer}
                onRequestClose={closeFilterDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">
                            Clear
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            form="filterSubscriberForm"
                            type="submit"
                        >
                            Apply
                        </Button>
                    </div>
                }
            >
                <Form
                    id="filterSubscriberForm"
                    onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
                    className="flex flex-col gap-y-6"
                >
                    <FormItem label="Subscribed Date Range">
                        <Controller
                            name="dateRange"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <DatePicker.DatePickerRange
                                    placeholder="Select date range"
                                    value={field.value as [Date | null, Date | null] | null | undefined}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Status">
                        <Controller
                            name="status"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select status"
                                    options={FILTER_STATUS_OPTIONS}
                                    value={FILTER_STATUS_OPTIONS.find(option => option.value === (field.value || ""))}
                                    onChange={(option) => field.onChange(option?.value || "")} // Set to empty string for "All"
                                    isClearable={false} // "All Statuses" acts as clear
                                />
                            )}
                        />
                    </FormItem>
                </Form>
            </Drawer>

            <ConfirmDialog
                isOpen={singleDeleteConfirmOpen}
                type="danger"
                title="Delete Subscriber"
                onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onConfirm={onConfirmSingleDelete}
                loading={isDeleting}
            >
                <p>Are you sure you want to delete the subscriber "<strong>{itemToDelete?.name} ({itemToDelete?.email})</strong>"? This action cannot be undone.</p>
            </ConfirmDialog>

            <ConfirmDialog
                isOpen={isExportReasonModalOpen}
                type="info"
                title="Reason for Export"
                onClose={() => setIsExportReasonModalOpen(false)}
                onRequestClose={() => setIsExportReasonModalOpen(false)}
                onCancel={() => setIsExportReasonModalOpen(false)}
                onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)}
                loading={isSubmittingExportReason}
                confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"}
                cancelText="Cancel"
                confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}
            >
                <Form
                id="exportSubscriberReasonForm"
                onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }}
                className="flex flex-col gap-4 mt-2"
                >
                <FormItem
                    label="Please provide a reason for exporting this data:"
                    invalid={!!exportReasonFormMethods.formState.errors.reason}
                    errorMessage={exportReasonFormMethods.formState.errors.reason?.message}
                >
                    <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
                </FormItem>
                </Form>
            </ConfirmDialog>
        </>
    );
};

export default SubscribersListing;