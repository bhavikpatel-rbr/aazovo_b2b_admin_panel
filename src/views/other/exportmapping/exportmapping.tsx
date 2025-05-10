// src/views/your-path/ExportMapping.tsx

import React, {
    useState,
    useMemo,
    useCallback,
    Ref,
    useEffect, // Added useEffect
    // Suspense, // Not needed if custom export is used and CSVLink removed
    // lazy, // Not needed if custom export is used and CSVLink removed
} from 'react'
// import { Link, useNavigate } from 'react-router-dom'; // useNavigate not used in this pattern for view-only
import cloneDeep from 'lodash/cloneDeep' // Keep for data processing
import { useForm, Controller } from 'react-hook-form' // For filter form
import { zodResolver } from '@hookform/resolvers/zod' // For filter form schema
import { z } from 'zod' // For filter form schema

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
// import ConfirmDialog from '@/components/shared/ConfirmDialog'; // Not needed if no delete
// import StickyFooter from '@/components/shared/StickyFooter'; // Not needed if no bulk actions
import DebouceInput from '@/components/shared/DebouceInput'
import { Drawer, Form, FormItem, Input, Select as UiSelect, DatePicker } from '@/components/ui' // Renamed Select
import { IoEyeOutline } from 'react-icons/io5'
import userIcon from '/img/avatars/thumb-1.jpg' // Assuming this path is correct

