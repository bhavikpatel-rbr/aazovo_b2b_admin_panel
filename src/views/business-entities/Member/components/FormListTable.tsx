import { useState, useMemo, useCallback } from 'react'
import Avatar from '@/components/ui/Avatar' // Can remove if forms don't have productNames
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import DataTable from '@/components/shared/DataTable'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
// Import new icons
import {
    TbPencil,
    TbEye,
    TbCopy,
    TbSwitchHorizontal,
    TbTrash,
} from 'react-icons/tb'
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Define Form Type ---
export type FormItem = {
    id: string;
    member_name: string;
    member_contact_number: string;
    member_email_id: string;
    member_photo: string; // URL or path
    member_photo_upload: string; // could be a timestamp or status string
    member_role: string;
    member_status: 'active' | 'inactive'; // 'Active' | 'Inactive'
    member_join_date: string; // Date string (e.g. "2025-05-17")
    profile_completion: number; // float
    success_score: number; // integer
    trust_score: number; // integer
    activity_score: number; // integer
    associated_brands: string[]; // array of strings
    business_category: string[]; // array of strings
    interested_in: string; // 'Buy' | 'Sell' | 'Both'
    company_id: string;
    company_name: string;
    membership_stats: string; // formatted string like "12/43"
    member_location: string;
    kyc_status: string; // 'Verified' | 'Pending' | 'Not Submitted'
}

// --- End Form Type Definition ---

// --- Updated Status Colors ---
const statusColor: Record<FormItem['member_status'], string> = {
    active: 'bg-green-200 dark:bg-green-200 text-green-600 dark:text-green-600',
    inactive: 'bg-red-200 dark:bg-red-200 text-red-600 dark:text-red-600', // Example color for inactive
}

// --- ActionColumn Component ---
// Added onClone and onChangeStatus props
const ActionColumn = ({
    onEdit,
    onViewDetail,
    onClone,
    onChangeStatus,
}: {
    onEdit: () => void
    onViewDetail: () => void
    onClone: () => void
    onChangeStatus: () => void
}) => {
    return (
        <div className="flex items-center justify-center gap-1">
            {' '}
            {/* Align actions to end */}
            {/* <Tooltip title="Clone Form">
                <div
                    className={`text-xl cursor-pointer select-none font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400`}
                    role="button"
                    onClick={onClone}
                >
                    <TbCopy />
                </div>
            </Tooltip> */}
            <Tooltip title="Change Status">
                <div
                    className={`text-xl cursor-pointer select-none text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400`}
                    role="button"
                    onClick={onChangeStatus}
                >
                    <TbSwitchHorizontal />
                </div>
            </Tooltip>
            <Tooltip title="Edit">
                {' '}
                {/* Keep Edit/View if needed */}
                <div
                    className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`}
                    role="button"
                    onClick={onEdit}
                >
                    <TbPencil />
                </div>
            </Tooltip>
            <Tooltip title="View">
                <div
                    className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`}
                    role="button"
                    onClick={onViewDetail}
                >
                    <TbTrash />
                </div>
            </Tooltip>
        </div>
    )
}

