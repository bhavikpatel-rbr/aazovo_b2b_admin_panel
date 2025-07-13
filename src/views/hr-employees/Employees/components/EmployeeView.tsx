import React, { useState, useMemo, useEffect } from 'react'
import { NavLink, useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import classNames from 'classnames'

// --- UI Components ---
import Container from '@/components/shared/Container'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Skeleton from '@/components/ui/Skeleton'
import Dialog from '@/components/ui/Dialog' // For the document viewer

// --- Icons ---
import {
    TbUserCircle,
    TbMail,
    TbPhone,
    TbDownload,
    TbAlertCircle,
    TbArrowLeft,
    TbUsers,
    TbFileText,
    TbBriefcase,
    TbDeviceLaptop,
    TbPencil,
    TbCalendar,
    TbCertificate,
    TbMapPin,
    TbUserCheck,
    TbSearch,
    TbLayoutList,
    TbBuildingStore,
    TbCategory,
    TbPaperclip,
    TbEye,
    TbFile,
    TbPhoto,
    TbX,
    TbChevronLeft,
    TbChevronRight,
    TbFileTypePdf,
} from 'react-icons/tb'
import { BiChevronRight } from 'react-icons/bi'

// --- Redux & API Services ---
import { apiGetEmployeeById } from '@/reduxtool/master/middleware' // Assuming this path is correct
import { useAppDispatch } from '@/reduxtool/store' // Assuming this path is correct

// --- UPDATED TYPE DEFINITIONS (to match new JSON) ---
type Role = {
    id: number
    display_name: string
}

// A generic object with a 'name' property, used for nested data
type SimpleObject = {
    id: number
    name: string
} | null

type Asset = {
    id: number
    name: string
    serial_no: string
    created_at: string
}

// This now reflects the new, more detailed JSON structure
export type Employee = {
    id: number
    name: string
    email: string
    employee_id: string
    status: 'Active' | 'Inactive' | string
    profile_pic_path: string | null
    mobile_number: string
    mobile_number_code: string
    date_of_joining: string
    date_of_birth: string | null
    gender: string | null
    maritual_status: string | null
    blood_group: string | null
    permanent_address: string | null
    local_address: string | null

    // Nested Objects with just a name
    department: SimpleObject
    designation: SimpleObject
    nationality: SimpleObject
    country: SimpleObject
    category: SimpleObject
    sub_category: SimpleObject
    brand: SimpleObject
    product: SimpleObject & { name: string }

    // Nested User/Member objects
    reporting_hr: SimpleObject // Keeps it simple if only name is needed
    reporting_head: SimpleObject // Keeps it simple if only name is needed

    roles: Role[]
    assets: Asset[]

    // Training
    training_date_of_completion: string | null
    training_remark: string | null
    specific_training_date_of_completion: string | null
    specific_training_remark: string | null

    // Document Paths (some are strings, some are stringified JSON arrays)
    identity_proof_path: string | null
    address_proof_path: string | null
    offer_letter_path: string | null
    past_offer_letter_path: string | null
    relieving_letter_path: string | null
    designation_letter_path: string | null
    bank_account_proof_path: string | null
    pan_card_path: string | null
    passport_size_photograph_path: string | null

    // These are strings containing JSON arrays in the new payload
    educational_certificates: string | string[]
    experience_certificates: string | string[]
    salary_slips: string | string[]

    // Timestamps
    created_at: string
    updated_at: string
}

export const employeeStatusColor: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
    Inactive: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
    default: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100',
}

// --- HELPER & REUSABLE COMPONENTS ---

const EmployeeProfileHeader: React.FC<{ employee: Employee }> = ({
    employee,
}) => {
    const status = employee.status || 'default'
    const statusClass = employeeStatusColor[status] || employeeStatusColor.default
    const roleName = employee.roles?.[0]?.display_name ?? 'N/A'
    const navigate = useNavigate()
    return (
        <div className="flex flex-col xl:flex-row xl:items-center gap-4">
            <div className="flex items-center gap-4">
                <Avatar
                    size={80}
                    shape="circle"
                    src={employee.profile_pic_path || ''}
                    icon={<TbUserCircle />}
                />
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold mb-0">{employee.name}</h4>
                        <Tag className={`${statusClass} capitalize`}>
                            {employee.status}
                        </Tag>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <TbPhone size={16} />
                        <span>
                            Mobile: {employee.mobile_number_code}{' '}
                            {employee.mobile_number}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <TbMail size={16} />
                        <span>Email: {employee.email}</span>
                    </div>
                </div>
            </div>

            <div className="p-3 border rounded-md inline-block text-center">
                <p className="text-gray-500 text-xs mb-1 uppercase">Role</p>
                <h6 className="font-bold mb-0">{roleName}</h6>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2"><Button variant="solid" icon={<TbPencil />} onClick={() => navigate(`/hr-employees/employees/edit/${employee.id}`)}>Edit Employee</Button><Button icon={<TbArrowLeft />} onClick={() => navigate('/hr/employees')}>Back to List</Button></div>
        </div>
    )
}

