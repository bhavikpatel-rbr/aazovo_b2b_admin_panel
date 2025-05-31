// src/views/your-path/SubscribersListing.tsx

import React, {
    useState,
    useMemo,
    useCallback,
    Ref,
    useEffect,
} from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { useForm, Controller } from 'react-hook-form';
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
import { Drawer, Form, FormItem, Input, DatePicker, Tooltip } from '@/components/ui'; // Removed Select and Tag as status/source are removed

// Icons
import {
    TbSearch,
    TbFilter,
    TbCloudUpload,
    TbMail,
    TbReload,
} from 'react-icons/tb';

// Types
import type { OnSortParam, ColumnDef } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';

// Redux
import { useAppDispatch } from '@/reduxtool/store';
import { getSubscribersAction } from '@/reduxtool/master/middleware';
import { masterSelector } from '@/reduxtool/master/masterSlice';
import { useSelector } from 'react-redux';

// Type for data coming directly from API
export type ApiSubscriberItem = {
    id: number | string;
    email: string;
    created_at: string; // ISO date string
    updated_at?: string;
    member_id?: number | string | null;
    status?: string | number; // Keep in API type if API sends it
    source?: string | null;   // Keep in API type if API sends it
};

// --- Define Subscriber Item Type (Mapped for UI) ---
export type SubscriberItem = {
    id: number | string;
    email: string;
    subscribedDate: Date;
    // Status and Source related fields can be kept if the API sends them,
    // but they won't be used for display or filtering in this version.
    rawStatus?: string | number;
    rawSource?: string | null;
};
// --- End Item Type Definition ---


// --- Zod Schema for Filter Form (Date Range Only) ---
const filterFormSchema = z.object({
    dateRange: z.array(z.date().nullable()).length(2).nullable().optional(),
    // filterStatuses and filterSources removed
});
type FilterFormData = z.infer<typeof filterFormSchema>;
// --- End Filter Schema ---

// --- CSV Exporter Utility (Email and Date only) ---
const CSV_HEADERS = ['ID', 'Email', 'Subscribed Date'];
const CSV_KEYS: (keyof SubscriberItem)[] = [
    'id', 'email', 'subscribedDate'
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
                    let cell = row[k];
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
                placeholder="Quick Search..."
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
        rawApiSubscribers = [],
        status: masterLoadingStatus = 'idle',
        error: masterError = null,
    } = useSelector(masterSelector);

    console.log("rawApiSubscribers", rawApiSubscribers);

    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(
        filterFormSchema.parse({})
    );
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: 'desc', key: 'subscribedDate' },
        query: '',
    });

    useEffect(() => {
        dispatch(getSubscribersAction());
    }, [dispatch]);

    useEffect(() => {
        if (masterLoadingStatus === 'failed' && masterError) {
            const errorMessage = typeof masterError === 'string' ? masterError : 'Failed to load subscribers.';
            toast.push(<Notification title="Loading Error" type="danger" duration={4000}>{errorMessage}</Notification>);
        }
    }, [masterLoadingStatus, masterError]);

    const mappedSubscribers = useMemo((): SubscriberItem[] => {
        if (!Array.isArray(rawApiSubscribers) || rawApiSubscribers.length === 0) return [];
        return rawApiSubscribers.map((apiItem: ApiSubscriberItem): SubscriberItem | null => {
            if (!apiItem || !apiItem.created_at) return null; // Basic validation
            return {
                id: apiItem.id,
                email: apiItem.email,
                subscribedDate: new Date(apiItem.created_at),
                // Keep rawStatus and rawSource if they exist in API response, for potential future use
                rawStatus: apiItem.status,
                rawSource: apiItem.source,
            };
        }).filter(item => item !== null) as SubscriberItem[];
    }, [rawApiSubscribers]);

    const filterFormMethods = useForm<FilterFormData>({
        resolver: zodResolver(filterFormSchema),
        defaultValues: filterCriteria,
    });

    const openFilterDrawer = useCallback(() => {
        filterFormMethods.reset(filterCriteria);
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
        const defaultFilters = filterFormSchema.parse({});
        filterFormMethods.reset(defaultFilters);
        setFilterCriteria(defaultFilters);
        handleSetTableData({ pageIndex: 1 });
    }, [filterFormMethods, handleSetTableData]);

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData: SubscriberItem[] = cloneDeep(mappedSubscribers);

        // Apply date range filter
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
        // Status and Source filters removed

        // Apply search query
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter((item) =>
                String(item.id).toLowerCase().includes(query) ||
                item.email.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && processedData.length > 0 && processedData[0].hasOwnProperty(key)) {
            processedData.sort((a, b) => {
                let aVal = a[key as keyof SubscriberItem];
                let bVal = b[key as keyof SubscriberItem];

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

    const handleExportData = useCallback(() => {
        exportSubscribersToCsv('subscribers_export.csv', allFilteredAndSortedData);
    }, [allFilteredAndSortedData]);

    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => {
        handleSetTableData({ pageSize: Number(value), pageIndex: 1 });
    }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query, pageIndex: 1 }), [handleSetTableData]);

    const columns: ColumnDef<SubscriberItem>[] = useMemo(
        () => [
            { header: 'ID', accessorKey: 'id', enableSorting: true, size: 100 },
            { header: 'Email', accessorKey: 'email', enableSorting: true, size: 350 }, // Increased size for email
            {
                header: 'Subscribed Date',
                accessorKey: 'subscribedDate',
                enableSorting: true,
                size: 200,
                cell: (props) => {
                    const date = props.row.original.subscribedDate;
                    return !isNaN(date.getTime()) ? dayjs(date).format('MMM DD, YYYY hh:mm A') : 'Invalid Date';
                }
            },
            // Status and Source columns removed
        ],
        []
    );

    const tableIsLoading = masterLoadingStatus === "idle";

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h5 className="mb-2 sm:mb-0">
                            Subscribers
                        </h5>
                    </div>
                    <SubscriberTableTools
                        onClearFilters={onClearFilters}
                        onSearchChange={handleSearchChange}
                        onFilter={openFilterDrawer}
                        onExport={handleExportData}
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
                            selectable={false} // No row selection
                            onPaginationChange={handlePaginationChange}
                            onSelectChange={handleSelectChange}
                            onSort={handleSort}
                            noData={!tableIsLoading && pageData.length === 0}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            <Drawer
                title="Filters"
                isOpen={isFilterDrawerOpen}
                onClose={closeFilterDrawer}
                onRequestClose={closeFilterDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" onClick={onClearFilters} type="button">
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
                    {/* Status and Source filter FormItems removed */}
                </Form>
            </Drawer>
        </>
    );
};

export default SubscribersListing;