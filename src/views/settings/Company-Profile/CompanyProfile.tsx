import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import { useForm, Controller } from 'react-hook-form'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import { Card, Drawer, Tag, Form, FormItem, Input } from '@/components/ui'

// Icons
import {
    TbPencil,
    TbTrash,
    TbChecks,
    TbSearch,
    TbFilter,
    TbCloudUpload,
    TbPlus,
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import { useAppDispatch } from '@/reduxtool/store'
import {
    getContinentsAction,
    getCountriesAction,
    getDocumentTypeAction,
    getPaymentTermAction,
} from '@/reduxtool/master/middleware'
import { useSelector } from 'react-redux'
import { masterSelector } from '@/reduxtool/master/masterSlice'

// --- Define FormItem Type (Table Row Data) ---
export type CompanyItem = {
    id: string;
    name: string;
    email: string;
    phone: string;
    from: string;
    date: string;
    status: 'active' | 'inactive';
}

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onEdit,
    onDelete,
}: {
    onEdit: () => void
    onDelete: () => void
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <div className="flex items-center justify-center">
            <Tooltip title="Edit">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400',
                    )}
                    role="button"
                    onClick={onEdit}
                >
                    <TbPencil />
                </div>
            </Tooltip>
            <Tooltip title="Delete">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400',
                    )}
                    role="button"
                    onClick={onDelete}
                >
                    <TbTrash />
                </div>
            </Tooltip>
        </div>
    )
}
// --- End ActionColumn ---

// --- CompanyProfileSearch Component ---
type CompanyProfileSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const CompanyProfileSearch = React.forwardRef<
    HTMLInputElement,
    CompanyProfileSearchProps
>(({ onInputChange }, ref) => {
    return (
        <DebouceInput
            ref={ref}
            placeholder="Quick Search..."
            suffix={<TbSearch className="text-lg" />}
            onChange={(e) => onInputChange(e.target.value)}
        />
    )
})
CompanyProfileSearch.displayName = 'CompanyProfileSearch'
// --- End CompanyProfileSearch ---

// --- CompanyProfileTableTools Component ---
const CompanyProfileTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    type CompanyProfileFilterSchema = {
        userRole: String
        exportFrom: String
        exportDate: Date
    }

    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false)
    const closeFilterDrawer = () => setIsFilterDrawerOpen(false)
    const openFilterDrawer = () => setIsFilterDrawerOpen(true)

    const { control, handleSubmit } = useForm<CompanyProfileFilterSchema>()

    const exportFiltersSubmitHandler = (data: CompanyProfileFilterSchema) => {
        console.log("filter data", data)
    }

    return (
        <div className="flex items-center w-full gap-2">
            <div className="flex-grow">
                <CompanyProfileSearch onInputChange={onSearchChange} />
            </div>
            <Button icon={<TbFilter />} className='' onClick={openFilterDrawer}>
                Filter
            </Button>
            <Button icon={<TbCloudUpload />}>Export</Button>
            <Drawer
                title="Filters"
                isOpen={isFilterDrawerOpen}
                onClose={closeFilterDrawer}
                onRequestClose={closeFilterDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeFilterDrawer}>
                            Cancel
                        </Button>
                    </div>
                }
            >
                <Form size='sm' onSubmit={handleSubmit(exportFiltersSubmitHandler)} containerClassName='flex flex-col'>
                    <FormItem label='Document Name'>
                    </FormItem>
                </Form>
            </Drawer>
        </div>
    )
}
// --- End CompanyProfileTableTools ---

// --- FormListActionTools Component (No functional changes needed for filter removal) ---
const FormListActionTools = ({
    allFormsData,
    openAddDrawer,
}: {
    allFormsData: CompanyItem[];
    openAddDrawer: () => void; // Accept function as a prop
}) => {
    const navigate = useNavigate()
    const csvHeaders = [

    ]

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {/*
            <CSVLink
                className="w-full"
                filename="documentTypeList.csv"
                data={allFormsData}
                headers={csvHeaders}
            >
                <Button icon={<TbCloudDownload />} className="w-full" block>
                    Download
                </Button>
            </CSVLink>
            */}
            <Button
                variant="solid"
                icon={<TbPlus />}
                onClick={openAddDrawer}
                block
            >
                Add New
            </Button>
        </div>
    )
}

// --- FormListTable Component (No changes) ---
const FormListTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedForms,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<CompanyItem>[]
    data: CompanyItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedForms: CompanyItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: CompanyItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<CompanyItem>[]) => void
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            noData={!loading && data.length === 0}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedForms.some((selected) => selected.id === row.id)
            }
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
            onCheckBoxChange={onRowSelect}
            onIndeterminateCheckBoxChange={onAllRowSelect}
        />
    )
}

