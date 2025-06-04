// src/views/your-path/EmailCampaignListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames";
import { useForm, Controller, FieldErrors, UseFormReturn } from "react-hook-form";
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
import DebounceInput from "@/components/shared/DebouceInput"; // Corrected typo
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
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
  TbMailOpened,
  TbMailForward, // For file import
} from "react-icons/tb";

// Types
import type { OnSortParam, ColumnDef } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  getEmailCampaignsAction,
  addEmailCampaignAction,
  editEmailCampaignAction,
  deleteEmailCampaignAction,
  getMailTemplatesAction,
} from "@/reduxtool/master/middleware"; 
import { masterSelector } from "@/reduxtool/master/masterSlice"; 
import { ConfirmDialog } from "@/components/shared";
import dayjs from "dayjs";

// --- Define Item Types & Constants ---
export type ApiMailTemplate = { id: string | number; name: string; template_id?: string };
export type SelectOption = { value: string; label: string };

export type CampaignApiStatus = "Inactive" | "" | null | string;
export type CampaignFormStatus = "active" | "inactive";

export type EmailCampaignItem = { 
  id: string | number;
  template_id: number | string; 
  campaign_name?: string;
  status: CampaignApiStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  schedule_at?: string | null;
  header_text?: string; 
  images?: string[]; 
  text_final?: string;
  text_block_2?: string;
  text_with_whatsapp_link?: string;
  whatsapp_number_to_link?: string;
  recipient_source?: string[]; // Can be email strings or a marker for file import

  mail_template: {
    id: number;
    name: string;
    template_id?: string;
  };
  campaignNameDisplay?: string;
  dateTimeDisplay?: Date;
};

const CAMPAIGN_STATUS_OPTIONS_FORM: SelectOption[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];
const campaignStatusFormValues = CAMPAIGN_STATUS_OPTIONS_FORM.map((s) => s.value) as [CampaignFormStatus, ...CampaignFormStatus[]];

const CAMPAIGN_STATUS_OPTIONS_FILTER: SelectOption[] = [ 
    { value: "", label: "Active" },
    { value: "Inactive", label: "Inactive/Draft" },
];

const campaignDisplayStatusColor: Record<string, string> = {
  "": "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  "Inactive": "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100",
  "null": "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100", // Assuming 'null' status is like a draft
  default: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100",
};

// For zod schema, forward declaration for getValues within superRefine
// This is a workaround to provide context (like editing state) to superRefine
let getValuesCampaignForm: UseFormReturn<CampaignCreationFormData>['getValues'] = () => ({} as CampaignCreationFormData) ;