const DetailSection: React.FC<{
    title: string
    icon: React.ReactNode
    children: React.ReactNode
}> = ({ title, icon, children }) => (
    <Card className="mb-6">
        <h5 className="flex items-center gap-2 mb-4 font-semibold text-gray-700 dark:text-gray-200">
            {icon}
            <span>{title}</span>
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            {children}
        </div>
    </Card>
)

const InfoPair: React.FC<{ label: string; value?: string | number | null }> = ({
    label,
    value,
}) => (
    <div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
            {label}
        </span>
        <p className="font-medium">{value ?? '—'}</p>
    </div>
)

const EmptyState: React.FC<{
    icon: React.ReactNode
    title: string
    message: string
}> = ({ icon, title, message }) => (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-4 text-gray-500 dark:text-gray-300">
            {icon}
        </div>
        <h6 className="font-semibold">{title}</h6>
        <p className="text-gray-500">{message}</p>
    </div>
)

// --- NEW DOCUMENT COMPONENTS ---

interface DocumentRecord {
    name: string
    type: 'image' | 'pdf' | 'other'
    url: string
}

const DocumentViewer: React.FC<{
    isOpen: boolean
    onClose: () => void
    documents: DocumentRecord[]
    currentIndex: number
    onNext: () => void
    onPrev: () => void
}> = ({ isOpen, onClose, documents, currentIndex, onNext, onPrev }) => {
    const document = documents[currentIndex]

    if (!document) {
        return null
    }

    const renderContent = () => {
        switch (document.type) {
            case 'image':
                return (
                    <img
                        src={document.url}
                        alt={document.name}
                        className="max-h-full max-w-full object-contain"
                    />
                )
            case 'pdf':
                return (
                    <iframe
                        src={document.url}
                        title={document.name}
                        className="w-full h-full"
                        frameBorder="0"
                    ></iframe>
                )
            default:
                return (
                    <div className="text-center p-10 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <TbFile size={60} className="mx-auto mb-4" />
                        <h5 className="mb-2">{document.name}</h5>
                        <p className="mb-4">
                            Preview is not available for this file type.
                        </p>
                        <a href={document.url} download target="_blank" rel="noopener noreferrer">
                            <Button variant="solid" icon={<TbDownload />}>
                                Download
                            </Button>
                        </a>
                    </div>
                )
        }
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            width="90vw"
            height="90vh"
            closable={false}
            bodyOpenClassName="overflow-hidden" // Prevents background scroll
            contentClassName="p-0"
        >
            <div className="relative w-full h-full bg-gray-200 dark:bg-gray-900 flex items-center justify-center">
                {/* Close Button */}
                <Button
                    shape="circle"
                    variant="plain"
                    size="sm"
                    icon={<TbX />}
                    className="absolute top-2 right-2 z-20 bg-white/70 dark:bg-black/70"
                    onClick={onClose}
                />

                {/* Content */}
                <div className="relative w-full h-full flex-grow p-4 md:p-8">
                    {renderContent()}
                </div>

                {/* Navigation */}
                {documents.length > 1 && (
                    <>
                        <Button
                            shape="circle"
                            size="lg"
                            icon={<TbChevronLeft />}
                            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20"
                            onClick={onPrev}
                            disabled={currentIndex === 0}
                        />
                        <Button
                            shape="circle"
                            size="lg"
                            icon={<TbChevronRight />}
                            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20"
                            onClick={onNext}
                            disabled={currentIndex === documents.length - 1}
                        />
                    </>
                )}
            </div>
        </Dialog>
    )
}

