// src/views/your-path/PriceList.tsx

import React, {
    useState,
    useMemo,
    useCallback,
    Ref,
    useEffect,
    useRef,
} from 'react'
import cloneDeep from 'lodash/cloneDeep'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import classNames from 'classnames'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
// import StickyFooter from "@/components/shared/StickyFooter"; // Still imported, but footer usage is commented
import DebounceInput from '@/components/shared/DebouceInput'
import Select from '@/components/ui/Select'
import {
    Card,
    Dialog,
    Drawer,
    Dropdown,
    Form,
    FormItem,
    Input,
    Table,
    Tag,
    Avatar,
} from '@/components/ui' // Tag already imported
import * as XLSX from 'xlsx'

// Icons
import {
    TbPencil,
    // TbTrash, // Commented out
    // TbChecks, // No longer needed for selected footer
    TbSearch,
    TbFilter,
    TbPlus,
    TbCloudUpload,
    TbReload,
    TbUser,
    TbMessagePause,
    TbMessage2X,
    TbMessageCheck,
    TbMessageUser,
    TbMessageShare,
    TbMessageStar,
    TbReceipt,
    TbDeviceWatchDollar,
    TbClockDollar,
    TbPencilDollar,
    TbDiscount,
    TbDiscountOff,
    TbEyeDollar,
    TbBell,
    TbShare,
    TbFileDownload,
    TbBox,
    TbClipboardText,
    TbDotsVertical,
} from 'react-icons/tb'

// Types
import type {
    OnSortParam,
    ColumnDef,
    CellContext,
    // Row, // No longer needed as onAllRowSelect is commented out
} from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import { useAppDispatch } from '@/reduxtool/store'
import {
    getPriceListAction,
    addPriceListAction,
    editPriceListAction,
    // deletePriceListAction, // Commented out
    // deleteAllPriceListAction, // No longer used as handleDeleteSelected is commented out
    getAllProductAction,
    submitExportReasonAction, // Placeholder for future action
    getCategoriesAction,
    getBrandAction,
    getSubcategoriesByCategoryIdAction,
} from '@/reduxtool/master/middleware'
import { useSelector } from 'react-redux'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { Link } from 'react-router-dom'
import { FaRegFilePdf, FaWhatsapp } from 'react-icons/fa'
import { BsFileExcelFill } from 'react-icons/bs'
import { HiOutlineMail } from 'react-icons/hi'

// --- Define Product Master Type (what getAllProductAction fetches) ---
export type ProductMasterItem = {
    id: string | number
    name: string
}

export type SelectOption = { value: any; label: string } // Changed value to 'any' for mixed types

// --- Define PriceList Type (Matches API Response Structure) ---
export type ApiProduct = {
    id: number
    name: string
    thumb_image_full_path?: string
    product_images_array?: any[]
    // [NEW] Added for filtering capabilities
    category?: { id: number; name: string } | null
    sub_category?: { id: number; name: string } | null
    brand?: { id: number; name: string } | null
}

export type PriceListItem = {
    id: number
    product_id: string
    price: string
    base_price: string
    gst_price: string
    usd_rate: string
    usd: string
    expance: string
    interest: string
    nlc: string
    margin: string
    sales_price: string
    status: 'Active' | 'Inactive' // Made status non-optional
    created_at?: string
    updated_at?: string
    updated_by_name?: string
    updated_by_role?: string
    product: ApiProduct
    qty?: string
    name: string | null
}

// --- Status Options ---
const statusOptions: SelectOption[] = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
]

// --- Zod Schema for SIMPLIFIED Add/Edit PriceList Form ---
const priceListFormSchema = z.object({
    product_id: z.string().min(1, 'Product is required.'),
    price: z
        .string()
        .min(1, 'Price is required.')
        .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid number'),
    usd_rate: z
        .string()
        .min(1, 'USD Rate is required.')
        .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid number'),
    expance: z
        .string()
        .min(1, 'Expenses are required.')
        .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid number'),
    margin: z
        .string()
        .min(1, 'Margin is required.')
        .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid number'),
    status: z.enum(['Active', 'Inactive'], {
        required_error: 'Status is required.',
    }), // Added status
})
type PriceListFormData = z.infer<typeof priceListFormSchema>

// --- Zod Schema for Filter Form ---
const priceListFilterFormSchema = z.object({
    filterProductIds: z
        .array(z.object({ value: z.string(), label: z.string() }))
        .optional(),
    filterStatus: z
        .array(z.object({ value: z.string(), label: z.string() }))
        .optional(),
    // [NEW] Added filters based on Products.tsx
    filterCategoryIds: z.array(z.number()).optional(),
    filterSubCategoryIds: z.array(z.number()).optional(),
    filterBrandIds: z.array(z.number()).optional(),
})
type PriceListFilterFormData = z.infer<typeof priceListFilterFormSchema>

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
    reason: z
        .string()
        .min(1, 'Reason for export is required.')
        .max(255, 'Reason cannot exceed 255 characters.'),
})
type ExportReasonFormData = z.infer<typeof exportReasonSchema>

// --- CSV Exporter Utility ---
const CSV_PRICE_LIST_HEADERS = [
    'ID',
    'Product ID',
    'Product Name',
    'Price',
    'Base Price',
    'GST Price',
    'USD Rate',
    'USD Amount',
    'Expense',
    'Interest',
    'NLC',
    'Margin',
    'Sales Price',
    'Status', // Added Status
    'Updated By',
    'Updated Role',
    'Updated At',
]
const CSV_PRICE_LIST_KEYS: (keyof PriceListItem | 'productNameForCsv')[] = [
    'id',
    'product_id',
    'productNameForCsv',
    'price',
    'base_price',
    'gst_price',
    'usd_rate',
    'usd',
    'expance',
    'interest',
    'nlc',
    'margin',
    'sales_price',
    'status', // Added Status
    'updated_by_name',
    'updated_by_role',
    'updated_at',
]

export type PriceListModalType = 'notification'

export interface PriceListModalState {
    isOpen: boolean
    type: PriceListModalType | null
    data: PriceListItem | null
}
interface PriceListModalsProps {
    modalState: PriceListModalState
    onClose: () => void
}

const dummyUsers = [
    { value: 'user1', label: 'Alice Johnson' },
    { value: 'user2', label: 'Bob Williams' },
    { value: 'user3', label: 'Charlie Brown' },
]

// --- PriceListModals Manager Component ---
const PriceListModals: React.FC<PriceListModalsProps> = ({
    modalState,
    onClose,
}) => {
    const { type, data: PriceList, isOpen } = modalState
    if (!isOpen || !PriceList) return null

    const renderModalContent = () => {
        switch (type) {
            case 'notification':
                return (
                    <AddNotificationDialog
                        PriceList={PriceList}
                        onClose={onClose}
                    />
                )
            default:
                // Fallback for any other modal types if they are added later
                return (
                    <Dialog
                        isOpen={true}
                        onClose={onClose}
                        onRequestClose={onClose}
                    >
                        <h5 className="mb-4">Unhandled Modal</h5>
                        <p>This modal type ({type}) has not been configured.</p>
                        <div className="text-right mt-6">
                            <Button onClick={onClose}>Close</Button>
                        </div>
                    </Dialog>
                )
        }
    }
    return <>{renderModalContent()}</>
}

