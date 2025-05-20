// src/views/your-path/EmailCampaignListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom'; // useNavigate can be used if needed
import cloneDeep from 'lodash/cloneDeep';
import classNames from 'classnames';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard';
import Container from '@/components/shared/Container';
import DataTable from '@/components/shared/DataTable';
import Tooltip from '@/components/ui/Tooltip';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';
import DebouceInput from '@/components/shared/DebouceInput';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import Radio from '@/components/ui/Radio';
import { Drawer, Form, FormItem, Input, Card,  Tag } from '@/components/ui';

// Icons
import {
    TbEye, TbSearch, TbFilter, TbPlus, TbCloudUpload, TbMail, TbTemplate, TbUsersGroup, TbFileUpload,
    TbFileSpreadsheet, TbPlayerTrackPrev, TbPlayerTrackNext, TbSend, TbCalendarStats, TbCircleCheck,
    TbClipboardText, TbTrash, TbPhoto, TbPhone,  TbFileDescription, // Added TbFileDescription for consistency
    TbForms
} from 'react-icons/tb';

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';
import { HiOutlineCalendar } from 'react-icons/hi';
import Textarea from '@/views/ui-components/forms/Input/Textarea';

// --- Define Item Types & Constants ---
export type CampaignStatus = 'sent' | 'scheduled' | 'draft' | 'failed' | 'sending';
export type EmailCampaignItem = {
    id: string;
    campaignName?: string;
    dateTime: Date;
    templateId: string;
    templateName: string;
    details: string;
    status?: CampaignStatus;
};

export type CampaignCreationData = {
    templateId?: string;
    templateName?: string;
    text1?: string; image1Url?: string; text2?: string;
    textWithWhatsappNo?: string; whatsappNo?: string;
    recipientSelectionMode?: 'database' | 'import';
    recipientUserIds?: string[];
    importedFile?: File | null;
    campaignNameInternal?: string;
    sendOption?: 'now' | 'schedule';
    scheduledAt?: Date | null;
};

const CAMPAIGN_STATUS_OPTIONS: {value: CampaignStatus, label: string}[] = [
    {value: 'sent', label: 'Sent'}, {value: 'scheduled', label: 'Scheduled'},
    {value: 'draft', label: 'Draft'}, {value: 'failed', label: 'Failed'},
    {value: 'sending', label: 'Sending'}
];
const campaignStatusColor: Record<CampaignStatus, string> = {
    sent: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
    scheduled: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100',
    draft: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100',
    failed: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
    sending: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-100',
};

const AVAILABLE_TEMPLATES = [
    { value: 'T001', label: 'Welcome New User V1 (Generic)' },
    { value: 'T002', label: 'Weekly Product Digest (All Subscribers)' },
    { value: 'T003', label: 'Q4 Holiday Sale Promo (Segment: VIP)' },
    { value: 'T004', label: 'Abandoned Cart Reminder (Dynamic)' }
];
const templateValues = AVAILABLE_TEMPLATES.map(t=>t.value) as [string, ...string[]];

const AVAILABLE_USERS_FOR_SELECTION = [
    { value: 'user1', label: 'Alice Wonderland (alice@example.com)'},
    { value: 'user2', label: 'Bob The Builder (bob@example.com)'},
    { value: 'segment_newsletter', label: 'Newsletter Subscribers (All)'},
    { value: 'segment_vip', label: 'VIP Customers (High Value)'},
];

