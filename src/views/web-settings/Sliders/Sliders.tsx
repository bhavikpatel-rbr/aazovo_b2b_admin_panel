import React, { useState, useMemo, useCallback, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";
import DebouceInput from "@/components/shared/DebouceInput";
import { Drawer, Form, FormItem, Input, Select as UiSelect, Tag, Dialog, Card, Dropdown, Checkbox } from "@/components/ui";
import Avatar from "@/components/ui/Avatar";

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbPhoto,
  TbReload,
  TbUser,
  TbMessageStar,
  TbMessageShare,
  TbMessageCheck,
  TbMessage2X,
  TbColumns,
  TbX,
  TbUserCircle,
} from "react-icons/tb";

// Types
import type { OnSortParam, ColumnDef, Row } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// --- Redux Imports ---
import { useAppDispatch } from "@/reduxtool/store";
import {
  getSlidersAction,
  addSliderAction,
  editSliderAction,
  deleteSliderAction,
  deleteAllSlidersAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

// --- Utility Functions ---
function formatCustomDateTime(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return `${date.getDate()} ${date.toLocaleString("en-US", { month: "short" })} ${date.getFullYear()}, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
    } catch (e) {
        return 'Invalid Date';
    }
}

// --- Type Definitions ---
type ApiSliderItem = {
  id: number | string;
  title: string;
  subtitle?: string | null;
  button_text?: string | null;
  image: string | null;
  image_full_path: string | null;
  display_page: string;
  link?: string | null;
  source: "web" | "mobile" | "both";
  status: "Active" | "Inactive";
  domain_ids?: string | null;
  slider_color?: string | null;
  index_position?: number | null;
  created_at: string;
  updated_at: string;
  updated_by_user?: { name: string; roles: { display_name: string }[]; profile_pic_path: string | null; } | null;
};

export type SliderItem = {
  id: number | string;
  title: string;
  subtitle: string | null;
  buttonText: string | null;
  image: string | null;
  imageFullPath: string | null;
  displayPage: string;
  link: string | null;
  source: "web" | "mobile" | "both";
  status: "Active" | "Inactive";
  sliderColor: string | null;
  indexPosition: number | null;
  created_at: string;
  updated_at: string;
  updated_by_user?: { name: string; roles: { display_name: string }[]; profile_pic_path: string | null; } | null;
};

// --- Zod Schemas & Constants ---
const displayPageOptionsConst = [ { value: "Home Page", label: "Home Page" }, { value: "Electronics Page", label: "Electronics Page" }, { value: "Engineering Page", label: "Engineering Page" }, { value: "Plastic Page", label: "Plastic Page" }, { value: "Gallery Page", label: "Gallery Page" } ];
const displayPageValues = displayPageOptionsConst.map((opt) => opt.value) as [ string, ...string[] ];
const sourceOptionsConst = [ { value: "web", label: "Web Only" }, { value: "mobile", label: "Mobile Only" }, { value: "both", label: "Web & Mobile (Both)" }, ];

const sliderFormSchema = z.object({
  title: z.string().min(1, "Title is required.").max(100, "Title cannot exceed 100 chars."),
  subtitle: z.string().max(250, "Subtitle too long").optional().nullable(),
  button_text: z.string().max(50, "Button text too long").optional().nullable(),
  image: z.union([z.instanceof(File), z.null()]).optional().nullable(),
  display_page: z.enum(displayPageValues, { errorMap: () => ({ message: "Please select a display page." }), }),
  link: z.string().url("Invalid URL. Must include http/https.").optional().nullable().or(z.literal("")),
  status: z.enum(["Active", "Inactive"], { errorMap: () => ({ message: "Please select a status." }), }),
  slider_color: z.string().regex(/^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$|^[a-zA-Z]+$/, "Invalid color (hex/name)").optional().nullable().or(z.literal("")),
  index_position: z.coerce.number().int("Must be an integer").min(0, "Cannot be negative").max(99999, "Index Position too large.").nullable().optional(),
});
type SliderFormData = z.infer<typeof sliderFormSchema>;

const filterFormSchema = z.object({
  filterStatuses: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterDisplayPages: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  date: z.tuple([z.date(), z.date()]).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const exportReasonSchema = z.object({ reason: z.string().min(10, "Reason for export is required minimum 10 characters.").max(255, "Reason cannot exceed 255 characters."), });
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

const apiStatusOptions: { value: "Active" | "Inactive"; label: string }[] = [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }, ];
const statusColor: Record<SliderItem["status"], string> = { Active: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-emerald-300 dark:border-emerald-500 border", Inactive: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-red-300 dark:border-red-500 border", };

// --- Utility Functions ---
function exportToCsvSlider(filename: string, rows: SliderItem[]) {
  if (!rows || !rows.length) return false;
  const CSV_HEADERS = [ "ID", "Title", "Subtitle", "Button Text", "Image URL", "Display Page", "Link", "Source", "Status", "Index Position", "Slider Color", "Created At", "Updated By", "Updated Role", "Updated At", ];
  type SliderCsvItem = Omit<SliderItem, "image" | "created_at" | "updated_at"> & { imageUrl: string | null; created_at_f: string; updated_at_f: string; updatedByName?: string; updatedByRole?: string };
  const transformedRows: SliderCsvItem[] = rows.map((item) => ({ ...item, imageUrl: item.imageFullPath, updatedByName: item.updated_by_user?.name || "N/A", updatedByRole: item.updated_by_user?.roles?.[0]?.display_name || "N/A", created_at_f: new Date(item.created_at).toLocaleString(), updated_at_f: new Date(item.updated_at).toLocaleString(), }));
  const csvKeys: (keyof SliderCsvItem)[] = [ "id", "title", "subtitle", "buttonText", "imageUrl", "displayPage", "link", "source", "status", "indexPosition", "sliderColor", "created_at_f", "updatedByName", "updatedByRole", "updated_at_f", ];
  const separator = ",";
  const csvContent = CSV_HEADERS.join(separator) + "\n" + transformedRows.map((row) => csvKeys.map((k) => { let cell = (row as any)[k] === null || (row as any)[k] === undefined ? "" : String((row as any)[k]).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(separator) ).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
  return false;
}
function classNames(...classes: (string | boolean | undefined)[]) { return classes.filter(Boolean).join(" "); }

// --- Child Components ---
const ActiveFiltersDisplay = ({
  filterData,
  onRemoveFilter,
  onClearAll,
}: {
  filterData: Partial<FilterFormData>;
  onRemoveFilter: (key: keyof FilterFormData, value?: string) => void;
  onClearAll: () => void;
}) => {
    const standardFilters = Object.entries(filterData)
        .filter(([key]) => key !== 'date')
        .flatMap(([key, values]) =>
            Array.isArray(values) ? values.map((v) => ({ key: key as keyof FilterFormData, ...v })) : []
        );
    const hasDateFilter = !!filterData.date;
    const hasActiveFilters = standardFilters.length > 0 || hasDateFilter;

    if (!hasActiveFilters) {
        return null;
    }
    const keyToLabelMap = { filterStatuses: 'Status', filterDisplayPages: 'Display Page' };

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
            {standardFilters.map((filter) => (
                <Tag
                    key={`${filter.key}-${filter.value}`}
                    prefix
                    className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
                >
                    {(keyToLabelMap as any)[filter.key]}: {filter.label}
                    <TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter(filter.key, filter.value)} />
                </Tag>
            ))}
            {hasDateFilter && (
                 <Tag
                    prefix
                    className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
                >
                    Date: Today
                    <TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('date')} />
                </Tag>
            )}
            <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
        </div>
    );
};

const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void; }) => ( <div className="flex items-center justify-center"> <Tooltip title="Edit"><div className="text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400" role="button" tabIndex={0} onClick={onEdit} onKeyDown={(e) => e.key === "Enter" && onEdit()}> <TbPencil /> </div></Tooltip> <Tooltip title="Delete"><div className="text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400" role="button" tabIndex={0} onClick={onDelete} onKeyDown={(e) => e.key === "Enter" && onDelete()}> <TbTrash /> </div></Tooltip> </div> );
const SlidersSearch = React.forwardRef<HTMLInputElement, { onInputChange: (value: string) => void }>(({ onInputChange }, ref) => <DebouceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />); SlidersSearch.displayName = 'SlidersSearch';
const SlidersTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters, allColumns, visibleColumnKeys, setVisibleColumnKeys, activeFilterCount }: { onSearchChange: (q: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: () => void; allColumns: ColumnDef<SliderItem>[]; visibleColumnKeys: string[]; setVisibleColumnKeys: (keys: string[]) => void; activeFilterCount: number; }) => { const toggleColumn = (checked: boolean, columnKey: string) => { if (checked) { setVisibleColumnKeys([...visibleColumnKeys, columnKey]); } else { setVisibleColumnKeys(visibleColumnKeys.filter((key) => key !== columnKey)); } }; const isColumnVisible = (columnKey: string) => visibleColumnKeys.includes(columnKey); return ( <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full"> <div className="flex-grow"> <SlidersSearch onInputChange={onSearchChange} /> </div> <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto"> <Dropdown renderTitle={<Button title="Filter Columns" icon={<TbColumns />} />} placement="bottom-end"> <div className="flex flex-col p-2"> <div className="font-semibold mb-1 border-b pb-1">Toggle Columns</div> {allColumns.filter((c) => (c.accessorKey || c.id) && c.header).map((col) => { const key = (col.accessorKey || col.id) as string; return ( <div key={key} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"> <Checkbox name={key} checked={isColumnVisible(key)} onChange={(checked) => toggleColumn(checked, key)} /> {col.header} </div> ); })} </div> </Dropdown> <Button title="Clear Filters & Reload" icon={<TbReload />} onClick={onClearFilters} /> <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto"> Filter {activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>} </Button> <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto"> Export </Button> </div> </div> ); };
const SlidersSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: { selectedItems: SliderItem[]; onDeleteSelected: () => void; isDeleting: boolean; }) => { const [deleteOpen, setDeleteOpen] = useState(false); if (selectedItems.length === 0) return null; return ( <> <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"> <div className="flex items-center justify-between w-full px-4 sm:px-8"> <span className="flex items-center gap-2"> <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span> <span className="font-semibold flex items-center gap-1 text-sm sm:text-base"> <span className="heading-text">{selectedItems.length}</span> <span>Slider{selectedItems.length > 1 ? "s" : ""} selected</span> </span> </span> <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteOpen(true)} loading={isDeleting}> Delete Selected </Button> </div> </StickyFooter> <ConfirmDialog isOpen={deleteOpen} type="danger" title={`Delete ${selectedItems.length} Slider${selectedItems.length > 1 ? "s" : ""}`} onClose={() => setDeleteOpen(false)} onRequestClose={() => setDeleteOpen(false)} onCancel={() => setDeleteOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteOpen(false); }} loading={isDeleting}> <p>Are you sure you want to delete the selected slider{selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.</p> </ConfirmDialog> </> ); };

// --- Main Sliders Component ---
const Sliders = () => {
  const dispatch = useAppDispatch();
  const { slidersData: rawSlidersData = [], status: masterLoadingStatus = "idle" } = useSelector(masterSelector);

  // --- UI & Local State ---
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<SliderItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [sliderToDelete, setSliderToDelete] = useState<SliderItem | null>(null);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);
  const [addFormPreviewUrl, setAddFormPreviewUrl] = useState<string | null>(null);
  const [editFormPreviewUrl, setEditFormPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);

  // --- Data & Table State ---
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "asc", key: "indexPosition" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<SliderItem[]>([]);
  const [activeFilters, setActiveFilters] = useState<Partial<FilterFormData>>({});
  
  // --- Initial Data Fetch ---
  useEffect(() => { dispatch(getSlidersAction()); }, [dispatch]);
  
  // --- Form Hooks ---
  const defaultSliderFormValues: SliderFormData = { title: "", subtitle: null, button_text: null, image: null, display_page: "Home Page", status: "Active", slider_color: "#FFFFFF", index_position: null, };
  const addFormMethods = useForm<SliderFormData>({ resolver: zodResolver(sliderFormSchema), defaultValues: defaultSliderFormValues, mode: "onChange", });
  const editFormMethods = useForm<SliderFormData>({ resolver: zodResolver(sliderFormSchema), defaultValues: defaultSliderFormValues, mode: "onChange", });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: activeFilters, });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange", });

  // --- Data Transformation & Memoization ---
  const mappedSliders: SliderItem[] = useMemo(() => {
    if (!Array.isArray(rawSlidersData)) return [];
    return rawSlidersData.map((apiItem: ApiSliderItem): SliderItem => ({ id: apiItem.id, title: apiItem.title, subtitle: apiItem.subtitle || null, buttonText: apiItem.button_text || null, image: apiItem.image || null, imageFullPath: apiItem.image_full_path, displayPage: apiItem.display_page, link: apiItem.link || null, source: apiItem.source, status: apiItem.status, sliderColor: apiItem.slider_color || null, indexPosition: apiItem.index_position === undefined || apiItem.index_position === null ? null : Number(apiItem.index_position), created_at: apiItem.created_at, updated_at: apiItem.updated_at, updated_by_user: apiItem.updated_by_user, }));
  }, [rawSlidersData]);

  const { pageData, total, allFilteredAndSortedData, counts } = useMemo(() => {
    let processedData: SliderItem[] = cloneDeep(mappedSliders);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const initialCounts = {
        total: mappedSliders.length,
        today: mappedSliders.filter(s => {
            const createdAtDate = new Date(s.created_at);
            return createdAtDate >= todayStart && createdAtDate <= todayEnd;
        }).length,
        active: mappedSliders.filter(s => s.status === 'Active').length,
        inactive: mappedSliders.filter(s => s.status === 'Inactive').length,
    };
    
    const filters = activeFilters;
    if (filters.filterStatuses?.length) processedData = processedData.filter((i) => filters.filterStatuses!.some((f) => f.value === i.status));
    if (filters.filterDisplayPages?.length) processedData = processedData.filter((i) => filters.filterDisplayPages!.some((f) => f.value === i.displayPage));
    if (filters.date) {
        const [startDate, endDate] = filters.date;
        processedData = processedData.filter(item => {
            if (!item.created_at) return false;
            const itemDate = new Date(item.created_at);
            return itemDate >= startDate && itemDate <= endDate;
        });
    }
    
    if (tableData.query) { const q = tableData.query.toLowerCase(); processedData = processedData.filter((i) => i.title?.toLowerCase().includes(q) || String(i.id).toLowerCase().includes(q) || i.displayPage?.toLowerCase().includes(q) || i.source?.toLowerCase().includes(q) || (i.updated_by_user?.name?.toLowerCase() ?? "").includes(q) || String(i.indexPosition ?? "").includes(q)); }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) { processedData.sort((a, b) => { let aVal: any, bVal: any; if (key === 'created_at' || key === 'updated_at') { aVal = a[key] ? new Date(a[key]).getTime() : 0; bVal = b[key] ? new Date(b[key]).getTime() : 0; } else if (key === "indexPosition") { aVal = a.indexPosition === null ? Infinity : a.indexPosition; bVal = b.indexPosition === null ? Infinity : b.indexPosition; } else { aVal = (a as any)[key] ?? ""; bVal = (b as any)[key] ?? ""; } if (typeof aVal === 'number' && typeof bVal === 'number') return order === 'asc' ? aVal - bVal : bVal - aVal; return order === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal)); }); }
    return { pageData: processedData.slice((tableData.pageIndex - 1) * tableData.pageSize, tableData.pageIndex * tableData.pageSize), total: processedData.length, allFilteredAndSortedData: processedData, counts: initialCounts };
  }, [mappedSliders, tableData, activeFilters]);
  
  const activeFilterCount = useMemo(() => Object.values(activeFilters).filter(v => Array.isArray(v) ? v.length > 0 : !!v).length, [activeFilters]);
  const tableLoading = masterLoadingStatus === "loading" || isSubmitting || isDeleting;
  const dynamicOptions = useMemo(() => ({
    displayPages: Array.from(new Set(mappedSliders.map(s => s.displayPage))).map(p => ({ value: p, label: displayPageOptionsConst.find(opt => opt.value === p)?.label || p })),
  }), [mappedSliders]);

  // --- Handlers ---
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })); setSelectedItems([]); }, []);
  const onClearFiltersAndReload = useCallback(() => {
    setActiveFilters({});
    handleSetTableData({ pageIndex: 1, query: "" });
    filterFormMethods.reset({});
    setIsFilterDrawerOpen(false)
  },[handleSetTableData, filterFormMethods]);

  const handleCardClick = useCallback((filterType: 'status' | 'date' | 'all', value?: string) => {
    handleSetTableData({ pageIndex: 1, query: '' });
    if (filterType === 'all') {
        setActiveFilters({});
    } else if (filterType === 'status') {
        const statusOption = apiStatusOptions.find(opt => opt.value === value);
        setActiveFilters(statusOption ? { filterStatuses: [statusOption] } : {});
    } else if (filterType === 'date' && value === 'today') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        setActiveFilters({ date: [todayStart, todayEnd] });
    }
  }, [handleSetTableData]);
const handleRemoveFilter = useCallback((key: keyof FilterFormData, valueToRemove?: string) => {
    setActiveFilters(prev => {
        const newFilters = { ...prev };
        if (key === 'date') {
            delete newFilters.date;
            return newFilters;
        }
        const currentValues = (prev[key] || []) as { value: string }[];
        if (valueToRemove) {
            const newValues = currentValues.filter(item => item.value !== valueToRemove);
            if (newValues.length > 0) {
                (newFilters as any)[key] = newValues;
            } else {
                delete (newFilters as any)[key];
            }
        }
        return newFilters;
    });
    handleSetTableData({ pageIndex: 1 });
}, [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: SliderItem) => setSelectedItems((prev) => checked ? [...prev, row] : prev.filter((item) => item.id !== row.id)), []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<SliderItem>[]) => { const originals = currentRows.map((r) => r.original); if (checked) { setSelectedItems((prev) => { const prevIds = new Set(prev.map((i) => i.id)); return [...prev, ...originals.filter((r) => !prevIds.has(r.id))]; }); } else { const currentIds = new Set(originals.map((r) => r.id)); setSelectedItems((prev) => prev.filter((item) => !currentIds.has(item.id))); } }, []);
  const openAddDrawer = () => { addFormMethods.reset(defaultSliderFormValues); setAddFormPreviewUrl(null); setIsAddDrawerOpen(true); };
  const closeAddDrawer = () => { setIsAddDrawerOpen(false); if (addFormPreviewUrl) {URL.revokeObjectURL(addFormPreviewUrl); setAddFormPreviewUrl(null);} };
  const onAddSliderSubmit = async (data: SliderFormData) => { setIsSubmitting(true); const formData = new FormData(); (Object.keys(data) as Array<keyof SliderFormData>).forEach((key) => { const value = data[key]; if (key === "image" && value instanceof File) formData.append(key, value); else if (value !== null && value !== undefined) formData.append(key, String(value)); }); formData.append('source', 'web'); formData.append('domain_ids', '2'); try { await dispatch(addSliderAction(formData)).unwrap(); toast.push(<Notification title="Slider Added" type="success">Slider "{data.title}" added.</Notification>); closeAddDrawer(); dispatch(getSlidersAction()); } catch (e: any) { toast.push(<Notification title="Failed to Add" type="danger">{e.message || "Could not add slider."}</Notification>); } finally { setIsSubmitting(false); } };
  const openEditDrawer = (slider: SliderItem) => { setEditingSlider(slider); editFormMethods.reset({ title: slider.title, subtitle: slider.subtitle, button_text: slider.buttonText, image: null, display_page: slider.displayPage, link: slider.link, status: slider.status, slider_color: slider.sliderColor, index_position: slider.indexPosition === null ? undefined : slider.indexPosition, }); setEditFormPreviewUrl(null); setIsEditDrawerOpen(true); };
  const closeEditDrawer = () => { setIsEditDrawerOpen(false); setEditingSlider(null); if (editFormPreviewUrl) {URL.revokeObjectURL(editFormPreviewUrl); setEditFormPreviewUrl(null);} };
  const onEditSliderSubmit = async (data: SliderFormData) => { if (!editingSlider?.id) return; setIsSubmitting(true); const formData = new FormData(); formData.append("_method", "PUT"); (Object.keys(data) as Array<keyof SliderFormData>).forEach((key) => { const value = data[key]; if (key === "image" && value instanceof File) formData.append(key, value); else if (value === null) formData.append(key, ""); else if (value !== undefined) formData.append(key, String(value)); }); formData.append('source', 'web'); formData.append('domain_ids', '2'); try { await dispatch(editSliderAction({ id: editingSlider.id, formData })).unwrap(); toast.push(<Notification title="Slider Updated" type="success">Slider "{data.title}" updated.</Notification>); closeEditDrawer(); dispatch(getSlidersAction()); } catch (e: any) { toast.push(<Notification title="Failed to Update" type="danger">{e.message || "Could not update slider."}</Notification>); } finally { setIsSubmitting(false); } };
  const handleDeleteClick = (slider: SliderItem) => { setSliderToDelete(slider); setSingleDeleteConfirmOpen(true); };
  const onConfirmSingleDelete = async () => { if (!sliderToDelete?.id) return; setIsDeleting(true); try { await dispatch(deleteSliderAction(sliderToDelete.id)).unwrap(); toast.push(<Notification title="Slider Deleted" type="success">Slider "{sliderToDelete.title}" deleted.</Notification>); setSelectedItems((prev) => prev.filter((item) => item.id !== sliderToDelete!.id)); dispatch(getSlidersAction()); } catch (e: any) { toast.push(<Notification title="Deletion Failed" type="danger">{e.message || "Could not delete slider."}</Notification>); } finally { setIsDeleting(false); setSingleDeleteConfirmOpen(false); setSliderToDelete(null); } };
  const handleDeleteSelected = async () => { if (selectedItems.length === 0) return; setIsDeleting(true); const ids = selectedItems.map((item) => item.id).join(","); try { await dispatch(deleteAllSlidersAction({ ids })).unwrap(); toast.push(<Notification title="Sliders Deleted" type="success">{selectedItems.length} slider(s) deleted.</Notification>); setSelectedItems([]); dispatch(getSlidersAction()); } catch (e: any) { toast.push(<Notification title="Deletion Failed" type="danger">{e.message || "Failed to delete selected sliders."}</Notification>); } finally { setIsDeleting(false); } };
  const handleOpenExportReasonModal = () => { if (!allFilteredAndSortedData?.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; } exportReasonFormMethods.reset({ reason: "" }); setIsExportReasonModalOpen(true); };
  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => { setIsSubmittingExportReason(true); const fileName = `sliders_export_${new Date().toISOString().split("T")[0]}.csv`; try { await dispatch(submitExportReasonAction({ reason: data.reason, module: "Sliders", file_name: fileName })).unwrap(); toast.push(<Notification title="Export Reason Submitted" type="success" />); exportToCsvSlider(fileName, allFilteredAndSortedData); setIsExportReasonModalOpen(false); } catch (e: any) { toast.push(<Notification title="Operation Failed" type="danger">{e.message || "Could not complete export."}</Notification>); } finally { setIsSubmittingExportReason(false); } };
  const openImageViewer = useCallback((url: string | null) => { if (url) { setImageToView(url); setImageViewerOpen(true); } }, []);
  
  // --- Column Definitions ---
  const baseColumns: ColumnDef<SliderItem>[] = useMemo(() => [
    { header: "Image", accessorKey: "imageFullPath", enableSorting: false, size: 60, cell: (props) => { const { imageFullPath, title } = props.row.original; return (<Avatar size={40} shape="circle" src={imageFullPath || undefined} icon={<TbPhoto />} className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => imageFullPath && openImageViewer(imageFullPath)}>{!imageFullPath && title ? title.charAt(0).toUpperCase() : ""}</Avatar>); }, },
    { header: "Index", accessorKey: "indexPosition", enableSorting: true, size: 80, cell: (props) => props.row.original.indexPosition ?? "N/A", },
    { header: "Title", accessorKey: "title", enableSorting: true, size: 220 },
    { header: "Display Page", accessorKey: "displayPage", enableSorting: true, size: 180, cell: (props) => displayPageOptionsConst.find((p) => p.value === props.row.original.displayPage)?.label || props.row.original.displayPage, },
    // { header: "Source", accessorKey: "source", enableSorting: true, size: 140, cell: (props) => sourceOptionsConst.find((s) => s.value === props.row.original.source)?.label || props.row.original.source, },
    { header: "Updated Info", accessorKey: "updated_at", enableSorting: true, size: 200, cell: (props) => { const { updated_at, updated_by_user } = props.row.original; return ( <div className="flex items-center gap-2"> <Avatar src={updated_by_user?.profile_pic_path || undefined} shape="circle" size="sm" icon={<TbUserCircle />} className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => openImageViewer(updated_by_user?.profile_pic_path || null)} /> <div> <span>{updated_by_user?.name || 'N/A'}</span> <div className="text-xs"><b>{updated_by_user?.roles?.[0]?.display_name || ''}</b></div> <div className="text-xs text-gray-500">{formatCustomDateTime(updated_at)}</div> </div> </div> ); }, },
    { header: "Status", accessorKey: "status", enableSorting: true, size: 80, cell: (props) => { const status = props.row.original.status; return (<Tag className={classNames("capitalize font-semibold", statusColor[status] || statusColor.Inactive)}>{status}</Tag>); }, },
    { header: "Actions", id: "action", size: 80, meta: { cellClass: "text-center" }, cell: (props) => (<ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} />), },
  ], [openImageViewer]);

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => baseColumns.map(c => (c.accessorKey || c.id) as string));
  const visibleColumns = useMemo(() => baseColumns.filter(c => visibleColumnKeys.includes((c.accessorKey || c.id) as string)), [baseColumns, visibleColumnKeys]);

  // --- Reusable Form Fields Renderer ---
  const renderFormFields = ( formMethods: any, isEditMode: boolean, currentSlider?: SliderItem | null) => (
    <>
      <FormItem label="Title" invalid={!!formMethods.formState.errors.title} errorMessage={formMethods.formState.errors.title?.message} isRequired>
        <Controller name="title" control={formMethods.control} render={({ field }) => (<Input {...field} placeholder="Enter Slider Title" />)} />
      </FormItem>
      <FormItem label="Subtitle" invalid={!!formMethods.formState.errors.subtitle} errorMessage={formMethods.formState.errors.subtitle?.message}>
        <Controller name="subtitle" control={formMethods.control} render={({ field }) => (<Input {...field} value={field.value ?? ""} placeholder="Enter Subtitle" />)} />
      </FormItem>
      <div className="grid grid-cols-2 gap-4">
          <FormItem label="Button Text" invalid={!!formMethods.formState.errors.button_text} errorMessage={formMethods.formState.errors.button_text?.message}>
              <Controller name="button_text" control={formMethods.control} render={({ field }) => (<Input {...field} value={field.value ?? ""} placeholder="e.g., Shop Now" />)} />
          </FormItem>
          <FormItem label="Index Position" invalid={!!formMethods.formState.errors.index_position} errorMessage={formMethods.formState.errors.index_position?.message}>
              <Controller name="index_position" control={formMethods.control} render={({ field }) => (<Input {...field} type="number" placeholder="e.g., 1" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value, 10))} />)} />
          </FormItem>
      </div>
      {isEditMode && currentSlider?.imageFullPath && !editFormPreviewUrl && ( <FormItem label="Current Image"> <Avatar className="w-full h-auto border p-1 rounded-md" src={currentSlider.imageFullPath} shape="square" icon={<TbPhoto />} /> </FormItem> )}
      <FormItem label={isEditMode ? "New Image" : "Image"} invalid={!!formMethods.formState.errors.image} errorMessage={formMethods.formState.errors.image?.message as string} isRequired={!isEditMode}>
          <Controller name="image" control={formMethods.control} render={({ field: { onChange, onBlur, name, ref } }) => ( <Input type="file" name={name} ref={ref} onBlur={onBlur} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0] || null; onChange(file); const previewUrlSetter = isEditMode ? setEditFormPreviewUrl : setAddFormPreviewUrl; const currentPreviewUrl = isEditMode ? editFormPreviewUrl : addFormPreviewUrl; if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl); previewUrlSetter(file ? URL.createObjectURL(file) : null); }} accept="image/*" /> )} />
      </FormItem>
      {(isEditMode ? editFormPreviewUrl : addFormPreviewUrl) && (<div className="mt-2"><Avatar src={isEditMode ? editFormPreviewUrl! : addFormPreviewUrl!} className="w-full h-auto border p-1 rounded-md" shape="square" /><p className="text-xs text-gray-500 mt-1">New image preview.</p></div>)}
      <div className="grid grid-cols-2 gap-4">
          <FormItem label="Display Page" invalid={!!formMethods.formState.errors.display_page} errorMessage={formMethods.formState.errors.display_page?.message} isRequired><Controller name="display_page" control={formMethods.control} render={({ field }) => (<UiSelect options={displayPageOptionsConst} value={displayPageOptionsConst.find((o) => o.value === field.value)} onChange={(o) => field.onChange(o?.value)} placeholder="Select page" />)} /></FormItem>
          <FormItem label="Link" invalid={!!formMethods.formState.errors.link} errorMessage={formMethods.formState.errors.link?.message}><Controller name="link" control={formMethods.control} render={({ field }) => (<Input {...field} value={field.value ?? ""} type="url" placeholder="https://example.com" />)} /></FormItem>
          <FormItem label="Status" invalid={!!formMethods.formState.errors.status} errorMessage={formMethods.formState.errors.status?.message} isRequired><Controller name="status" control={formMethods.control} render={({ field }) => (<UiSelect options={apiStatusOptions} value={apiStatusOptions.find((o) => o.value === field.value)} onChange={(o) => field.onChange(o?.value)} placeholder="Select status" />)} /></FormItem>
          <FormItem label="Slider Color" invalid={!!formMethods.formState.errors.slider_color} errorMessage={formMethods.formState.errors.slider_color?.message}>
            <div className="flex items-center gap-2"> <Controller name="slider_color" control={formMethods.control} render={({ field }) => ( <Input {...field} value={field.value ?? "#FFFFFF"} type="color" className="w-12 h-10 p-1" /> )}/> <Controller name="slider_color" control={formMethods.control} render={({ field }) => ( <Input {...field} value={field.value ?? ""} type="text" placeholder="#RRGGBB" className="flex-grow" /> )}/> </div>
          </FormItem>
      </div>
      {isEditMode && currentSlider && (
        <div className=" grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
            <div>
              <b className="mt-3 mb-3 font-semibold text-primary">
                Latest Update:
              </b>
              <br />
              <p className="text-sm font-semibold">
                {currentSlider.updated_by_user?.name || "N/A"}
              </p>
              <p>
                {currentSlider.updated_by_user?.roles[0]?.display_name ||
                  "N/A"}
              </p>
            </div>
            <div className="text-right">
              <br />
              <span className="font-semibold">Created At:</span>{" "}
              <span>
                {currentSlider.created_at
                  ? `${new Date(
                      currentSlider.created_at
                    ).getDate()} ${new Date(
                      currentSlider.created_at
                    ).toLocaleString("en-US", {
                      month: "short",
                    })} ${new Date(
                      currentSlider.created_at
                    ).getFullYear()}, ${new Date(
                      currentSlider.created_at
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}`
                  : "N/A"}
              </span>
              <br />
              <span className="font-semibold">Updated At:</span>{" "}
              <span>
                {}
                {currentSlider.updated_at
                  ? `${new Date(
                      currentSlider.updated_at
                    ).getDate()} ${new Date(
                      currentSlider.updated_at
                    ).toLocaleString("en-US", {
                      month: "short",
                    })} ${new Date(
                      currentSlider.updated_at
                    ).getFullYear()}, ${new Date(
                      currentSlider.updated_at
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}`
                  : "N/A"}
              </span>
            </div>
          </div>
      )}
    </>
  );

  // --- Main Render ---
  return ( <> <Container className="h-auto"> <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4"> <h5 className="mb-2 sm:mb-0">Sliders</h5> <div> <Link to="/task/task-list/create"><Button className="mr-2" icon={<TbUser />} clickFeedback={false}>Assign to Task</Button></Link> <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} disabled={tableLoading}>Add New</Button> </div> </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Tooltip title="Click to show all sliders"><div className="cursor-pointer" onClick={() => handleCardClick('all')}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200 hover:shadow-lg"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbMessageStar size={24} /></div><div><h6 className="text-blue-500">{counts.total}</h6><span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
        <Tooltip title="Click to show sliders created today"><div className="cursor-pointer" onClick={() => handleCardClick('date', 'today')}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-violet-200 hover:shadow-lg"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbMessageShare size={24} /></div><div><h6 className="text-violet-500">{counts.today}</h6><span className="font-semibold text-xs">Today</span></div></Card></div></Tooltip>
        <Tooltip title="Click to show Active sliders"><div className="cursor-pointer" onClick={() => handleCardClick('status', 'Active')}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-300 hover:shadow-lg"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbMessageCheck size={24} /></div><div><h6 className="text-green-500">{counts.active}</h6><span className="font-semibold text-xs">Active</span></div></Card></div></Tooltip>
        <Tooltip title="Click to show Inactive sliders"><div className="cursor-pointer" onClick={() => handleCardClick('status', 'Inactive')}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200 hover:shadow-lg"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbMessage2X size={24} /></div><div><h6 className="text-red-500">{counts.inactive}</h6><span className="font-semibold text-xs">Inactive</span></div></Card></div></Tooltip>
    </div>
    <SlidersTableTools onSearchChange={(q) => handleSetTableData({ query: q, pageIndex: 1 })} onFilter={() => setIsFilterDrawerOpen(true)} onExport={handleOpenExportReasonModal} onClearFilters={onClearFiltersAndReload} allColumns={baseColumns} visibleColumnKeys={visibleColumnKeys} setVisibleColumnKeys={setVisibleColumnKeys} activeFilterCount={activeFilterCount} />
    <div className="mt-4"><ActiveFiltersDisplay filterData={activeFilters} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFiltersAndReload} /></div>
    {(activeFilterCount > 0 || tableData.query) && <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">Found <strong>{total}</strong> matching slider(s).</div>}
    <div className="mt-4 flex-grow overflow-y-auto"> <DataTable selectable columns={visibleColumns} data={pageData} noData={!tableLoading && pageData.length === 0} loading={tableLoading} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} checkboxChecked={(row) => selectedItems.some((s) => s.id === row.id)} onPaginationChange={(p) => handleSetTableData({ pageIndex: p })} onSelectChange={(s) => handleSetTableData({ pageSize: s, pageIndex: 1 })} onSort={(s) => handleSetTableData({ sort: s, pageIndex: 1 })} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect} /> </div>
  </AdaptiveCard> </Container>
  <SlidersSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />

  {/* --- Drawers & Modals --- */}
  <Drawer title="Add New Slider" isOpen={isAddDrawerOpen} onClose={closeAddDrawer} onRequestClose={closeAddDrawer} width={520} footer={<><Button size="sm" className="mr-2" onClick={closeAddDrawer} disabled={isSubmitting}>Cancel</Button><Button size="sm" variant="solid" form="addSliderForm" type="submit" loading={isSubmitting} disabled={!addFormMethods.formState.isValid || isSubmitting}>{isSubmitting ? "Adding..." : "Save"}</Button></>}>
    <Form id="addSliderForm" onSubmit={addFormMethods.handleSubmit(onAddSliderSubmit)} className="flex flex-col gap-4">{renderFormFields(addFormMethods, false)}</Form>
  </Drawer>
  <Drawer title="Edit Slider" isOpen={isEditDrawerOpen} onClose={closeEditDrawer} onRequestClose={closeEditDrawer} width={520} footer={<><Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmitting}>Cancel</Button><Button size="sm" variant="solid" form="editSliderForm" type="submit" loading={isSubmitting} disabled={!editFormMethods.formState.isValid || isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button></>}>
    <Form id="editSliderForm" onSubmit={editFormMethods.handleSubmit(onEditSliderSubmit)} className="flex flex-col gap-4">{renderFormFields(editFormMethods, true, editingSlider)}</Form>
  </Drawer>
  <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} onRequestClose={() => setIsFilterDrawerOpen(false)} width={400} footer={<><Button size="sm" className="mr-2" onClick={onClearFiltersAndReload}>Clear</Button><Button size="sm" variant="solid" form="filterSliderForm" type="submit">Apply</Button></>}>
    <Form id="filterSliderForm" onSubmit={filterFormMethods.handleSubmit((data) => { setActiveFilters(data); handleSetTableData({ pageIndex: 1 }); setIsFilterDrawerOpen(false); })} className="flex flex-col gap-4">
        <FormItem label="Status"><Controller name="filterStatuses" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select status..." options={apiStatusOptions} value={field.value || []} onChange={(v) => field.onChange(v || [])} />)} /></FormItem>
        <FormItem label="Display Page"><Controller name="filterDisplayPages" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select display pages..." options={dynamicOptions.displayPages} value={field.value || []} onChange={(v) => field.onChange(v || [])} />)} /></FormItem>
    </Form>
  </Drawer>
  <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Slider" 
  onCancel={() => setSingleDeleteConfirmOpen(false)}
  onClose={() => setSingleDeleteConfirmOpen(false)} onRequestClose={() => setSingleDeleteConfirmOpen(false)} onConfirm={onConfirmSingleDelete} loading={isDeleting}><p>Are you sure you want to delete the slider "<strong>{sliderToDelete?.title}</strong>"?</p></ConfirmDialog>
  <Dialog isOpen={isImageViewerOpen} onClose={() => setImageViewerOpen(false)} onRequestClose={() => setImageViewerOpen(false)} width={600}><div className="flex justify-center items-center p-4">{imageToView ? <img src={imageToView} alt="Slider" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }}/> : <p>No image.</p>}</div></Dialog>
  <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" 
  onCancel={() => setIsExportReasonModalOpen(false)}
  onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
    <Form id="exportSlidersReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }} className="flex flex-col gap-4 mt-2">
      <FormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}>
        <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
      </FormItem>
    </Form>
  </ConfirmDialog>
  </> );
};

export default Sliders;