const DocumentCard: React.FC<{
    document: DocumentRecord
    onPreview: () => void
}> = ({ document, onPreview }) => {
    const renderPreviewIcon = () => {
        switch (document.type) {
            case 'image':
                return (
                    <img
                        src={document.url}
                        alt={document.name}
                        className="w-full h-full object-cover"
                    />
                )
            case 'pdf':
                return <TbFileTypePdf className="w-12 h-12 text-red-500" />
            default:
                return <TbFile className="w-12 h-12 text-gray-500" />
        }
    }

    return (
        <Card bodyClass="p-0" className="hover:shadow-lg transition-shadow">
            <div
                className="w-full h-40 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={onPreview}
            >
                {renderPreviewIcon()}
            </div>
            <div className="p-4">
                <p className="font-semibold truncate" title={document.name}>
                    {document.name}
                </p>
                <div className="flex justify-end gap-2 mt-3">
                    <Tooltip title="Preview">
                        <Button
                            shape="circle"
                            size="sm"
                            icon={<TbEye />}
                            onClick={onPreview}
                        />
                    </Tooltip>
                    <Tooltip title="Download">
                        <a href={document.url} download target="_blank" rel="noopener noreferrer">
                            <Button shape="circle" size="sm" icon={<TbDownload />} />
                        </a>
                    </Tooltip>
                </div>
            </div>
        </Card>
    )
}

// --- TAB COMPONENTS ---

const EmployeeDetailsTab: React.FC<{ employee: Employee }> = ({ employee }) => {
    return (
        <>
            <DetailSection title="Registration Information" icon={<TbUserCircle size={20} />}>
                <InfoPair label="Full Name" value={employee.name} />
                <InfoPair label="Employee ID" value={employee.employee_id} />
                <InfoPair label="Date of Joining" value={dayjs(employee.date_of_joining).format('D MMM YYYY')} />
                <InfoPair label="Department" value={employee.department?.name} />
                <InfoPair label="Designation" value={employee.designation?.name} />
                <InfoPair label="Role" value={employee.roles?.[0]?.display_name} />
            </DetailSection>

            <DetailSection title="Work & Product Assignment" icon={<TbBuildingStore size={20} />}>
                <InfoPair label="Category" value={employee.category?.name} />
                <InfoPair label="Sub Category" value={employee.sub_category?.name} />
                <InfoPair label="Brand" value={employee.brand?.name} />
                <div className="lg:col-span-3">
                    <InfoPair label="Product / Service" value={employee.product?.name} />
                </div>
            </DetailSection>

            <DetailSection title="Personal Information" icon={<TbUserCircle size={20} />}>
                <InfoPair label="Date of Birth" value={employee.date_of_birth ? dayjs(employee.date_of_birth).format('D MMM YYYY') : null} />
                <InfoPair label="Gender" value={employee.gender} />
                <InfoPair label="Marital Status" value={employee.maritual_status} />
                <InfoPair label="Nationality" value={employee.nationality?.name} />
                <InfoPair label="Blood Group" value={employee.blood_group} />
            </DetailSection>

            <DetailSection title="Reporting Structure" icon={<TbUserCheck size={20} />}>
                <InfoPair label="Reporting HR" value={employee.reporting_hr?.name} />
                <InfoPair label="Reporting Head" value={employee.reporting_head?.name} />
            </DetailSection>

            <DetailSection title="Contact & Address" icon={<TbMapPin size={20} />}>
                <div className="lg:col-span-3">
                    <InfoPair label="Permanent Address" value={employee.permanent_address} />
                </div>
                <div className="lg:col-span-3">
                    <InfoPair label="Local Address" value={employee.local_address} />
                </div>
            </DetailSection>

            <DetailSection title="Training Details" icon={<TbCertificate size={20} />}>
                <InfoPair label="General Training Completion" value={employee.training_date_of_completion ? dayjs(employee.training_date_of_completion).format('D MMM YYYY') : null} />
                <InfoPair label="General Training Remark" value={employee.training_remark} />
                <InfoPair label="Specific Training Completion" value={employee.specific_training_date_of_completion ? dayjs(employee.specific_training_date_of_completion).format('D MMM YYYY') : null} />
                <InfoPair label="Specific Training Remark" value={employee.specific_training_remark} />
            </DetailSection>
        </>
    );
};