// --- Initial Dummy Data ---
const initialDummyForms: FormItem[] = [
    {
    id: "1",
    member_name: "John Doe",
    member_contact_number: "+1234567890",
    member_email_id: "john.doe@example.com",
    member_photo: "https://example.com/photo1.jpg",
    member_photo_upload: "Uploaded at 2025-05-17T10:00:00Z",
    member_role: "Director",
    member_status: "active",
    member_join_date: "2023-01-01",
    profile_completion: 85.5,
    success_score: 75,
    trust_score: 80,
    activity_score: 90,
    associated_brands: ["Brand A", "Brand B"],
    business_category: ["Automotive", "Electronics"],
    interested_in: "Both",
    company_id: "COMP12345",
    company_name: "Acme Corporation",
    membership_stats: "12/43",
    member_location: "USA / New York / NY",
    kyc_status: "Verified",
  },
  {
    id: "2",
    member_name: "Jane Smith",
    member_contact_number: "+1987654321",
    member_email_id: "jane.smith@example.com",
    member_photo: "https://example.com/photo2.jpg",
    member_photo_upload: "Uploaded at 2025-05-16T11:00:00Z",
    member_role: "Manager",
    member_status: "inactive",
    member_join_date: "2022-06-15",
    profile_completion: 72.0,
    success_score: 60,
    trust_score: 70,
    activity_score: 65,
    associated_brands: ["Brand C"],
    business_category: ["Healthcare"],
    interested_in: "Sell",
    company_id: "COMP67890",
    company_name: "Beta Enterprises",
    membership_stats: "8/30",
    member_location: "UK / London",
    kyc_status: "Pending",
  },
  {
    id: "3",
    member_name: "Alice Johnson",
    member_contact_number: "+1123456789",
    member_email_id: "alice.johnson@example.com",
    member_photo: "https://example.com/photo3.jpg",
    member_photo_upload: "Uploaded at 2025-05-15T09:30:00Z",
    member_role: "Engineer",
    member_status: "active",
    member_join_date: "2021-09-10",
    profile_completion: 92.0,
    success_score: 88,
    trust_score: 95,
    activity_score: 98,
    associated_brands: ["Brand D", "Brand E"],
    business_category: ["IT Services", "FinTech"],
    interested_in: "Buy",
    company_id: "COMP24680",
    company_name: "Gamma Innovations",
    membership_stats: "20/50",
    member_location: "India / Bengaluru / KA",
    kyc_status: "Verified",
  }
];
// --- End Dummy Data ---