const AddNotificationDialog: React.FC<{
    PriceList: PriceListItem
    onClose: () => void
}> = ({ PriceList, onClose }) => {
    const [isLoading, setIsLoading] = useState(false)
    const { control, handleSubmit } = useForm({
        defaultValues: { title: '', users: [], message: '' },
    })
    const onSend = (data: any) => {
        setIsLoading(true)
        console.log(
            'Sending in-app notification for',
            PriceList.product.name,
            'with data:',
            data,
        )
        setTimeout(() => {
            toast.push(
                <Notification type="success" title="Notification Sent" />,
            )
            setIsLoading(false)
            onClose()
        }, 1000)
    }
    return (
        <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
            <h5 className="mb-4">
                Add Notification for {PriceList.product.name}
            </h5>
            <form onSubmit={handleSubmit(onSend)}>
                <FormItem label="Notification Title">
                    <Controller
                        name="title"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                    />
                </FormItem>
                <FormItem label="Send to Users">
                    <Controller
                        name="users"
                        control={control}
                        render={({ field }) => (
                            <Select
                                isMulti
                                placeholder="Select Users"
                                options={dummyUsers}
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem label="Message">
                    <Controller
                        name="message"
                        control={control}
                        render={({ field }) => (
                            <Input textArea {...field} rows={3} />
                        )}
                    />
                </FormItem>
                <div className="text-right mt-6">
                    <Button className="mr-2" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="solid" type="submit" loading={isLoading}>
                        Send Notification
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}

function exportPriceListToCsv(filename: string, rows: PriceListItem[]) {
    if (!rows || !rows.length) {
        toast.push(
            <Notification title="No Data" type="info">
                Nothing to export.
            </Notification>,
        )
        return false
    }
    const separator = ','
    const csvContent =
        CSV_PRICE_LIST_HEADERS.join(separator) +
        '\n' +
        rows
            .map((row) => {
                const flatRow: any = {
                    ...row,
                    productNameForCsv:
                        row.product?.name || String(row.product_id),
                    status: row.status,
                    updated_at: row.updated_at
                        ? new Date(row.updated_at).toLocaleString()
                        : 'N/A',
                    updated_by_name: row.updated_by_name || 'N/A',
                    updated_by_role: row.updated_by_role || 'N/A',
                }
                return CSV_PRICE_LIST_KEYS.map((k) => {
                    let cell: any
                    if (k === 'productNameForCsv') {
                        cell = flatRow.productNameForCsv
                    } else {
                        cell = flatRow[k as keyof PriceListItem]
                    }
                    if (cell === null || cell === undefined) cell = ''
                    else cell = String(cell).replace(/"/g, '""')
                    if (String(cell).search(/("|,|\n)/g) >= 0)
                        cell = `"${cell}"`
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
        toast.push(
            <Notification title="Export Successful" type="success">
                Data exported to {filename}.
            </Notification>,
        )
        return true
    }
    toast.push(
        <Notification title="Export Failed" type="danger">
            Browser does not support.
        </Notification>,
    )
    return false
}

// --- ActionColumn, PriceListSearch, PriceListTableTools, PriceListTable ---
const ActionColumn = ({
    rowData,
    onEdit,
    onOpenModal,
}: {
    rowData: PriceListItem
    onEdit: () => void
    onOpenModal: (type: PriceListModalType, data: PriceListItem) => void
}) => {
    // [NEW] Handler for copying details
    const handleCopyDetails = (item: PriceListItem) => {
        const details = [
            `Product: ${item.product?.name}`,
            `Price: ${item.price}`,
            `Base Price: ${item.base_price}`,
            `Sales Price: ${item.sales_price}`,
            `Status: ${item.status}`,
        ].join('\n')

        navigator.clipboard.writeText(details).then(
            () => {
                toast.push(
                    <Notification
                        title="Copied to clipboard"
                        type="success"
                        duration={2000}
                    />,
                )
            },
            () => {
                toast.push(
                    <Notification
                        title="Failed to copy"
                        type="danger"
                        duration={2000}
                    />,
                )
            },
        )
    }

    return (
        <div className="flex items-center justify-center gap-1">
            <Tooltip title="Edit">
                <div
                    className={classNames(
                        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none',
                        'hover:bg-gray-100 dark:hover:bg-gray-700',
                        'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400',
                    )}
                    role="button"
                    onClick={onEdit}
                >
                    <TbPencil />
                </div>
            </Tooltip>
            <Tooltip title="Send Notification">
                <div
                    className={classNames(
                        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none',
                        'hover:bg-gray-100 dark:hover:bg-gray-700',
                        'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400',
                    )}
                    role="button"
                    onClick={() => onOpenModal('notification', rowData)}
                >
                    <TbBell />
                </div>
            </Tooltip>
            {/* [NEW] Dropdown for more actions */}
            <Dropdown
                placement="bottom-end"
                renderTitle={
                    <Tooltip title="More">
                        <div className="text-xl cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100">
                            <TbDotsVertical />
                        </div>
                    </Tooltip>
                }
            >
                <Dropdown.Item
                    onClick={() => handleCopyDetails(rowData)}
                    className="flex items-center gap-2"
                >
                    <TbClipboardText size={18} />{' '}
                    <span className="text-xs">Copy Details</span>
                </Dropdown.Item>
            </Dropdown>
        </div>
    )
}
type PriceListSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const PriceListSearch = React.forwardRef<
    HTMLInputElement,
    PriceListSearchProps
>(({ onInputChange }, ref) => (
    <DebounceInput
        ref={ref}
        className="w-full"
        placeholder="Quick Search..."
        suffix={<TbSearch className="text-lg" />}
        onChange={(e) => onInputChange(e.target.value)}
    />
))
PriceListSearch.displayName = 'PriceListSearch'
const PriceListTableTools = ({
    onSearchChange,
    onFilter,
    onExport,
    onClearFilters,
}: {
    onSearchChange: (query: string) => void
    onFilter: () => void
    onExport: () => void
    onClearFilters: () => void
}) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
        <div className="flex-grow">
            <PriceListSearch onInputChange={onSearchChange} />
        </div>
        <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
            <Button
                title="Clear Filters"
                icon={<TbReload />}
                onClick={() => onClearFilters()}
            ></Button>
            <Button
                icon={<TbFilter />}
                onClick={onFilter}
                className="w-full sm:w-auto"
            >
                Filter
            </Button>
            <Button
                icon={<TbCloudUpload />}
                onClick={onExport} // This will now open the reason modal
                className="w-full sm:w-auto"
            >
                Export
            </Button>
        </div>
    </div>
)

type PriceListTableProps = {
    columns: ColumnDef<PriceListItem>[]
    data: PriceListItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
}
const PriceListTable = (props: PriceListTableProps) => (
    <DataTable
        columns={props.columns}
        data={props.data}
        noData={!props.loading && props.data.length === 0}
        loading={props.loading}
        pagingData={props.pagingData}
        onPaginationChange={props.onPaginationChange}
        onSelectChange={props.onSelectChange}
        onSort={props.onSort}
    />
)

// --- Main PriceList Component ---
const PriceList = () => {
    const dispatch = useAppDispatch()

    const {
        priceListData = [],
        productsMasterData = [],
        status: masterLoadingStatus = 'idle',
        CategoriesData: GlobalCategoriesData = [], // [NEW]
        subCategoriesForSelectedCategoryData = [], // [NEW]
        BrandData = [], // [NEW]
    } = useSelector(masterSelector)

    const productSelectOptions = useMemo(() => {
        if (!Array.isArray(productsMasterData)) return []
        return productsMasterData.map((p: ProductMasterItem) => ({
            value: String(p.id),
            label: p.name,
        }))
    }, [productsMasterData])

    // [NEW] Options for filters
    const categoryOptions = useMemo(
        () =>
            Array.isArray(GlobalCategoriesData)
                ? GlobalCategoriesData.map((c: any) => ({
                      value: c.id,
                      label: c.name,
                  }))
                : [],
        [GlobalCategoriesData],
    )
    const brandOptions = useMemo(
        () =>
            BrandData.length > 0 &&
            BrandData?.map((b: any) => ({ value: b.id, label: b.name })) ||
            [],
        [BrandData],
    )
    const [subcategoryOptions, setSubcategoryOptions] = useState<SelectOption[]>(
        [],
    )

    // --- MODAL STATE AND HANDLERS (LIFTED UP) ---
    const [modalState, setModalState] = useState<PriceListModalState>({
        isOpen: false,
        type: null,
        data: null,
    })
    // [FIXED] Correctly pass item data to the modal state
    const handleOpenModal = useCallback(
        (type: PriceListModalType, itemData: PriceListItem) =>
            setModalState({ isOpen: true, type, data: itemData }),
        [],
    )
    const handleCloseModal = useCallback(
        () => setModalState({ isOpen: false, type: null, data: null }),
        [],
    )
    // --- END MODAL STATE AND HANDLERS ---

    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
    const [editingPriceListItem, setEditingPriceListItem] =
        useState<PriceListItem | null>(null)
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [isExportReasonModalOpen, setIsExportReasonModalOpen] =
        useState(false)
    const [isTodayExportReasonModalOpen, setIsTodayExportReasonModalOpen] =
        useState(false)
    const [isSubmittingExportReason, setIsSubmittingExportReason] =
        useState(false)
    const [isTodaySubmittingExportReason, setIsTodaySubmittingExportReason] =
        useState(false)
    const [filterCriteria, setFilterCriteria] =
        useState<PriceListFilterFormData>({
            filterProductIds: [],
            filterStatus: [],
            filterCategoryIds: [], // [NEW]
            filterBrandIds: [], // [NEW]
            filterSubCategoryIds: [], // [NEW]
        })

    useEffect(() => {
        dispatch(getPriceListAction())
        dispatch(getAllProductAction())
        dispatch(getCategoriesAction()) // [NEW]
        dispatch(getBrandAction()) // [NEW]
    }, [dispatch])

    const defaultFormValues: PriceListFormData = useMemo(
        () => ({
            product_id: productSelectOptions[0]?.value || '',
            price: '',
            usd_rate: '',
            expance: '',
            margin: '',
            status: 'Active',
        }),
        [productSelectOptions],
    )

    const addFormMethods = useForm<PriceListFormData>({
        resolver: zodResolver(priceListFormSchema),
        defaultValues: defaultFormValues,
        mode: 'onChange',
    })
    const editFormMethods = useForm<PriceListFormData>({
        resolver: zodResolver(priceListFormSchema),
        defaultValues: defaultFormValues,
        mode: 'onChange',
    })
    const filterFormMethods = useForm<PriceListFilterFormData>({
        resolver: zodResolver(priceListFilterFormSchema),
        defaultValues: filterCriteria,
    })

    const exportReasonFormMethods = useForm<ExportReasonFormData>({
        resolver: zodResolver(exportReasonSchema),
        defaultValues: { reason: '' },
        mode: 'onChange',
    })

    // [NEW] Effect to handle dynamic subcategory loading for filter
    const watchedFilterCategoryIds = filterFormMethods.watch(
        'filterCategoryIds',
    )
    useEffect(() => {
        if (isFilterDrawerOpen) {
            if (
                watchedFilterCategoryIds &&
                watchedFilterCategoryIds.length === 1
            ) {
                dispatch(
                    getSubcategoriesByCategoryIdAction(
                        watchedFilterCategoryIds[0],
                    ),
                )
            } else {
                setSubcategoryOptions([])
                const currentFilterSubCatIds =
                    filterFormMethods.getValues('filterSubCategoryIds')
                if (currentFilterSubCatIds && currentFilterSubCatIds.length > 0)
                    filterFormMethods.setValue('filterSubCategoryIds', [])
            }
        }
    }, [watchedFilterCategoryIds, isFilterDrawerOpen, dispatch])

    useEffect(() => {
        if (masterLoadingStatus !== 'loading') {
            setSubcategoryOptions(
                subCategoriesForSelectedCategoryData?.map((sc: any) => ({
                    value: sc.id,
                    label: sc.name,
                })) || [],
            )
        }
    }, [subCategoriesForSelectedCategoryData, masterLoadingStatus])

    const openAddDrawer = useCallback(() => {
        addFormMethods.reset(defaultFormValues)
        setIsAddDrawerOpen(true)
    }, [addFormMethods, defaultFormValues])

    const closeAddDrawer = useCallback(() => {
        addFormMethods.reset(defaultFormValues)
        setIsAddDrawerOpen(false)
    }, [addFormMethods, defaultFormValues])

    const onAddPriceListSubmit = async (formData: PriceListFormData) => {
        setIsSubmitting(true)
        const selectedProduct = productSelectOptions.find(
            (p) => p.value === formData.product_id,
        )
        const productNameForNotification = selectedProduct
            ? selectedProduct.label
            : 'Unknown Product'
        const apiPayload = { ...formData }
        try {
            await dispatch(addPriceListAction(apiPayload)).unwrap()
            toast.push(
                <Notification
                    title="Price List Item Added"
                    type="success"
                >{`Item for "${productNameForNotification}" added.`}</Notification>,
            )
            closeAddDrawer()
            dispatch(getPriceListAction())
        } catch (error: any) {
            toast.push(
                <Notification title="Failed to Add" type="danger">
                    {error.message || 'Could not add item.'}
                </Notification>,
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const openEditDrawer = (item: PriceListItem) => {
        setEditingPriceListItem(item)
        console.log('item', item)

        editFormMethods.reset({
            product_id: String(item.product_id),
            price: item.price,
            usd_rate: item.usd_rate,
            expance: item.expance,
            margin: item.margin,
            status: item.status || 'Active',
        })
        setIsEditDrawerOpen(true)
    }
    const closeEditDrawer = () => {
        setEditingPriceListItem(null)
        editFormMethods.reset(defaultFormValues)
        setIsEditDrawerOpen(false)
    }

    const onEditPriceListSubmit = async (formData: PriceListFormData) => {
        if (!editingPriceListItem) return
        setIsSubmitting(true)
        const selectedProduct = productSelectOptions.find(
            (p) => p.value === formData.product_id,
        )
        const productNameForNotification = selectedProduct
            ? selectedProduct.label
            : editingPriceListItem.product?.name || 'Unknown'
        const apiPayload = { id: editingPriceListItem.id, ...formData }
        try {
            await dispatch(editPriceListAction(apiPayload)).unwrap()
            toast.push(
                <Notification
                    title="Price List Item Updated"
                    type="success"
                >{`Item for "${productNameForNotification}" updated.`}</Notification>,
            )
            closeEditDrawer()
            dispatch(getPriceListAction())
        } catch (error: any) {
            toast.push(
                <Notification title="Failed to Update" type="danger">
                    {error.message || 'Could not update.'}
                </Notification>,
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const openFilterDrawer = () => {
        filterFormMethods.reset(filterCriteria)
        setIsFilterDrawerOpen(true)
    }
    const closeFilterDrawerCb = useCallback(
        () => setIsFilterDrawerOpen(false),
        [],
    )
    const onApplyFiltersSubmit = (data: PriceListFilterFormData) => {
        setFilterCriteria({
            filterProductIds: data.filterProductIds || [],
            filterStatus: data.filterStatus || [],
            filterCategoryIds: data.filterCategoryIds || [], // [NEW]
            filterBrandIds: data.filterBrandIds || [], // [NEW]
            filterSubCategoryIds: data.filterSubCategoryIds || [], // [NEW]
        })
        handleSetTableData({ pageIndex: 1 })
        closeFilterDrawerCb()
    }
    const onClearFilters = () => {
        const df = {
            filterProductIds: [],
            filterStatus: [],
            filterCategoryIds: [],
            filterBrandIds: [],
            filterSubCategoryIds: [],
        }
        filterFormMethods.reset(df)
        setFilterCriteria(df)
        handleSetTableData({ pageIndex: 1 })
        dispatch(getPriceListAction())
    }

    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        const sourceData: PriceListItem[] = Array.isArray(priceListData?.data)
            ? priceListData?.data.map((item) => ({
                  ...item,
                  status: item.status || 'Inactive',
              }))
            : []

        let processedData: PriceListItem[] = cloneDeep(sourceData)

        // [NEW] Apply category, sub-category, and brand filters
        if (filterCriteria.filterCategoryIds?.length) {
            const selectedIds = new Set(filterCriteria.filterCategoryIds)
            processedData = processedData.filter(
                (item) =>
                    item.product?.category?.id &&
                    selectedIds.has(item.product.category.id),
            )
        }
        if (filterCriteria.filterSubCategoryIds?.length) {
            const selectedIds = new Set(filterCriteria.filterSubCategoryIds)
            processedData = processedData.filter(
                (item) =>
                    item.product?.sub_category?.id &&
                    selectedIds.has(item.product.sub_category.id),
            )
        }
        if (filterCriteria.filterBrandIds?.length) {
            const selectedIds = new Set(filterCriteria.filterBrandIds)
            processedData = processedData.filter(
                (item) =>
                    item.product?.brand?.id &&
                    selectedIds.has(item.product.brand.id),
            )
        }

        if (filterCriteria.filterProductIds?.length) {
            const selectedIds = filterCriteria.filterProductIds.map(
                (opt) => opt.value,
            )
            processedData = processedData.filter((item) =>
                selectedIds.includes(String(item.product_id)),
            )
        }
        if (filterCriteria.filterStatus?.length) {
            const statuses = filterCriteria.filterStatus.map(
                (opt) => opt.value as 'Active' | 'Inactive',
            )
            processedData = processedData.filter((item) =>
                statuses.includes(item.status),
            )
        }

        if (tableData.query) {
            const query = tableData.query.toLowerCase().trim()
            processedData = processedData.filter(
                (item) =>
                    item.product?.name?.toLowerCase().includes(query) ||
                    String(item.id).toLowerCase().includes(query) ||
                    String(item.product_id).toLowerCase().includes(query) ||
                    item.status?.toLowerCase().includes(query) ||
                    item.updated_by_name?.toLowerCase().includes(query),
            )
        }
        const { order, key } = tableData.sort as OnSortParam
        if (order && key && processedData.length > 0) {
            processedData.sort((a, b) => {
                let aValue: any, bValue: any
                if (key === 'product.name') {
                    aValue = String(a.product?.name ?? '')
                    bValue = String(b.product?.name ?? '')
                } else if (key === 'updated_at') {
                    const dateA = a.updated_at
                        ? new Date(a.updated_at).getTime()
                        : 0
                    const dateB = b.updated_at
                        ? new Date(b.updated_at).getTime()
                        : 0
                    return order === 'asc' ? dateA - dateB : dateB - dateA
                } else if (key === 'status') {
                    aValue = String(a.status ?? '')
                    bValue = String(b.status ?? '')
                } else {
                    aValue = String(a[key as keyof PriceListItem] ?? '')
                    bValue = String(b[key as keyof PriceListItem] ?? '')
                }

                if (
                    [
                        'id',
                        'price',
                        'base_price',
                        'gst_price',
                        'usd_rate',
                        'usd',
                        'expance',
                        'interest',
                        'nlc',
                        'margin',
                        'sales_price',
                    ].includes(key)
                ) {
                    const numA = parseFloat(aValue)
                    const numB = parseFloat(bValue)
                    if (!isNaN(numA) && !isNaN(numB)) {
                        return order === 'asc' ? numA - numB : numB - numA
                    }
                }
                return order === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue)
            })
        }
        const currentTotal = processedData.length
        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const startIndex = (pageIndex - 1) * pageSize
        return {
            pageData: processedData.slice(startIndex, startIndex + pageSize),
            total: currentTotal,
            allFilteredAndSortedData: processedData,
        }
    }, [priceListData?.data, tableData, filterCriteria])

    const handleOpenExportReasonModal = () => {
        if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) {
            toast.push(
                <Notification title="No Data" type="info">
                    Nothing to export.
                </Notification>,
            )
            return
        }
        exportReasonFormMethods.reset({ reason: '' })
        setIsExportReasonModalOpen(true)
    }

    const handleConfirmExportWithReason = async (
        data: ExportReasonFormData,
    ) => {
        setIsSubmittingExportReason(true)
        const moduleName = 'Price List'
        const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
        const fileName = `prizeList_export_${timestamp}.csv`
        try {
            await dispatch(
                submitExportReasonAction({
                    reason: data.reason,
                    module: moduleName,
                    file_name: fileName,
                }),
            ).unwrap()
        } catch (error: any) {
            setIsSubmittingExportReason(false)
            return
        }

        exportPriceListToCsv(fileName, allFilteredAndSortedData)
        setIsSubmittingExportReason(false)
        setIsExportReasonModalOpen(false)
    }

    const handleTodayConfirmExportWithReason = async (
        data: ExportReasonFormData,
    ) => {
        setIsTodaySubmittingExportReason(true)
        const moduleName = 'Price List'
        const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
        const fileName = `todayPrizeList_export_${timestamp}.csv`
        try {
            await dispatch(
                submitExportReasonAction({
                    reason: data.reason,
                    module: moduleName,
                    file_name: fileName,
                }),
            ).unwrap()
        } catch (error: any) {
            setIsTodaySubmittingExportReason(false)
            return
        }

        exportPriceListToCsv(fileName, todayPriceListData)
        setIsTodaySubmittingExportReason(false)
        setIsTodayExportReasonModalOpen(false)
    }

    const handleSetTableData = useCallback(
        (data: Partial<TableQueries>) =>
            setTableData((prev) => ({ ...prev, ...data })),
        [],
    )
    const handlePaginationChange = useCallback(
        (page: number) => handleSetTableData({ pageIndex: page }),
        [handleSetTableData],
    )
    const handleSelectPageSizeChange = useCallback(
        (value: number) => {
            handleSetTableData({ pageSize: Number(value), pageIndex: 1 })
        },
        [handleSetTableData],
    )
    const handleSort = useCallback(
        (sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }),
        [handleSetTableData],
    )
    const handleSearchChange = useCallback(
        (query: string) => handleSetTableData({ query, pageIndex: 1 }),
        [handleSetTableData],
    )

    const columns: ColumnDef<PriceListItem>[] = useMemo(
        () => [
            // { header: "ID", accessorKey: "id", enableSorting: true, size: 60 },
            {
                // [NEW] Enhanced product column with Avatar
                header: 'Product',
                accessorKey: 'product.name',
                enableSorting: true,
                size: 280,
                cell: (props: CellContext<PriceListItem, any>) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center gap-3">
                            <Avatar
                                size={40}
                                shape="circle"
                                src={row.product?.thumb_image_full_path || undefined}
                                icon={<TbBox />}
                            />
                            <div className="truncate">
                                <span className="font-semibold">
                                    {row.product?.name || 'N/A'}
                                </span>
                                {/* <div className="text-xs text-gray-500">
                                    Cat: {row.product?.category?.name || '-'}
                                </div> */}
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Price Breakup',
                id: 'priceBreakup',
                size: 160,
                cell: ({ row }) => {
                    const { price, base_price, gst_price, usd } = row.original
                    return (
                        <div className="flex flex-col text-xs">
                            <span>Price: {price}</span>
                            <span>Base: {base_price}</span>
                            <span>GST: {gst_price}</span>
                            <span>USD: {usd}</span>
                        </div>
                    )
                },
            },
            {
                header: 'Cost Split',
                id: 'costSplit',
                size: 160,
                cell: ({ row }) => {
                    const { expance, margin, interest, nlc } = row.original
                    return (
                        <div className="flex flex-col text-xs">
                            <span>Expense: {expance}</span>
                            <span>Margin: {margin}</span>
                            <span>Interest: {interest}</span>
                            <span>NLC: {nlc}</span>
                        </div>
                    )
                },
            },
            {
                header: 'Sales Price',
                accessorKey: 'sales_price',
                enableSorting: true,
                size: 140,
            },
            {
                header: 'Updated Info',
                accessorKey: 'updated_at',
                enableSorting: true,

                size: 180,
                cell: (props) => {
                    const { updated_at, updated_by_user, updated_by_role } =
                        props.row.original
                    const formattedDate = updated_at
                        ? `${new Date(updated_at).getDate()} ${new Date(
                              updated_at,
                          ).toLocaleString('en-US', {
                              month: 'short',
                          })} ${new Date(updated_at).getFullYear()}, ${new Date(
                              updated_at,
                          ).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                          })}`
                        : 'N/A'
                    return (
                        <div className="text-xs">
                            <span>
                                {updated_by_user?.name || 'N/A'}
                                {updated_by_user?.roles[0]?.display_name && (
                                    <>
                                        <br />
                                        <b>
                                            {
                                                updated_by_user?.roles[0]
                                                    ?.display_name
                                            }
                                        </b>
                                    </>
                                )}
                            </span>
                            <br />
                            <span>{formattedDate}</span>
                        </div>
                    )
                },
            },
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                size: 80,
                cell: (props) => {
                    const status = props.row.original.status
                    return (
                        <Tag
                            className={classNames(
                                'capitalize font-semibold whitespace-nowrap',
                                {
                                    'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-emerald-300 dark:border-emerald-500':
                                        status === 'Active',
                                    'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-red-300 dark:border-red-500':
                                        status === 'Inactive',
                                },
                            )}
                        >
                            {status}
                        </Tag>
                    )
                },
            },
            {
                header: 'Actions',
                id: 'action',
                meta: { HeaderClass: 'text-center', cellClass: 'text-center' },
                size: 80,
                cell: (props) => (
                    <div className="flex justify-center items-center">
                        <ActionColumn
                            rowData={props.row.original}
                            onEdit={() => openEditDrawer(props.row.original)}
                            onOpenModal={handleOpenModal}
                        />
                    </div>
                ),
            },
        ],
        [openEditDrawer, handleOpenModal],
    )

    const formFieldsConfig: {
        name: keyof PriceListFormData
        label: string
        type?: 'text' | 'number' | 'select'
        options?: SelectOption[]
        isRequired?: boolean
    }[] = useMemo(
        () => [
            {
                name: 'product_id',
                label: 'Product Name',
                type: 'select',
                options: productSelectOptions,
                isRequired: true,
            },
            { name: 'price', label: 'Price', type: 'text', isRequired: true },
            { name: 'usd_rate', label: 'USD Rate', type: 'text' },
            { name: 'expance', label: 'Expenses', type: 'text' },
            { name: 'margin', label: 'Margin', type: 'text' },
            {
                name: 'status',
                label: 'Status',
                type: 'select',
                options: statusOptions,
                isRequired: true,
            },
        ],
        [productSelectOptions],
    )

    const renderFormField = (
        fieldConfig: (typeof formFieldsConfig)[0],
        formControl: any,
    ) => {
        const commonProps = { name: fieldConfig.name, control: formControl }
        const placeholderText = `Enter ${fieldConfig.label}`
        if (fieldConfig.type === 'select') {
            return (
                <Controller
                    {...commonProps}
                    render={({ field }) => (
                        <Select
                            placeholder={`Select ${fieldConfig.label}`}
                            options={fieldConfig.options || []}
                            value={
                                fieldConfig.options?.find(
                                    (opt) => opt.value === field.value,
                                ) || null
                            }
                            onChange={(option) =>
                                field.onChange(option ? option.value : '')
                            }
                        />
                    )}
                />
            )
        }
        return (
            <Controller
                {...commonProps}
                render={({ field }) => (
                    <Input
                        {...field}
                        type={fieldConfig.type || 'text'}
                        placeholder={placeholderText}
                    />
                )}
            />
        )
    }

    function exportToExcel(filename: string, data: PriceListItem[]) {
        if (!data || !data.length) {
            toast.push(
                <Notification
                    title="No Data"
                    type="info"
                    children="Nothing to export."
                />,
            )
            return
        }
        const worksheetData = data.map((item) => ({
            'Product Name': item.product?.name,
            'Sales Price': item.sales_price,
            'Base Price': item.base_price,
            Status: item.status,
            'Last Updated': new Date(item.updated_at || '').toLocaleString(),
        }))
        const worksheet = XLSX.utils.json_to_sheet(worksheetData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Today's Prices")
        XLSX.writeFile(workbook, filename)
        toast.push(
            <Notification
                title="Export Successful"
                type="success"
                children={`Data exported to ${filename}.`}
            />,
        )
    }

    // --- [NEW] --- State and handlers for the "Today's Price" drawer
    const [isTodayPriceDrawerOpen, setIsTodayPriceDrawerOpen] = useState(false)
    const openTodayPriceDrawer = () => setIsTodayPriceDrawerOpen(true)
    const closeTodayPriceDrawer = () => setIsTodayPriceDrawerOpen(false)

    // --- [NEW] --- Memoized data for today's prices
    const todayPriceListData = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Normalize today's date to midnight

        if (!Array.isArray(priceListData?.data)) return []

        return priceListData?.data.filter((item) => {
            if (!item.updated_at) return false
            const itemDate = new Date(item.updated_at)
            itemDate.setHours(0, 0, 0, 0) // Normalize item's date
            return itemDate.getTime() === today.getTime()
        })
    }, [priceListData?.data])

    const generateShareableText = () => {
        let message = `*Today's Price List (${new Date().toLocaleDateString()})*\n\n`
        message += '-----------------------------------\n'
        todayPriceListData.forEach((item) => {
            message += `*Product:* ${item.product?.name}\n`
            message += `*Price:* ₹${item.sales_price}\n`
            message += `*Status:* ${item.status}\n`
            message += '-----------------------------------\n'
        })
        return message
    }

    const handleShareViaEmail = () => {
        const subject = `Today's Price List - ${new Date().toLocaleDateString()}`
        const body = generateShareableText()
            .replace(/\*/g, '')
            .replace(/\n/g, '%0A') // Simple text format for email
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    }

    const handleShareViaWhatsapp = () => {
        const message = generateShareableText()
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, '_blank')
    }

    // --- [NEW] --- Handlers for drawer actions
    const handlePdfDownload = () => {
        // This would require a library like jsPDF and jspdf-autotable
        // npm install jspdf jspdf-autotable
        toast.push(
            <Notification
                title="Feature in Development"
                type="info"
                children="PDF export will be available soon."
            />,
        )
        // Example placeholder:
        // import jsPDF from 'jspdf';
        // import 'jspdf-autotable';
        // const doc = new jsPDF();
        // doc.autoTable({ ... });
        // doc.save('todays-prices.pdf');
    }

    const handleExcelDownload = () => {
        setIsTodayPriceDrawerOpen(false)
        exportReasonFormMethods.reset({ reason: '' })
        setIsTodayExportReasonModalOpen(true)
        // exportToExcel("todays-prices.xlsx", todayPriceListData);
    }

    return (
        <>
            <Container className="h-auto">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h5 className="mb-2 sm:mb-0">Price List</h5>
                        <div>
                            <Link to="/task/task-list/create">
                                <Button
                                    className="mr-2"
                                    icon={<TbUser />}
                                    clickFeedback={false}
                                    customColorClass={({
                                        Active,
                                        unclickable,
                                    }) =>
                                        classNames(
                                            'hover:text-gray-800 dark:hover:bg-gray-600 border-0 hover:ring-0',
                                            Active
                                                ? 'bg-gray-200'
                                                : 'bg-gray-100',
                                            unclickable &&
                                                'opacity-50 cursor-not-allowed',
                                            !Active &&
                                                !unclickable &&
                                                'hover:bg-gray-200',
                                        )
                                    }
                                >
                                    Assign to Task
                                </Button>
                            </Link>
                            <Button
                                className="mr-2"
                                icon={<TbEyeDollar />}
                                onClick={openTodayPriceDrawer} // <-- Added this
                                clickFeedback={false}
                                customColorClass={({ Active, unclickable }) =>
                                    classNames(
                                        'hover:text-green-800 dark:hover:bg-green-600 border-0 hover:ring-0',
                                        Active
                                            ? 'bg-green-200'
                                            : 'bg-green-100',
                                        unclickable &&
                                            'opacity-50 cursor-not-allowed',
                                        !Active &&
                                            !unclickable &&
                                            'hover:bg-green-200',
                                    )
                                }
                            >
                                View Today Price
                            </Button>
                            <Button
                                variant="solid"
                                icon={<TbPlus />}
                                onClick={openAddDrawer}
                            >
                                Add New
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 mb-4 gap-2">
                        <Card
                            bodyClass="flex gap-2 p-2"
                            className="rounded-md border border-blue-200"
                        >
                            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                                <TbReceipt size={24} />
                            </div>
                            <div>
                                <h6 className="text-blue-500">
                                    {priceListData?.counts?.total}
                                </h6>
                                <span className="font-semibold text-xs">
                                    Total Listed
                                </span>
                            </div>
                        </Card>
                        <Card
                            bodyClass="flex gap-2 p-2"
                            className="rounded-md border border-violet-200"
                        >
                            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
                                <TbDeviceWatchDollar size={24} />
                            </div>
                            <div>
                                <h6 className="text-violet-500">
                                    {priceListData?.counts?.today}
                                </h6>
                                <span className="font-semibold text-xs">
                                    Today Listed
                                </span>
                            </div>
                        </Card>
                        <Card
                            bodyClass="flex gap-2 p-2"
                            className="rounded-md border border-orange-200"
                        >
                            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500">
                                <TbClockDollar size={24} />
                            </div>
                            <div>
                                <h6 className="text-orange-500">
                                    {parseFloat(
                                        priceListData?.counts?.avg_base,
                                    ).toFixed(2)}
                                </h6>
                                <span className="font-semibold text-xs">
                                    Avg Base (₹)
                                </span>
                            </div>
                        </Card>
                        <Card
                            bodyClass="flex gap-2 p-2"
                            className="rounded-md border border-gray-200"
                        >
                            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-gray-100 text-gray-500">
                                <TbPencilDollar size={24} />
                            </div>
                            <div>
                                <h6 className="text-gray-500">
                                    {parseFloat(
                                        priceListData?.counts?.avg_nlc,
                                    ).toFixed(2)}
                                </h6>
                                <span className="font-semibold text-xs">
                                    Avg NLC ($)
                                </span>
                            </div>
                        </Card>
                        <Card
                            bodyClass="flex gap-2 p-2"
                            className="rounded-md border border-green-300"
                        >
                            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                                <TbDiscount size={24} />
                            </div>
                            <div>
                                <h6 className="text-green-500">
                                    {priceListData?.counts?.active}
                                </h6>
                                <span className="font-semibold text-xs">
                                    Active
                                </span>
                            </div>
                        </Card>
                        <Card
                            bodyClass="flex gap-2 p-2"
                            className="rounded-md border border-red-200"
                        >
                            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                                <TbDiscountOff size={24} />
                            </div>
                            <div>
                                <h6 className="text-red-500">
                                    {priceListData?.counts?.inactive}
                                </h6>
                                <span className="font-semibold text-xs">
                                    Inactive
                                </span>
                            </div>
                        </Card>
                    </div>
                    <PriceListTableTools
                        onSearchChange={handleSearchChange}
                        onFilter={openFilterDrawer}
                        onExport={handleOpenExportReasonModal}
                        onClearFilters={onClearFilters}
                    />
                    <div className="mt-4">
                        <PriceListTable
                            columns={columns}
                            data={pageData}
                            loading={
                                masterLoadingStatus === 'loading' ||
                                isSubmitting
                            }
                            pagingData={{
                                total: total,
                                pageIndex: tableData.pageIndex as number,
                                pageSize: tableData.pageSize as number,
                            }}
                            onPaginationChange={handlePaginationChange}
                            onSelectChange={handleSelectPageSizeChange}
                            onSort={handleSort}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            {/* RENDER MODALS HERE */}
            <PriceListModals
                modalState={modalState}
                onClose={handleCloseModal}
            />

            {[
                {
                    title: 'Add Price List',
                    isOpen: isAddDrawerOpen,
                    closeFn: closeAddDrawer,
                    formId: 'addPriceListForm',
                    methods: addFormMethods,
                    onSubmit: onAddPriceListSubmit,
                    submitText: 'Adding...',
                    saveText: 'Save',
                    isEdit: false,
                },
                {
                    title: 'Edit Price List',
                    isOpen: isEditDrawerOpen,
                    closeFn: closeEditDrawer,
                    formId: 'editPriceListForm',
                    methods: editFormMethods,
                    onSubmit: onEditPriceListSubmit,
                    submitText: 'Saving...',
                    saveText: 'Save',
                    isEdit: true,
                },
            ].map((drawerProps) => (
                <Drawer
                    key={drawerProps.formId}
                    title={drawerProps.title}
                    isOpen={drawerProps.isOpen}
                    onClose={drawerProps.closeFn}
                    onRequestClose={drawerProps.closeFn}
                    width={480}
                    bodyClass="relative"
                    footer={
                        <div className="text-right w-full">
                            <Button
                                size="sm"
                                className="mr-2"
                                onClick={drawerProps.closeFn}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                variant="solid"
                                form={drawerProps.formId}
                                type="submit"
                                loading={isSubmitting}
                                disabled={
                                    !drawerProps.methods.formState.isValid ||
                                    isSubmitting
                                }
                            >
                                {isSubmitting
                                    ? drawerProps.submitText
                                    : drawerProps.saveText}
                            </Button>
                        </div>
                    }
                >
                    <Form
                        id={drawerProps.formId}
                        onSubmit={drawerProps.methods.handleSubmit(
                            drawerProps.onSubmit as any,
                        )}
                        className="flex flex-col gap-4 relative p-0"
                    >
                        {
                            <div className="grid grid-cols-2 gap-2">
                                {formFieldsConfig.map((fConfig) => (
                                    <FormItem
                                        key={fConfig.name}
                                        label={
                                            <div>
                                                {fConfig.label}{' '}
                                                {fConfig.isRequired && (
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                )}
                                            </div>
                                        }
                                        invalid={
                                            !!drawerProps.methods.formState
                                                .errors[fConfig.name]
                                        }
                                        errorMessage={
                                            drawerProps.methods.formState
                                                .errors[fConfig.name]
                                                ?.message as string | undefined
                                        }
                                        className={
                                            ['product_id', 'status'].includes(
                                                fConfig.name,
                                            )
                                                ? 'col-span-2'
                                                : 'col-span-1'
                                        }
                                    >
                                        {renderFormField(
                                            fConfig,
                                            drawerProps.methods.control,
                                        )}
                                    </FormItem>
                                ))}
                            </div>
                        }
                    </Form>
                    {drawerProps.isEdit && editingPriceListItem && (
                        <div className="">
                            <div className="grid grid-cols-[2fr_3fr] text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                                {/* First div (will be narrower) - Removed inline style={{flex:0.4}} */}
                                <div>
                                    <b className="mt-3 mb-3 font-semibold text-primary">
                                        Latest Update:
                                    </b>
                                    <br />
                                    <p className="text-sm font-semibold">
                                        {editingPriceListItem.updated_by_user
                                            ?.name || 'N/A'}
                                    </p>
                                    <p>
                                        {editingPriceListItem.updated_by_user
                                            ?.roles[0]?.display_name || 'N/A'}
                                    </p>
                                </div>
                                {/* Second div (will be wider) - Removed inline style={{flex:0.6}} */}
                                <div className="text-right">
                                    <br />{' '}
                                    {/* This <br /> is for spacing, consider if padding/margin is more appropriate */}
                                    <span className="font-semibold">
                                        Created At:
                                    </span>{' '}
                                    <span>
                                        {editingPriceListItem.created_at
                                            ? `${new Date(editingPriceListItem.created_at).getDate()} ${new Date(
                                                  editingPriceListItem.created_at,
                                              ).toLocaleString('en-US', {
                                                  month: 'short',
                                              })} ${new Date(editingPriceListItem.created_at).getFullYear()}, ${new Date(
                                                  editingPriceListItem.created_at,
                                              ).toLocaleTimeString('en-US', {
                                                  hour: 'numeric',
                                                  minute: '2-digit',
                                                  hour12: true,
                                              })}`
                                            : 'N/A'}
                                    </span>
                                    <br />
                                    <span className="font-semibold">
                                        Updated At:
                                    </span>{' '}
                                    <span>
                                        {editingPriceListItem.updated_at
                                            ? `${new Date(editingPriceListItem.updated_at).getDate()} ${new Date(
                                                  editingPriceListItem.updated_at,
                                              ).toLocaleString('en-US', {
                                                  month: 'short',
                                              })} ${new Date(editingPriceListItem.updated_at).getFullYear()}, ${new Date(
                                                  editingPriceListItem.updated_at,
                                              ).toLocaleTimeString('en-US', {
                                                  hour: 'numeric',
                                                  minute: '2-digit',
                                                  hour12: true,
                                              })}`
                                            : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </Drawer>
            ))}
            <Drawer
                title="Filters"
                isOpen={isFilterDrawerOpen}
                onClose={closeFilterDrawerCb}
                onRequestClose={closeFilterDrawerCb}
                width={400}
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
                            form="filterPriceListForm"
                            type="submit"
                        >
                            Apply
                        </Button>
                    </div>
                }
            >
                <Form
                    id="filterPriceListForm"
                    onSubmit={filterFormMethods.handleSubmit(
                        onApplyFiltersSubmit,
                    )}
                    className="flex flex-col gap-4"
                >
                    <FormItem label="Product Name">
                        <Controller
                            name="filterProductIds"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select product names..."
                                    options={productSelectOptions}
                                    value={field.value || []}
                                    onChange={(val) =>
                                        field.onChange(val || [])
                                    }
                                />
                            )}
                        />
                    </FormItem>
                    {/* [NEW] Filter fields */}
                    <FormItem label="Categories">
                        <Controller
                            name="filterCategoryIds"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select Categories"
                                    options={categoryOptions}
                                    value={categoryOptions.filter((o) =>
                                        field.value?.includes(o.value),
                                    )}
                                    onChange={(opts) =>
                                        field.onChange(
                                            opts?.map((o) => o.value) || [],
                                        )
                                    }
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Sub Categories">
                        <Controller
                            name="filterSubCategoryIds"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder={
                                        !watchedFilterCategoryIds ||
                                        watchedFilterCategoryIds.length !== 1
                                            ? 'Select one category first'
                                            : subcategoryOptions.length === 0
                                              ? 'No subcategories found'
                                              : 'Select Sub Categories'
                                    }
                                    options={subcategoryOptions}
                                    value={subcategoryOptions.filter((o) =>
                                        field.value?.includes(o.value),
                                    )}
                                    onChange={(opts) =>
                                        field.onChange(
                                            opts?.map((o) => o.value) || [],
                                        )
                                    }
                                    isDisabled={
                                        !watchedFilterCategoryIds ||
                                        watchedFilterCategoryIds.length !== 1 ||
                                        (subcategoryOptions.length === 0 &&
                                            masterLoadingStatus !== 'loading')
                                    }
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Brands">
                        <Controller
                            name="filterBrandIds"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select Brands"
                                    options={brandOptions}
                                    value={brandOptions.filter((o) =>
                                        field.value?.includes(o.value),
                                    )}
                                    onChange={(opts) =>
                                        field.onChange(
                                            opts?.map((o) => o.value) || [],
                                        )
                                    }
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Status">
                        <Controller
                            name="filterStatus"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select status..."
                                    options={statusOptions}
                                    value={field.value || []}
                                    onChange={(selectedVal) =>
                                        field.onChange(selectedVal || [])
                                    }
                                />
                            )}
                        />
                    </FormItem>
                </Form>
            </Drawer>

            <ConfirmDialog
                isOpen={isExportReasonModalOpen}
                type="info"
                title="Reason for Export"
                className={'w-full'}
                onClose={() => setIsExportReasonModalOpen(false)}
                onRequestClose={() => setIsExportReasonModalOpen(false)}
                onCancel={() => setIsExportReasonModalOpen(false)}
                onConfirm={exportReasonFormMethods.handleSubmit(
                    handleConfirmExportWithReason,
                )}
                loading={isSubmittingExportReason}
                confirmText={
                    isSubmittingExportReason
                        ? 'Submitting...'
                        : 'Submit & Export'
                }
                cancelText="Cancel"
                disableConfirm={
                    !exportReasonFormMethods.formState.isValid ||
                    isSubmittingExportReason
                } // Corrected: use disableConfirm
                confirmButtonProps={{
                    // Alternative for older ConfirmDialog versions, ensure only one method is used
                    disabled:
                        !exportReasonFormMethods.formState.isValid ||
                        isSubmittingExportReason,
                }}
            >
                <Form
                    id="exportReasonForm"
                    onSubmit={(e) => {
                        e.preventDefault()
                        exportReasonFormMethods.handleSubmit(
                            handleConfirmExportWithReason,
                        )()
                    }}
                    className="flex flex-col mt-2"
                >
                    <FormItem
                        label="Please provide a reason for exporting this data:"
                        invalid={
                            !!exportReasonFormMethods.formState.errors.reason
                        }
                        errorMessage={
                            exportReasonFormMethods.formState.errors.reason
                                ?.message
                        }
                    >
                        <Controller
                            name="reason"
                            control={exportReasonFormMethods.control}
                            render={({ field }) => (
                                <Input
                                    textArea
                                    {...field}
                                    placeholder="Enter reason..."
                                    rows={3}
                                />
                            )}
                        />
                    </FormItem>
                </Form>
            </ConfirmDialog>

            <ConfirmDialog
                isOpen={isTodayExportReasonModalOpen}
                type="info"
                title="Reason for Export"
                className={'w-full'}
                onClose={() => setIsTodayExportReasonModalOpen(false)}
                onRequestClose={() => setIsTodayExportReasonModalOpen(false)}
                onCancel={() => setIsTodayExportReasonModalOpen(false)}
                onConfirm={exportReasonFormMethods.handleSubmit(
                    handleTodayConfirmExportWithReason,
                )}
                loading={isTodayExportReasonModalOpen}
                confirmText={
                    isTodaySubmittingExportReason
                        ? 'Submitting...'
                        : 'Submit & Export'
                }
                cancelText="Cancel"
                disableConfirm={
                    !exportReasonFormMethods.formState.isValid ||
                    isTodaySubmittingExportReason
                } // Corrected: use disableConfirm
                confirmButtonProps={{
                    // Alternative for older ConfirmDialog versions, ensure only one method is used
                    disabled:
                        !exportReasonFormMethods.formState.isValid ||
                        isTodaySubmittingExportReason,
                }}
            >
                <Form
                    id="exportReasonForm"
                    onSubmit={(e) => {
                        e.preventDefault()
                        exportReasonFormMethods.handleSubmit(
                            handleConfirmExportWithReason,
                        )()
                    }}
                    className="flex flex-col mt-2"
                >
                    <FormItem
                        label="Please provide a reason for exporting this data:"
                        invalid={
                            !!exportReasonFormMethods.formState.errors.reason
                        }
                        errorMessage={
                            exportReasonFormMethods.formState.errors.reason
                                ?.message
                        }
                    >
                        <Controller
                            name="reason"
                            control={exportReasonFormMethods.control}
                            render={({ field }) => (
                                <Input
                                    textArea
                                    {...field}
                                    placeholder="Enter reason..."
                                    rows={3}
                                />
                            )}
                        />
                    </FormItem>
                </Form>
            </ConfirmDialog>

            <Drawer
                title="Today's Price List"
                isOpen={isTodayPriceDrawerOpen}
                onClose={closeTodayPriceDrawer}
                onRequestClose={closeTodayPriceDrawer}
                width={700}
                footer={
                    <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-gray-500">
                            {todayPriceListData.length} item(s) updated today.
                        </span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                icon={<FaRegFilePdf />}
                                onClick={handlePdfDownload}
                                disabled={todayPriceListData.length === 0}
                            >
                                PDF
                            </Button>
                            <Button
                                size="sm"
                                icon={<BsFileExcelFill />}
                                onClick={handleExcelDownload}
                                disabled={todayPriceListData.length === 0}
                            >
                                Excel
                            </Button>
                            <Dropdown
                                placement="top-end"
                                renderTitle={
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        icon={<TbShare />}
                                        disabled={
                                            todayPriceListData.length === 0
                                        }
                                    >
                                        Share
                                    </Button>
                                }
                            >
                                <Dropdown.Item
                                    icon={<HiOutlineMail />}
                                    onClick={handleShareViaEmail}
                                >
                                    Share via Email
                                </Dropdown.Item>
                                <Dropdown.Item
                                    icon={<FaWhatsapp />}
                                    onClick={handleShareViaWhatsapp}
                                >
                                    Share on WhatsApp
                                </Dropdown.Item>
                            </Dropdown>
                        </div>
                    </div>
                }
            >
                <div className="h-full">
                    {todayPriceListData.length > 0 ? (
                        <Table>
                            <Table.THead>
                                <Table.Tr>
                                    <Table.Th>Product Name</Table.Th>
                                    <Table.Th>Sales Price</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                </Table.Tr>
                            </Table.THead>
                            <Table.TBody>
                                {todayPriceListData?.map((item) => (
                                    <Table.Tr key={item.id}>
                                        <Table.Td>
                                            {item.product?.name}
                                        </Table.Td>
                                        <Table.Td>
                                            ${item.sales_price}
                                        </Table.Td>
                                        <Table.Td>
                                            <Tag
                                                className={classNames(
                                                    'capitalize',
                                                    {
                                                        'bg-emerald-100 text-emerald-600':
                                                            item.status ===
                                                            'Active',
                                                        'bg-red-100 text-red-600':
                                                            item.status ===
                                                            'Inactive',
                                                    },
                                                )}
                                            >
                                                {item.status}
                                            </Tag>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.TBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                                <TbFileDownload className="text-4xl text-gray-500" />
                            </div>
                            <h6 className="font-semibold">
                                No Prices Updated Today
                            </h6>
                            <p className="text-gray-500">
                                Check back later or view the full price list.
                            </p>
                        </div>
                    )}
                </div>
            </Drawer>
        </>
    )
}

export default PriceList