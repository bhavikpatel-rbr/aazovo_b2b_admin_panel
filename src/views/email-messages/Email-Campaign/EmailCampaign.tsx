// src/views/your-path/EmailCampaignListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import DebounceInput from "@/components/shared/DebouceInput"; // Corrected
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker"; // Keep for scheduling UI
import Radio from "@/components/ui/Radio";
import { Drawer, Form, FormItem, Input, Card, Tag } from "@/components/ui";

// Icons
import {
  TbPencil,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbTemplate,
  TbUsersGroup,
  TbPlayerTrackPrev,
  TbPlayerTrackNext,
  TbSend,
  TbCalendarStats,
  TbCircleCheck,
  TbClipboardText,
  TbEye,
  TbTrash,
  TbPhoto,
  TbPhone,
  TbToggleRight,
  TbForms,
  TbMail, // For email list
  TbFileImport,
  TbReload, // For file import
} from "react-icons/tb";

// Types
import type { OnSortParam, ColumnDef, Row } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  // !!! REPLACE WITH YOUR ACTUAL ACTIONS !!!
  getEmailCampaignsAction,
  addEmailCampaignAction,
  editEmailCampaignAction,
  deleteEmailCampaignAction,
  getMailTemplatesAction, // To fetch mail templates for dropdown
} from "@/reduxtool/master/middleware"; // Adjust path
import { masterSelector } from "@/reduxtool/master/masterSlice"; // Adjust path
import { ConfirmDialog } from "@/components/shared";

// --- Define Item Types & Constants ---
export type ApiMailTemplate = { id: string | number; name: string; template_id?: string /* Mailgun/Sendgrid ID if available */ };
export type SelectOption = { value: string; label: string };

export type CampaignApiStatus = "0" | "1" | null | string; // From your API (0 for inactive/draft, 1 for active)
export type CampaignFormStatus = "active" | "inactive";   // For form select

export type EmailCampaignItem = { // Matches your API listing data
  id: string | number;
  template_id: string; // ID of the mail_template
  value: string;       // JSON string of content blocks
  sender_address: string; // JSON string of sender objects
  status: CampaignApiStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  mail_template: { // Nested object from API
    id: number;
    name: string; // This is the template name we'll display
    template_id?: string; // Actual template service ID
    // ... other fields from mail_template
  };
  // For UI display convenience (derived)
  campaignNameDisplay?: string; // We'll try to extract from 'value' or use template name
  dateTimeDisplay?: Date;     // Usually from created_at or a schedule field if API supports it
};

// For the 'value' JSON string in API
type ContentBlock = 
  | { type: "text"; name: string; value: string }
  | { type: "image"; name: string; value: string }; // value is URL

// For the 'sender_address' JSON string in API
type SenderAddress = { email: string; name: string };


const CAMPAIGN_STATUS_OPTIONS_FORM: SelectOption[] = [
  { value: "active", label: "Active" },   // Will map to API "1"
  { value: "inactive", label: "Inactive" }, // Will map to API "0"
];
const campaignStatusFormValues = CAMPAIGN_STATUS_OPTIONS_FORM.map((s) => s.value) as [CampaignFormStatus, ...CampaignFormStatus[]];

const campaignDisplayStatusColor: Record<string, string> = { // Keyed by API status values
  "1": "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100", // Active
  "0": "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100",       // Inactive/Draft
  "null": "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100",      // Could be 'Draft' or 'Scheduled'
  "failed": "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",     // If API sends other statuses
  "sending": "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-100",
  "sent": "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-100",
};