const DocumentsTab: React.FC<{ employee: Employee }> = ({ employee }) => {
    const [viewerState, setViewerState] = useState({ isOpen: false, index: 0 })

    const documentList = useMemo((): DocumentRecord[] => {
        const docs: DocumentRecord[] = []
        const baseUrl = 'https://aazovo.omcommunication.co'

        const getFileType = (url: string): 'image' | 'pdf' | 'other' => {
            if (!url) return 'other';
            const extension = url.split('.').pop()?.toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
                return 'image';
            }
            if (extension === 'pdf') {
                return 'pdf';
            }
            return 'other';
        }

        const addDoc = (name: string, url: string | null) => {
            if (url) docs.push({ name, url, type: getFileType(url) })
        }

        const parseAndAddDocs = (namePrefix: string, data: string | string[] | null) => {
            if (!data) return
            let relativeUrls: string[] = []
            if (typeof data === 'string') {
                try {
                    // This handles cases like "[\"\\/path\\/to\\/doc.pdf\"]"
                    relativeUrls = JSON.parse(data)
                } catch (e) {
                    console.error(`Failed to parse document JSON for ${namePrefix}:`, data)
                    return;
                }
            } else {
                relativeUrls = data
            }

            if (Array.isArray(relativeUrls)) {
                relativeUrls.forEach((relUrl, i) => {
                    if (relUrl && typeof relUrl === 'string') {
                        const fullUrl = relUrl.startsWith('http') ? relUrl : `${baseUrl}${relUrl}`;
                        const docName = `${namePrefix} ${relativeUrls.length > 1 ? i + 1 : ''}`.trim()
                        docs.push({ name: docName, url: fullUrl, type: getFileType(fullUrl) })
                    }
                })
            }
        }

        // KYC & Onboarding Docs
        addDoc('Identity Proof', employee.identity_proof_path)
        addDoc('Address Proof', employee.address_proof_path)
        addDoc('PAN Card', employee.pan_card_path)
        addDoc('Passport Size Photo', employee.passport_size_photograph_path)
        addDoc('Bank Account Proof', employee.bank_account_proof_path)
        addDoc('Offer Letter', employee.offer_letter_path)
        addDoc('Past Offer Letter', employee.past_offer_letter_path)
        addDoc('Designation Letter', employee.designation_letter_path)
        addDoc('Relieving Letter', employee.relieving_letter_path)

        // Docs from stringified JSON
        parseAndAddDocs('Salary Slip', employee.salary_slips)
        parseAndAddDocs('Educational Certificate', employee.educational_certificates)
        parseAndAddDocs('Experience Certificate', employee.experience_certificates)

        return docs
    }, [employee])

    if (!documentList.length) {
        return (
            <EmptyState
                icon={<TbPaperclip size={28} />}
                title="No Documents Found"
                message="Official documents for this employee will be listed here."
            />
        )
    }

    const handlePreview = (index: number) => {
        setViewerState({ isOpen: true, index: index })
    }

    const handleCloseViewer = () => {
        setViewerState({ isOpen: false, index: 0 })
    }

    const handleNext = () => {
        setViewerState((prev) => ({
            ...prev,
            index: Math.min(prev.index + 1, documentList.length - 1)
        }))
    }

    const handlePrev = () => {
        setViewerState((prev) => ({
            ...prev,
            index: Math.max(prev.index - 1, 0)
        }))
    }

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {documentList.map((doc, index) => (
                    <DocumentCard
                        key={index}
                        document={doc}
                        onPreview={() => handlePreview(index)}
                    />
                ))}
            </div>
            <DocumentViewer
                isOpen={viewerState.isOpen}
                onClose={handleCloseViewer}
                documents={documentList}
                currentIndex={viewerState.index}
                onNext={handleNext}
                onPrev={handlePrev}
            />
        </div>
    )
}

const AssetsTab: React.FC<{ assets: Asset[] }> = ({ assets }) => {
    if (!assets || assets.length === 0) {
        return <EmptyState icon={<TbDeviceLaptop size={28} />} title="No Assets Assigned" message="Company assets provided to this employee will appear here." />;
    }

    const columns = useMemo<ColumnDef<Asset>[]>(() => [
        { header: 'Asset Name', accessorKey: 'name' },
        { header: 'Serial Number', accessorKey: 'serial_no' },
        { header: 'Issued On', cell: (props) => dayjs(props.row.original.created_at).format("D MMM YYYY") }
    ], []);

    return <DataTable columns={columns} data={assets} />;
}


// --- MAIN PAGE COMPONENT ---