// --- Zod Schema for Campaign Creation ---
const campaignCreationFormSchema = z.object({
    templateId: z.string({required_error: "Please select a template."}).min(1, "Template is required."),
    templateName: z.string().optional(),
    text1: z.string().max(1000, "Text 1 is too long.").optional().or(z.literal('')),
    image1Url: z.string().url("Image 1 must be a valid URL.").optional().or(z.literal('')),
    text2: z.string().max(1000, "Text 2 is too long.").optional().or(z.literal('')),
    textWithWhatsappNo: z.string().max(500, "WhatsApp text too long.").optional().or(z.literal('')),
    whatsappNo: z.string().regex(/^\+?[0-9\s-()]{7,15}$/, "Invalid WhatsApp number format.").optional().or(z.literal('')),
    recipientSelectionMode: z.enum(['database', 'import'], {required_error: "Please choose a recipient selection mode."}),
    recipientUserIds: z.array(z.string()).optional(),
    importedFile: z.instanceof(File).optional().nullable(),
    campaignNameInternal: z.string().min(1, "Campaign Name is required for tracking.").max(150),
    sendOption: z.enum(['now', 'schedule'], {required_error: "Please choose a send option."}),
    scheduledAt: z.date({coerce: true}).nullable().optional(), // Coerce string from DatePicker to Date
}).superRefine((data, ctx) => {
    if (data.recipientSelectionMode === 'database' && (!data.recipientUserIds || data.recipientUserIds.length === 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select recipients or a segment.", path: ["recipientUserIds"] });
    }
    if (data.recipientSelectionMode === 'import' && !data.importedFile) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please upload a file for import.", path: ["importedFile"] });
    }
    if (data.sendOption === 'schedule' && !data.scheduledAt) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select a schedule date and time.", path: ["scheduledAt"] });
    }
    if (data.sendOption === 'schedule' && data.scheduledAt && data.scheduledAt < new Date(new Date().setHours(0,0,0,0))) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Scheduled date cannot be in the past.", path: ["scheduledAt"] });
    }
});
type CampaignCreationFormData = z.infer<typeof campaignCreationFormSchema>;

const initialDummyCampaigns: EmailCampaignItem[] = [
    { id: 'CAMP001', campaignName: 'Q4 Holiday Blast', dateTime: new Date(2023, 10, 5, 10, 0), templateId: 'T003', templateName: 'Q4 Holiday Promotion', details: 'Sent to US/CA subscribers.', status: 'sent' },
    { id: 'CAMP002', campaignName: 'Welcome Series - New Users', dateTime: new Date(2023, 10, 1, 9, 0), templateId: 'T001', templateName: 'Welcome - New User Signup', details: 'Triggered on registration.', status: 'sent' },
    { id: 'CAMP003', campaignName: 'October Newsletter W4', dateTime: new Date(2023, 9, 28, 14, 30), templateId: 'T002', templateName: 'Weekly Newsletter - Oct Week 4', details: 'To Newsletter segment.', status: 'scheduled' },
];

// --- CSV Exporter ---
const CSV_HEADERS_CAMPAIGN = ['ID', 'Campaign Name', 'Sent/Scheduled DateTime', 'Template ID', 'Template Name', 'Details', 'Status'];
const CSV_KEYS_CAMPAIGN: (keyof EmailCampaignItem)[] = ['id', 'campaignName', 'dateTime', 'templateId', 'templateName', 'details', 'status'];
function exportCampaignsToCsv(filename: string, rows: EmailCampaignItem[]) {
    if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info" duration={2000}>Nothing to export.</Notification>); return false;}
    const preparedRows = rows.map(row => ({
        ...row,
        dateTime: row.dateTime.toISOString(),
        status: CAMPAIGN_STATUS_OPTIONS.find(s=>s.value === row.status)?.label || row.status,
    }));
    const separator = ',';
    const csvContent = CSV_HEADERS_CAMPAIGN.join(separator) + '\n' + preparedRows.map((row: any) => CSV_KEYS_CAMPAIGN.map(k => { let cell: any = row[k]; if (cell === null || cell === undefined) cell = ''; else cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(separator)).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute('href', url); link.setAttribute('download', filename); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; }
    toast.push(<Notification title="Export Failed" type="danger" duration={3000}>Browser does not support this feature.</Notification>); return false;
}

// --- ActionColumn for Listing ---
const ActionColumn = ({ onViewDetails }: { onViewDetails: () => void }) => {
    const iconButtonClass = 'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';
    return ( <div className="flex items-center justify-center"><Tooltip title="View Details"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-300')} role="button" onClick={onViewDetails}><TbEye /></div></Tooltip></div> );
};

// --- CampaignSearch & CampaignTableTools ---
type CampaignSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; }
const CampaignSearch = React.forwardRef<HTMLInputElement, CampaignSearchProps>(({ onInputChange }, ref) => (<DebouceInput ref={ref} className="w-full" placeholder="Search campaigns..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />));
CampaignSearch.displayName = 'CampaignSearch';

type CampaignTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; }
const CampaignTableTools = ({ onSearchChange, onFilter, onExport }: CampaignTableToolsProps) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div className="flex-grow"><CampaignSearch onInputChange={onSearchChange} /></div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto" disabled>Filter</Button> {/* Filter for listing not fully implemented */}
            <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
        </div>
    </div>
);

// --- CampaignTable for Listing ---
type CampaignTableProps = { columns: ColumnDef<EmailCampaignItem>[]; data: EmailCampaignItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void; };
const CampaignTable = ({ columns, data, loading, pagingData, onPaginationChange, onSelectChange, onSort }: CampaignTableProps) => (
    <DataTable columns={columns} data={data} loading={loading} pagingData={pagingData} onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort} noData={!loading && data.length === 0} />
);