const FormListTable = () => {
    const navigate = useNavigate()

    // --- Local State for Table Data and Selection ---
    const [isLoading, setIsLoading] = useState(false)
    const [forms, setForms] = useState<FormItem[]>(initialDummyForms) // Make forms stateful
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedForms, setSelectedForms] = useState<FormItem[]>([]) // Renamed state
    // --- End Local State ---

    // Simulate data fetching and processing based on tableData
    const { pageData, total } = useMemo(() => {
        let filteredData = [...forms] // Use the stateful forms data

        // --- Filtering ---
        if (tableData.query) {
            const query = tableData.query.toLowerCase();
            filteredData = forms.filter(
                (form) =>
                    form.id.toLowerCase().includes(query) ||
                    form.member_name.toLowerCase().includes(query) ||
                    form.member_email_id.toLowerCase().includes(query) ||
                    form.member_contact_number.toLowerCase().includes(query) ||
                    form.member_status.toLowerCase().includes(query) ||
                    form.member_role.toLowerCase().includes(query) ||
                    form.company_name.toLowerCase().includes(query) ||
                    form.member_location.toLowerCase().includes(query)
            );
        }

        // --- Sorting ---
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            filteredData.sort((a, b) => {
                const aValue = a[key as keyof FormItem] ?? ''
                const bValue = b[key as keyof FormItem] ?? ''

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return order === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue)
                }
                // Add number comparison if forms have numeric fields to sort
                return 0
            })
        }

        // --- Pagination ---
        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const dataTotal = filteredData.length // Use filtered length for total
        const startIndex = (pageIndex - 1) * pageSize
        const dataForPage = filteredData.slice(
            startIndex,
            startIndex + pageSize,
        )

        return { pageData: dataForPage, total: dataTotal }
    }, [forms, tableData]) // Depend on forms state and tableData

    // --- Action Handlers ---
    const handleEdit = (form: FormItem) => {
        // Navigate to a hypothetical form edit page
        console.log('Navigating to edit form:', form.id)
        // navigate(`/forms/edit/${form.id}`) // Example navigation
    }

    const handleViewDetails = (form: FormItem) => {
        // Navigate to a hypothetical form details page
        console.log('Navigating to view form:', form.id)
        // navigate(`/forms/details/${form.id}`) // Example navigation
    }

    const handleCloneForm = (form: FormItem) => {
        // Generate a new unique ID for the cloned form
        const newId = `F${Math.floor(Math.random() * 9000) + 1000}`;
    
        // Create a cloned form with updated fields
        const clonedForm: FormItem = {
            ...form,
            id: newId, // Assign the new ID
            member_name: `${form.member_name} (Clone)`, // Append "(Clone)" to the member name
            member_contact_number: form.member_contact_number, // Copy contact
            member_email_id: form.member_email_id, // Keep same email
            member_photo: form.member_photo,
            member_photo_upload: form.member_photo_upload,
            member_role: form.member_role,
            member_status: 'inactive', // Cloned forms start as inactive
            member_join_date: form.member_join_date,
            profile_completion: form.profile_completion,
            success_score: form.success_score,
            trust_score: form.trust_score,
            activity_score: form.activity_score,
            associated_brands: [...form.associated_brands], // Clone array
            business_category: [...form.business_category],
            interested_in: form.interested_in,
            company_id: form.company_id,
            company_name: `${form.company_name} (Clone)`, // Append "(Clone)" to company name
            membership_stats: form.membership_stats,
            member_location: form.member_location,
            kyc_status: form.kyc_status,
        };

    
        // Add the cloned form to the beginning of the forms list
        setForms((prev) => [clonedForm, ...prev]);
    
        // Optionally navigate to the edit page of the cloned form
        console.log(`Cloned form created with ID: ${newId}`);
        // navigate(`/forms/edit/${newId}`); // Uncomment if navigation is required
    };

    const handleChangeStatus = (form: FormItem) => {
        // Logic to change the status (e.g., API call and update state)
        const newStatus = form.member_status === 'active' ? 'inactive' : 'active'
        console.log(`Changing status of form ${form.id} to ${newStatus}`)

        // Update the status in the local state for visual feedback
        setForms((currentForms) =>
            currentForms.map((f) =>
                f.id === form.id ? { ...f, member_status: newStatus } : f,
            ),
        )
    }
    // --- End Action Handlers ---

    // --- Columns Definition ---
    const columns: ColumnDef<FormItem>[] = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                // Simple cell to display ID, enable sorting
                enableSorting: true,
                size:70,
                cell: (props) => <span>{props.row.original.id}</span>,
            },
            { header: 'Member Name', accessorKey: 'member_name' },
            { header: 'Contact Number', accessorKey: 'member_contact_number' },
            { header: 'Email ID', accessorKey: 'member_email_id' },
            {
                header: 'Photo',
                accessorKey: 'member_photo',
                cell: (props) => (
                    <img
                        src={props.row.original.member_photo}
                        alt="Member"
                        className="h-10 w-10 object-cover rounded-full"
                    />
                )
            },
            { header: 'Photo Upload', accessorKey: 'member_photo_upload' },
            { header: 'Role', accessorKey: 'member_role' },
            {
                header: 'Member Status',
                accessorKey: 'member_status',
                                cell: (props) => {
                    const { member_status } = props.row.original
                    return (
                        <div className="flex items-center">
                            <Tag className={statusColor[member_status]}>
                                <span className="capitalize">{member_status}</span>
                            </Tag>
                        </div>
                    )
                },
            },
            { header: 'Join Date', accessorKey: 'member_join_date' },
            { header: 'Profile Completion %', accessorKey: 'profile_completion' },
            { header: 'Success Score %', accessorKey: 'success_score' },
            { header: 'Trust Score %', accessorKey: 'trust_score' },
            { header: 'Activity Score %', accessorKey: 'activity_score' },
            {
                header: 'Associated Brands',
                accessorKey: 'associated_brands',
                cell: (props) => props.row.original.associated_brands.join(', ')
            },
            {
                header: 'Business Category',
                accessorKey: 'business_category',
                cell: (props) => props.row.original.business_category.join(', ')
            },
            { header: 'Interested In', accessorKey: 'interested_in' },
            { header: 'Company ID', accessorKey: 'company_id' },
            { header: 'Company Name', accessorKey: 'company_name' },
            { header: 'Membership Stats', accessorKey: 'membership_stats' },
            { header: 'Location', accessorKey: 'member_location' },
            {
                header: 'KYC Status',
                accessorKey: 'kyc_status',
                cell: (props) => {
                    const kyc = props.row.original.kyc_status;
                    let color = 'bg-gray-200 text-gray-700';
                    if (kyc === 'Verified') color = 'bg-green-100 text-green-800';
                    else if (kyc === 'Pending') color = 'bg-yellow-100 text-yellow-800';
                    else if (kyc === 'Not Submitted') color = 'bg-red-100 text-red-800';
                    return <Tag className={color}>{kyc}</Tag>;
                }
            },
            {
                header: 'Action', // Keep header empty for actions
                id: 'action',
                size: 160, // Adjust width for actions
                meta:{HeaderClass: "text-center"},
                cell: (props) => (
                    <ActionColumn
                        // Pass new handlers
                        onClone={() => handleCloneForm(props.row.original)}
                        onChangeStatus={() =>
                            handleChangeStatus(props.row.original)
                        }
                        // Keep existing handlers if needed
                        onEdit={() => handleEdit(props.row.original)}
                        onViewDetail={() =>
                            handleViewDetails(props.row.original)
                        }
                    />
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [], // Handlers are defined outside, state dependency handled by component re-render
    )
    // --- End Columns Definition ---

    // --- Table Interaction Handlers (Pagination, Selection, etc.) ---
    const handleSetTableData = useCallback(
        (data: TableQueries) => {
            setTableData(data)
            if (selectedForms.length > 0) {
                setSelectedForms([]) // Clear selection on data change
            }
        },
        [selectedForms.length], // Dependency needed
    )

    const handlePaginationChange = useCallback(
        (page: number) => {
            const newTableData = cloneDeep(tableData)
            newTableData.pageIndex = page
            handleSetTableData(newTableData)
        },
        [tableData, handleSetTableData],
    )

    const handleSelectChange = useCallback(
        (value: number) => {
            const newTableData = cloneDeep(tableData)
            newTableData.pageSize = Number(value)
            newTableData.pageIndex = 1
            handleSetTableData(newTableData)
        },
        [tableData, handleSetTableData],
    )

    const handleSort = useCallback(
        (sort: OnSortParam) => {
            const newTableData = cloneDeep(tableData)
            newTableData.sort = sort
            handleSetTableData(newTableData)
        },
        [tableData, handleSetTableData],
    )

    const handleRowSelect = useCallback((checked: boolean, row: FormItem) => {
        setSelectedForms((prev) => {
            if (checked) {
                return prev.some((f) => f.id === row.id) ? prev : [...prev, row]
            } else {
                return prev.filter((f) => f.id !== row.id)
            }
        })
    }, [])

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<FormItem>[]) => {
            if (checked) {
                const originalRows = rows.map((row) => row.original)
                setSelectedForms(originalRows)
            } else {
                setSelectedForms([])
            }
        },
        [],
    )
    // --- End Table Interaction Handlers ---

    return (
        <DataTable
            selectable
            columns={columns}
            data={pageData} // Use processed page data
            noData={!isLoading && forms.length === 0} // Check stateful forms length
            // Remove skeleton avatar if not used
            // skeletonAvatarColumns={[0]}
            // skeletonAvatarProps={{ width: 28, height: 28 }}
            loading={isLoading}
            pagingData={{
                total: total, // Use calculated total from filtered data
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
            }}
            checkboxChecked={
                (row) =>
                    selectedForms.some((selected) => selected.id === row.id) // Use selectedForms state
            }
            onPaginationChange={handlePaginationChange}
            onSelectChange={handleSelectChange}
            onSort={handleSort}
            onCheckBoxChange={handleRowSelect} // Pass correct handler
            onIndeterminateCheckBoxChange={handleAllRowSelect} // Pass correct handler
        />
    )
}

export default FormListTable