const EmployeeView: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const dispatch = useAppDispatch()

    const [employee, setEmployee] = useState<Employee | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeSection, setActiveSection] = useState<string>('details')

    // Updated Navigation List
    const navigationList = [
        { label: 'Employee details', link: 'details' },
        { label: 'Documents', link: 'documents' },
        { label: 'Wall inquiry', link: 'inquiry' },
        { label: 'Offer & Demand', link: 'offers' },
        { label: 'Assets', link: 'assets' }, // Changed to 'Assets' to match data
        { label: 'Member', link: 'members' },
    ]

    useEffect(() => {
        const fetchEmployeeData = async () => {
            if (!id) {
                setError('No employee ID found.')
                setLoading(false)
                return
            }
            setLoading(true)
            try {
                // This dispatches the Redux Thunk action to fetch data
                const response = await dispatch(apiGetEmployeeById(id)).unwrap()

                if (response && response.data) {
                    setEmployee(response.data.data)
                } else {
                    setError('Employee data could not be loaded or is empty.')
                    setEmployee(null)
                }
            } catch (err: any) {
                console.error('API Error:', err)
                setError(
                    err.message ||
                    'An unexpected error occurred while fetching data.'
                )
                setEmployee(null)
            } finally {
                setLoading(false)
            }
        }

        fetchEmployeeData()
    }, [id, dispatch])

    const renderActiveSection = () => {
        if (!employee) return null
        switch (activeSection) {
            case 'details':
                return <EmployeeDetailsTab employee={employee} />
            case 'documents':
                return <DocumentsTab employee={employee} />
            case 'assets':
                return <AssetsTab assets={employee.assets || []} /> // Render AssetsTab for 'assets'
            case 'inquiry':
                return (
                    <EmptyState
                        icon={<TbSearch size={28} />}
                        title="No Wall Inquiries"
                        message="Inquiries related to this employee will be listed here."
                    />
                )
            case 'offers':
                return (
                    <EmptyState
                        icon={<TbLayoutList size={28} />}
                        title="No Offers or Demands"
                        message="All offers and demands will be displayed on this page."
                    />
                )
            case 'members':
                return (
                    <EmptyState
                        icon={<TbUsers size={28} />}
                        title="No Associated Members"
                        message="Associated members will be shown here."
                    />
                )
            default:
                return <EmployeeDetailsTab employee={employee} />
        }
    }

    const PageTitle = (
        <div className="flex gap-2 items-center mb-4">
            <TbUsers />
            <NavLink to="/hr/employees">
                <span className="font-semibold hover:text-indigo-600">
                    Employees
                </span>
            </NavLink>
            <BiChevronRight size={18} />
            <span className="font-semibold text-indigo-600">
                {loading ? 'Loading...' : employee?.name || 'View Employee'}
            </span>
        </div>
    )

    if (loading) {
        return (
            <Container>
                {PageTitle}
                <Card>
                    <Skeleton paragraph={{ rows: 10 }} />
                </Card>
            </Container>
        )
    }

    if (error) {
        return (
            <Container>
                {PageTitle}
                <Card className="p-8">
                    <EmptyState
                        icon={
                            <TbAlertCircle className="text-red-500" size={40} />
                        }
                        title="An Error Occurred"
                        message={error}
                    />
                    <div className="text-center mt-4">
                        <Button
                            icon={<TbArrowLeft />}
                            onClick={() => navigate(-1)}
                        >
                            Go Back
                        </Button>
                    </div>
                </Card>
            </Container>
        )
    }

    if (!employee) {
        return (
            <Container>
                {PageTitle}
                <Card className="p-8">
                    <EmptyState
                        icon={<TbUserCircle size={40} />}
                        title="Employee Not Found"
                        message="We couldn't find any data for this employee ID."
                    />
                    <div className="text-center mt-4">
                        <Button
                            icon={<TbArrowLeft />}
                            onClick={() => navigate('/hr/employees')}
                        >
                            Back to List
                        </Button>
                    </div>
                </Card>
            </Container>
        )
    }

    return (
        <Container className="h-full">
            <div className="flex items-center justify-between mb-4">
                {PageTitle}
            </div>

            <Card className="mb-6" bodyClass="p-4 sm:p-6">
                <EmployeeProfileHeader employee={employee} />
            </Card>

            <div className="flex flex-row items-center border-b border-gray-200 dark:border-gray-600 mb-6 flex-wrap">
                {navigationList.map((nav) => (
                    <button
                        type="button"
                        key={nav.link}
                        className={classNames(
                            'px-4 py-2 -mb-px font-semibold focus:outline-none whitespace-nowrap',
                            {
                                'text-indigo-600 border-b-2 border-indigo-600':
                                    activeSection === nav.link,
                                'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200':
                                    activeSection !== nav.link,
                            }
                        )}
                        onClick={() => setActiveSection(nav.link)}
                    >
                        {nav.label}
                    </button>
                ))}
            </div>

            <div>{renderActiveSection()}</div>
        </Container>
    )
}

export default EmployeeView