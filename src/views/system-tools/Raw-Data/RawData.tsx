// src/views/your-path/RowDataListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect, ChangeEvent } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// For robust CSV parsing, uncomment and install:
// import Papa from 'papaparse';
// import type { ParseResult } from 'papaparse';

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
import Select from "@/components/ui/Select";
import DebounceInput from "@/components/shared/DebouceInput";
import { Drawer, Form, FormItem, Input, Tag, Dialog, Upload } from "@/components/ui"; // Assuming Upload is available if you want drag-drop

// Icons
import {
  TbPencil,
  TbChecks,
  TbPlus,
  TbEye,
  TbUser,
  TbBuilding,
  TbMail,
  TbPhone,
  TbSearch,
  TbCloudUpload,
  TbFilter,
  TbCloudDownload,
  TbMapPin,
  TbTrash,
  TbCategory2,
  TbBuildingArch,
  TbWorld,
  TbFileSpreadsheet,
  TbCancel,
  TbReload,
  TbUserShare,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import classNames from "@/utils/classNames";

// Redux
import { useAppDispatch } from '@/reduxtool/store';
import { shallowEqual, useSelector } from "react-redux";
import {
  getRowDataAction,
  addRowDataAction,
  editRowDataAction,
  deleteRowDataAction,
  deleteAllRowDataAction,
  getCountriesAction,
  getCategoriesAction,
  getBrandAction,
  importRowDataAction, // Ensure this action is created in your middleware
} from '@/reduxtool/master/middleware';
import { masterSelector } from '@/reduxtool/master/masterSlice';
import { Link } from "react-router-dom";


// --- Define Types for API data and Form Selects ---
export type CountryListItem = { id: string | number; name: string; };
export type CategoryListItem = { id: string | number; name: string; };
export type BrandListItem = { id: string | number; name: string; };
export type SelectOption = { value: string; label: string };

export type RowDataItem = {
  id: string | number;
  country_id: string;
  category_id: string;
  brand_id: string;
  mobile_no: string;
  email?: string | null;
  name: string;
  company_name?: string | null;
  status: string;
  quality: string;
  city?: string;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
  country?: { id: number; name: string; } | null;
  category?: { id: number; name: string; } | null;
  brand?: { id: number; name: string; } | null;
};

// UI Dropdown options
const QUALITY_LEVELS_UI: SelectOption[] = [
  { value: "A", label: "Grade A (High)" },
  { value: "B", label: "Grade B (Medium)" },
  { value: "C", label: "Grade C (Low)" },
];
const qualityUIValues = QUALITY_LEVELS_UI.map((q) => q.value) as [string, ...string[]];

const STATUS_OPTIONS_UI: SelectOption[] = [
  { value: "Row", label: "Row" },
  { value: "Identified", label: "Identified" },
  { value: "Verified", label: "Verified" },
  { value: "Hold", label: "Hold" },
  { value: "Blacklist", label: "Blacklisted" },
];
const statusUIValues = STATUS_OPTIONS_UI.map((s) => s.value) as [string, ...string[]];

const statusColors: Record<string, string> = {
  Row: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  Identified: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100",
  Verified: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  Hold: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100",
  Blacklist: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
};

const rowDataFormSchema = z.object({
  country_id: z.string().min(1, "Country is required."),
  category_id: z.string().min(1, "Category is required."),
  brand_id: z.string().min(1, "Brand is required."),
  mobile_no: z.string().min(1, "Mobile No. is required.").max(20, "Mobile No. too long."),
  email: z.string().email("Invalid email format.").optional().or(z.literal("")),
  name: z.string().min(1, "Name is required.").max(100, "Name too long."),
  company_name: z.string().max(150).optional().or(z.literal("")),
  quality: z.enum(qualityUIValues, { errorMap: () => ({ message: "Quality is required." }), }),
  city: z.string().max(100).optional().or(z.literal("")),
  status: z.enum(statusUIValues, { errorMap: () => ({ message: "Status is required." }), }),
  remarks: z.string().max(500, "Remarks too long.").optional().or(z.literal("")),
});
type RowDataFormData = z.infer<typeof rowDataFormSchema>;

const CSV_HEADERS_ROW_DATA = ["ID", "Country", "Category", "Brand", "Mobile No", "Email", "Name", "Company Name", "Status", "Quality", "City", "Remarks", "Created At"];
const CSV_KEYS_ROW_DATA: (keyof Pick<RowDataItem, 'id' | 'mobile_no' | 'email' | 'name' | 'company_name' | 'status' | 'quality' | 'city' | 'remarks' | 'created_at'> | 'countryNameDisplay' | 'categoryNameDisplay' | 'brandNameDisplay')[] = [
  "id", "countryNameDisplay", "categoryNameDisplay", "brandNameDisplay", "mobile_no", "email", "name", "company_name", "status", "quality", "city", "remarks", "created_at"
];

function exportRowDataToCsv(filename: string, rows: RowDataItem[], countryOptions: SelectOption[], categoryOptions: SelectOption[], brandOptions: SelectOption[]) {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info" duration={2000}>Nothing to export.</Notification>); return false; }
  const preparedRows = rows.map((row) => ({
    ...row,
    countryNameDisplay: countryOptions.find(c => c.value === String(row.country_id))?.label || String(row.country_id),
    categoryNameDisplay: categoryOptions.find(c => c.value === String(row.category_id))?.label || String(row.category_id),
    brandNameDisplay: brandOptions.find(b => b.value === String(row.brand_id))?.label || String(row.brand_id),
    status: STATUS_OPTIONS_UI.find(s => s.value === row.status)?.label || row.status,
    quality: QUALITY_LEVELS_UI.find(q => q.value === row.quality)?.label || row.quality,
  }));
  const separator = ",";
  const csvContent = CSV_HEADERS_ROW_DATA.join(separator) + "\n" + preparedRows.map((row: any) => CSV_KEYS_ROW_DATA.map((k) => { let cell: any = row[k]; if (cell === null || cell === undefined) cell = ""; else cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(separator)).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; }
  toast.push(<Notification title="Export Failed" type="danger" duration={3000}>Browser does not support this feature.</Notification>); return false;
}

const ItemActionColumn = ({ onEdit, onViewDetail, onDelete, onBlacklist }: { onEdit: () => void; onViewDetail: () => void; onDelete: () => void; onBlacklist: () => void; }) => {
  return ( 
  <div className="flex items-center justify-center gap-1"> 
    <Tooltip title="Edit"> <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`} role="button" onClick={onEdit}><TbPencil /></div></Tooltip> 
    <Tooltip title="View"> <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`} role="button" onClick={onViewDetail}><TbEye /></div></Tooltip> 
    <Tooltip title="Convert to Member"> <Link to="/business-entities/member-create" className={`text-xl cursor-pointer select-none text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400`} role="button"><TbUserShare /></Link></Tooltip> 
    <Tooltip title="Blacklist"> <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400`} role="button" onClick={onBlacklist}><TbCancel size={16}/></div></Tooltip> 
    <Tooltip title="Delete"> <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`} role="button" onClick={onDelete}><TbTrash /></div></Tooltip> </div> );
};
ItemActionColumn.displayName = "ItemActionColumn";