// Icons
import {
    TbSearch,
    TbFilter,
    TbCloudUpload, // For custom export button
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import { useAppDispatch } from '@/reduxtool/store'
import { getExportMappingAction1 } from '@/reduxtool/master/middleware' // Ensure this action exists
import { masterSelector } from '@/reduxtool/master/masterSlice'


// --- Define Item Type (Table Row Data) matching your API response ---
export type UserRole = {
    id: number;
    name: string;
    display_name: string;
    pivot: {
        user_id: number;
        role_id: number;
    };
};

export type User = {
    id: number;
    name: string;
    roles: UserRole[];
};

export type ExportMappingItem = {
    id: number; // API returns number
    user_id: number;
    export_from: string;
    file_name: string;
    export_reason: string | null;
    created_at: string; // Date string from API
    updated_at: string; // Date string from API
    user: User;
};
// --- End Item Type Definition ---


// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
    filterUserNames: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    filterUserRoles: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    filterExportFrom: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    filterDateRange: z.custom<[Date | null, Date | null] | null>((val) => {
        if (val === null) return true; // Allow null
        if (Array.isArray(val) && val.length === 2) {
            return (val[0] === null || val[0] instanceof Date) && (val[1] === null || val[1] instanceof Date);
        }
        return false;
    }, "Invalid date range").optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>

// --- CSV Exporter Utility ---
const CSV_HEADERS_EXPORT_MAPPING = ['Record ID', 'User Name', 'User Role', 'Exported From', 'File Name', 'Reason', 'Export Date']
// Define a type for the data being passed to the CSV exporter
type ExportMappingCsvItem = {
    id: number;
    userName: string;
    userRole: string;
    export_from: string;
    file_name: string;
    export_reason: string | null;
    created_at: string; // Keep as string for direct export
};

function exportToCsvExportMapping(filename: string, rows: ExportMappingItem[]) {
    if (!rows || !rows.length) {
        toast.push(
            <Notification title="No Data" type="info">
                Nothing to export.
            </Notification>,
        )
        return false
    }

    const transformedRows: ExportMappingCsvItem[] = rows.map(item => ({
        id: item.id,
        userName: item.user.name,
        userRole: item.user.roles.map(role => role.display_name).join(', ') || 'N/A',
        export_from: item.export_from,
        file_name: item.file_name,
        export_reason: item.export_reason,
        created_at: new Date(item.created_at).toLocaleString(), // Format date for readability
    }));

    const csvKeys: (keyof ExportMappingCsvItem)[] = ['id', 'userName', 'userRole', 'export_from', 'file_name', 'export_reason', 'created_at'];


    const separator = ','

    const csvContent =
        CSV_HEADERS_EXPORT_MAPPING.join(separator) +
        '\n' +
        transformedRows
            .map((row) => {
                return csvKeys.map((k) => {
                    let cell = row[k]
                    if (cell === null || cell === undefined) {
                        cell = ''
                    } else {
                        cell = String(cell).replace(/"/g, '""')
                    }
                    if (String(cell).search(/("|,|\n)/g) >= 0) {
                        cell = `"${cell}"`
                    }
                    return cell
                }).join(separator)
            })
            .join('\n')

    const blob = new Blob(['\ufeff' + csvContent], {
        type: 'text/csv;charset=utf-8;',
    })
    const link = document.createElement('a')
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        return true
    }
    toast.push(
        <Notification title="Export Failed" type="danger">
            Browser does not support this feature.
        </Notification>,
    )
    return false
}

// --- ActionColumn Component (View Only) ---
const ActionColumn = ({ data }: { data: ExportMappingItem }) => {
    const [isViewDrawerOpen, setIsViewDrawerOpen] = useState<boolean>(false)
    const openViewDrawer = () => setIsViewDrawerOpen(true)
    const closeViewDrawer = () => setIsViewDrawerOpen(false)

    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <>
            <div className="flex items-center justify-center">
                <Tooltip title="View Record">
                    <div
                        className={classNames(
                            iconButtonClass,
                            hoverBgClass,
                            'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400',
                        )}
                        role="button"
                        onClick={openViewDrawer}
                    >
                        <IoEyeOutline />
                    </div>
                </Tooltip>
            </div>
            <Drawer
                title="View Export Details"
                isOpen={isViewDrawerOpen}
                onClose={closeViewDrawer}
                onRequestClose={closeViewDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" onClick={closeViewDrawer}>
                            Close
                        </Button>
                    </div>
                }
            >
                <div className="p-4 space-y-4">
                    <div>
                        <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Exported By:</h6>
                        <div className="flex items-center gap-2">
                            <img
                                src={userIcon} // Replace with actual user avatar if available
                                alt={data.user.name}
                                className="h-10 w-10 rounded-full object-cover"
                            />
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-white">{data.user.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {data.user.roles.map(role => role.display_name).join(', ') || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Export Details:</h6>
                        <p><span className="font-medium text-gray-600 dark:text-gray-300">Exported From:</span> {data.export_from}</p>
                        <p><span className="font-medium text-gray-600 dark:text-gray-300">File Name:</span> {data.file_name}</p>
                        <p><span className="font-medium text-gray-600 dark:text-gray-300">Export Date:</span> {new Date(data.created_at).toLocaleString()}</p>
                    </div>

                    {data.export_reason && (
                        <div>
                            <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Reason for Export:</h6>
                            <p className="text-gray-700 dark:text-gray-300">{data.export_reason}</p>
                        </div>
                    )}

                     <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">Record ID: {data.id}</p>
                </div>
            </Drawer>
        </>
    )
}

// --- ExportMappingSearch Component ---
type ExportMappingSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const ExportMappingSearch = React.forwardRef<
    HTMLInputElement,
    ExportMappingSearchProps
>(({ onInputChange }, ref) => {
    return (
        <DebouceInput
            ref={ref}
            className="w-full"
            placeholder="Quick search exports..."
            suffix={<TbSearch className="text-lg" />}
            onChange={(e) => onInputChange(e.target.value)}
        />
    )
})
ExportMappingSearch.displayName = 'ExportMappingSearch'

// --- ExportMappingTableTools Component ---
const ExportMappingTableTools = ({
    onSearchChange,
    onFilter,
    onExport,
    userNameOptions,
    userRoleOptions,
    exportFromOptions,
}: {
    onSearchChange: (query: string) => void
    onFilter: () => void // For opening the filter drawer
    onExport: () => void // For triggering CSV export
    userNameOptions: {value: string; label: string}[];
    userRoleOptions: {value: string; label: string}[];
    exportFromOptions: {value: string; label: string}[];
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            <div className="flex-grow">
                <ExportMappingSearch onInputChange={onSearchChange} />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                    icon={<TbFilter />}
                    onClick={onFilter}
                    className="w-full sm:w-auto"
                >
                    Filter
                </Button>
                <Button
                    icon={<TbCloudUpload />} // Changed icon to represent general export
                    onClick={onExport}
                    className="w-full sm:w-auto"
                >
                    Export
                </Button>
            </div>
        </div>
    )
}

// --- ExportMappingTable Component ---
type ExportMappingTableProps = {
    columns: ColumnDef<ExportMappingItem>[]
    data: ExportMappingItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    // selectedItems: ExportMappingItem[] // No selection needed for view-only
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    // onRowSelect and onAllRowSelect not needed for view-only
}
const ExportMappingTable = ({
    columns,
    data,
    loading,
    pagingData,
    onPaginationChange,
    onSelectChange,
    onSort,
}: ExportMappingTableProps) => {
    return (
        <DataTable
            // selectable={false} // Disable row selection
            columns={columns}
            data={data}
            noData={!loading && data.length === 0}
            loading={loading}
            pagingData={pagingData}
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
        />
    )
}


// --- Main ExportMapping Component ---
const ExportMapping = () => {
    const dispatch = useAppDispatch()

    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)

    // Fetch data from Redux store
    const { ExportMappingData = [], status: masterLoadingStatus = 'idle' } =
        useSelector(masterSelector)

    useEffect(() => {
        dispatch(getExportMappingAction()) // Dispatch action to fetch data
    }, [dispatch])

    const filterFormMethods = useForm<FilterFormData>({
        resolver: zodResolver(filterFormSchema),
        defaultValues: {
            filterUserNames: [],
            filterUserRoles: [],
            filterExportFrom: [],
            filterDateRange: null,
        },
    })

    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
        filterUserNames: [],
        filterUserRoles: [],
        filterExportFrom: [],
        filterDateRange: null,
    })

    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    // selectedItems state is not needed for view-only

    // Options for filter dropdowns
    const userNameOptions = useMemo(() => {
        if (!Array.isArray(ExportMappingData)) return [];
        const uniqueNames = new Set(ExportMappingData.map(item => item.user.name));
        return Array.from(uniqueNames).map(name => ({ value: name, label: name }));
    }, [ExportMappingData]);

    const userRoleOptions = useMemo(() => {
        if (!Array.isArray(ExportMappingData)) return [];
        const roles = new Set<string>();
        ExportMappingData.forEach(item => {
            item.user.roles.forEach(role => roles.add(role.display_name));
        });
        return Array.from(roles).map(role => ({ value: role, label: role }));
    }, [ExportMappingData]);

    const exportFromOptions = useMemo(() => {
        if (!Array.isArray(ExportMappingData)) return [];
        const uniqueSources = new Set(ExportMappingData.map(item => item.export_from));
        return Array.from(uniqueSources).map(source => ({ value: source, label: source }));
    }, [ExportMappingData]);


    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        const sourceData: ExportMappingItem[] = Array.isArray(ExportMappingData)
            ? ExportMappingData
            : []
        let processedData: ExportMappingItem[] = cloneDeep(sourceData)

        // Apply filters
        if (filterCriteria.filterUserNames && filterCriteria.filterUserNames.length > 0) {
            const selectedNames = filterCriteria.filterUserNames.map(opt => opt.value.toLowerCase());
            processedData = processedData.filter(item => selectedNames.includes(item.user.name.toLowerCase()));
        }
        if (filterCriteria.filterUserRoles && filterCriteria.filterUserRoles.length > 0) {
            const selectedRoles = filterCriteria.filterUserRoles.map(opt => opt.value.toLowerCase());
            processedData = processedData.filter(item => 
                item.user.roles.some(role => selectedRoles.includes(role.display_name.toLowerCase()))
            );
        }
        if (filterCriteria.filterExportFrom && filterCriteria.filterExportFrom.length > 0) {
            const selectedSources = filterCriteria.filterExportFrom.map(opt => opt.value.toLowerCase());
            processedData = processedData.filter(item => selectedSources.includes(item.export_from.toLowerCase()));
        }
        if (filterCriteria.filterDateRange && filterCriteria.filterDateRange[0] && filterCriteria.filterDateRange[1]) {
            const [startDate, endDate] = filterCriteria.filterDateRange;
            // Set endDate to the end of the day for inclusive range
            const endOfDayEndDate = new Date(endDate);
            endOfDayEndDate.setHours(23, 59, 59, 999);

            processedData = processedData.filter(item => {
                const itemDate = new Date(item.created_at);
                return itemDate >= startDate && itemDate <= endOfDayEndDate;
            });
        }


        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim()
            processedData = processedData.filter((item: ExportMappingItem) => {
                const userNameLower = item.user.name?.trim().toLowerCase() ?? ''
                const userRoleLower = item.user.roles.map(r => r.display_name.toLowerCase()).join(' ') ?? ''
                const exportFromLower = item.export_from?.trim().toLowerCase() ?? ''
                const fileNameLower = item.file_name?.trim().toLowerCase() ?? ''
                const reasonLower = item.export_reason?.trim().toLowerCase() ?? ''
                const idString = String(item.id ?? '').trim().toLowerCase()
                return (
                    userNameLower.includes(query) ||
                    userRoleLower.includes(query) ||
                    exportFromLower.includes(query) ||
                    fileNameLower.includes(query) ||
                    reasonLower.includes(query) ||
                    idString.includes(query)
                )
            })
        }
        const { order, key } = tableData.sort as OnSortParam
        if (
            order &&
            key &&
            processedData.length > 0
        ) {
            const sortedData = [...processedData]
            // Adjust sorting keys for nested user data
            sortedData.sort((a, b) => {
                let aValue, bValue;
                if (key === 'user.name') {
                    aValue = a.user.name;
                    bValue = b.user.name;
                } else if (key === 'user.roles') { // Simplified role sort (e.g., by first role)
                    aValue = a.user.roles[0]?.display_name || '';
                    bValue = b.user.roles[0]?.display_name || '';
                } else if (key === 'created_at' || key === 'updated_at') {
                    aValue = new Date(a[key as 'created_at' | 'updated_at']).getTime();
                    bValue = new Date(b[key as 'created_at' | 'updated_at']).getTime();
                }
                else {
                    aValue = a[key as keyof ExportMappingItem] ?? '';
                    bValue = b[key as keyof ExportMappingItem] ?? '';
                }

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return order === 'asc' ? aValue - bValue : bValue - aValue;
                }
                return 0;
            });
            processedData = sortedData
        }

        const dataToExport = [...processedData]; // Data for CSV export

        const currentTotal = processedData.length
        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const startIndex = (pageIndex - 1) * pageSize
        const dataForPage = processedData.slice(
            startIndex,
            startIndex + pageSize,
        )
        return {
            pageData: dataForPage,
            total: currentTotal,
            allFilteredAndSortedData: dataToExport,
        }
    }, [ExportMappingData, tableData, filterCriteria])

    const handleExportData = () => {
        const success = exportToCsvExportMapping(
            'export_mappings.csv',
            allFilteredAndSortedData, // Use the fully filtered and sorted data
        )
        if (success) {
            toast.push(
                <Notification title="Export Successful" type="success">
                    Data exported.
                </Notification>,
            )
        }
    }

    const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
        setTableData((prev) => ({ ...prev, ...data }))
    }, [])
    const handlePaginationChange = useCallback(
        (page: number) => handleSetTableData({ pageIndex: page }),
        [handleSetTableData],
    )
    const handleSelectChange = useCallback(
        (value: number) => {
            handleSetTableData({ pageSize: Number(value), pageIndex: 1 })
            // No need to clear selectedItems
        },
        [handleSetTableData],
    )
    const handleSort = useCallback(
        (sort: OnSortParam) => {
            handleSetTableData({ sort: sort, pageIndex: 1 })
        },
        [handleSetTableData],
    )
    const handleSearchChange = useCallback(
        (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
        [handleSetTableData],
    )
    // Row selection handlers not needed for view-only

    const openFilterDrawer = () => {
        filterFormMethods.reset(filterCriteria); // Set current filters to the form
        setIsFilterDrawerOpen(true);
    };
    const closeFilterDrawer = () => setIsFilterDrawerOpen(false);

    const onApplyFiltersSubmit = (data: FilterFormData) => {
        setFilterCriteria({
            filterUserNames: data.filterUserNames || [],
            filterUserRoles: data.filterUserRoles || [],
            filterExportFrom: data.filterExportFrom || [],
            filterDateRange: data.filterDateRange || null,
        });
        handleSetTableData({ pageIndex: 1 }); // Reset to first page on filter change
        closeFilterDrawer();
    };
    const onClearFilters = () => {
        const defaultFilters = { filterUserNames: [], filterUserRoles: [], filterExportFrom: [], filterDateRange: null };
        filterFormMethods.reset(defaultFilters);
        setFilterCriteria(defaultFilters);
        handleSetTableData({ pageIndex: 1 });
    };

    const columns: ColumnDef<ExportMappingItem>[] = useMemo(
        () => [
            { header: 'ID', accessorKey: 'id', enableSorting: true, size: 80 },
            {
                header: 'User Name',
                accessorKey: 'user.name', // Access nested property
                enableSorting: true,
                cell: props => props.row.original.user.name,
            },
            {
                header: 'User Role',
                accessorKey: 'user.roles', // For sorting, might need custom logic or sort by first role
                enableSorting: true, // Sorting might be complex for multi-role, consider disabling or custom sort
                cell: props => props.row.original.user.roles.map(role => role.display_name).join(', ') || 'N/A',
            },
            {
                header: 'Exported From',
                accessorKey: 'export_from',
                enableSorting: true,
            },
            {
                header: 'File Name',
                accessorKey: 'file_name',
                enableSorting: true,
            },
            {
                header: 'Reason',
                accessorKey: 'export_reason',
                enableSorting: true, // Or disable if not useful
                cell: props => props.row.original.export_reason || '-',
            },
            {
                header: 'Export Date',
                accessorKey: 'created_at', // Sort by the raw date string
                enableSorting: true,
                cell: props => new Date(props.row.original.created_at).toLocaleString(),
            },
            {
                header: 'Action',
                id: 'action',
                meta: { HeaderClass: 'text-center' },
                cell: (props) => <ActionColumn data={props.row.original} />,
            },
        ],
        [], 
    )

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4"> {/* Simplified header */}
                        <h5 className="mb-0">Export Mapping Log</h5>
                        {/* Add New button is not needed for view-only log */}
                    </div>
                    <ExportMappingTableTools
                        onSearchChange={handleSearchChange}
                        onFilter={openFilterDrawer}
                        onExport={handleExportData}
                        userNameOptions={userNameOptions}
                        userRoleOptions={userRoleOptions}
                        exportFromOptions={exportFromOptions}

                    />
                    <div className="mt-4 flex-grow overflow-auto">
                        <ExportMappingTable
                            columns={columns}
                            data={pageData}
                            loading={masterLoadingStatus === 'loading'} // Use Redux loading status
                            pagingData={{
                                total: total,
                                pageIndex: tableData.pageIndex as number,
                                pageSize: tableData.pageSize as number,
                            }}
                            onPaginationChange={handlePaginationChange}
                            onSelectChange={handleSelectChange}
                            onSort={handleSort}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            {/* No StickyFooter for selected items if view-only */}

            <Drawer
                title="Filter Export Log"
                isOpen={isFilterDrawerOpen}
                onClose={closeFilterDrawer}
                onRequestClose={closeFilterDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button
                            size="sm"
                            className="mr-2"
                            onClick={onClearFilters}
                        >
                            Clear
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            form="filterExportLogForm"
                            type="submit"
                        >
                            Apply
                        </Button>
                    </div>
                }
            >
                <Form
                    id="filterExportLogForm"
                    onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
                    className="flex flex-col gap-4"
                >
                    <FormItem label="Filter by User Name(s)">
                        <Controller
                            name="filterUserNames"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <UiSelect
                                    isMulti
                                    placeholder="Select user names..."
                                    options={userNameOptions}
                                    value={field.value}
                                    onChange={(val) => field.onChange(val)}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Filter by User Role(s)">
                        <Controller
                            name="filterUserRoles"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <UiSelect
                                    isMulti
                                    placeholder="Select user roles..."
                                    options={userRoleOptions}
                                    value={field.value}
                                    onChange={(val) => field.onChange(val)}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Filter by Source(s)">
                        <Controller
                            name="filterExportFrom"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <UiSelect
                                    isMulti
                                    placeholder="Select export sources..."
                                    options={exportFromOptions}
                                    value={field.value}
                                    onChange={(val) => field.onChange(val)}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Filter by Date Range">
                        <Controller
                            name="filterDateRange"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <DatePicker.DatePickerRange
                                    value={field.value}
                                    onChange={(dates) => field.onChange(dates)}
                                    placeholder="Select date range"
                                    inputFormat="DD/MM/YYYY"
                                />
                            )}
                        />
                    </FormItem>
                </Form>
            </Drawer>
        </>
    )
}

export default ExportMapping

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ')
}