// --- Main CompanyProfile Component ---
const CompanyProfile = () => {
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<CompanyItem | null>(null);

    const openEditDrawer = (item: CompanyItem) => {
        setSelectedItem(item);
        setIsEditDrawerOpen(true);
    };

    const closeEditDrawer = () => {
        setSelectedItem(null);
        setIsEditDrawerOpen(false);
    };

    const openAddDrawer = () => {
        setSelectedItem(null);
        setIsAddDrawerOpen(true);
    };

    const closeAddDrawer = () => {
        setIsAddDrawerOpen(false);
    };

    const navigate = useNavigate()
    const dispatch = useAppDispatch()

    useEffect(() => {
        dispatch(getCountriesAction())
    }, [dispatch])

    const { CompanyProfileData = [], status: masterLoadingStatus = 'idle' } =
        useSelector(masterSelector)

    const initialDummyForms: CompanyItem[] = [
        {
            id: 'F001',
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+1-123-456-7890',
            from: 'USA',
            date: '2023-05-01',
            status: 'active',
        },
        {
            id: 'F002',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            phone: '+1-987-654-3210',
            from: 'Canada',
            date: '2023-05-02',
            status: 'active',
        },
    ];

    const [forms, setForms] = useState<CompanyItem[]>(initialDummyForms);
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    });
    const [selectedForms, setSelectedForms] = useState<CompanyItem[]>([]);

    const columns: ColumnDef<CompanyItem>[] = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                enableSorting: true,
                cell: (props) => <span>{props.row.original.id}</span>,
            },
            {
                header: 'Name',
                accessorKey: 'name',
                enableSorting: true,
                cell: (props) => <span>{props.row.original.name}</span>,
            },
            {
                header: 'Email',
                accessorKey: 'email',
                enableSorting: true,
                cell: (props) => <span>{props.row.original.email}</span>,
            },
            {
                header: 'Phone',
                accessorKey: 'phone',
                enableSorting: true,
                cell: (props) => <span>{props.row.original.phone}</span>,
            },
            {
                header: 'From',
                accessorKey: 'from',
                enableSorting: true,
                cell: (props) => <span>{props.row.original.from}</span>,
            },
            {
                header: 'Date',
                accessorKey: 'date',
                enableSorting: true,
                cell: (props) => <span>{props.row.original.date}</span>,
            },
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                cell: (props) => (
                    <Tag
                        className={
                            props.row.original.status === 'active'
                                ? 'bg-green-200 text-green-600'
                                : 'bg-red-200 text-red-600'
                        }
                    >
                        {props.row.original.status}
                    </Tag>
                ),
            },
            {
                header: 'Action',
                id: 'action',
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => openEditDrawer(props.row.original)}
                        onDelete={() => console.log('Delete', props.row.original)}
                    />
                ),
            },
        ],
        [],
    )

    // --- FormListSelected Component (No functional changes needed for filter removal) ---
