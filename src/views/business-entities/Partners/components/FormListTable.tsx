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
  status: 'active' | 'inactive'; // Changed status options
  partner_name: string;
  partner_contact_number: string;
  partner_email_id: string;
  partner_logo: string; // URL
  partner_status: 'Active' | 'Inactive' | 'Pending';
  partner_join_date: string; // ISO date string
  partner_location: string;
  partner_profile_completion: number; // float
  partner_trust_score: number; // integer
  partner_activity_score: number; // integer
  partner_kyc_status: string;
  business_category: string[]; // array of strings
  partner_interested_in: 'Buy' | 'Sell' | 'Both' | 'None';
  partner_business_type: string;
  partner_profile_link: string; // URL
  partner_certifications: string[]; // array of strings
  partner_service_offerings: string[]; // array of strings
  partner_website: string; // URL
  partner_payment_terms: string;
  partner_reference_id: string;
  partner_document_upload: string; // URL
  partner_lead_time: number; // integer
};

// --- End Form Type Definition ---

// --- Updated Status Colors ---
const statusColor: Record<FormItem['status'], string> = {
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
export const initialDummyForms: FormItem[] = [
  {
    id: 'F001',
    status: 'active',
    partner_name: 'Alpha Tech Solutions',
    partner_contact_number: '+1-202-555-0143',
    partner_email_id: 'contact@alphatech.com',
    partner_logo: 'https://example.com/logos/alpha.png',
    partner_status: 'Active',
    partner_join_date: '2023-01-15',
    partner_location: 'New York, USA',
    partner_profile_completion: 95.5,
    partner_trust_score: 88,
    partner_activity_score: 75,
    partner_kyc_status: 'Verified',
    business_category: ['IT', 'Consulting'],
    partner_interested_in: 'Both',
    partner_business_type: 'B2B',
    partner_profile_link: 'https://example.com/partners/alpha',
    partner_certifications: ['ISO 9001', 'CMMI Level 3'],
    partner_service_offerings: ['Software Development', 'Cloud Services'],
    partner_website: 'https://alphatech.com',
    partner_payment_terms: 'Net 30',
    partner_reference_id: 'REF12345',
    partner_document_upload: 'https://example.com/docs/alpha_agreement.pdf',
    partner_lead_time: 7,
  },
  {
    id: 'F002',
    status: 'inactive',
    partner_name: 'Beta Logistics',
    partner_contact_number: '+44-161-555-0199',
    partner_email_id: 'info@betalogs.co.uk',
    partner_logo: 'https://example.com/logos/beta.png',
    partner_status: 'Inactive',
    partner_join_date: '2022-10-01',
    partner_location: 'Manchester, UK',
    partner_profile_completion: 78.2,
    partner_trust_score: 72,
    partner_activity_score: 60,
    partner_kyc_status: 'Pending',
    business_category: ['Logistics', 'Warehousing'],
    partner_interested_in: 'Sell',
    partner_business_type: 'B2B',
    partner_profile_link: 'https://example.com/partners/beta',
    partner_certifications: ['ISO 27001'],
    partner_service_offerings: ['Freight Transport', 'Storage'],
    partner_website: 'https://betalogs.co.uk',
    partner_payment_terms: 'Advance',
    partner_reference_id: 'REF56789',
    partner_document_upload: 'https://example.com/docs/beta_license.pdf',
    partner_lead_time: 10,
  },
  {
    id: 'F003',
    status: 'active',
    partner_name: 'Gamma Retailers',
    partner_contact_number: '+91-9876543210',
    partner_email_id: 'sales@gammaretail.in',
    partner_logo: 'https://example.com/logos/gamma.png',
    partner_status: 'Pending',
    partner_join_date: '2024-03-21',
    partner_location: 'Mumbai, India',
    partner_profile_completion: 67.0,
    partner_trust_score: 55,
    partner_activity_score: 49,
    partner_kyc_status: 'Under Review',
    business_category: ['Retail', 'FMCG'],
    partner_interested_in: 'Buy',
    partner_business_type: 'B2C',
    partner_profile_link: 'https://example.com/partners/gamma',
    partner_certifications: ['FSSAI'],
    partner_service_offerings: ['Retail Sales'],
    partner_website: 'https://gammaretail.in',
    partner_payment_terms: 'Net 15',
    partner_reference_id: 'REF32123',
    partner_document_upload: 'https://example.com/docs/gamma_docs.pdf',
    partner_lead_time: 5,
  },
  {
    id: 'F004',
    status: 'inactive',
    partner_name: 'Delta Engineering',
    partner_contact_number: '+61-2-9876-5432',
    partner_email_id: 'engineering@delta.com.au',
    partner_logo: 'https://example.com/logos/delta.png',
    partner_status: 'Active',
    partner_join_date: '2023-06-05',
    partner_location: 'Sydney, Australia',
    partner_profile_completion: 88.9,
    partner_trust_score: 91,
    partner_activity_score: 85,
    partner_kyc_status: 'Verified',
    business_category: ['Engineering', 'Manufacturing'],
    partner_interested_in: 'Sell',
    partner_business_type: 'B2B',
    partner_profile_link: 'https://example.com/partners/delta',
    partner_certifications: ['ISO 14001'],
    partner_service_offerings: ['Mechanical Design', 'CAD Services'],
    partner_website: 'https://delta.com.au',
    partner_payment_terms: 'Net 45',
    partner_reference_id: 'REF77889',
    partner_document_upload: 'https://example.com/docs/delta_papers.pdf',
    partner_lead_time: 12,
  },
  {
    id: 'F005',
    status: 'active',
    partner_name: 'Epsilon Innovations',
    partner_contact_number: '+49-30-123456',
    partner_email_id: 'hello@epsilon.de',
    partner_logo: 'https://example.com/logos/epsilon.png',
    partner_status: 'Active',
    partner_join_date: '2022-12-11',
    partner_location: 'Berlin, Germany',
    partner_profile_completion: 92.3,
    partner_trust_score: 85,
    partner_activity_score: 78,
    partner_kyc_status: 'Verified',
    business_category: ['AI', 'Tech Consulting'],
    partner_interested_in: 'Both',
    partner_business_type: 'B2B',
    partner_profile_link: 'https://example.com/partners/epsilon',
    partner_certifications: ['TUV Certified'],
    partner_service_offerings: ['AI Solutions', 'R&D Consulting'],
    partner_website: 'https://epsilon.de',
    partner_payment_terms: 'Milestone Based',
    partner_reference_id: 'REF00987',
    partner_document_upload: 'https://example.com/docs/epsilon_agreement.pdf',
    partner_lead_time: 8,
  },
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
            filteredData = forms.filter((form) =>
                form.id.toLowerCase().includes(query) ||
                form.partner_name.toLowerCase().includes(query) ||
                form.partner_contact_number.toLowerCase().includes(query) ||
                form.partner_email_id.toLowerCase().includes(query) ||
                form.partner_status.toLowerCase().includes(query) ||
                form.partner_location.toLowerCase().includes(query) ||
                form.partner_kyc_status.toLowerCase().includes(query) ||
                form.status.toLowerCase().includes(query)
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
            partner_name: `${form.partner_name} (Clone)`,
            partner_contact_number: form.partner_contact_number,
            partner_email_id: form.partner_email_id,
            partner_logo: form.partner_logo,
            partner_status: 'Inactive', // Cloned forms start as inactive
            partner_join_date: form.partner_join_date,
            partner_location: form.partner_location,
            partner_profile_completion: form.partner_profile_completion,
            partner_trust_score: form.partner_trust_score,
            partner_activity_score: form.partner_activity_score,
            partner_kyc_status: 'Pending', // Reset or mark KYC status
            business_category: [...form.business_category],
            partner_interested_in: form.partner_interested_in,
            partner_business_type: form.partner_business_type,
            partner_profile_link: form.partner_profile_link,
            partner_certifications: [...form.partner_certifications],
            partner_service_offerings: [...form.partner_service_offerings],
            partner_website: form.partner_website,
            partner_payment_terms: form.partner_payment_terms,
            partner_reference_id: form.partner_reference_id,
            partner_document_upload: form.partner_document_upload,
            partner_lead_time: form.partner_lead_time,
            status: 'inactive' // Keep overall form status also inactive
        };

    
        // Add the cloned form to the beginning of the forms list
        setForms((prev) => [clonedForm, ...prev]);
    
        // Optionally navigate to the edit page of the cloned form
        console.log(`Cloned form created with ID: ${newId}`);
        // navigate(`/forms/edit/${newId}`); // Uncomment if navigation is required
    };

    const handleChangeStatus = (form: FormItem) => {
        // Logic to change the status (e.g., API call and update state)
        const newStatus = form.status === 'active' ? 'inactive' : 'active'
        console.log(`Changing status of form ${form.id} to ${newStatus}`)

        // Update the status in the local state for visual feedback
        setForms((currentForms) =>
            currentForms.map((f) =>
                f.id === form.id ? { ...f, status: newStatus } : f,
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
            {
                header: 'Partner Name',
                accessorKey: 'partner_name',
                size: 150,
            },
            {
                header: 'Contact Number',
                accessorKey: 'partner_contact_number',
                size: 140,
            },
            {
                header: 'Email',
                accessorKey: 'partner_email_id',
                size: 180,
            },
            {
                header: 'Logo',
                accessorKey: 'partner_logo',
                size: 120,
                cell: ({ row }) => (
                <img src={row.original.partner_logo} alt="Logo" className="h-10 w-10 rounded-full object-cover" />
                ),
            },
            {
                header: 'Partner Status',
                accessorKey: 'partner_status',
                size: 120,
            },
            {
                header: 'Join Date',
                accessorKey: 'partner_join_date',
                size: 120,
                cell: ({ row }) => new Date(row.original.partner_join_date).toLocaleDateString(),
            },
            {
                header: 'Location',
                accessorKey: 'partner_location',
                size: 160,
            },
            {
                header: 'Profile Completion (%)',
                accessorKey: 'partner_profile_completion',
                size: 140,
            },
            {
                header: 'Trust Score',
                accessorKey: 'partner_trust_score',
                size: 120,
            },
            {
                header: 'Activity Score',
                accessorKey: 'partner_activity_score',
                size: 120,
            },
            {
                header: 'KYC Status',
                accessorKey: 'partner_kyc_status',
                size: 120,
            },
            {
                header: 'Business Category',
                accessorKey: 'business_category',
                size: 180,
                cell: ({ row }) => row.original.business_category.join(', '),
            },
            {
                header: 'Interested In',
                accessorKey: 'partner_interested_in',
                size: 120,
            },
            {
                header: 'Business Type',
                accessorKey: 'partner_business_type',
                size: 150,
            },
            {
                header: 'Profile Link',
                accessorKey: 'partner_profile_link',
                size: 180,
                cell: ({ row }) => (
                <a
                    href={row.original.partner_profile_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                >
                    View Profile
                </a>
                ),
            },
            {
                header: 'Certifications',
                accessorKey: 'partner_certifications',
                size: 180,
                cell: ({ row }) => row.original.partner_certifications.join(', '),
            },
            {
                header: 'Service Offerings',
                accessorKey: 'partner_service_offerings',
                size: 180,
                cell: ({ row }) => row.original.partner_service_offerings.join(', '),
            },
            {
                header: 'Website',
                accessorKey: 'partner_website',
                size: 180,
                cell: ({ row }) => (
                <a
                    href={row.original.partner_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                >
                    Visit Site
                </a>
                ),
            },
            {
                header: 'Payment Terms',
                accessorKey: 'partner_payment_terms',
                size: 150,
            },
            {
                header: 'Reference ID',
                accessorKey: 'partner_reference_id',
                size: 130,
            },
            {
                header: 'Document Upload',
                accessorKey: 'partner_document_upload',
                size: 150,
                cell: ({ row }) => (
                <a
                    href={row.original.partner_document_upload}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                >
                    View Document
                </a>
                ),
            },
            {
                header: 'Lead Time (days)',
                accessorKey: 'partner_lead_time',
                size: 120,
            },
            {
                header: 'Status',
                accessorKey: 'status',
                // Enable sorting
                enableSorting: true,
                size:120,
                cell: (props) => {
                    const { status } = props.row.original
                    return (
                        <div className="flex items-center">
                            <Tag className={statusColor[status]}>
                                <span className="capitalize">{status}</span>
                            </Tag>
                        </div>
                    )
                },
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