const campaignCreationFormSchema = z
  .object({
    template_id: z.string({ required_error: "Please select a template." }).min(1, "Template is required."),
    campaign_name: z.string().min(1, "Campaign Name is required.").max(150, "Campaign name too long."),
    text_block_1: z.string().max(1000, "Header text is too long.").optional().or(z.literal("")),
    image_1: z.string().url("Image 1 must be a valid URL.").optional().or(z.literal("")),
    image_2: z.string().url("Image 2 must be a valid URL.").optional().or(z.literal("")),
    image_3: z.string().url("Image 3 must be a valid URL.").optional().or(z.literal("")),
    image_4: z.string().url("Image 4 must be a valid URL.").optional().or(z.literal("")),
    image_5: z.string().url("Image 5 must be a valid URL.").optional().or(z.literal("")),
    image_6: z.string().url("Image 6 must be a valid URL.").optional().or(z.literal("")),
    text_final: z.string().max(1000, "Final text is too long").optional().or(z.literal("")),
    text_block_2: z.string().max(1000, "Text 2 is too long.").optional().or(z.literal("")),
    text_with_whatsapp_link: z.string().max(500, "WhatsApp text too long.").optional().or(z.literal("")),
    whatsapp_number_to_link: z.string().regex(/^\+?[0-9\s-()]{7,15}$/, "Invalid WhatsApp number format.").optional().or(z.literal("")),
    recipient_source_mode: z.enum(["input_emails", "import_file"], { required_error: "Choose recipient mode."}),
    recipient_emails_input: z.string().optional(), 
    recipient_imported_file: z.instanceof(File).optional().nullable(), 
    status: z.enum(campaignStatusFormValues, { errorMap: () => ({ message: "Please select a status." })}),
    sendOption: z.enum(["now", "schedule"], { required_error: "Please choose a send option."}),
    scheduledAt: z.date({ coerce: true }).nullable().optional(),
    __editingItem: z.custom<EmailCampaignItem | null>().optional(), // To pass context
  })
  .superRefine((data, ctx) => {
    if (data.recipient_source_mode === "input_emails" && (!data.recipient_emails_input || data.recipient_emails_input.trim() === "")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please enter at least one email address.", path: ["recipient_emails_input"]});
    }
    
    if (data.recipient_source_mode === "import_file" && !data.recipient_imported_file) {
        const isEditing = !!data.__editingItem; // Check if __editingItem is present
        
        // If creating new (not editing) and file mode is chosen, file is required.
        // If editing, and file mode is chosen, but no new file is provided, this validation passes.
        // The backend will determine if it reuses an old file or if this implies no file/clearing recipients.
        if (!isEditing) { 
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please upload a file for new campaign.", path: ["recipient_imported_file"]});
        }
        // If you want to enforce re-upload on edit when 'import_file' is selected:
        // else if (isEditing) { 
        //    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please re-upload a file if you wish to use file import for recipients.", path: ["recipient_imported_file"]});
        // }
    }
    if (data.sendOption === "schedule" && !data.scheduledAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select a schedule date and time.", path: ["scheduledAt"]});
    }
    if (data.sendOption === "schedule" && data.scheduledAt && data.scheduledAt < new Date(new Date().setHours(0, 0, 0, 0)) ) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Scheduled date cannot be in the past.", path: ["scheduledAt"]});
    }
    if (data.recipient_source_mode === "input_emails" && data.recipient_emails_input) {
        const emails = data.recipient_emails_input.split(',').map(e => e.trim()).filter(e => e);
        if (emails.length === 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please enter at least one email address.", path: ["recipient_emails_input"]});
        }
        emails.forEach((email) => { 
            if (!z.string().email().safeParse(email).success) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid email format: ${email}`, path: ["recipient_emails_input"]});
            }
        });
    }
  });
type CampaignCreationFormData = z.infer<typeof campaignCreationFormSchema>;
type ImageFieldName = 'image_1' | 'image_2' | 'image_3' | 'image_4' | 'image_5' | 'image_6';

const campaignFilterFormSchema = z.object({
    status: z.string().optional(), // Handles "" (empty string) or "Inactive" or ""
    date_range: z.array(z.date().nullable()).optional().default([null, null]),
});
type CampaignFilterFormData = z.infer<typeof campaignFilterFormSchema>;

const CSV_HEADERS_CAMPAIGN = ["ID", "Campaign Name", "Status", "Created At"];
const CSV_KEYS_CAMPAIGN_SIMPLE: (keyof Pick<EmailCampaignItem, 'id' | 'status' | 'created_at' | 'campaign_name'>)[] = [
  "id", "campaign_name", "status", "created_at"
];

function exportCampaignsToCsv(filename: string, rows: EmailCampaignItem[]): boolean {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info" duration={2000}>Nothing to export.</Notification>); return false; }
  const preparedRows = rows.map((row) => ({
    id: row.id,
    campaign_name: row.campaign_name || row.mail_template?.name || String(row.template_id),
    status: CAMPAIGN_STATUS_OPTIONS_FILTER.find((s) => s.value === row.status)?.label || String(row.status), // Use filter options for "Active" / "Inactive" consistency
    created_at: row.created_at,
  }));
  const separator = ",";
  const csvContent = CSV_HEADERS_CAMPAIGN.join(separator) + "\n" + preparedRows.map((row: any) => CSV_KEYS_CAMPAIGN_SIMPLE.map((k) => { let cell: any = row[k]; if (cell === null || cell === undefined) cell = ""; else cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(separator)).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; }
  toast.push(<Notification title="Export Failed" type="danger" duration={3000}>Browser does not support this feature.</Notification>); return false;
}
const ActionColumn = ({ onViewDetails, onEdit, onDelete }: { onViewDetails: () => void; onEdit: () => void; onDelete: () => void; }) => { return ( 
  <div className="flex items-center justify-center gap-2"> 
    <Tooltip title="Edit Campaign">
      <div className="text-xl cursor-pointer text-gray-500 hover:text-emerald-600" role="button" onClick={onEdit}><TbPencil/></div>
    </Tooltip> 
    <Tooltip title="View Details">
      <div className="text-xl cursor-pointer text-gray-500 hover:text-blue-600" role="button" onClick={onViewDetails}>
        <TbEye/>
      </div>
    </Tooltip> 
    <Tooltip title="Send test email">
      <div className="text-xl cursor-pointer text-gray-500 hover:text-orange-600" role="button">
        <TbMailForward size={18}/>
      </div>
    </Tooltip> 
    <Tooltip title="View Template">
      <div className="text-xl cursor-pointer text-gray-500 hover:text-blue-600" role="button">
        <TbMailOpened size={18}/>
      </div>
    </Tooltip> 
    <Tooltip title="Delete Campaign">
      <div className="text-xl cursor-pointer text-gray-500 hover:text-red-600" role="button" onClick={onDelete}>
        <TbTrash/>
      </div>
    </Tooltip> 
  </div> ); };
type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>( ({ onInputChange }, ref) => ( <DebounceInput ref={ref} className="w-full" placeholder="Search by Template Name, ID..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} /> ));
ItemSearch.displayName = "ItemSearch";
type ItemTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; };
const ItemTableTools = ({ onSearchChange, onFilter, onExport }: ItemTableToolsProps) => ( <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full"> <div className="flex-grow"><ItemSearch onInputChange={onSearchChange} /></div> <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"> <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button> <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button> </div> </div> );
type EmailCampaignsTableProps = { columns: ColumnDef<EmailCampaignItem>[]; data: EmailCampaignItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void; /* selectedItems and row selection removed as not in UI */ };
const EmailCampaignsTable = ({ columns, data, loading, pagingData, onPaginationChange, onSelectChange, onSort }: EmailCampaignsTableProps) => ( <DataTable columns={columns} data={data} loading={loading} pagingData={pagingData} onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort} noData={!loading && data.length === 0} />);


const EmailCampaignListing = () => {
  const dispatch = useAppDispatch();
  const {
    emailCampaignsData = [], 
    mailTemplatesData = [], 
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [currentWizardStep, setCurrentWizardStep] = useState(1);
  const [editingItem, setEditingItem] = useState<EmailCampaignItem | null>(null);
  const [viewingItem, setViewingItem] = useState<EmailCampaignItem | null>(null);
  const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_at" }, query: ""});
  const [itemToDelete, setItemToDelete] = useState<EmailCampaignItem | null>(null);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<Partial<CampaignFilterFormData>>({});

  const mailTemplateOptions = useMemo(() => Array.isArray(mailTemplatesData) ? mailTemplatesData.map((t: ApiMailTemplate) => ({ value: String(t.id), label: t.name })) : [], [mailTemplatesData]);
  
  const campaignFormMethods = useForm<CampaignCreationFormData>({
    resolver: zodResolver(campaignCreationFormSchema),
    mode: "onChange", // "onChange" can be performance-intensive; consider "onBlur" or "onSubmit" if needed
  });
  const { control, handleSubmit, reset, watch, setValue, trigger, getValues, formState: { errors, isValid: formIsValid } } = campaignFormMethods;
  
  // Assign getValues to the module-level variable for superRefine accessibility
   useEffect(() => {
     getValuesCampaignForm = getValues;
   }, [getValues]);


  const filterFormMethods: UseFormReturn<CampaignFilterFormData> = useForm<CampaignFilterFormData>({
    resolver: zodResolver(campaignFilterFormSchema),
    defaultValues: { status: '', date_range: [null, null] }, // Explicit defaults
  });

  useEffect(() => {
    dispatch(getEmailCampaignsAction({ params: tableData })); 
    dispatch(getMailTemplatesAction()); // Fetch templates once, or as needed
  }, [dispatch, tableData]); 

  const watchedTemplateId = watch("template_id");

  useEffect(() => {
    if (!isCreateDrawerOpen) return;

    const selectedTemplateOption = mailTemplateOptions.find(opt => opt.value === watchedTemplateId);
    let numberOfImagesExpected = 0;

    if (selectedTemplateOption && selectedTemplateOption.label) {
        const templateName = selectedTemplateOption.label;
        const match = templateName.match(/^img\s*(\d+)$/i);
        if (match && match[1]) {
            numberOfImagesExpected = parseInt(match[1], 10);
            numberOfImagesExpected = Math.min(Math.max(0, numberOfImagesExpected), 6);
        }
    }
    
    // Only clear image fields if not editing OR if editing and the template has changed
    if (!editingItem || (editingItem && String(editingItem.template_id) !== watchedTemplateId)) {
        for (let i = 1; i <= 6; i++) {
            const fieldName = `image_${i}` as ImageFieldName;
            if (i > numberOfImagesExpected) {
                if (getValues(fieldName)) { // Check if field has a value before clearing
                    setValue(fieldName, "", { shouldValidate: false, shouldDirty: true });
                }
            }
        }
    }
  }, [watchedTemplateId, mailTemplateOptions, setValue, getValues, isCreateDrawerOpen, editingItem]);


  const nextStep = useCallback(async () => {
    let fieldsToValidate: (keyof CampaignCreationFormData)[] = [];
    if (currentWizardStep === 1) fieldsToValidate = ["template_id", "campaign_name"];
    // Step 2 (content) validation will occur on final submit or if fields are marked explicitly
    else if (currentWizardStep === 3) fieldsToValidate = ["recipient_source_mode", "recipient_emails_input", "recipient_imported_file"];
    
    if (fieldsToValidate.length > 0) {
      // Ensure __editingItem is part of the values for superRefine context during trigger
      setValue('__editingItem', editingItem, { shouldValidate: false, shouldDirty: false });
      const isValidStep = await trigger(fieldsToValidate);
      if (!isValidStep) { toast.push(<Notification title="Validation Error" type="danger">Please correct errors before proceeding.</Notification>); return; }
    }
    setCurrentWizardStep((prev) => Math.min(prev + 1, 4));
  }, [currentWizardStep, trigger, setValue, editingItem]);

  const prevStep = useCallback(() => setCurrentWizardStep((prev) => Math.max(prev - 1, 1)), []);
  
  const openCreateDrawer = useCallback((itemToEdit?: EmailCampaignItem) => {
    setCurrentWizardStep(1);
    setEditingItem(itemToEdit || null); // Set editingItem state

    const initialValues: CampaignCreationFormData = {
        template_id: itemToEdit ? String(itemToEdit.template_id) : (mailTemplateOptions[0]?.value || ""),
        campaign_name: itemToEdit ? (itemToEdit.campaign_name || itemToEdit.mail_template?.name || `Campaign ${itemToEdit.id}`) : "",
        text_block_1: itemToEdit?.header_text || "",
        image_1: itemToEdit?.images?.[0] || "",
        image_2: itemToEdit?.images?.[1] || "",
        image_3: itemToEdit?.images?.[2] || "",
        image_4: itemToEdit?.images?.[3] || "",
        image_5: itemToEdit?.images?.[4] || "",
        image_6: itemToEdit?.images?.[5] || "",
        text_final: itemToEdit?.text_final || "",
        text_block_2: itemToEdit?.text_block_2 || "",
        text_with_whatsapp_link: itemToEdit?.text_with_whatsapp_link || "",
        whatsapp_number_to_link: itemToEdit?.whatsapp_number_to_link || "",
        recipient_source_mode: (itemToEdit?.recipient_source && itemToEdit.recipient_source.length > 0 && !itemToEdit.recipient_source[0]?.startsWith("file:")) ? "input_emails" : "input_emails", // Default, or infer if possible
        recipient_emails_input: (itemToEdit?.recipient_source && itemToEdit.recipient_source.length > 0 && !itemToEdit.recipient_source[0]?.startsWith("file:")) ? itemToEdit.recipient_source.join(', ') : "",
        recipient_imported_file: null, // Always reset file input on open
        status: itemToEdit ? (itemToEdit.status === "" ? "active" : "inactive") : "active",
        sendOption: itemToEdit?.schedule_at ? "schedule" : "now",
        scheduledAt: itemToEdit?.schedule_at ? new Date(itemToEdit.schedule_at) : null,
        __editingItem: itemToEdit || null, // Pass context for superRefine
    };
    reset(initialValues);
    setIsCreateDrawerOpen(true);
  }, [reset, mailTemplateOptions]);

  const closeCreateDrawer = useCallback(() => {
    setIsCreateDrawerOpen(false);
    setEditingItem(null); 
    // Optionally reset form to complete defaults if desired, or leave as is
    // reset({ ...getValues(), __editingItem: null }); // Clears context
  }, [/*reset, getValues*/]); // Dependencies for reset and getValues removed if not resetting fully on close

  const onCampaignFormSubmit = useCallback( async (data: CampaignCreationFormData) => {
      setIsSubmittingCampaign(true);
      
      let recipientEmailsForApi: string[] | null = null;
      let recipientFileForApi: File | null = null; // Placeholder for actual file object if API uses FormData

      if (data.recipient_source_mode === "input_emails" && data.recipient_emails_input) {
          const emails = data.recipient_emails_input.split(',').map(e => e.trim()).filter(e => e);
          if (emails.length > 0) recipientEmailsForApi = emails;
      } else if (data.recipient_source_mode === "import_file" && data.recipient_imported_file) {
          recipientFileForApi = data.recipient_imported_file;
          // If not using FormData, and API expects emails extracted client-side (not ideal):
          // recipientEmailsForApi = ["simulated_email_from_file@example.com"]; 
          // Or send a marker: recipientEmailsForApi = ["marker:use_uploaded_file"];
      }
      // If editing and no new input/file, API decides whether to keep old recipients or clear them.
      // Sending `null` for recipient_source often implies "clear" or "no change if field is omitted".

      const imagesForApi: string[] = [];
      (['image_1', 'image_2', 'image_3', 'image_4', 'image_5', 'image_6'] as ImageFieldName[]).forEach(key => {
          if (data[key]) imagesForApi.push(data[key] as string);
      });

      // This payload is for a JSON API. If using FormData for file uploads, structure will differ.
      const apiPayload: any = { 
        template_id: data.template_id,
        campaign_name: data.campaign_name,
        // recipient_source: recipientEmailsForApi, // Set this based on API design if not using FormData for file
        status: data.status === "active" ? "" : "Inactive",
        header_text: data.text_block_1 || null,
        images: imagesForApi.length > 0 ? imagesForApi : null, 
        text_final: data.text_final || null,
        text_block_2: data.text_block_2 || null,
        text_with_whatsapp_link: data.text_with_whatsapp_link || null,
        whatsapp_number_to_link: data.whatsapp_number_to_link || null,
        ...(data.sendOption === "schedule" && data.scheduledAt && { schedule_at: data.scheduledAt.toISOString() }),
      };

      let finalPayloadToSend = apiPayload;

      if (recipientFileForApi) {
          // If API expects FormData for file uploads:
          const formData = new FormData();
          Object.keys(apiPayload).forEach(key => {
              if (apiPayload[key] !== null && apiPayload[key] !== undefined) {
                  if (Array.isArray(apiPayload[key])) {
                      apiPayload[key].forEach((item: string) => formData.append(`${key}[]`, item));
                  } else {
                      formData.append(key, apiPayload[key] as string);
                  }
              }
          });
          formData.append('recipient_file', recipientFileForApi); // Adjust 'recipient_file' to API's expected field name
          finalPayloadToSend = formData;
      } else if (recipientEmailsForApi) {
          finalPayloadToSend.recipient_source = recipientEmailsForApi;
      } else {
          // No direct emails, no file.
          // If editing, this might mean "keep existing recipients" if `recipient_source` is omitted.
          // Or `null` might mean "clear recipients". Depends on API.
          finalPayloadToSend.recipient_source = null; 
      }
      
      try {
        if (editingItem) {
          await dispatch(editEmailCampaignAction({ id: editingItem.id, ...finalPayloadToSend })).unwrap();
          toast.push(<Notification title="Campaign Updated" type="success" />);
        } else {
          await dispatch(addEmailCampaignAction(finalPayloadToSend)).unwrap();
          toast.push(<Notification title="Campaign Created" type="success" />);
        }
        closeCreateDrawer();
        dispatch(getEmailCampaignsAction({ params: tableData })); // Re-fetch data
      } catch (e: any) {
          console.error("Campaign Submission Error:", e);
          const errorMessage = e?.response?.data?.message || e?.message || "Could not process campaign.";
          toast.push( <Notification title="Operation Failed" type="danger">{errorMessage}</Notification> );
        }
        finally {
          setIsSubmittingCampaign(false);
        }
    }, [dispatch, editingItem, closeCreateDrawer, tableData] // Added tableData
  );

  const openViewDialog = useCallback((item: EmailCampaignItem) => setViewingItem(item), []);
  const closeViewDialog = useCallback(() => setViewingItem(null), []);
  
  const handleDeleteClick = useCallback((item: EmailCampaignItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
  const onConfirmSingleDelete = useCallback(async () => { if (!itemToDelete) return; setIsDeleting(true); setSingleDeleteConfirmOpen(false); try { await dispatch(deleteEmailCampaignAction({ id: itemToDelete.id })).unwrap(); toast.push(<Notification title="Campaign Deleted" type="success">{`Campaign "${itemToDelete.campaign_name || itemToDelete.mail_template?.name || itemToDelete.id}" deleted.`}</Notification>); dispatch(getEmailCampaignsAction({ params: tableData })); } catch (e:any) { toast.push(<Notification title="Delete Failed" type="danger">{(e as Error).message}</Notification>); } finally { setIsDeleting(false); setItemToDelete(null); } }, [dispatch, itemToDelete, tableData]); // Added tableData
  
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }),[handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); },[handleSetTableData]); // Used by DataTable's page size selector
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }),[handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }),[handleSetTableData]);
  const handleSelectPageSizeChange = useCallback((value: number) => { setTableData(prev => ({ ...prev, pageSize: Number(value), pageIndex: 1 })); }, []); // Duplicate of handleSelectChange, can consolidate
  
  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria); // Populate drawer with current active filters
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);

  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  
  const onFilterFormSubmit = useCallback((data: CampaignFilterFormData) => {
      setFilterCriteria(data);
      handleSetTableData({ pageIndex: 1 }); // !! CRITICAL: Reset to first page when filters change
      toast.push(<Notification title="Filters Applied" type="success" duration={2000}>Client-side filtering active.</Notification>);
      closeFilterDrawer();
  }, [closeFilterDrawer, handleSetTableData]); // Added handleSetTableData dependency

  const onClearFilters = useCallback(() => {
      setFilterCriteria({});
      filterFormMethods.reset({ status: '', date_range: [null, null] }); // Reset form to defaults
      handleSetTableData({ pageIndex: 1 }); // !! CRITICAL: Reset to first page
      // toast.push(<Notification title="Filters Cleared" type="info" duration={2000}/>);
      closeFilterDrawer(); // Optional: keep drawer open or close it
  }, [filterFormMethods, handleSetTableData]); // Removed closeFilterDrawer if not closing, added filterFormMethods, handleSetTableData

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: EmailCampaignItem[] = Array.isArray(emailCampaignsData) ? emailCampaignsData.map(item => ({
        ...item,
        campaignNameDisplay: item.campaign_name || item.mail_template?.name || `Campaign ${item.id}`,
        dateTimeDisplay: new Date(item.created_at), 
    })) : [];
    
    let processedData = cloneDeep(sourceData);

    if (tableData.query) { 
        const q = tableData.query.toLowerCase().trim(); 
        processedData = processedData.filter(c => 
            String(c.id).toLowerCase().includes(q) || 
            (c.campaign_name && c.campaign_name.toLowerCase().includes(q)) ||
            (c.mail_template?.name && c.mail_template.name.toLowerCase().includes(q)) || // Guard against undefined mail_template or name
            String(c.status).toLowerCase().includes(q) 
        ); 
    }

    // Apply filters from filterCriteria
    if (filterCriteria.status) { // Checks for non-empty string ("Inactive" or "")
        processedData = processedData.filter(c => c.status === filterCriteria.status);
    }
    if (filterCriteria.date_range && (filterCriteria.date_range[0] || filterCriteria.date_range[1])) {
        const [startDate, endDate] = filterCriteria.date_range;
        processedData = processedData.filter(c => {
            const itemDate = new Date(c.created_at); // Assuming created_at is the filter target
            let passes = true;
            if (startDate && itemDate < new Date(new Date(startDate).setHours(0,0,0,0))) passes = false;
            if (endDate && itemDate > new Date(new Date(endDate).setHours(23,59,59,999))) passes = false;
            return passes;
        });
    }
    
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aVal: any = a[key as keyof EmailCampaignItem];
        let bVal: any = b[key as keyof EmailCampaignItem];

        // Handle specific keys that require different access or transformation
        if (key === 'campaignNameDisplay') { aVal = a.campaignNameDisplay; bVal = b.campaignNameDisplay; }
        else if (key === 'dateTimeDisplay') { aVal = a.dateTimeDisplay?.getTime(); bVal = b.dateTimeDisplay?.getTime(); return order === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0); }
        else if (key === 'campaign_name') { aVal = a.campaign_name || ""; bVal = b.campaign_name || "";}
        else if (key === 'mail_template.name') { aVal = a.mail_template?.name || ""; bVal = b.mail_template?.name || ""; }
        
        const aStr = String(aVal ?? "").toLowerCase(); const bStr = String(bVal ?? "").toLowerCase();
        return order === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }
    
    const currentTotal = processedData.length; 
    const pageIndex = tableData.pageIndex as number; 
    const pageSize = tableData.pageSize as number; 
    const startIndex = (pageIndex - 1) * pageSize;
    return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
  }, [emailCampaignsData, tableData, filterCriteria]);

  const handleExportData = useCallback(() => { exportCampaignsToCsv("email_campaigns_log.csv", allFilteredAndSortedData); }, [allFilteredAndSortedData]);

  const columns: ColumnDef<EmailCampaignItem>[] = useMemo( () => [
      // { header: "ID", accessorKey: "id", size: 80, enableSorting: true },
      { header: "Campaign Name", accessorKey: "campaign_name", size: 220, enableSorting: true, cell: props => props.row.original.campaign_name || <span className="italic text-gray-400">N/A</span> },
      { header: "Template Used", accessorKey: "mail_template.name", size: 200, enableSorting: true, cell: props => props.row.original.mail_template?.name || `ID: ${props.row.original.template_id}` },
      { header: "Date & Time", accessorKey: "dateTimeDisplay", size: 180, enableSorting: true, 
        cell: props => { 
          const d = props.getValue<Date>(); 
          return d ? (
            <span className="text-xs">
              {
                <span>{`${new Date(d.toLocaleDateString()).getDate()} 
                  ${new Date(d.toLocaleDateString()).toLocaleString("en-US", { month: "short" })} 
                  ${new Date(d.toLocaleDateString()).getFullYear()}, 
                  ${new Date(d.toLocaleDateString()).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
                }</span>
              }
            </span>
          ) : '-' 
        } 
      },
      { header: "Status", accessorKey: "status", size: 100, cell: props => { const s = props.getValue<CampaignApiStatus>(); const statusLabel = CAMPAIGN_STATUS_OPTIONS_FILTER.find(opt => opt.value === s)?.label || (s === null ? "Draft" : String(s || "N/A")); return (<Tag className={classNames("capitalize whitespace-nowrap", campaignDisplayStatusColor[String(s)] || campaignDisplayStatusColor.default)}>{statusLabel}</Tag>); }},
      { header: "Actions", id: "actions", size: 120, meta: { HeaderClass: "text-center", cellClass: "text-center" }, cell: (props) => <ActionColumn onViewDetails={() => openViewDialog(props.row.original)} onEdit={() => openCreateDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} /> },
    ], [openViewDialog, openCreateDrawer, handleDeleteClick] // Dependencies are stable callbacks
  );

  const renderWizardStep = () => {
    switch (currentWizardStep) {
      case 1:
        return (
          <Card header={<div className="flex items-center gap-2 font-semibold"><TbTemplate /> Step 1: Template & Name</div>} bodyClass="p-4 md:p-6">
            <FormItem label="Mail Template" invalid={!!errors.template_id} errorMessage={errors.template_id?.message}>
              <Controller name="template_id" control={control} render={({ field }) => (
                <Select placeholder="Select a template..." options={mailTemplateOptions} value={mailTemplateOptions.find(o => o.value === field.value)}
                  onChange={(opt) => field.onChange(opt?.value)} />
              )}/>
            </FormItem>
            <FormItem label="Campaign Name (Internal Tracking)" className="mt-4" invalid={!!errors.campaign_name} errorMessage={errors.campaign_name?.message}>
              <Controller name="campaign_name" control={control} render={({ field }) => (<Input {...field} prefix={<TbClipboardText />} placeholder="e.g., Q4 Holiday Promo" /> )}/>
            </FormItem>
          </Card>
        );
      case 2: 
        const currentTemplateId = watch("template_id");
        const selectedTemplateOption = mailTemplateOptions.find(opt => opt.value === currentTemplateId);
        let numberOfImagesToRender = 0;

        if (selectedTemplateOption && selectedTemplateOption.label) {
            const templateName = selectedTemplateOption.label;
            const match = templateName.match(/^img\s*(\d+)$/i);
            if (match && match[1]) {
                numberOfImagesToRender = parseInt(match[1], 10);
                numberOfImagesToRender = Math.min(Math.max(0, numberOfImagesToRender), 6);
            }
        }
        
        return (
          <Card header={<div className="flex items-center gap-2 font-semibold"><TbForms /> Step 2: Customize Content</div>} bodyClass="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormItem label="Header Text (for {{header_text}})" className="md:col-span-2" invalid={!!errors.text_block_1} errorMessage={errors.text_block_1?.message}>
                <Controller name="text_block_1" control={control} render={({ field }) => (<Input textArea {...field} rows={3} placeholder="Main heading or introductory text..." />)}/>
              </FormItem>
              
              {numberOfImagesToRender > 0 && Array.from({ length: numberOfImagesToRender }).map((_, index) => {
                  const imageNumber = index + 1;
                  const fieldName = `image_${imageNumber}` as ImageFieldName;
                  return (
                      <FormItem 
                          key={fieldName} 
                          label={`Image ${imageNumber} URL (for {{image${imageNumber}}})`} 
                          invalid={!!(errors as FieldErrors<CampaignCreationFormData>)[fieldName]}
                          errorMessage={(errors as FieldErrors<CampaignCreationFormData>)[fieldName]?.message as string | undefined}
                      >
                          <Controller name={fieldName} control={control} render={({ field }) => ( <Input {...field} type="url" prefix={<TbPhoto />} placeholder={`https://example.com/${fieldName}.png`} /> )}/>
                      </FormItem>
                  );
              })}
              
              <FormItem label="Final Text (for {{text}})" className="md:col-span-2" invalid={!!errors.text_final} errorMessage={errors.text_final?.message}>
                <Controller name="text_final" control={control} render={({ field }) => (<Input textArea {...field} rows={3} placeholder="Concluding text or call to action..." />)}/>
              </FormItem>
              <hr className="md:col-span-2 my-2"/>
              <FormItem label="Text Block 2 (Optional)" className="md:col-span-2" invalid={!!errors.text_block_2} errorMessage={errors.text_block_2?.message}>
                <Controller name="text_block_2" control={control} render={({ field }) => (<Input textArea {...field} rows={2} placeholder="Additional text block..." />)}/>
              </FormItem>
              <FormItem label="Text with WhatsApp Link" className="md:col-span-1" invalid={!!errors.text_with_whatsapp_link} errorMessage={errors.text_with_whatsapp_link?.message}>
                <Controller name="text_with_whatsapp_link" control={control} render={({ field }) => (<Input {...field} placeholder="e.g., Chat on WhatsApp!" />)}/>
              </FormItem>
              <FormItem label="WhatsApp Number" className="md:col-span-1" invalid={!!errors.whatsapp_number_to_link} errorMessage={errors.whatsapp_number_to_link?.message}>
                <Controller name="whatsapp_number_to_link" control={control} render={({ field }) => (<Input {...field} type="tel" prefix={<TbPhone />} placeholder="+1234567890" />)}/>
              </FormItem>
            </div>
          </Card>
        );
      case 3: 
        return (
          <Card header={<div className="flex items-center gap-2 font-semibold"><TbUsersGroup /> Step 3: Choose Recipients</div>} bodyClass="p-4 md:p-6">
            <FormItem label="Recipient Source" className="mb-6" invalid={!!errors.recipient_source_mode} errorMessage={errors.recipient_source_mode?.message}>
              <Controller name="recipient_source_mode" control={control}
                render={({ field }) => (
                  <Radio.Group value={field.value} onChange={(val) => { field.onChange(val); if (val === "input_emails") setValue("recipient_imported_file", null, {shouldValidate: true}); if (val === "import_file") setValue("recipient_emails_input", "", {shouldValidate: true}); }}>
                    <Radio value="input_emails">Enter Email Addresses</Radio>
                    <Radio value="import_file">Import from File (CSV/Excel with 'email' column)</Radio>
                  </Radio.Group>
                )}
              />
            </FormItem>
            {watch("recipient_source_mode") === "input_emails" && (
              <FormItem label="Email Addresses (comma-separated)" invalid={!!errors.recipient_emails_input} errorMessage={errors.recipient_emails_input?.message as string}>
                <Controller name="recipient_emails_input" control={control} render={({ field }) => (<Input textArea {...field} rows={4} prefix={<TbMail/>} placeholder="user1@example.com, user2@example.com, ..." /> )}/>
              </FormItem>
            )}
            {watch("recipient_source_mode") === "import_file" && (
              <FormItem label="Upload File" invalid={!!errors.recipient_imported_file} errorMessage={errors.recipient_imported_file?.message as string}>
                <Controller name="recipient_imported_file" control={control}
                  render={({ field: { onChange, value, ref, ...restField } }) => ( // Destructure to avoid passing `value` and `ref` to native input if not needed
                      <Input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" {...restField} onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)} prefix={<TbFileImport />} />
                  )}
                />
                 {/* Informative message for editing context */}
                 {editingItem && !watch("recipient_imported_file") && watch("recipient_source_mode") === "import_file" && (
                    <p className="text-xs text-gray-500 mt-1">
                        To change recipients via file, please upload a new file. If no new file is uploaded, the handling of existing recipients (if any from a previous file import) depends on the backend.
                    </p>
                )}
              </FormItem>
            )}
          </Card>
        );
      case 4: 
        const formData = getValues();
        return (
          <Card header={<div className="flex items-center gap-2 font-semibold"><TbCircleCheck /> Step 4: Review & Schedule/Send</div>} bodyClass="p-4 md:p-6">
             <FormItem label="Set Status for this Campaign" invalid={!!errors.status} errorMessage={errors.status?.message}>
              <Controller name="status" control={control} render={({ field }) => (
                <Select placeholder="Select campaign status" options={CAMPAIGN_STATUS_OPTIONS_FORM} value={CAMPAIGN_STATUS_OPTIONS_FORM.find(o => o.value === field.value)}
                  onChange={(opt) => field.onChange(opt?.value)} prefix={<TbToggleRight/>} />
              )}/>
            </FormItem>
            <div className="space-y-2 my-6 text-sm border-t border-b py-4 dark:border-gray-600">
              <h6 className="font-semibold text-base mb-2">Campaign Summary:</h6>
              <p><strong>Campaign Name:</strong> {formData.campaign_name || <span className="italic text-gray-500">Not Set</span>}</p>
              <p><strong>Template:</strong> {mailTemplateOptions.find(t => t.value === formData.template_id)?.label || <span className="italic text-gray-500">Not Set</span>}</p>
              <p><strong>Recipients:</strong> {formData.recipient_source_mode === "input_emails" ? `${formData.recipient_emails_input?.split(',').map(e=>e.trim()).filter(e=>e).length || 0} emails entered` : formData.recipient_imported_file ? `File: ${formData.recipient_imported_file.name}` : (editingItem && formData.recipient_source_mode === "import_file") ? <span className="italic text-gray-500">Using previously associated file or none (if cleared by backend)</span> : <span className="italic text-gray-500">No file selected</span>}</p>
            </div>
            <FormItem label="Send Options" className="mb-4" invalid={!!errors.sendOption} errorMessage={errors.sendOption?.message}>
              <Controller name="sendOption" control={control}
                render={({ field }) => (
                  <Radio.Group value={field.value} onChange={(val) => { field.onChange(val); if (val === "now") setValue("scheduledAt", null, {shouldValidate: true}); }}>
                    <Radio value="now">Send Now</Radio>
                    <Radio value="schedule">Schedule for Later</Radio>
                  </Radio.Group>
                )}
              />
            </FormItem>
            {watch("sendOption") === "schedule" && (
              <FormItem label="Schedule Date & Time" invalid={!!errors.scheduledAt} errorMessage={errors.scheduledAt?.message as string}>
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
          <ItemTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} />
          <div className="mt-4">
            <EmailCampaignsTable 
                columns={columns} 
                data={pageData} 
                loading={masterLoadingStatus === "loading" || isSubmittingCampaign || isDeleting} 
                pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} 
                onPaginationChange={handlePaginationChange} 
                onSelectChange={handleSelectPageSizeChange} // Corrected, this is for DataTable page size selector
                onSort={handleSort} 
            />
          </div>
        </AdaptiveCard>
      </Container>

      <Drawer
        title={`${editingItem ? "Edit" : "Create"} Email Campaign - Step ${currentWizardStep} of 4: ${ currentWizardStep === 1 ? "Template & Name" : currentWizardStep === 2 ? "Customize Content" : currentWizardStep === 3 ? "Choose Recipients" : "Review & Schedule" }`}
        isOpen={isCreateDrawerOpen} onClose={closeCreateDrawer} onRequestClose={closeCreateDrawer} width={800}
        footer={ <div className="flex justify-between w-full dark:border-gray-700 border-t pt-4 mt-4"> <div> {currentWizardStep > 1 && (<Button onClick={prevStep} disabled={isSubmittingCampaign} icon={<TbPlayerTrackPrev />}>Back</Button>)} </div> <div className="flex gap-2"> {currentWizardStep < 4 && (<Button variant="solid" onClick={nextStep} disabled={isSubmittingCampaign} icon={<TbPlayerTrackNext />}>Next</Button>)} {currentWizardStep === 4 && (<> <Button variant="outline" onClick={() => { closeCreateDrawer(); toast.push(<Notification title="Info">Campaign Saved as Draft (Simulated).</Notification>); }} disabled={isSubmittingCampaign}>Save as Draft</Button> <Button variant="solid" color={watch("sendOption") === "schedule" ? "blue" : "emerald"} form="campaignCreationForm" type="submit" loading={isSubmittingCampaign} disabled={!formIsValid || isSubmittingCampaign} icon={<TbSend />}>{watch("sendOption") === "schedule" ? "Schedule Campaign" : "Send Campaign Now"}</Button> </>)} </div> </div> }
      >
        <Form id="campaignCreationForm" onSubmit={handleSubmit(onCampaignFormSubmit)} className="flex flex-col">
          {renderWizardStep()}
        </Form>
      </Drawer>

      <Drawer
        title="Filter Campaigns"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        width={400}
        footer={ <div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear All</Button> <Button size="sm" variant="solid" form="campaignFilterForm" type="submit">Apply Filters</Button> </div> }
      >
        <Form id="campaignFilterForm" onSubmit={filterFormMethods.handleSubmit(onFilterFormSubmit)} className="flex flex-col gap-y-6 p-1">
            <FormItem label="Status" invalid={!!filterFormMethods.formState.errors.status} errorMessage={filterFormMethods.formState.errors.status?.message}>
                <Controller
                    name="status"
                    control={filterFormMethods.control}
                    render={({ field }) => (
                        <Select
                            placeholder="Select status..."
                            options={CAMPAIGN_STATUS_OPTIONS_FILTER}
                            value={CAMPAIGN_STATUS_OPTIONS_FILTER.find(o => o.value === field.value) || null} // Ensure value is null if not found for Select
                            onChange={(opt) => field.onChange(opt?.value ?? '')} // Send '' if cleared (meaning "any"), or selected value
                            isClearable
                        />
                    )}
                />
            </FormItem>
            <FormItem label="Creation Date Range" invalid={!!filterFormMethods.formState.errors.date_range} errorMessage={filterFormMethods.formState.errors.date_range?.message as string | undefined}>
                <Controller
                    name="date_range"
                    control={filterFormMethods.control}
                    render={({ field }) => (
                        <DatePicker
                            value={field.value as [Date | null, Date | null] ?? [null, null]} // Ensure value is [null,null] if undefined
                            onChange={(dates) => field.onChange(dates ?? [null, null])} // Ensure dates is [null,null] if cleared by DatePicker
                            placeholder={["Start Date", "End Date"]}
                        />
                    )}
                />
            </FormItem>
        </Form>
      </Drawer>

      <Dialog isOpen={!!viewingItem} onClose={closeViewDialog} onRequestClose={closeViewDialog} width={700} bodyOpenClassName="overflow-hidden">
        <h5 className="mb-4">Campaign Details: {viewingItem?.campaign_name || viewingItem?.mail_template?.name || `Campaign ID: ${viewingItem?.id}`}</h5>
        {viewingItem && ( <div className="space-y-3 text-sm max-h-[70vh] overflow-y-auto pr-2">
            <p><strong>ID:</strong> {viewingItem.id}</p>
            <p><strong>Campaign Name:</strong> {viewingItem.campaign_name || <span className="italic">Not set</span>}</p>
            <p><strong>Template Used:</strong> {viewingItem.mail_template?.name} (ID: {viewingItem.template_id})</p>
            <p><strong>Status:</strong> {CAMPAIGN_STATUS_OPTIONS_FILTER.find(opt => opt.value === viewingItem.status)?.label || (viewingItem.status === null ? "Draft" : String(viewingItem.status || "N/A"))}</p>
            {viewingItem.schedule_at && <p><strong>Scheduled At:</strong> {new Date(viewingItem.schedule_at).toLocaleString()}</p>}
            <p><strong>Created At:</strong> {new Date(viewingItem.created_at).toLocaleString()}</p>
            <p><strong>Updated At:</strong> {new Date(viewingItem.updated_at).toLocaleString()}</p>
            
            {viewingItem.header_text && <p><strong>Header Text:</strong> {viewingItem.header_text}</p>}
            {viewingItem.images && viewingItem.images.length > 0 && (
                <div>
                    <strong>Images:</strong>
                    {viewingItem.images.map((imgUrl, idx) => (
                        <p key={idx} className="ml-2">Image {idx + 1} URL: <span className="break-all">{imgUrl}</span></p>
                    ))}
                </div>
            )}
            {viewingItem.text_final && <p><strong>Final Text:</strong> {viewingItem.text_final}</p>}
            {viewingItem.text_block_2 && <p><strong>Text Block 2:</strong> {viewingItem.text_block_2}</p>}
            {viewingItem.text_with_whatsapp_link && <p><strong>WhatsApp Text:</strong> {viewingItem.text_with_whatsapp_link}</p>}
            {viewingItem.whatsapp_number_to_link && <p><strong>WhatsApp Number:</strong> {viewingItem.whatsapp_number_to_link}</p>}
            {viewingItem.recipient_source && viewingItem.recipient_source.length > 0 && (
              <div><strong>Recipient Source Emails/Marker:</strong> <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 whitespace-pre-wrap break-all">{viewingItem.recipient_source.join(', ')}</pre></div>
            )}
        </div>)}
        <div className="text-right mt-6"><Button variant="solid" onClick={closeViewDialog}>Close</Button></div>
      </Dialog>
      
      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Email Campaign" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} >
        <p>Are you sure you want to delete the campaign "<strong>{itemToDelete?.campaign_name || itemToDelete?.mail_template?.name || itemToDelete?.id}</strong>"?</p>
      </ConfirmDialog>
    </>
  );
};

export default EmailCampaignListing;