// --- Main EmailCampaignListing Component ---
const EmailCampaignListing = () => {
    const [campaignsData, setCampaignsData] = useState<EmailCampaignItem[]>(initialDummyCampaigns);
    const [masterLoadingStatus, setMasterLoadingStatus] = useState<'idle' | 'loading'>('idle');
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
    const [currentWizardStep, setCurrentWizardStep] = useState(1);
    const [viewingItem, setViewingItem] = useState<EmailCampaignItem | null>(null);
    const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1, pageSize: 10, sort: { order: 'desc', key: 'dateTime' }, query: '',
    });

    const campaignFormMethods = useForm<CampaignCreationFormData>({
        resolver: zodResolver(campaignCreationFormSchema),
        defaultValues: {
            templateId: undefined, templateName: '', text1: '', image1Url: '', text2: '',
            textWithWhatsappNo: '', whatsappNo: '', recipientSelectionMode: 'database',
            recipientUserIds: [], importedFile: null, campaignNameInternal: '',
            sendOption: 'now', scheduledAt: null,
        },
        mode: 'onChange',
    });

    const nextStep = useCallback(async () => {
        let fieldsToValidate: (keyof CampaignCreationFormData)[] = [];
        if (currentWizardStep === 1) fieldsToValidate = ['templateId'];
        else if (currentWizardStep === 2) fieldsToValidate = []; // Optional fields, or validate if filled
        else if (currentWizardStep === 3) fieldsToValidate = ['recipientSelectionMode', 'recipientUserIds', 'importedFile'];
        // No specific fields for step 4 to validate before showing, validation happens on submit

        if (fieldsToValidate.length > 0) {
            const isValid = await campaignFormMethods.trigger(fieldsToValidate);
            if (!isValid) {
                toast.push(<Notification title="Validation Error" type="danger" duration={3000}>Please correct the errors on this step.</Notification>);
                return;
            }
        }
        setCurrentWizardStep(prev => Math.min(prev + 1, 4));
    }, [currentWizardStep, campaignFormMethods]);

    const prevStep = useCallback(() => setCurrentWizardStep(prev => Math.max(prev - 1, 1)), []);

    const openCreateDrawer = useCallback(() => {
        campaignFormMethods.reset({ // Reset to initial defaults for a new campaign
            templateId: undefined, templateName: '', text1: '', image1Url: '', text2: '',
            textWithWhatsappNo: '', whatsappNo: '', recipientSelectionMode: 'database',
            recipientUserIds: [], importedFile: null, campaignNameInternal: '',
            sendOption: 'now', scheduledAt: null,
        });
        setCurrentWizardStep(1);
        setIsCreateDrawerOpen(true);
    }, [campaignFormMethods]);
    const closeCreateDrawer = useCallback(() => setIsCreateDrawerOpen(false), []);

    const onCampaignFormSubmit = useCallback(async (data: CampaignCreationFormData) => {
        setIsSubmittingCampaign(true); setMasterLoadingStatus('loading');
        console.log("Submitting Campaign Data:", data);
        // Simulate API call to backend
        await new Promise(resolve => setTimeout(resolve, 1500));
        try {
            // This is where you'd send 'data' to your backend API
            // The backend would handle template merging, recipient processing, and actual sending/scheduling.
            // For demo, we add an entry to our local listing data.
            const newCampaignEntry: EmailCampaignItem = {
                id: `CAMP${Date.now()}`,
                campaignName: data.campaignNameInternal,
                dateTime: data.sendOption === 'schedule' && data.scheduledAt ? data.scheduledAt : new Date(),
                templateId: data.templateId || 'N/A',
                templateName: AVAILABLE_TEMPLATES.find(t=>t.value === data.templateId)?.label || data.templateName || 'Custom/Unknown',
                details: `Recipients: ${data.recipientSelectionMode === 'database' ? `${data.recipientUserIds?.length || 0} selected` : (data.importedFile ? `File: ${data.importedFile.name}` : 'None')}. Values: Text1 - ${data.text1 ? 'Set' : 'N/A'} etc.`,
                status: data.sendOption === 'schedule' ? 'scheduled' : 'sending', // Initial status
            };
            setCampaignsData(prev => [newCampaignEntry, ...prev]);
            toast.push(<Notification title="Campaign Processed" type="success" duration={3000}>{data.sendOption === 'schedule' ? 'Campaign scheduled successfully!' : 'Campaign queued for sending!'}</Notification>);
            closeCreateDrawer();
        } catch (e: any) { toast.push(<Notification title="Campaign Failed" type="danger" duration={4000}>{(e as Error).message || 'Could not process campaign.'}</Notification>); }
        finally { setIsSubmittingCampaign(false); setMasterLoadingStatus('idle'); }
    }, [closeCreateDrawer]);

    const openViewDialog = useCallback((item: EmailCampaignItem) => setViewingItem(item), []);
    const closeViewDialog = useCallback(() => setViewingItem(null), []);

    const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })); }, []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => { handleSetTableData({ sort: sort, pageIndex: 1 }); }, [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData: EmailCampaignItem[] = cloneDeep(campaignsData);
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter(c =>
                c.id.toLowerCase().includes(query) || (c.campaignName && c.campaignName.toLowerCase().includes(query)) ||
                c.templateId.toLowerCase().includes(query) || c.templateName.toLowerCase().includes(query) ||
                c.details.toLowerCase().includes(query) || (c.status && c.status.toLowerCase().includes(query))
            );
        }
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key) {
            processedData.sort((a, b) => {
                if (key === 'dateTime') return order === 'asc' ? a.dateTime.getTime() - b.dateTime.getTime() : b.dateTime.getTime() - a.dateTime.getTime();
                const aVal = a[key as keyof EmailCampaignItem]; const bVal = b[key as keyof EmailCampaignItem];
                const aStr = String(aVal ?? '').toLowerCase(); const bStr = String(bVal ?? '').toLowerCase();
                return order === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
            });
        }
        const dataToExport = [...processedData];
        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
        return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
    }, [campaignsData, tableData]);

    const handleExportData = useCallback(() => { exportCampaignsToCsv('email_campaigns_log.csv', allFilteredAndSortedData); }, [allFilteredAndSortedData]);

    const columns: ColumnDef<EmailCampaignItem>[] = useMemo(() => [
        { header: 'ID', accessorKey: 'id', size: 100, enableSorting: true },
        { header: 'Campaign Name', accessorKey: 'campaignName', size: 200, enableSorting: true, cell: props => props.getValue() || <span className="text-gray-400 italic">Untitled</span> },
        { header: 'Date & Time', accessorKey: 'dateTime', size: 180, enableSorting: true, cell: props => { const d=props.getValue<Date>(); return <span>{d.toLocaleDateString()} <span className="text-xs text-gray-500">{d.toLocaleTimeString()}</span></span>}},
        { header: 'Template', id: 'template', size: 200, cell: props => <div><span className="font-semibold">{props.row.original.templateName}</span> <span className="text-xs text-gray-500">({props.row.original.templateId})</span></div>},
        { header: 'Details Summary', accessorKey: 'details', size: 300, cell: props => <Tooltip title={props.getValue<string>()}><span className="block whitespace-nowrap overflow-hidden text-ellipsis max-w-sm">{props.getValue<string>()}</span></Tooltip>},
        { header: 'Status', accessorKey: 'status', size: 120, cell: props => props.row.original.status ? <Tag className={classNames('capitalize whitespace-nowrap', campaignStatusColor[props.row.original.status])}>{CAMPAIGN_STATUS_OPTIONS.find(s=>s.value === props.row.original.status)?.label}</Tag> : '-' },
        { header: 'Actions', id: 'actions', meta:{headerClass: "text-center", cellClass: "text-center"}, size: 80, cell: props => <ActionColumn onViewDetails={() => openViewDialog(props.row.original)} />},
    ], [openViewDialog]);

    const renderWizardStep = () => {
        const { control, formState: { errors }, watch, getValues, setValue } = campaignFormMethods;

        switch (currentWizardStep) {
            case 1: // Step 1: Choose Template
                return (
                    <Card header={<div className="flex items-center gap-2 font-semibold"><TbTemplate /> Step 1: Choose Template</div>} bodyClass="p-4 md:p-6">
                        <FormItem label="Email Template" invalid={!!errors.templateId} errorMessage={errors.templateId?.message} >
                            <Controller name="templateId" control={control}
                                render={({ field }) => (
                                    <Select placeholder="Select a template..." options={AVAILABLE_TEMPLATES}
                                        value={AVAILABLE_TEMPLATES.find(o => o.value === field.value)}
                                        onChange={opt => { field.onChange(opt?.value); setValue('templateName', opt?.label || '', {shouldValidate: true}); }} />
                                )} />
                        </FormItem>
                        <FormItem label="Selected Template Name" className="mt-4" >
                            <Controller name="templateName" control={control} render={({ field }) => <Input {...field} placeholder="Template name (auto-filled or custom)" disabled />} />
                            <p className="text-xs text-gray-500 mt-1">This name is for reference, based on the selected template ID.</p>
                        </FormItem>
                    </Card>
                );
            case 2: // Step 2: Add Dynamic Values
                return (
                    <Card header={<div className="flex items-center gap-2 font-semibold"><TbForms /> Step 2: Add Dynamic Values</div>} bodyClass="p-4 md:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <FormItem label="Text Block 1 (e.g., for {{text1}})" className="md:col-span-2" invalid={!!errors.text1} errorMessage={errors.text1?.message}>
                                <Controller name="text1" control={control} render={({ field }) => <Textarea {...field} rows={4} placeholder="Enter content for the first main text block..." />} />
                            </FormItem>
                            <FormItem label="Image 1 URL (e.g., for {{image1Url}})" invalid={!!errors.image1Url} errorMessage={errors.image1Url?.message}>
                                <Controller name="image1Url" control={control} render={({ field }) => <Input {...field} type="url" prefix={<TbPhoto />} placeholder="https://example.com/your-image.png" />} />
                            </FormItem>
                             <div/> {/* Spacer */}
                            <FormItem label="Text Block 2 (e.g., for {{text2}})" className="md:col-span-2" invalid={!!errors.text2} errorMessage={errors.text2?.message}>
                                <Controller name="text2" control={control} render={({ field }) => <Textarea {...field} rows={3} placeholder="Enter content for a secondary text block..." />} />
                            </FormItem>
                            <FormItem label="Text with WhatsApp Link (e.g., for {{textWithWhatsappNo}})" invalid={!!errors.textWithWhatsappNo} errorMessage={errors.textWithWhatsappNo?.message}>
                                <Controller name="textWithWhatsappNo" control={control} render={({ field }) => <Input {...field} placeholder="E.g., Chat with us on WhatsApp!" />} />
                            </FormItem>
                            <FormItem label="WhatsApp Number to Link" invalid={!!errors.whatsappNo} errorMessage={errors.whatsappNo?.message}>
                                <Controller name="whatsappNo" control={control} render={({ field }) => <Input {...field} type="tel" prefix={<TbPhone />} placeholder="+1234567890 (include country code)" />} />
                            </FormItem>
                        </div>
                    </Card>
                );
            case 3: // Step 3: Choose or Import User Email
                 return (
                    <Card header={<div className="flex items-center gap-2 font-semibold"><TbUsersGroup /> Step 3: Choose Recipients</div>} bodyClass="p-4 md:p-6">
                        <FormItem label="Recipient Source" className="mb-6" invalid={!!errors.recipientSelectionMode} errorMessage={errors.recipientSelectionMode?.message}>
                            <Controller name="recipientSelectionMode" control={control}
                                render={({ field }) => (
                                    <Radio.Group value={field.value} onChange={val => { field.onChange(val); if (val === 'database') setValue('importedFile', null); if (val === 'import') setValue('recipientUserIds', []); }}>
                                        <Radio value="database">Select from Database</Radio>
                                        <Radio value="import">Import from Excel/CSV</Radio>
                                    </Radio.Group>
                                )} />
                        </FormItem>
                        {watch('recipientSelectionMode') === 'database' && (
                            <FormItem label="Select Users or Segments" invalid={!!errors.recipientUserIds} errorMessage={errors.recipientUserIds?.message as string}>
                                <Controller name="recipientUserIds" control={control}
                                    render={({ field }) => ( <Select isMulti placeholder="Select users or predefined segments..." options={AVAILABLE_USERS_FOR_SELECTION} value={AVAILABLE_USERS_FOR_SELECTION.filter(o => field.value?.includes(o.value))} onChange={opts => field.onChange(opts ? opts.map((o: any) => o.value) : [])} /> )} />
                            </FormItem>
                        )}
                        {watch('recipientSelectionMode') === 'import' && (
                            <FormItem label="Upload Excel/CSV File (with 'email' column)" invalid={!!errors.importedFile} errorMessage={errors.importedFile?.message as string}>
                                <Controller name="importedFile" control={control}
                                    render={({ field: { onChange, onBlur, name }}) => ( <Input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)} onBlur={onBlur} name={name} /> )} />
                                <p className="text-xs text-gray-500 mt-1">Note: File will be processed on submission. Client-side parsing not implemented here.</p>
                            </FormItem>
                        )}
                    </Card>
                );
            case 4: // Step 4: Review & Send/Schedule
                const formData = getValues();
                return (
                    <Card header={<div className="flex items-center gap-2 font-semibold"><TbCircleCheck /> Step 4: Review & Send/Schedule</div>} bodyClass="p-4 md:p-6">
                        <FormItem label="Campaign Name (for internal tracking)" invalid={!!errors.campaignNameInternal} errorMessage={errors.campaignNameInternal?.message} className="mb-4">
                            <Controller name="campaignNameInternal" control={control} render={({ field }) => <Input {...field} prefix={<TbClipboardText />} placeholder="e.g., Q4 Holiday Promo - US/CA Users" />} />
                        </FormItem>
                        <div className="space-y-2 mb-6 text-sm border-t border-b py-4 dark:border-gray-600">
                            <h6 className="font-semibold text-base mb-2">Campaign Summary:</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                                <div><strong>Template:</strong> {AVAILABLE_TEMPLATES.find(t=>t.value === formData.templateId)?.label || formData.templateName || formData.templateId || <span className="italic text-gray-500">Not Set</span>}</div>
                                <div><strong>Recipients:</strong> {formData.recipientSelectionMode === 'database' ? `${formData.recipientUserIds?.length || 0} selected` : (formData.importedFile ? `File: ${formData.importedFile.name}` : <span className="italic text-gray-500">Not Set</span>)}</div>
                            </div>
                            <p className="mt-2"><strong>Text 1:</strong> {formData.text1 ? <span className="line-clamp-2" title={formData.text1}>{formData.text1}</span> : <span className="italic text-gray-500">Not Set</span>}</p>
                            {/* Add more review fields here... */}
                        </div>
                        <FormItem label="Send Options" className="mb-4" invalid={!!errors.sendOption} errorMessage={errors.sendOption?.message}>
                            <Controller name="sendOption" control={control}
                                render={({ field }) => (
                                    <Radio.Group value={field.value} onChange={(val) => { field.onChange(val); if (val === 'now') setValue('scheduledAt', null); }}>
                                        <Radio value="now">Send Now</Radio>
                                        <Radio value="schedule">Schedule for Later</Radio>
                                    </Radio.Group>
                                )} />
                        </FormItem>
                        {watch('sendOption') === 'schedule' && (
                            <FormItem label="Schedule Date & Time" invalid={!!errors.scheduledAt} errorMessage={errors.scheduledAt?.message as string}>
                                <Controller name="scheduledAt" control={control}
                                    render={({ field }) => (
                                        <DatePicker value={field.value} onChange={date => field.onChange(date)} placeholder="Select date and time"
                                                    showTimeSelect inputPrefix={<HiOutlineCalendar />} minDate={new Date()}/>
                                    )} />
                            </FormItem>
                        )}
                    </Card>
                );
            default: return <div>Unknown Step</div>;
        }
    };

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h3 className="mb-4 sm:mb-0 flex items-center gap-2"><TbMail /> Email Campaign Log</h3>
                        <Button variant="solid" icon={<TbPlus />} onClick={openCreateDrawer}>Create New Campaign</Button>
                    </div>
                    <CampaignTableTools
                        onSearchChange={handleSearchChange}
                        onFilter={() => toast.push(<Notification title="Info">Filter for listing page not fully implemented yet.</Notification>)}
                        onExport={handleExportData}
                    />
                    <div className="mt-4">
                        <CampaignTable
                            columns={columns} data={pageData}
                            loading={masterLoadingStatus === 'loading' || isSubmittingCampaign}
                            pagingData={{total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number}}
                            onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange}
                            onSort={handleSort}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            <Drawer
                title={`Create Email Campaign - Step ${currentWizardStep} of 4: ${
                    currentWizardStep === 1
                        ? 'Choose Template'
                        : currentWizardStep === 2
                        ? 'Add Values'
                        : currentWizardStep === 3
                        ? 'Choose Recipients'
                        : 'Review & Send'
                }`}
                isOpen={isCreateDrawerOpen}
                onClose={closeCreateDrawer}
                onRequestClose={closeCreateDrawer}
                width={700}
                footer={
                    <div className="flex justify-between w-full p-4 border-t dark:border-gray-700">
                        <div>
                            {currentWizardStep > 1 && (
                                <Button
                                    onClick={prevStep}
                                    disabled={isSubmittingCampaign}
                                    icon={<TbPlayerTrackPrev />}
                                >
                                    Back
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {currentWizardStep < 4 && (
                                <Button
                                    variant="solid"
                                    onClick={nextStep}
                                    disabled={isSubmittingCampaign}
                                    icon={<TbPlayerTrackNext />}
                                >
                                    Next
                                </Button>
                            )}
                            {currentWizardStep === 4 && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            // Save as Draft
                                            closeCreateDrawer();
                                            toast.push(
                                                <Notification title="Info">
                                                    Campaign Saved as Draft (simulated).
                                                </Notification>
                                            );
                                        }}
                                        disabled={isSubmittingCampaign}
                                    >
                                        Save as Draft
                                    </Button>
                                    <Button
                                        variant="solid"
                                        color={
                                            campaignFormMethods.watch('sendOption') === 'schedule'
                                                ? 'blue'
                                                : 'emerald'
                                        }
                                        form="campaignCreationForm"
                                        type="submit"
                                        loading={isSubmittingCampaign}
                                        disabled={
                                            !campaignFormMethods.formState.isValid ||
                                            isSubmittingCampaign
                                        }
                                        icon={<TbSend />}
                                    >
                                        {campaignFormMethods.watch('sendOption') === 'schedule'
                                            ? 'Schedule Campaign'
                                            : 'Send Campaign Now'}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                }
            >
                <Form
                    id="campaignCreationForm"
                    onSubmit={campaignFormMethods.handleSubmit(onCampaignFormSubmit)}
                    className="flex flex-col"
                >
                    {renderWizardStep()}
                </Form>
            </Drawer>

            <Dialog isOpen={!!viewingItem} onClose={closeViewDialog} onRequestClose={closeViewDialog} width={700}>
                 <h5 className="mb-4">Campaign Details: {viewingItem?.campaignName || viewingItem?.templateName}</h5>
                {viewingItem && (
                    <div className="space-y-3 text-sm max-h-[70vh] overflow-y-auto pr-2">
                        <p><strong>ID:</strong> {viewingItem.id}</p>
                        <p><strong>Campaign Name:</strong> {viewingItem.campaignName || <span className="italic text-gray-500">N/A</span>}</p>
                        <p><strong>Sent/Scheduled:</strong> {viewingItem.dateTime.toLocaleString()}</p>
                        <p><strong>Template:</strong> {viewingItem.templateName} ({viewingItem.templateId})</p>
                        <p><strong>Status:</strong> {viewingItem.status ? <Tag className={classNames('capitalize whitespace-nowrap', campaignStatusColor[viewingItem.status])}>{CAMPAIGN_STATUS_OPTIONS.find(s=>s.value === viewingItem.status)?.label}</Tag> : '-'}</p>
                        <div><strong>Details:</strong> <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 whitespace-pre-wrap">{viewingItem.details}</pre></div>
                    </div>
                )}
                <div className="text-right mt-6"><Button variant="solid" onClick={closeViewDialog}>Close</Button></div>
            </Dialog>
        </>
    );
};

export default EmailCampaignListing;