// --- Zod Schema for Campaign Creation ---
// Matches your provided "add edit field" list
const campaignCreationFormSchema = z
  .object({
    template_id: z.string({ required_error: "Please select a template." }).min(1, "Template is required."),
    campaign_name: z.string().min(1, "Campaign Name is required.").max(150, "Campaign name too long."),
    // Dynamic content fields
    text_block_1: z.string().max(1000, "Text 1 is too long.").optional().or(z.literal("")),
    image_1: z.string().url("Image 1 must be a valid URL.").optional().or(z.literal("")),
    text_block_2: z.string().max(1000, "Text 2 is too long.").optional().or(z.literal("")),
    text_with_whatsapp_link: z.string().max(500, "WhatsApp text too long.").optional().or(z.literal("")),
    whatsapp_number_to_link: z.string().regex(/^\+?[0-9\s-()]{7,15}$/, "Invalid WhatsApp number format.").optional().or(z.literal("")),
    // For additional images based on your API's 'value' structure (image2 to image6)
    image_2: z.string().url().optional().or(z.literal("")),
    image_3: z.string().url().optional().or(z.literal("")),
    image_4: z.string().url().optional().or(z.literal("")),
    image_5: z.string().url().optional().or(z.literal("")),
    image_6: z.string().url().optional().or(z.literal("")),
    // For the last text block based on your API's 'value' structure
    text_final: z.string().max(1000, "Final text is too long").optional().or(z.literal("")),


    // Recipient handling
    recipient_source_mode: z.enum(["input_emails", "import_file"], { required_error: "Choose recipient mode."}),
    recipient_emails_input: z.string().optional(), // For comma-separated emails
    recipient_imported_file: z.instanceof(File).optional().nullable(), // For file upload

    status: z.enum(campaignStatusFormValues, { errorMap: () => ({ message: "Please select a status." })}),
    // Scheduling (UI kept from previous, map to backend if supported)
    sendOption: z.enum(["now", "schedule"], { required_error: "Please choose a send option."}),
    scheduledAt: z.date({ coerce: true }).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.recipient_source_mode === "input_emails" && (!data.recipient_emails_input || data.recipient_emails_input.trim() === "")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please enter at least one email address.", path: ["recipient_emails_input"]});
    }
    if (data.recipient_source_mode === "import_file" && !data.recipient_imported_file) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please upload a file.", path: ["recipient_imported_file"]});
    }
    if (data.sendOption === "schedule" && !data.scheduledAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select a schedule date and time.", path: ["scheduledAt"]});
    }
    if (data.sendOption === "schedule" && data.scheduledAt && data.scheduledAt < new Date(new Date().setHours(0, 0, 0, 0)) ) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Scheduled date cannot be in the past.", path: ["scheduledAt"]});
    }
    // Validate emails if input_emails mode
    if (data.recipient_source_mode === "input_emails" && data.recipient_emails_input) {
        const emails = data.recipient_emails_input.split(',').map(e => e.trim()).filter(e => e);
        if (emails.length === 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please enter at least one email address.", path: ["recipient_emails_input"]});
        }
        emails.forEach((email, index) => {
            if (!z.string().email().safeParse(email).success) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid email format: ${email}`, path: ["recipient_emails_input"]});
            }
        });
    }
  });
type CampaignCreationFormData = z.infer<typeof campaignCreationFormSchema>;


// --- CSV Exporter ---
// ... (CSV export logic - will need significant update if `value` and `sender_address` are to be parsed)
// For now, a simplified CSV export
const CSV_HEADERS_CAMPAIGN = ["ID", "Campaign Name (from Template)", "Status", "Created At"];
const CSV_KEYS_CAMPAIGN_SIMPLE: (keyof Pick<EmailCampaignItem, 'id' | 'status' | 'created_at'> | 'templateName')[] = [
  "id", "templateName", "status", "created_at"
];

function exportCampaignsToCsv(filename: string, rows: EmailCampaignItem[]) {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info" duration={2000}>Nothing to export.</Notification>); return false; }
  const preparedRows = rows.map((row) => ({
    id: row.id,
    templateName: row.mail_template?.name || String(row.template_id),
    status: CAMPAIGN_STATUS_OPTIONS_FORM.find((s) => s.value === (row.status === "1" ? "active" : "inactive"))?.label || String(row.status),
    created_at: row.created_at,
  }));
  // ... (Standard exportToCsv logic using preparedRows, CSV_HEADERS_CAMPAIGN, CSV_KEYS_CAMPAIGN_SIMPLE)
  const separator = ",";
  const csvContent = CSV_HEADERS_CAMPAIGN.join(separator) + "\n" + preparedRows.map((row: any) => CSV_KEYS_CAMPAIGN_SIMPLE.map((k) => { let cell: any = row[k]; if (cell === null || cell === undefined) cell = ""; else cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(separator)).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; }
  toast.push(<Notification title="Export Failed" type="danger" duration={3000}>Browser does not support this feature.</Notification>); return false;
}

// --- ActionColumn, Search, TableTools, SelectedFooter (UI remains same) ---
const ActionColumn = ({ onViewDetails, onEdit, onDelete }: { onViewDetails: () => void; onEdit: () => void; onDelete: () => void; }) => { return ( <div className="flex items-center justify-center gap-2"> <Tooltip title="Edit Campaign"><div className="text-xl cursor-pointer text-gray-500 hover:text-emerald-600" role="button" onClick={onEdit}><TbPencil/></div></Tooltip> <Tooltip title="View Details"><div className="text-xl cursor-pointer text-gray-500 hover:text-blue-600" role="button" onClick={onViewDetails}><TbEye/></div></Tooltip> <Tooltip title="Delete Campaign"><div className="text-xl cursor-pointer text-gray-500 hover:text-red-600" role="button" onClick={onDelete}><TbTrash/></div></Tooltip> </div> ); };
type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>( ({ onInputChange }, ref) => ( <DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} /> ));
ItemSearch.displayName = "ItemSearch";
type ItemTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: () => void; };
const ItemTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters }: ItemTableToolsProps) => ( <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full"> <div className="flex-grow"><ItemSearch onInputChange={onSearchChange} /></div> <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto"><Tooltip title="Clear Filters"><Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters"></Button></Tooltip> <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button> <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button> </div> </div> );
type EmailCampaignsTableProps = { columns: ColumnDef<EmailCampaignItem>[]; data: EmailCampaignItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void; /* selectedItems and row selection removed as not in UI */ };
const EmailCampaignsTable = ({ columns, data, loading, pagingData, onPaginationChange, onSelectChange, onSort }: EmailCampaignsTableProps) => ( <DataTable columns={columns} data={data} loading={loading} pagingData={pagingData} onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort} noData={!loading && data.length === 0} />);
// No selected footer if table is not selectable

// --- Main EmailCampaignListing Component ---
const EmailCampaignListing = () => {
  const dispatch = useAppDispatch();
  const {
    emailCampaignsData = [], // Assuming this is from your Redux state for the listing
    mailTemplatesData = [], // For template_id dropdown
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [currentWizardStep, setCurrentWizardStep] = useState(1);
  const [editingItem, setEditingItem] = useState<EmailCampaignItem | null>(null); // For editing existing campaign
  const [viewingItem, setViewingItem] = useState<EmailCampaignItem | null>(null);
  const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_at" }, query: ""});
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false); // For listing filter
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [itemToDelete, setItemToDelete] = useState<EmailCampaignItem | null>(null);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  const mailTemplateOptions = useMemo(() => Array.isArray(mailTemplatesData) ? mailTemplatesData.map((t: ApiMailTemplate) => ({ value: String(t.id), label: t.name })) : [], [mailTemplatesData]);

  useEffect(() => {
    dispatch(getEmailCampaignsAction());
    dispatch(getMailTemplatesAction());
  }, [dispatch]);

  const campaignFormMethods = useForm<CampaignCreationFormData>({
    resolver: zodResolver(campaignCreationFormSchema),
    mode: "onChange", // Or "onTouched"
  });
  const { control, handleSubmit, reset, watch, setValue, trigger, getValues } = campaignFormMethods;
  

  const nextStep = useCallback(async () => {
    let fieldsToValidate: (keyof CampaignCreationFormData)[] = [];
    if (currentWizardStep === 1) fieldsToValidate = ["template_id"];
    else if (currentWizardStep === 2) fieldsToValidate = ["campaign_name", /* add other dynamic fields if they become mandatory */];
    else if (currentWizardStep === 3) fieldsToValidate = ["recipient_source_mode", "recipient_emails_input", "recipient_imported_file"];
    
    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) { toast.push(<Notification title="Validation Error" type="danger">Please correct errors.</Notification>); return; }
    }
    setCurrentWizardStep((prev) => Math.min(prev + 1, 4));
  }, [currentWizardStep, trigger]);

  const prevStep = useCallback(() => setCurrentWizardStep((prev) => Math.max(prev - 1, 1)), []);

  const parseValueString = (valueString: string): Partial<CampaignCreationFormData> => {
    try {
        const blocks = JSON.parse(valueString) as ContentBlock[];
        const parsed: Partial<CampaignCreationFormData> = {};
        blocks.forEach(block => {
            if(block.type === 'text' && block.name === 'header_text') parsed.text_block_1 = block.value;
            else if(block.type === 'image' && block.name === 'image1') parsed.image_1 = block.value;
            else if(block.type === 'image' && block.name === 'image2') parsed.image_2 = block.value;
            else if(block.type === 'image' && block.name === 'image3') parsed.image_3 = block.value;
            else if(block.type === 'image' && block.name === 'image4') parsed.image_4 = block.value;
            else if(block.type === 'image' && block.name === 'image5') parsed.image_5 = block.value;
            else if(block.type === 'image' && block.name === 'image6') parsed.image_6 = block.value;
            else if(block.type === 'text' && block.name === 'text') parsed.text_final = block.value;
            // Assuming text_block_2, text_with_whatsapp_link, whatsapp_number_to_link are separate fields not in 'value' JSON
        });
        return parsed;
    } catch (e) {
        console.error("Error parsing content 'value' string:", e);
        return {};
    }
  };
  
  const openCreateDrawer = useCallback((itemToEdit?: EmailCampaignItem) => {
    setCurrentWizardStep(1);
    if (itemToEdit) {
        setEditingItem(itemToEdit);
        const parsedContent = parseValueString(itemToEdit.value);
        // Recipient source for edit needs to be inferred or handled based on how API returns it
        // For simplicity, assuming we can't directly map sender_address back to form fields easily
        reset({
            template_id: String(itemToEdit.template_id),
            campaign_name: itemToEdit.mail_template?.name || `Campaign ${itemToEdit.id}`, // Use template name or a default
            ...parsedContent, // Spread parsed dynamic values
            // Defaulting recipient mode for edit, this needs robust handling based on API data
            recipient_source_mode: "input_emails", 
            recipient_emails_input: "", // API doesn't provide this directly in listing for edit
            recipient_imported_file: null,
            status: itemToEdit.status === "1" ? "active" : "inactive",
            sendOption: "now", // Or determine from existing data if possible
            scheduledAt: null,
             // These might not be in 'value' string from API, get them if they exist at top level
            text_block_2: (parsedContent as any).text_block_2 || (itemToEdit as any).text_block_2 || "", 
            text_with_whatsapp_link: (parsedContent as any).text_with_whatsapp_link || (itemToEdit as any).text_with_whatsapp_link || "",
            whatsapp_number_to_link: (parsedContent as any).whatsapp_number_to_link || (itemToEdit as any).whatsapp_number_to_link || "",
        });
    } else {
        setEditingItem(null);
        reset({
            template_id: mailTemplateOptions[0]?.value || "",
            campaign_name: "",
            text_block_1: "", image_1: "", text_block_2: "",
            image_2: "", image_3: "", image_4: "", image_5: "", image_6: "",
            text_final: "",
            text_with_whatsapp_link: "", whatsapp_number_to_link: "",
            recipient_source_mode: "input_emails",
            recipient_emails_input: "", recipient_imported_file: null,
            status: "active", sendOption: "now", scheduledAt: null,
        });
    }
    setIsCreateDrawerOpen(true);
  }, [reset, mailTemplateOptions]);

  const closeCreateDrawer = useCallback(() => setIsCreateDrawerOpen(false), []);

  const onCampaignFormSubmit = useCallback( async (data: CampaignCreationFormData) => {
      setIsSubmittingCampaign(true);
      // Construct the 'value' JSON string
      const contentValue: ContentBlock[] = [];
      if(data.text_block_1) contentValue.push({ type: "text", name: "header_text", value: data.text_block_1 });
      if(data.image_1) contentValue.push({ type: "image", name: "image1", value: data.image_1 });
      if(data.image_2) contentValue.push({ type: "image", name: "image2", value: data.image_2 });
      if(data.image_3) contentValue.push({ type: "image", name: "image3", value: data.image_3 });
      if(data.image_4) contentValue.push({ type: "image", name: "image4", value: data.image_4 });
      if(data.image_5) contentValue.push({ type: "image", name: "image5", value: data.image_5 });
      if(data.image_6) contentValue.push({ type: "image", name: "image6", value: data.image_6 });
      if(data.text_final) contentValue.push({ type: "text", name: "text", value: data.text_final });
      // Note: text_block_2, text_with_whatsapp_link, whatsapp_number_to_link are not part of the 'value' JSON in your API example
      // They are separate fields in the add/edit payload.

      let recipientEmails: string[] = [];
      if (data.recipient_source_mode === "input_emails" && data.recipient_emails_input) {
          recipientEmails = data.recipient_emails_input.split(',').map(e => e.trim()).filter(e => e);
      } else if (data.recipient_source_mode === "import_file" && data.recipient_imported_file) {
          // Placeholder for file parsing logic - this is complex
          // You would read the file, parse emails, and populate recipientEmails
          toast.push(<Notification title="Info" type="info">File import processing not implemented in this demo.</Notification>);
          // For now, simulate some emails if a file is "uploaded"
          recipientEmails = ["file_user1@example.com", "file_user2@example.com"];
      }

      const apiPayload = {
        template_id: data.template_id,
        campaign_name: data.campaign_name, // This is the new 'campaign_name' from form
        value: JSON.stringify(contentValue),
        // sender_address: JSON.stringify([{ email: "system@example.com", name: "System Sender" }]), // Example, or from config
        recipient_source: recipientEmails, // This matches your add/edit payload field
        status: data.status === "active" ? "1" : "0", // Map to API status
        // Include other separate fields if your API expects them at top level:
        text_block_1: data.text_block_1,
        image_1: data.image_1,
        text_block_2: data.text_block_2,
        text_with_whatsapp_link: data.text_with_whatsapp_link,
        whatsapp_number_to_link: data.whatsapp_number_to_link,
        // Handle scheduling if API supports it
        ...(data.sendOption === "schedule" && data.scheduledAt && { schedule_at: data.scheduledAt.toISOString() }),
      };

      console.log("API Payload:", apiPayload);

      try {
        if (editingItem) {
          await dispatch(editEmailCampaignAction({ id: editingItem.id, ...apiPayload })).unwrap();
          toast.push(<Notification title="Campaign Updated" type="success" />);
        } else {
          await dispatch(addEmailCampaignAction(apiPayload)).unwrap();
          toast.push(<Notification title="Campaign Created" type="success" />);
        }
        dispatch(getEmailCampaignsAction()); // Refresh list
        closeCreateDrawer();
      } catch (e: any) {
        toast.push(<Notification title="Operation Failed" type="danger">{(e as Error).message || "Could not process campaign."}</Notification>);
      } finally {
        setIsSubmittingCampaign(false);
      }
    }, [dispatch, editingItem, closeCreateDrawer]
  );

  const openViewDialog = useCallback((item: EmailCampaignItem) => setViewingItem(item), []);
  const closeViewDialog = useCallback(() => setViewingItem(null), []);
  
  const handleDeleteClick = useCallback((item: EmailCampaignItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
  const onConfirmSingleDelete = useCallback(async () => { if (!itemToDelete) return; setIsDeleting(true); setSingleDeleteConfirmOpen(false); try { await dispatch(deleteEmailCampaignAction({ id: itemToDelete.id })).unwrap(); toast.push(<Notification title="Campaign Deleted" type="success">{`Campaign "${itemToDelete.mail_template?.name || itemToDelete.id}" deleted.`}</Notification>); dispatch(getEmailCampaignsAction()); } catch (e:any) { toast.push(<Notification title="Delete Failed" type="danger">{(e as Error).message}</Notification>); } finally { setIsDeleting(false); setItemToDelete(null); } }, [dispatch, itemToDelete]);
  const [selectedItems, setSelectedItems] = useState<any>([]);
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }),[handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); },[handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }),[handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }),[handleSetTableData]);
const handleSelectPageSizeChange = useCallback((value: number) => { setTableData(prev => ({ ...prev, pageSize: Number(value), pageIndex: 1 })); setSelectedItems([]); }, []);
  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: EmailCampaignItem[] = Array.isArray(emailCampaignsData) ? emailCampaignsData.map(item => ({
        ...item,
        campaignNameDisplay: item.mail_template?.name || `Campaign ${item.id}`, // Use template name for display
        dateTimeDisplay: new Date(item.created_at), // Or a specific schedule field
    })) : [];
    let processedData = cloneDeep(sourceData);
    // Filtering logic here if needed, based on filterCriteria
    if (tableData.query) { const q = tableData.query.toLowerCase().trim(); processedData = processedData.filter(c => String(c.id).toLowerCase().includes(q) || c.campaignNameDisplay?.toLowerCase().includes(q) || c.mail_template?.name.toLowerCase().includes(q) || String(c.status).toLowerCase().includes(q) ); }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aVal: any = a[key as keyof EmailCampaignItem];
        let bVal: any = b[key as keyof EmailCampaignItem];
        if (key === 'campaignNameDisplay') { aVal = a.campaignNameDisplay; bVal = b.campaignNameDisplay; }
        else if (key === 'dateTimeDisplay') { aVal = a.dateTimeDisplay?.getTime(); bVal = b.dateTimeDisplay?.getTime(); return order === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0); }
        
        const aStr = String(aVal ?? "").toLowerCase(); const bStr = String(bVal ?? "").toLowerCase();
        return order === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }
    const currentTotal = processedData.length; const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number; const startIndex = (pageIndex - 1) * pageSize;
    return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
  }, [emailCampaignsData, tableData/*, filterCriteria */]); // Add filterCriteria if implemented

  const handleExportData = useCallback(() => { exportCampaignsToCsv("email_campaigns_log.csv", allFilteredAndSortedData); }, [allFilteredAndSortedData]);

  const columns: ColumnDef<EmailCampaignItem>[] = useMemo( () => [
      { header: "ID", accessorKey: "id", size: 80, enableSorting: true },
      { header: "Campaign (Template Name)", accessorKey: "campaignNameDisplay", size: 250, enableSorting: true, cell: props => props.row.original.mail_template?.name || `Campaign ${props.row.original.id}` },
      { header: "Date & Time", accessorKey: "dateTimeDisplay", size: 180, enableSorting: true, cell: props => { const d = props.getValue<Date>(); return d ? (<span>{d.toLocaleDateString()} <span className="text-xs text-gray-500">{d.toLocaleTimeString()}</span></span>) : '-'; } },
      { header: "Status", accessorKey: "status", size: 120, cell: props => { const s = props.getValue<CampaignApiStatus>(); const displayStatus = s === "1" ? "active" : (s === "0" ? "inactive" : String(s || "draft")); return (<Tag className={classNames("capitalize whitespace-nowrap", campaignDisplayStatusColor[String(s)] || campaignDisplayStatusColor.default)}>{CAMPAIGN_STATUS_OPTIONS_FORM.find(opt => opt.value === displayStatus)?.label || displayStatus}</Tag>); }},
      { header: "Actions", id: "actions", size: 120, meta: { HeaderClass: "text-center", cellClass: "text-center" }, cell: (props) => <ActionColumn onViewDetails={() => openViewDialog(props.row.original)} onEdit={() => openCreateDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} /> },
    ], [openViewDialog, openCreateDrawer, handleDeleteClick]
  );

  const renderWizardStep = () => {
    const { control, formState: { errors: formErrors }, watch: watchForm, setValue: setFormValue } = campaignFormMethods;

    switch (currentWizardStep) {
      case 1: // Step 1: Choose Template & Campaign Name
        return (
          <Card header={<div className="flex items-center gap-2 font-semibold"><TbTemplate /> Step 1: Template & Name</div>} bodyClass="p-4 md:p-6">
            <FormItem label="Mail Template" invalid={!!formErrors.template_id} errorMessage={formErrors.template_id?.message}>
              <Controller name="template_id" control={control} render={({ field }) => (
                <Select placeholder="Select a template..." options={mailTemplateOptions} value={mailTemplateOptions.find(o => o.value === field.value)}
                  onChange={(opt) => field.onChange(opt?.value)} />
              )}/>
            </FormItem>
            <FormItem label="Campaign Name (Internal Tracking)" className="mt-4" invalid={!!formErrors.campaign_name} errorMessage={formErrors.campaign_name?.message}>
              <Controller name="campaign_name" control={control} render={({ field }) => (<Input {...field} prefix={<TbClipboardText />} placeholder="e.g., Q4 Holiday Promo" /> )}/>
            </FormItem>
          </Card>
        );
      case 2: // Step 2: Add Dynamic Values (matches your API's 'value' field structure)
        return (
          <Card header={<div className="flex items-center gap-2 font-semibold"><TbForms /> Step 2: Customize Content</div>} bodyClass="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormItem label="Header Text (for {{header_text}})" className="md:col-span-2" invalid={!!formErrors.text_block_1} errorMessage={formErrors.text_block_1?.message}>
                <Controller name="text_block_1" control={control} render={({ field }) => (<Input textArea {...field} rows={3} placeholder="Main heading or introductory text..." />)}/>
              </FormItem>
              {[1,2,3,4,5,6].map(i => (
                <FormItem key={`image_${i}`} label={`Image ${i} URL (for {{image${i}}})`} invalid={!!(formErrors as any)[`image_${i}`]} errorMessage={(formErrors as any)[`image_${i}`]?.message}>
                  <Controller
                    name={`image_${i}` as any}
                    control={control}
                    render={({ field }) => (
                      <Input {...field} type="url" prefix={<TbPhoto />} placeholder={`https://example.com/image${i}.png`} />
                    )}
                  />
                </FormItem>
              ))}
              <FormItem label="Final Text (for {{text}})" className="md:col-span-2" invalid={!!formErrors.text_final} errorMessage={formErrors.text_final?.message}>
                <Controller name="text_final" control={control} render={({ field }) => (<Input textArea {...field} rows={3} placeholder="Concluding text or call to action..." />)}/>
              </FormItem>
              <hr className="md:col-span-2 my-2"/>
              <FormItem label="Text with WhatsApp Link" className="md:col-span-1" invalid={!!formErrors.text_with_whatsapp_link} errorMessage={formErrors.text_with_whatsapp_link?.message}>
                <Controller name="text_with_whatsapp_link" control={control} render={({ field }) => (<Input {...field} placeholder="e.g., Chat on WhatsApp!" />)}/>
              </FormItem>
              <FormItem label="WhatsApp Number" className="md:col-span-1" invalid={!!formErrors.whatsapp_number_to_link} errorMessage={formErrors.whatsapp_number_to_link?.message}>
                <Controller name="whatsapp_number_to_link" control={control} render={({ field }) => (<Input {...field} type="tel" prefix={<TbPhone />} placeholder="+1234567890" />)}/>
              </FormItem>
            </div>
          </Card>
        );
      case 3: // Step 3: Choose Recipients (Email List or File)
        return (
          <Card header={<div className="flex items-center gap-2 font-semibold"><TbUsersGroup /> Step 3: Choose Recipients</div>} bodyClass="p-4 md:p-6">
            <FormItem label="Recipient Source" className="mb-6" invalid={!!formErrors.recipient_source_mode} errorMessage={formErrors.recipient_source_mode?.message}>
              <Controller name="recipient_source_mode" control={control}
                render={({ field }) => (
                  <Radio.Group value={field.value} onChange={(val) => { field.onChange(val); if (val === "input_emails") setFormValue("recipient_imported_file", null); if (val === "import_file") setFormValue("recipient_emails_input", ""); }}>
                    <Radio value="input_emails">Enter Email Addresses</Radio>
                    <Radio value="import_file">Import from File (CSV/Excel with 'email' column)</Radio>
                  </Radio.Group>
                )}
              />
            </FormItem>
            {watchForm("recipient_source_mode") === "input_emails" && (
              <FormItem label="Email Addresses (comma-separated)" invalid={!!formErrors.recipient_emails_input} errorMessage={formErrors.recipient_emails_input?.message as string}>
                <Controller name="recipient_emails_input" control={control} render={({ field }) => (<Input textArea {...field} rows={4} prefix={<TbMail/>} placeholder="user1@example.com, user2@example.com, ..." /> )}/>
              </FormItem>
            )}
            {watchForm("recipient_source_mode") === "import_file" && (
              <FormItem label="Upload File" invalid={!!formErrors.recipient_imported_file} errorMessage={formErrors.recipient_imported_file?.message as string}>
                <Controller name="recipient_imported_file" control={control}
                  render={({ field: { onChange, name } }) => ( <Input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" name={name} onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)} prefix={<TbFileImport />} /> )}
                />
              </FormItem>
            )}
          </Card>
        );
      case 4: // Step 4: Review & Send/Schedule
        const formData = getValues();
        return (
          <Card header={<div className="flex items-center gap-2 font-semibold"><TbCircleCheck /> Step 4: Review & Schedule/Send</div>} bodyClass="p-4 md:p-6">
             <FormItem label="Set Status for this Campaign" invalid={!!formErrors.status} errorMessage={formErrors.status?.message}>
              <Controller name="status" control={control} render={({ field }) => (
                <Select placeholder="Select campaign status" options={CAMPAIGN_STATUS_OPTIONS_FORM} value={CAMPAIGN_STATUS_OPTIONS_FORM.find(o => o.value === field.value)}
                  onChange={(opt) => field.onChange(opt?.value)} prefix={<TbToggleRight/>} />
              )}/>
            </FormItem>
            <div className="space-y-2 my-6 text-sm border-t border-b py-4 dark:border-gray-600">
              <h6 className="font-semibold text-base mb-2">Campaign Summary:</h6>
              <p><strong>Campaign Name:</strong> {formData.campaign_name || <span className="italic text-gray-500">Not Set</span>}</p>
              <p><strong>Template:</strong> {mailTemplateOptions.find(t => t.value === formData.template_id)?.label || <span className="italic text-gray-500">Not Set</span>}</p>
              <p><strong>Recipients:</strong> {formData.recipient_source_mode === "input_emails" ? `${formData.recipient_emails_input?.split(',').map(e=>e.trim()).filter(e=>e).length || 0} emails entered` : formData.recipient_imported_file ? `File: ${formData.recipient_imported_file.name}` : <span className="italic text-gray-500">Not Set</span>}</p>
            </div>
            <FormItem label="Send Options" className="mb-4" invalid={!!formErrors.sendOption} errorMessage={formErrors.sendOption?.message}>
              <Controller name="sendOption" control={control}
                render={({ field }) => (
                  <Radio.Group value={field.value} onChange={(val) => { field.onChange(val); if (val === "now") setFormValue("scheduledAt", null); }}>
                    <Radio value="now">Send Now</Radio>
                    <Radio value="schedule">Schedule for Later</Radio>
                  </Radio.Group>
                )}
              />
            </FormItem>
            {watchForm("sendOption") === "schedule" && (
              <FormItem label="Schedule Date & Time" invalid={!!formErrors.scheduledAt} errorMessage={formErrors.scheduledAt?.message as string}>
                <Controller name="scheduledAt" control={control}
                  render={({ field }) => (<DatePicker value={field.value} onChange={(date) => field.onChange(date)} placeholder="Select date and time" showTimeSelect inputPrefix={<TbCalendarStats />} minDate={new Date()} /> )} />
              </FormItem>
            )}
          </Card>
        );
      default: return <div>Unknown Step</div>;
    }
  };

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Email Campaigns</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={() => openCreateDrawer()}>Create New Campaign</Button>
          </div>
          <ItemTableTools onSearchChange={handleSearchChange} onFilter={() => { /* openFilterDrawer(); */ toast.push(<Notification title="Info">Filter for listing page not yet implemented.</Notification>) }} onExport={handleExportData} />
          <div className="mt-4">
            <EmailCampaignsTable columns={columns} data={pageData} loading={masterLoadingStatus === "loading" || isSubmittingCampaign || isDeleting} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectPageSizeChange} onSort={handleSort} />
          </div>
        </AdaptiveCard>
      </Container>

      {/* No selected footer as selection is removed from table for now */}

      <Drawer
        title={`Create Email Campaign - Step ${currentWizardStep} of 4: ${ currentWizardStep === 1 ? "Template & Name" : currentWizardStep === 2 ? "Customize Content" : currentWizardStep === 3 ? "Choose Recipients" : "Review & Schedule" }`}
        isOpen={isCreateDrawerOpen} onClose={closeCreateDrawer} onRequestClose={closeCreateDrawer} width={800} // Wider for wizard
        footer={ <div className="flex justify-between w-full dark:border-gray-700"> <div> {currentWizardStep > 1 && (<Button onClick={prevStep} disabled={isSubmittingCampaign} icon={<TbPlayerTrackPrev />}>Back</Button>)} </div> <div className="flex gap-2"> {currentWizardStep < 4 && (<Button variant="solid" onClick={nextStep} disabled={isSubmittingCampaign} icon={<TbPlayerTrackNext />}>Next</Button>)} {currentWizardStep === 4 && (<> <Button variant="outline" onClick={() => { /* Placeholder for save as draft */ closeCreateDrawer(); toast.push(<Notification title="Info">Campaign Saved as Draft (Simulated).</Notification>); }} disabled={isSubmittingCampaign}>Save as Draft</Button> <Button variant="solid" color={watch("sendOption") === "schedule" ? "blue" : "emerald"} form="campaignCreationForm" type="submit" loading={isSubmittingCampaign} disabled={!campaignFormMethods.formState.isValid || isSubmittingCampaign} icon={<TbSend />}>{watch("sendOption") === "schedule" ? "Schedule Campaign" : "Send Campaign Now"}</Button> </>)} </div> </div> }
      >
        <Form id="campaignCreationForm" onSubmit={handleSubmit(onCampaignFormSubmit)} className="flex flex-col">
          {renderWizardStep()}
        </Form>
      </Drawer>

      <Dialog isOpen={!!viewingItem} onClose={closeViewDialog} onRequestClose={closeViewDialog} width={700}>
        <h5 className="mb-4">Campaign Details: {viewingItem?.mail_template?.name || `Campaign ID: ${viewingItem?.id}`}</h5>
        {viewingItem && ( <div className="space-y-3 text-sm max-h-[70vh] overflow-y-auto pr-2">
            <p><strong>ID:</strong> {viewingItem.id}</p>
            <p><strong>Template:</strong> {viewingItem.mail_template?.name} (ID: {viewingItem.template_id})</p>
            <p><strong>Status:</strong> {viewingItem.status === "1" ? "Active" : (viewingItem.status === "0" ? "Inactive/Draft" : String(viewingItem.status || "N/A"))}</p>
            <p><strong>Created At:</strong> {new Date(viewingItem.created_at).toLocaleString()}</p>
            <p><strong>Updated At:</strong> {new Date(viewingItem.updated_at).toLocaleString()}</p>
            <div><strong>Content Values (JSON):</strong> <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 whitespace-pre-wrap break-all">{viewingItem.value}</pre></div>
            <div><strong>Sender Addresses (JSON):</strong> <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 whitespace-pre-wrap break-all">{viewingItem.sender_address}</pre></div>
        </div>)}
        <div className="text-right mt-6"><Button variant="solid" onClick={closeViewDialog}>Close</Button></div>
      </Dialog>
      
      {/* Filter Drawer (if implemented for listing page) */}
      {/* ... */}

      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Email Campaign" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} >
        <p>Are you sure you want to delete the campaign "<strong>{itemToDelete?.mail_template?.name || itemToDelete?.id}</strong>"?</p>
      </ConfirmDialog>
    </>
  );
};

export default EmailCampaignListing;