type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>( ({ onInputChange }, ref) => ( <DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} /> ));
ItemSearch.displayName = "ItemSearch";

type ItemTableToolsProps = {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onImport: () => void; // Added for import button
  onClearFilters: () => void;
};
const ItemTableTools = ({ onSearchChange, onFilter, onExport, onImport, onClearFilters }: ItemTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow"> <ItemSearch onInputChange={onSearchChange} /> </div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Tooltip title="Clear Filters">
        <Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters"></Button>
      </Tooltip>
      <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
      <Button icon={<TbCloudDownload />} onClick={onImport} className="w-full sm:w-auto">Import</Button>
      <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
    </div>
  </div>
);
ItemTableTools.displayName = "ItemTableTools";


const RowDataListing = () => {
  const dispatch = useAppDispatch();
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RowDataItem | null>(null);
  const [viewingItem, setViewingItem] = useState<RowDataItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<RowDataItem | null>(null);
  const [itemToBlacklist, setItemToBlacklist] = useState<RowDataItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // For add/edit forms
  const [isDeleting, setIsDeleting] = useState(false); // For delete operations
  const [isBlacklisting, setIsBlacklisting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [blacklistConfirmOpen, setBlacklistConfirmOpen] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_at" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<RowDataItem[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<{ filterCountry?: SelectOption[]; filterCategory?: SelectOption[]; filterBrand?: SelectOption[]; filterStatus?: SelectOption[]; filterQuality?: SelectOption[]; }>({});

  // State for Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false); // Loading state for import process

  const {
    rowData = [],
    CountriesData = [],
    CategoriesData = [],
    BrandData = [],
    status: masterLoadingStatus = "idle", // Global loading status from Redux
  } = useSelector(masterSelector, shallowEqual);

  useEffect(() => {
    if (rowData.length > 0) {
      console.log("Raw rowData from Redux (first item):", JSON.stringify(rowData[0], null, 2));
    }
  }, [rowData]);

  const countryOptions = useMemo(() => Array.isArray(CountriesData) ? CountriesData.map((c: CountryListItem) => ({ value: String(c.id), label: c.name })) : [], [CountriesData]);
  const categoryOptions = useMemo(() => Array.isArray(CategoriesData) ? CategoriesData.map((c: CategoryListItem) => ({ value: String(c.id), label: c.name })) : [], [CategoriesData]);
  const brandOptions = useMemo(() => Array.isArray(BrandData) ? BrandData.map((b: BrandListItem) => ({ value: String(b.id), label: b.name })) : [], [BrandData]);

  useEffect(() => {
    dispatch(getRowDataAction());
    dispatch(getCountriesAction());
    dispatch(getCategoriesAction());
    dispatch(getBrandAction());
  }, [dispatch]); // Removed exhaustive-deps to avoid re-triggering on every dispatch change

  const formMethods = useForm<RowDataFormData>({
    resolver: zodResolver(rowDataFormSchema),
    mode: "onChange",
  });

  const filterForm = useForm<typeof filterCriteria>({ defaultValues: {} });

  const openAddDrawer = useCallback(() => {
    formMethods.reset({
        country_id: countryOptions[0]?.value || "",
        category_id: categoryOptions[0]?.value || "",
        brand_id: brandOptions[0]?.value || "",
        mobile_no: "", email: "", name: "", company_name: "",
        quality: QUALITY_LEVELS_UI[0]?.value || "",
        city: "", status: STATUS_OPTIONS_UI.find(s => s.value === "Row")?.value || STATUS_OPTIONS_UI[0]?.value || "",
        remarks: "",
    });
    setEditingItem(null); setIsAddDrawerOpen(true);
  }, [formMethods, countryOptions, categoryOptions, brandOptions]);

  const closeAddDrawer = () => setIsAddDrawerOpen(false);

  const openEditDrawer = useCallback((item: RowDataItem) => {
    setEditingItem(item);
    console.log("--- Opening Edit Drawer for Item ---", item);
    formMethods.reset({
      country_id: String(item.country_id),
      category_id: String(item.category_id),
      brand_id: String(item.brand_id),
      mobile_no: item.mobile_no,
      email: item.email || "",
      name: item.name,
      company_name: item.company_name || "",
      quality: item.quality || "",
      city: item.city || "",
      status: item.status || "",
      remarks: item.remarks || "",
    });
    setTimeout(() => { console.log("Form values in RHF after reset:", formMethods.getValues()); }, 0);
    setIsEditDrawerOpen(true);
  }, [formMethods]);

  const closeEditDrawer = () => { setIsEditDrawerOpen(false); setEditingItem(null); };
  const openViewDialog = (item: RowDataItem) => { console.log("Viewing Item raw:", item); setViewingItem(item); }
  const closeViewDialog = () => setViewingItem(null);

  const onSubmitHandler = async (data: RowDataFormData) => {
    setIsSubmitting(true);
    const apiPayload = { ...data, email: data.email === "" ? null : data.email, /* ... other null conversions ... */ };
    try {
      if (editingItem) {
        await dispatch(editRowDataAction({ id: editingItem.id, ...apiPayload })).unwrap();
        toast.push(<Notification title="Row Data Updated" type="success" duration={2000}/>);
        closeEditDrawer();
      } else {
        await dispatch(addRowDataAction(apiPayload)).unwrap();
        toast.push(<Notification title="Row Data Added" type="success" duration={2000}/>);
        closeAddDrawer();
      }
      dispatch(getRowDataAction()); // Refresh data
    } catch (e: any) {
      toast.push(<Notification title={(editingItem ? "Update" : "Add") + " Failed"} type="danger" duration={3000}>{(e as Error).message || "An error occurred."}</Notification>);
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteClick = (item: RowDataItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); };
  const onConfirmSingleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true); setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteRowDataAction({ id: String(itemToDelete.id) })).unwrap(); // Changed to single delete action
      toast.push(<Notification title="Row Data Deleted" type="success" duration={2000}>{`Entry "${itemToDelete.name || itemToDelete.mobile_no}" deleted.`}</Notification>);
      setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id));
      dispatch(getRowDataAction()); // Refresh data
    } catch (e: any) { toast.push(<Notification title="Delete Failed" type="danger" duration={3000}>{(e as Error).message}</Notification>);
    } finally { setIsDeleting(false); setItemToDelete(null); }
  };
  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const idsToDelete = selectedItems.map((item) => String(item.id));
    try {
      await dispatch(deleteAllRowDataAction({ ids: idsToDelete.join(',') })).unwrap();
      toast.push(<Notification title="Row Data Deleted" type="success" duration={2000}>{selectedItems.length} entr(ies) deleted.</Notification>);
      setSelectedItems([]); dispatch(getRowDataAction()); // Refresh data
    } catch (e: any) { toast.push(<Notification title="Delete Failed" type="danger" duration={3000}>{(e as Error).message}</Notification>);
    } finally { setIsDeleting(false); }
  };

  const handleBlacklistClick = (item: RowDataItem) => { setItemToBlacklist(item); setBlacklistConfirmOpen(true); };
  const onConfirmBlacklist = async () => {
    if (!itemToBlacklist) return;
    setIsBlacklisting(true); setBlacklistConfirmOpen(false);
    const payload: any = { ...itemToBlacklist, status: "Blacklist", country_id: String(itemToBlacklist.country_id), category_id: String(itemToBlacklist.category_id), brand_id: String(itemToBlacklist.brand_id) };
    delete payload.country; delete payload.category; delete payload.brand; delete payload.created_at; delete payload.updated_at; // Ensure only expected fields are sent
    try {
      await dispatch(editRowDataAction(payload)).unwrap();
      toast.push(<Notification title="Row Data Blacklisted" type="warning" duration={2000}>{`Entry "${itemToBlacklist.name || itemToBlacklist.mobile_no}" blacklisted.`}</Notification>);
      dispatch(getRowDataAction()); // Refresh data
    } catch (e: any) { toast.push(<Notification title="Blacklist Failed" type="danger" duration={3000}>{(e as Error).message}</Notification>);
    } finally { setIsBlacklisting(false); setItemToBlacklist(null); }
  };
  
  const openFilterDrawer = () => { filterForm.reset(filterCriteria); setIsFilterDrawerOpen(true); };
  const onApplyFiltersSubmit = (data: typeof filterCriteria) => { setFilterCriteria(data); setTableData((prev) => ({ ...prev, pageIndex: 1 })); setIsFilterDrawerOpen(false); };
  const onClearFilters = () => { filterForm.reset({}); setFilterCriteria({}); setTableData((prev) => ({ ...prev, pageIndex: 1 })); };

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceDataWithDisplayNames: any[] = Array.isArray(rowData) ? rowData.map(item => ({ ...item, countryNameDisplay: item.country?.name || String(item.country_id), categoryNameDisplay: item.category?.name || String(item.category_id), brandNameDisplay: item.brand?.name || String(item.brand_id), })) : [];
    let processedData = cloneDeep(sourceDataWithDisplayNames);
    // ... filtering logic ...
    if (filterCriteria.filterCountry?.length) processedData = processedData.filter(item => filterCriteria.filterCountry!.some(fc => fc.value === String(item.country_id)));
    if (filterCriteria.filterCategory?.length) processedData = processedData.filter(item => filterCriteria.filterCategory!.some(fc => fc.value === String(item.category_id)));
    if (filterCriteria.filterBrand?.length) processedData = processedData.filter(item => filterCriteria.filterBrand!.some(fb => fb.value === String(item.brand_id)));
    if (filterCriteria.filterStatus?.length) processedData = processedData.filter(item => filterCriteria.filterStatus!.some(fs => fs.value === item.status));
    if (filterCriteria.filterQuality?.length) processedData = processedData.filter(item => filterCriteria.filterQuality!.some(fq => fq.value === item.quality));

    if (tableData.query && tableData.query.trim() !== "") { const query = tableData.query.toLowerCase().trim(); processedData = processedData.filter(item => (String(item.id).toLowerCase().includes(query) || item.mobile_no.toLowerCase().includes(query) || (item.email && item.email.toLowerCase().includes(query)) || (item.name && item.name.toLowerCase().includes(query)) || (item.company_name && item.company_name.toLowerCase().includes(query)) || (item.city && item.city.toLowerCase().includes(query)) || (item.remarks && item.remarks.toLowerCase().includes(query)) || (item.countryNameDisplay && item.countryNameDisplay.toLowerCase().includes(query)) || (item.categoryNameDisplay && item.categoryNameDisplay.toLowerCase().includes(query)) || (item.brandNameDisplay && item.brandNameDisplay.toLowerCase().includes(query)) )); }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) { processedData.sort((a, b) => { let aVal: any, bVal: any; if (key === 'country_id') { aVal = a.countryNameDisplay; bVal = b.countryNameDisplay; } else if (key === 'category_id') { aVal = a.categoryNameDisplay; bVal = b.categoryNameDisplay; } else if (key === 'brand_id') { aVal = a.brandNameDisplay; bVal = b.brandNameDisplay; } else { aVal = a[key as keyof RowDataItem]; bVal = b[key as keyof RowDataItem]; } if (key === "created_at" || key === "updated_at") { return order === "asc" ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime() : new Date(bVal as string).getTime() - new Date(aVal as string).getTime(); } const aStr = String(aVal ?? "").toLowerCase(); const bStr = String(bVal ?? "").toLowerCase(); return order === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr); }); }
    const dataToExport = [...processedData];
    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
    return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
  }, [rowData, tableData, filterCriteria, countryOptions, categoryOptions, brandOptions]);
  
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const handleExportData = () => { exportRowDataToCsv("row_data_export.csv", allFilteredAndSortedData, countryOptions, categoryOptions, brandOptions); };
  const handlePaginationChange = useCallback((page: number) => setTableData(prev => ({ ...prev, pageIndex: page })), []);
  const handleSelectPageSizeChange = useCallback((value: number) => { setTableData(prev => ({ ...prev, pageSize: Number(value), pageIndex: 1 })); setSelectedItems([]); }, []);
  const handleSort = useCallback((sort: OnSortParam) => { setTableData(prev => ({ ...prev, sort: sort, pageIndex: 1 })); }, []);
  const handleSearchInputChange = useCallback((query: string) => { setTableData(prev => ({ ...prev, query: query, pageIndex: 1 })); }, []);
  const handleRowSelect = useCallback((checked: boolean, row: RowDataItem) => {setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); });}, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<RowDataItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => !pSIds.has(r.id)); return [...pS, ...nRTA]; }); } else { const cPRIds = new Set(cPOR.map((r) => r.id)); setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id))); } }, []);

  const columns: ColumnDef<RowDataItem>[] = useMemo(() => [
    { header: 'Country', accessorKey: 'country_id', size: 120, cell: props => props.row.original.country?.name || String(props.getValue()) },
    { header: 'Category', accessorKey: 'category_id', size: 140, cell: props => props.row.original.category?.name || String(props.getValue()) },
    { header: 'Brand', accessorKey: 'brand_id', size: 120, cell: props => props.row.original.brand?.name || String(props.getValue()) },
    { header: 'Mobile No', accessorKey: 'mobile_no', size: 130 },
    { header: 'Name', accessorKey: 'name', size: 150 },
    { header: 'Quality', accessorKey: 'quality', size: 100, cell: props => { const qVal = props.getValue<string>(); const qOpt = QUALITY_LEVELS_UI.find(q => q.value === qVal); return <Tag className={classNames("capitalize", qVal === "A" && "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-100", qVal === "B" && "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-100", qVal === "C" && "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100")}>{qOpt?.label || qVal}</Tag>; }},
    { header: 'Status', accessorKey: 'status', size: 110, cell: props => { const sVal = props.getValue<string>(); const sOpt = STATUS_OPTIONS_UI.find(s => s.value === sVal); return <Tag className={classNames("capitalize", statusColors[sVal])}>{sOpt?.label || sVal}</Tag>; }},
    { header: 'Remarks', accessorKey: 'remarks', size: 150, cell: props => <div className="truncate w-36" title={props.getValue() as string | undefined}>{props.getValue() as string || '-'}</div> },
    { header: 'Created At', accessorKey: 'created_at', size: 120, cell: props => props.getValue() ? new Date(props.getValue() as string).toLocaleDateString() : '-' },
    { header: "Actions", id: "action", size: 130, meta: { HeaderClass: "text-center", cellClass: "text-center" }, cell: props => <ItemActionColumn onEdit={() => openEditDrawer(props.row.original)} onViewDetail={() => openViewDialog(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} onBlacklist={() => handleBlacklistClick(props.row.original)} /> },
  ], [openEditDrawer, openViewDialog, handleDeleteClick, handleBlacklistClick]);

  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
      <FormItem label="Country" invalid={!!currentFormMethods.formState.errors.country_id} errorMessage={currentFormMethods.formState.errors.country_id?.message}><Controller name="country_id" control={currentFormMethods.control} render={({ field }) => (<Select placeholder="Select country" options={countryOptions} value={countryOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbWorld />} />)} /></FormItem>
      <FormItem label="Category" invalid={!!currentFormMethods.formState.errors.category_id} errorMessage={currentFormMethods.formState.errors.category_id?.message}><Controller name="category_id" control={currentFormMethods.control} render={({ field }) => (<Select placeholder="Select category" options={categoryOptions} value={categoryOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbCategory2 />} />)} /></FormItem>
      <FormItem label="Brand" invalid={!!currentFormMethods.formState.errors.brand_id} errorMessage={currentFormMethods.formState.errors.brand_id?.message}><Controller name="brand_id" control={currentFormMethods.control} render={({ field }) => (<Select placeholder="Select brand" options={brandOptions} value={brandOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbBuildingArch />} />)} /></FormItem>
      <FormItem label="Mobile No." invalid={!!currentFormMethods.formState.errors.mobile_no} errorMessage={currentFormMethods.formState.errors.mobile_no?.message}><Controller name="mobile_no" control={currentFormMethods.control} render={({ field }) => (<Input {...field} prefix={<TbPhone />} placeholder="+XX-XXXXXXXXXX" />)} /></FormItem>
      <FormItem label="Email (Optional)" invalid={!!currentFormMethods.formState.errors.email} errorMessage={currentFormMethods.formState.errors.email?.message}><Controller name="email" control={currentFormMethods.control} render={({ field }) => (<Input {...field} type="email" prefix={<TbMail />} placeholder="name@example.com" />)} /></FormItem>
      <FormItem label="Name" invalid={!!currentFormMethods.formState.errors.name} errorMessage={currentFormMethods.formState.errors.name?.message}><Controller name="name" control={currentFormMethods.control} render={({ field }) => (<Input {...field} prefix={<TbUser />} placeholder="Contact Name / Lead Name" />)} /></FormItem>
      <FormItem label="Company Name (Optional)" invalid={!!currentFormMethods.formState.errors.company_name} errorMessage={currentFormMethods.formState.errors.company_name?.message}><Controller name="company_name" control={currentFormMethods.control} render={({ field }) => <Input {...field} prefix={<TbBuilding />} placeholder="ABC Corp" />} /></FormItem>
      <FormItem label="Quality" invalid={!!currentFormMethods.formState.errors.quality} errorMessage={currentFormMethods.formState.errors.quality?.message}><Controller name="quality" control={currentFormMethods.control} render={({ field }) => (<Select placeholder="Select quality" options={QUALITY_LEVELS_UI} value={QUALITY_LEVELS_UI.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />)} /></FormItem>
      <FormItem label="City (Optional)" invalid={!!currentFormMethods.formState.errors.city} errorMessage={currentFormMethods.formState.errors.city?.message}><Controller name="city" control={currentFormMethods.control} render={({ field }) => <Input {...field} prefix={<TbMapPin />} placeholder="City Name" />} /></FormItem>
      <FormItem label="Status" invalid={!!currentFormMethods.formState.errors.status} errorMessage={currentFormMethods.formState.errors.status?.message}><Controller name="status" control={currentFormMethods.control} render={({ field }) => (<Select placeholder="Select status" options={STATUS_OPTIONS_UI.filter(s => s.value !== "Blacklist")} value={STATUS_OPTIONS_UI.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />)} /></FormItem>
      <FormItem label="Remarks (Optional)" className="md:col-span-2 lg:col-span-3" invalid={!!currentFormMethods.formState.errors.remarks} errorMessage={currentFormMethods.formState.errors.remarks?.message}><Controller name="remarks" control={currentFormMethods.control} render={({ field }) => <Input textArea {...field} rows={3} placeholder="Add any relevant notes or comments..." />} /></FormItem>
    </div>
  );
  

  // --- Import Modal Handlers & Submit ---
  const openImportModal = () => setIsImportModalOpen(true);
  const closeImportModal = () => { setIsImportModalOpen(false); setSelectedFile(null); };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "text/csv" || file.name.endsWith(".csv") || file.type === "application/vnd.ms-excel" || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        setSelectedFile(file);
      } else {
        toast.push(<Notification title="Invalid File Type" type="danger" duration={3000}>Please upload a CSV or Excel file.</Notification>);
        setSelectedFile(null);
        if (e.target) e.target.value = ""; // Reset file input
      }
    } else {
        setSelectedFile(null);
    }
  };

  const handleImportSubmit = async () => {
    if (!selectedFile) { toast.push(<Notification title="No File Selected" type="warning" duration={2000}>Please select a file to import.</Notification>); return; }
    setIsImporting(true);
    try {
      // For client-side parsing (example, better to use a library like PapaParse for CSV)
      // This example focuses on sending the file to the backend.
      // If your backend expects FormData:
      const formData = new FormData();
      formData.append('file', selectedFile); // 'file' is the typical key name

      // Dispatch your import action
      await dispatch(importRowDataAction(formData)).unwrap(); // Assuming importRowDataAction takes FormData

      toast.push(<Notification title="Import Initiated" type="success" duration={2000}>File uploaded. Processing will continue in the background.</Notification>);
      dispatch(getRowDataAction()); // Optionally refresh data immediately, or wait for backend signal
      closeImportModal();
    } catch (apiError: any) {
      toast.push(<Notification title="Import Failed" type="danger" duration={3000}>{apiError.message || "Failed to import data."}</Notification>);
    } finally {
      setIsImporting(false);
    }
  };


  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Row Data Management</h5>
            <div className="flex gap-2">
              <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New</Button>
            </div>
          </div>
          <div className="mb-4">
            <ItemTableTools
              onClearFilters={onClearFilters}
              onSearchChange={handleSearchInputChange}
              onFilter={openFilterDrawer}
              onExport={handleExportData}
              onImport={openImportModal} // Connect to open import modal
            />
          </div>
          <div className="mt-4 flex-grow overflow-auto">
            <DataTable
              columns={columns}
              data={pageData}
              loading={masterLoadingStatus === "loading" || isSubmitting || isDeleting || isBlacklisting || isImporting} // Add isImporting to loading
              pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
              selectable
              checkboxChecked={(row: RowDataItem) => selectedItems.some((selected) => selected.id === row.id)}
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectPageSizeChange}
              onSort={handleSort}
              onCheckBoxChange={handleRowSelect}
              onIndeterminateCheckBoxChange={handleAllRowSelect}
              noData={!isImporting && masterLoadingStatus !== "loading" && pageData.length === 0}
            />
          </div>
        </AdaptiveCard>
      </Container>

      {selectedItems.length > 0 && (
        <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
            <div className="flex items-center justify-between w-full px-4 sm:px-8">
            <span className="flex items-center gap-2"> <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span> <span className="font-semibold flex items-center gap-1 text-sm sm:text-base"> <span className="heading-text">{selectedItems.length}</span> <span>Item{selectedItems.length > 1 ? "s" : ""} selected</span> </span> </span>
            <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteSelected} loading={isDeleting}>Delete Selected</Button>
            </div>
        </StickyFooter>
      )}

      <Drawer title={editingItem ? "Edit Row Data" : "Add New Row Data"} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={editingItem ? closeEditDrawer : closeAddDrawer} onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer} width={940}
        footer={ <div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button> <Button size="sm" variant="solid" form="rowDataForm" type="submit" loading={isSubmitting} disabled={isSubmitting || (editingItem ? !formMethods.formState.isDirty : false) || !formMethods.formState.isValid }>{isSubmitting ? (editingItem ? "Saving..." : "Adding...") : (editingItem ? "Save Changes" : "Save")}</Button> </div> } >
        <Form id="rowDataForm" onSubmit={formMethods.handleSubmit(onSubmitHandler)} className="flex flex-col gap-4">
          {renderDrawerForm(formMethods)}
        </Form>
      </Drawer>

      <Dialog isOpen={!!viewingItem} onClose={closeViewDialog} onRequestClose={closeViewDialog} width={700}>
        <h5 className="mb-4 text-lg font-semibold">Row Data Details - {viewingItem?.name || viewingItem?.mobile_no}</h5>
        {viewingItem && (
          <div className="space-y-3 text-sm">
            {(Object.keys(viewingItem) as Array<keyof RowDataItem>).filter(key => key !== 'country' && key !== 'category' && key !== 'brand').map((key) => {
                let label = key.replace(/_id$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                let value: any = viewingItem[key as keyof RowDataItem];
                if (key === 'country_id') value = viewingItem.country?.name || String(value);
                else if (key === 'category_id') value = viewingItem.category?.name || String(value);
                else if (key === 'brand_id') value = viewingItem.brand?.name || String(value);
                else if (key === 'quality') value = QUALITY_LEVELS_UI.find(q => q.value === value)?.label || String(value);
                else if (key === 'status') value = STATUS_OPTIONS_UI.find(s => s.value === value)?.label || String(value);
                else if ((key === 'created_at' || key === 'updated_at') && value) value = new Date(value).toLocaleString();
                value = (value === null || value === undefined || value === "") ? <span className="text-gray-400">-</span> : String(value);
                return (<div key={key} className="flex py-1.5 border-b border-gray-200 dark:border-gray-700 last:border-b-0"><span className="font-medium w-1/3 text-gray-700 dark:text-gray-300">{label}:</span><span className="w-2/3 text-gray-900 dark:text-gray-100">{value}</span></div>);
            })}
          </div>
        )}
        <div className="text-right mt-6"><Button variant="solid" onClick={closeViewDialog}>Close</Button></div>
      </Dialog>

      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer}
        footer={ <div className="text-right w-full flex justify-end gap-2"> <Button size="sm" onClick={onClearFilters} type="button">Clear</Button> <Button size="sm" variant="solid" form="filterRowDataForm" type="submit">Apply</Button> </div> } >
        <Form id="filterRowDataForm" onSubmit={filterForm.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Country"><Controller name="filterCountry" control={filterForm.control} render={({ field }) => (<Select isMulti placeholder="Any Country" options={countryOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Category"><Controller name="filterCategory" control={filterForm.control} render={({ field }) => (<Select isMulti placeholder="Any Category" options={categoryOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Brand"><Controller name="filterBrand" control={filterForm.control} render={({ field }) => (<Select isMulti placeholder="Any Brand" options={brandOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Status"><Controller name="filterStatus" control={filterForm.control} render={({ field }) => (<Select isMulti placeholder="Any Status" options={STATUS_OPTIONS_UI} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Quality"><Controller name="filterQuality" control={filterForm.control} render={({ field }) => (<Select isMulti placeholder="Any Quality" options={QUALITY_LEVELS_UI} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Row Data" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}>
        <p>Are you sure you want to delete entry for "<strong>{itemToDelete?.name || itemToDelete?.mobile_no}</strong>"?</p>
      </ConfirmDialog>
      <ConfirmDialog isOpen={blacklistConfirmOpen} type="warning" title="Blacklist Row Data" onClose={() => { setBlacklistConfirmOpen(false); setItemToBlacklist(null); }} confirmText="Yes, Blacklist" cancelText="No, Cancel" onConfirm={onConfirmBlacklist} loading={isBlacklisting} onCancel={() => { setBlacklistConfirmOpen(false); setItemToBlacklist(null); }} onRequestClose={() => { setBlacklistConfirmOpen(false); setItemToBlacklist(null); }}>
        <p>Are you sure you want to blacklist entry for "<strong>{itemToBlacklist?.name || itemToBlacklist?.mobile_no}</strong>"? This will change status to 'Blacklist'.</p>
      </ConfirmDialog>

      {/* Import Modal Dialog */}
      <Dialog
        isOpen={isImportModalOpen}
        onClose={closeImportModal}
        onRequestClose={closeImportModal}
        width={600}
        title="Import Raw Data from CSV/Excel"
        contentClass="overflow-visible" // Allow file input to be fully visible if it has custom styling
      >
        <div className="py-4">
            <p className="mb-1 text-sm text-gray-600 dark:text-gray-300">
                Select a CSV or Excel file to import raw data.
            </p>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                Required headers (example): <code>country_id, category_id, brand_id, mobile_no, name, email, status, quality, etc.</code>
            </p>

            <FormItem label="Upload File" className="mb-4">
                <Input
                    type="file"
                    name="file" // Add name for potential form handling if needed, not strictly required for direct state update
                    accept=".csv, text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" // Accept CSV and Excel types
                    onChange={handleFileChange}
                    prefix={<TbFileSpreadsheet className="text-xl text-gray-400" />}
                />
                 {selectedFile && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Selected: <span className="font-semibold">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </div>
                )}
            </FormItem>

            <div className="mt-3">
                <a
                    href="/sample-import-template.csv" // Link to your sample CSV
                    download="sample-row-data-import-template.csv"
                    className="text-sm text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"
                >
                    <TbCloudDownload /> Download Sample CSV Template
                </a>
            </div>
            <div className="text-right w-full">
                        <Button
                variant="plain"
                onClick={closeImportModal}
                disabled={isImporting}
            >
                Cancel
            </Button>
            <Button
                variant="solid"
                onClick={handleImportSubmit}
                loading={isImporting}
                disabled={!selectedFile || isImporting}
                icon={isImporting ? null : <TbCloudUpload />}
            >
                {isImporting ? 'Importing...' : 'Upload & Import'}
            </Button>
            </div>
        </div>
      </Dialog>
    </>
  );
};

export default RowDataListing;