const FormListSelected = ({
    selectedForms,
    setSelectedForms,
    onDeleteSelected,
}: {
    selectedForms: CompanyItem[]
    setSelectedForms: React.Dispatch<React.SetStateAction<CompanyItem[]>>
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedForms.length === 0) return null

    return (
        <>
            <StickyFooter
                className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
                stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
            >
                <div className="flex items-center justify-between w-full px-4 sm:px-8">
                    <span className="flex items-center gap-2">
                        <span className="text-lg text-primary-600 dark:text-primary-400">
                            <TbChecks />
                        </span>
                        <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                            <span className="heading-text">
                                {selectedForms.length}
                            </span>
                            <span>
                                Item{selectedForms.length > 1 ? 's' : ''}{' '}
                                selected
                            </span>
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <Button
                            size="sm"
                            variant="plain"
                            className="text-red-600 hover:text-red-500"
                            onClick={handleDeleteClick}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title={`Delete ${selectedForms.length} Item${selectedForms.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected item
                    {selectedForms.length > 1 ? 's' : ''}? This action cannot be
                    undone.
                </p>
            </ConfirmDialog>
        </>
    )
}

    
    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="lg:flex items-center justify-between mb-4">
                        <h5 className="mb-4 lg:mb-0">Company Profile</h5>
                        <FormListActionTools
                            allFormsData={forms}
                            openAddDrawer={openAddDrawer} // Pass the function as a prop
                        />
                    </div>

                    <div className="mb-4">
                        <CompanyProfileTableTools
                            onSearchChange={(query) =>
                                setTableData((prev) => ({ ...prev, query }))
                            }
                        />
                    </div>

                    <FormListTable
                        columns={columns}
                        data={forms}
                        loading={false}
                        pagingData={{
                            total: forms.length,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedForms={selectedForms}
                        onPaginationChange={(page) =>
                            setTableData((prev) => ({ ...prev, pageIndex: page }))
                        }
                        onSelectChange={(value) =>
                            setTableData((prev) => ({
                                ...prev,
                                pageSize: Number(value),
                                pageIndex: 1,
                            }))
                        }
                        onSort={(sort) =>
                            setTableData((prev) => ({ ...prev, sort }))
                        }
                        onRowSelect={(checked, row) =>
                            setSelectedForms((prev) =>
                                checked
                                    ? [...prev, row]
                                    : prev.filter((form) => form.id !== row.id)
                            )
                        }
                        onAllRowSelect={(checked, rows) => {
                            const rowIds = rows.map((row) => row.original.id);
                            setSelectedForms((prev) =>
                                checked
                                    ? [...prev, ...rows.map((row) => row.original)]
                                    : prev.filter((form) => !rowIds.includes(form.id))
                            );
                        }}
                    />
                </AdaptiveCard>

                <FormListSelected
                    selectedForms={selectedForms}
                    setSelectedForms={setSelectedForms}
                    onDeleteSelected={() =>
                        setForms((prev) =>
                            prev.filter(
                                (form) =>
                                    !selectedForms.some(
                                        (selected) => selected.id === form.id
                                    )
                            )
                        )
                    }
                />
            </Container>

            {/* Edit Drawer */}
            <Drawer
                title="Edit Profile"
                isOpen={isEditDrawerOpen}
                onClose={closeEditDrawer}
                onRequestClose={closeEditDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeEditDrawer}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            onClick={() => {
                                console.log('Updated Company Profile:', selectedItem);
                                closeEditDrawer();
                            }}
                        >
                            Save
                        </Button>
                    </div>
                }
            >
                <Form>
                    <FormItem label="Name">
                        <Input
                            value={selectedItem?.name || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', name: '', email: '', phone: '', from: '', date: '', status: 'active' }),
                                    name: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Email">
                        <Input
                            value={selectedItem?.email || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', name: '', email: '', phone: '', from: '', date: '', status: 'active' }),
                                    email: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Phone">
                        <Input
                            value={selectedItem?.phone || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', name: '', email: '', phone: '', from: '', date: '', status: 'active' }),
                                    phone: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="From">
                        <Input
                            value={selectedItem?.from || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', name: '', email: '', phone: '', from: '', date: '', status: 'active' }),
                                    from: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Date">
                        <Input
                            type="date"
                            value={selectedItem?.date || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', name: '', email: '', phone: '', from: '', date: '', status: 'active' }),
                                    date: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Status">
                        <select
                            value={selectedItem?.status || 'active'}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', name: '', email: '', phone: '', from: '', date: '', status: 'active' }),
                                    status: e.target.value as 'active' | 'inactive',
                                }))
                            }
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </FormItem>
                </Form>
            </Drawer>

            <Drawer
                title="Add New Profile"
                isOpen={isAddDrawerOpen}
                onClose={closeAddDrawer}
                onRequestClose={closeAddDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeAddDrawer}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            onClick={() => console.log('Company Profile Added')}
                        >
                            Add
                        </Button>
                    </div>
                }
            >
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target as HTMLFormElement);
                        const newItem: CompanyItem = {
                            id: `${forms.length + 1}`,
                            name: formData.get('name') as string,
                            email: formData.get('email') as string,
                            phone: formData.get('phone') as string,
                            from: formData.get('from') as string,
                            date: formData.get('date') as string,
                            status: formData.get('status') as 'active' | 'inactive',
                        };
                        console.log('New Company Profile:', newItem);
                        // handleAdd(newItem);
                    }}
                >
                    <FormItem label="Name">
                        <Input name="name" placeholder="Enter Name" />
                    </FormItem>
                    <FormItem label="Email">
                        <Input name="email" placeholder="Enter Email" />
                    </FormItem>
                    <FormItem label="Phone">
                        <Input name="phone" placeholder="Enter Phone" />
                    </FormItem>
                    <FormItem label="From">
                        <Input name="from" placeholder="Enter From" />
                    </FormItem>
                    <FormItem label="Date">
                        <Input name="date" type="date" />
                    </FormItem>
                    <FormItem label="Status">
                        <select name="status" defaultValue="active">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </FormItem>
                </Form>
            </Drawer>
        </>
    )
}

export default CompanyProfile

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ')
}
