// src/views/your-path/RolesListing.tsx

import React, { useState, useMemo, useCallback, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSelector, shallowEqual } from "react-redux";
import { useNavigate } from "react-router-dom";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DebouceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select";
import { Card, Drawer, Form, FormItem, Input, Badge, Tag, Dropdown, Checkbox, Avatar, Dialog } from "@/components/ui";

// Icons
import {
  TbPencil,
  TbEye,
  TbShieldLock,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbUserShield,
  TbLockAccess,
  TbFileDescription,
  TbReload,
  TbX,
  TbColumns,
  TbUserCircle
} from "react-icons/tb";

// Utils
import { formatCustomDateTime } from '@/utils/formatCustomDateTime';

// Types
// FIX: Added OnPagingChange for better type safety, as seen in the reference component.
import type { OnSortParam, ColumnDef } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux Imports
import { useAppDispatch } from "@/reduxtool/store";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  getRolesAction,
  addRolesAction,
  editRolesAction,
  getDepartmentsAction,
  getDesignationsAction,
  submitExportReasonAction
} from "@/reduxtool/master/middleware";

// --- Define Item Types ---
export type DepartmentItem = { id: string | number; name: string };
export type DesignationItem = { id: string | number; name: string; department_id: string; };
export type SelectOption = { value: string; label: string; };

export type RoleItem = {
  id: string;
  display_name: string;
  name: string;
  description: string;
  department_id: string | number;
  designation_id: string | number;
  department?: DepartmentItem;
  designation?: DesignationItem;
  created_at: string;
  updated_at: string;
  updated_by_user?: {
    name: string;
    profile_pic_path?: string;
    roles: { display_name: string }[];
  };
};

// --- Zod Schemas ---
const roleFormSchema = z.object({
  display_name: z.string().min(1, "Display Name is required.").max(100),
  name: z.string().min(1, "System key is required."),
  description: z.string().min(1, "Description is required.").max(500),
  department_id: z.string().min(1, "Department is required."),
  designation_id: z.string().min(1, "Designation is required."),
});
type RoleFormData = z.infer<typeof roleFormSchema>;

const roleFilterFormSchema = z.object({
  filterDisplayName: z.string().optional(),
  department_ids: z.array(z.string()).optional(),
  designation_ids: z.array(z.string()).optional(),
});
type RoleFilterFormData = z.infer<typeof roleFilterFormSchema>;

const exportReasonSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- Helper Functions ---
function exportToCsvRoles(filename: string, rows: RoleItem[], visibleColumns: ColumnDef<RoleItem>[]) {
  if (!rows || !rows.length) {
    toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
    return;
  }
  const visibleHeaders = visibleColumns.filter(c => c.header && c.id !== 'action').map(c => c.header as string);

  const preparedRows = rows.map(row => {
    const rowData: (string | number)[] = [];
    visibleColumns.forEach(col => {
      if (col.id === 'action' || !col.accessorKey) return;
      if (col.accessorKey === 'department.name') rowData.push(row.department?.name || 'N/A');
      else if (col.accessorKey === 'designation.name') rowData.push(row.designation?.name || 'N/A');
      else if (col.accessorKey === 'updated_at') rowData.push(
        `${row.updated_by_user?.name || 'N/A'} (${formatCustomDateTime(row.updated_at)})`
      );
      else rowData.push((row as any)[col.accessorKey as string] || 'N/A');
    });
    return rowData;
  });

  const csvContent = [
    visibleHeaders.join(','),
    ...preparedRows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.push(<Notification title="Export Successful" type="success" />);
}

// --- Reusable Components ---
const ActionColumn = ({ onEdit, onViewDetail, onPermissions }: { onEdit: () => void; onViewDetail: () => void; onPermissions: () => void }) => {
  const iconButtonClass = "text-lg p-1 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Permissions"><div className={classNames(iconButtonClass, hoverBgClass, "text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400")} role="button" onClick={onPermissions}><TbShieldLock /></div></Tooltip>
      <Tooltip title="Edit"><div className={classNames(iconButtonClass, hoverBgClass, "text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400")} role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
      <Tooltip title="View"><div className={classNames(iconButtonClass, hoverBgClass, "text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400")} role="button" onClick={onViewDetail}><TbEye /></div></Tooltip>
    </div>
  );
};

const ActiveFiltersDisplay = ({ filters, onRemoveFilter, onClearAll, departmentOptions, designationOptions }: { filters: RoleFilterFormData; onRemoveFilter: (key: keyof RoleFilterFormData, value: string) => void; onClearAll: () => void; departmentOptions: SelectOption[]; designationOptions: SelectOption[]; }) => {
  const activeDisplayName = filters.filterDisplayName;
  const activeDepartments = filters.department_ids || [];
  const activeDesignations = filters.designation_ids || [];
  const hasActiveFilters = activeDisplayName || activeDepartments.length > 0 || activeDesignations.length > 0;

  if (!hasActiveFilters) return null;

  const getDeptName = (id: string) => departmentOptions.find(opt => opt.value === id)?.label || id;
  const getDesigName = (id: string) => designationOptions.find(opt => opt.value === id)?.label || id;

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm">Active Filters:</span>
      {activeDisplayName && <Tag prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100">Name: {activeDisplayName}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterDisplayName', activeDisplayName)} /></Tag>}
      {activeDepartments.map(id => <Tag key={`dept-${id}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100">Dept: {getDeptName(id)}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('department_ids', id)} /></Tag>)}
      {activeDesignations.map(id => <Tag key={`desig-${id}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100">Desig: {getDesigName(id)}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('designation_ids', id)} /></Tag>)}
      {hasActiveFilters && <Button size="xs" variant="plain" className="text-red-600 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>}
    </div>
  );
};

// FIX: Corrected the component props to include `activeFilters`.
const RoleTableTools = ({ onSearchChange, onApplyFilters, onClearFilters, onExport, activeFilters, activeFilterCount, departmentOptions, allDesignationOptions, columns, visibleColumnKeys, setVisibleColumnKeys, searchInputValue, isDataReady }) => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { control, handleSubmit, reset } = useForm<RoleFilterFormData>({ defaultValues: { filterDisplayName: '', department_ids: [], designation_ids: [] } });

  // This useEffect hook depends on `activeFilters` and was causing the error.
  useEffect(() => { reset(activeFilters); }, [activeFilters, reset]);

  const onSubmit = (data: RoleFilterFormData) => { onApplyFilters(data); setIsFilterDrawerOpen(false); };
  const onDrawerClear = () => { onApplyFilters({}); reset({ filterDisplayName: '', department_ids: [], designation_ids: [] }); setIsFilterDrawerOpen(false); };

  const isColumnVisible = (header: string) => visibleColumnKeys.includes(header);
  const toggleColumn = (checked: boolean, colHeader: string) => {
    setVisibleColumnKeys(prevKeys =>
      checked
        ? [...prevKeys, colHeader]
        : prevKeys.filter(key => key !== colHeader)
    );
  };

  return (
    <div className="md:flex items-center justify-between w-full gap-2">
      <div className="flex-grow mb-2 md:mb-0"><DebouceInput value={searchInputValue} placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onSearchChange(e.target.value)} /></div>
      <div className="flex gap-2">
        <Dropdown renderTitle={<Button title="Filter Columns" icon={<TbColumns />} />} placement="bottom-end">
          <div className="p-2 flex flex-col"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
            {columns.filter(c => c.header).map(col => (<div key={col.header as string} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox checked={isColumnVisible(col.header as string)} onChange={(checked) => toggleColumn(checked, col.header as string)} />{col.header}</div>))}
          </div>
        </Dropdown>
        <Button title="Clear Filters & Reload" icon={<TbReload />} onClick={onClearFilters} disabled={!isDataReady} />
        <Button icon={<TbFilter />} onClick={() => setIsFilterDrawerOpen(true)} disabled={!isDataReady}>Filter{activeFilterCount > 0 && <Badge className="ml-2" innerClass="bg-indigo-500 text-white">{activeFilterCount}</Badge>}</Button>
        <Button icon={<TbCloudUpload />} menuName="roles" isExport={true} onClick={onExport} disabled={!isDataReady}>Export</Button>
      </div>
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onDrawerClear}>Clear</Button><Button size="sm" variant="solid" type="submit" form="filterRoleForm">Apply</Button></div>}>
        <Form id="filterRoleForm" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormItem label="Display Name"><Controller name="filterDisplayName" control={control} render={({ field }) => <Input {...field} placeholder="Search by name..." />} /></FormItem>
          <FormItem label="Departments"><Controller name="department_ids" control={control} render={({ field }) => <Select isMulti placeholder="Select departments..." options={departmentOptions} value={departmentOptions.filter(o => field.value?.includes(o.value))} onChange={val => field.onChange(val.map(v => v.value))} />} /></FormItem>
          <FormItem label="Designations"><Controller name="designation_ids" control={control} render={({ field }) => <Select isMulti placeholder="Select designations..." options={allDesignationOptions} value={allDesignationOptions.filter(o => field.value?.includes(o.value))} onChange={val => field.onChange(val.map(v => v.value))} />} /></FormItem>
        </Form>
      </Drawer>
    </div>
  );
};

// --- Main RolesListing Component ---
const RolesListing = () => {
  const pageTitle = "System Roles & Permissions";
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { Roles = [], departmentsData = { data: [] }, designationsData = { data: [] }, status: masterLoading } = useSelector(masterSelector, shallowEqual);

  // --- State Management ---
  const [initialLoading, setInitialLoading] = useState(true);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [viewingRole, setViewingRole] = useState<RoleItem | null>(null);
  const [isExportReasonModalOpen, setExportReasonModalOpen] = useState(false);
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingExportReason, setSubmittingExportReason] = useState(false);

  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "updated_at" }, query: "" });
  const [activeFilters, setActiveFilters] = useState<RoleFilterFormData>({});
  const isDataReady = !initialLoading;

  const tableLoading = initialLoading || masterLoading === "loading";

  // --- Data Fetching ---
  const refreshData = useCallback(async () => {
    setInitialLoading(true);
    try {
      await Promise.all([
        dispatch(getRolesAction()),
        dispatch(getDepartmentsAction()),
        dispatch(getDesignationsAction())
      ]);
    } catch (error) {
      console.error("Failed to load initial data:", error);
      toast.push(<Notification title="Data Load Failed" type="danger" />);
    } finally {
      setInitialLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // --- Memoized Select Options ---
  const departmentOptions: SelectOption[] = useMemo(() => Array.isArray(departmentsData?.data) ? departmentsData.data.map(d => ({ value: String(d.id), label: d.name })) : [], [departmentsData?.data]);
  const allDesignationOptions: SelectOption[] = useMemo(() => Array.isArray(designationsData?.data) ? designationsData.data.map(d => ({ value: String(d.id), label: d.name })) : [], [designationsData?.data]);

  // --- Form Hooks ---
  const defaultFormValues: RoleFormData = { display_name: "", name: "", description: "", department_id: "", designation_id: "" };
  const formMethods = useForm<RoleFormData>({ resolver: zodResolver(roleFormSchema), defaultValues: defaultFormValues, mode: "onChange" });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: '' } });

  const { control, handleSubmit, reset, watch, setValue, formState } = formMethods;
  const watchedDepartmentId = watch("department_id");

  const designationOptionsForForm: SelectOption[] = useMemo(() => {
    if (!watchedDepartmentId || !Array.isArray(designationsData?.data)) {
      return [];
    }

    return designationsData.data
      .filter(designation => {
        if (!designation.department_id) {
          return false;
        }
        try {
          const departmentIds: string[] = JSON.parse(designation.department_id);
          return departmentIds.map(String).includes(String(watchedDepartmentId));
        } catch (e) {
          console.error("Failed to parse department_id from designation:", designation, e);
          return false;
        }
      })
      .map(d => ({ value: String(d.id), label: d.name }));

  }, [watchedDepartmentId, designationsData?.data]);

  useEffect(() => {
    if (isEditDrawerOpen) return;
    const department = departmentsData?.data?.find(d => String(d.id) === watchedDepartmentId);
    const designation = designationsData?.data?.find(d => String(d.id) === watch("designation_id"));
    if (department && designation) {
      const deptKey = department.name.toLowerCase().replace(/\s+/g, '_');
      const desigKey = designation.name.toLowerCase().replace(/\s+/g, '_');
      setValue('name', `${deptKey}_${desigKey}`, { shouldValidate: true });
      setValue('display_name', `${department.name} - ${designation.name}`, { shouldValidate: true });
      setValue('description', `Role for the ${designation.name} in the ${department.name} department.`, { shouldValidate: true });
    }
  }, [watchedDepartmentId, watch("designation_id"), departmentsData?.data, designationsData?.data, setValue, isEditDrawerOpen]);

  // --- Modal & Drawer Handlers ---
  const openAddDrawer = () => { reset(defaultFormValues); setIsAddDrawerOpen(true); };
  const closeAddDrawer = () => setIsAddDrawerOpen(false);
  const onAddRoleSubmit = async (data: RoleFormData) => {
    setIsSubmitting(true);
    const resultAction = await dispatch(addRolesAction(data));
    if (addRolesAction.fulfilled.match(resultAction)) {
      toast.push(<Notification title="Role Added" type="success" />);
      closeAddDrawer(); refreshData();
    } else {
      toast.push(<Notification title="Add Failed" type="danger" children={(resultAction.payload as string) || "Could not add role."} />);
    }
    setIsSubmitting(false);
  };

  const openEditDrawer = (role: RoleItem) => {
    setEditingRole(role);
    reset({ ...role, department_id: String(role.department_id), designation_id: String(role.designation_id) });
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => { setEditingRole(null); setIsEditDrawerOpen(false); };
  const onEditRoleSubmit = async (data: RoleFormData) => {
    if (!editingRole) return;
    setIsSubmitting(true);
    const resultAction = await dispatch(editRolesAction({ id: editingRole.id, ...data }));
    if (editRolesAction.fulfilled.match(resultAction)) {
      toast.push(<Notification title="Role Updated" type="success" />);
      closeEditDrawer(); refreshData();
    } else {
      toast.push(<Notification title="Update Failed" type="danger" children={(resultAction.payload as string) || "Could not update role."} />);
    }
    setIsSubmitting(false);
  };

  const openViewModal = (role: RoleItem) => { setViewingRole(role); setViewModalOpen(true); };
  const closeViewModal = () => { setViewingRole(null); setViewModalOpen(false); };

  const openImageViewer = (imageUrl: string | null | undefined) => { if (imageUrl) { setImageToView(imageUrl); setImageViewerOpen(true); } };
  const closeImageViewer = () => { setImageViewerOpen(false); setImageToView(null); };

  // --- Filtering & Table Interaction Handlers ---
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), [tableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query, pageIndex: 1 }), [handleSetTableData]);
  const handleApplyFilters = useCallback((filters: RoleFilterFormData) => { setActiveFilters(filters); handleSetTableData({ pageIndex: 1 }); }, [handleSetTableData]);
  const onClearFiltersAndReload = useCallback(() => { setActiveFilters({}); handleSetTableData({ query: '', pageIndex: 1 }); refreshData(); }, [refreshData, handleSetTableData]);
  const handleRemoveFilter = useCallback((key: keyof RoleFilterFormData, value: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      if (key === 'filterDisplayName') {
        newFilters.filterDisplayName = '';
      } else {
        const currentValues = prev[key] as string[] | undefined;
        if (currentValues) {
          const newValues = currentValues.filter(item => item !== value);
          (newFilters as any)[key] = newValues.length > 0 ? newValues : undefined;
        }
      }
      return newFilters;
    });
    handleSetTableData({ pageIndex: 1 });
  }, [handleSetTableData]);

  const handlePermissionsClick = (role: RoleItem) => {
    navigate('/access-control/permission', { state: { role } });
  };

  // --- Table Columns Definition ---
  const columns: ColumnDef<RoleItem>[] = useMemo(() => [
    { header: "Display Name", accessorKey: "display_name", enableSorting: true, size: 200 },
    { header: "Department", accessorKey: "department.name", size: 150 },
    { header: "Designation", accessorKey: "designation.name", size: 150 },
    { header: "System Key", accessorKey: "name", size: 180 },
    {
      header: "Updated Info", accessorKey: "updated_at", enableSorting: true, size: 220,
      cell: props => {
        const { updated_at, updated_by_user } = props.row.original;
        return <div className="flex items-center gap-2">
          <Avatar
            src={updated_by_user?.profile_pic_path}
            shape="circle"
            size="sm"
            icon={<TbUserCircle />}
            className="cursor-pointer hover:ring-2 hover:ring-indigo-500"
            onClick={() => openImageViewer(updated_by_user?.profile_pic_path)}
          />
          <div>
            <span>{updated_by_user?.name || "N/A"}</span>
            <div className="text-xs"><b>{updated_by_user?.roles?.[0]?.display_name || ""}</b></div>
            <div className="text-xs text-gray-500">{formatCustomDateTime(updated_at)}</div>
          </div>
        </div>
      }
    },
    {
      header: "Actions", id: "action", size: 130,
      meta: { HeaderClass: "text-center", cellClass: "text-center" },
      cell: props => <ActionColumn
        onEdit={() => openEditDrawer(props.row.original)}
        onViewDetail={() => openViewModal(props.row.original)}
        onPermissions={() => handlePermissionsClick(props.row.original)}
      />
    },
  ], [navigate]);

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(
    columns.filter(c => c.header).map(c => c.header as string)
  );
  useEffect(() => {
    setVisibleColumnKeys(columns.filter(c => c.header).map(c => c.header as string));
  }, [columns]);

  const filteredColumns = useMemo(() =>
    columns.filter(c => c.header ? visibleColumnKeys.includes(c.header as string) : true),
    [columns, visibleColumnKeys]
  );

  const handleOpenExportReasonModal = () => {
    if (!allFilteredAndSortedData.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; }
    exportReasonFormMethods.reset(); setExportReasonModalOpen(true);
  };
  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setSubmittingExportReason(true);
    const fileName = `roles_export_${new Date().toISOString().split('T')[0]}.csv`;
    try {
      await dispatch(submitExportReasonAction({ reason: data.reason, module: "Roles", file_name: fileName })).unwrap();
      exportToCsvRoles(fileName, allFilteredAndSortedData, filteredColumns);
      setExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(<Notification title="Failed to Submit Reason" type="danger">{error.message}</Notification>);
    } finally {
      setSubmittingExportReason(false);
    }
  };

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: RoleItem[] = cloneDeep(Roles || []);
    const safeDepartments = departmentsData?.data || [];
    const safeDesignations = designationsData?.data || [];

    processedData = processedData.map(role => ({
      ...role,
      department: safeDepartments.find(d => String(d.id) === String(role.department_id)),
      designation: safeDesignations.find(d => String(d.id) === String(role.designation_id)),
    }));

    if (tableData.query) {
      const q = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(item =>
        item.display_name.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.department?.name.toLowerCase().includes(q) ||
        item.designation?.name.toLowerCase().includes(q)
      );
    }

    if (activeFilters.filterDisplayName) { processedData = processedData.filter(item => item.display_name.toLowerCase().includes(activeFilters.filterDisplayName!.toLowerCase())); }
    if (activeFilters.department_ids?.length) { const ids = new Set(activeFilters.department_ids); processedData = processedData.filter(item => ids.has(String(item.department_id))); }
    if (activeFilters.designation_ids?.length) { const ids = new Set(activeFilters.designation_ids); processedData = processedData.filter(item => ids.has(String(item.designation_id))); }

    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        const aVal = (key as string).split('.').reduce((acc, part) => acc && acc[part], a as any);
        const bVal = (key as string).split('.').reduce((acc, part) => acc && acc[part], b as any);
        if (key.includes('at')) return order === 'asc' ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime() : new Date(bVal as string).getTime() - new Date(aVal as string).getTime();
        return order === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
      });
    }

    const totalCount = processedData.length;
    const startIndex = (tableData.pageIndex - 1) * tableData.pageSize;
    return { pageData: processedData.slice(startIndex, startIndex + tableData.pageSize), total: totalCount, allFilteredAndSortedData: processedData };
  }, [Roles, departmentsData, designationsData, tableData, activeFilters]);

  // IMPROVEMENT: Refined logic to be more explicit, inspired by reference.
  const activeFilterCount = useMemo(() => {
    return Object.values(activeFilters).filter(value => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return !!value; // For non-array values, check if they are truthy (e.g., a non-empty string).
    }).length;
  }, [activeFilters]);

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="lg:flex items-center justify-between mb-4">
            <h3 className="mb-4 lg:mb-0">{pageTitle}</h3>
            <Button variant="solid" menuName="roles" isAdd={true} icon={<TbPlus />} onClick={openAddDrawer} disabled={!isDataReady}> Add New Role </Button>
          </div>
          <div className="mb-4">
            <RoleTableTools onSearchChange={handleSearchChange} onApplyFilters={handleApplyFilters} onClearFilters={onClearFiltersAndReload} onExport={handleOpenExportReasonModal} activeFilters={activeFilters} activeFilterCount={activeFilterCount} departmentOptions={departmentOptions} allDesignationOptions={allDesignationOptions} columns={columns} visibleColumnKeys={visibleColumnKeys} setVisibleColumnKeys={setVisibleColumnKeys} searchInputValue={tableData.query} isDataReady={isDataReady} />
          </div>
          <ActiveFiltersDisplay filters={activeFilters} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFiltersAndReload} departmentOptions={departmentOptions} designationOptions={allDesignationOptions} />
          <div className="flex-grow overflow-auto">
            {/* FIX: Added onPagingChange prop to enable pagination functionality. */}
            <DataTable
              menuName="roles"
              columns={filteredColumns}
              data={pageData}
              loading={tableLoading || isSubmitting}
              pagingData={{ total, pageIndex: tableData.pageIndex, pageSize: tableData.pageSize }}
              onPaginationChange={(p) => setTableData(prev => ({ ...prev, pageIndex: p }))}
              onSelectChange={(s) => setTableData(prev => ({ ...prev, pageSize: s, pageIndex: 1 }))}
              onSort={(s) => setTableData(prev => ({ ...prev, sort: s }))}
              noData={!isDataReady && pageData.length === 0}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <Drawer title={isEditDrawerOpen ? 'Edit Role' : 'Add New Role'} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={isEditDrawerOpen ? closeEditDrawer : closeAddDrawer} width={480} bodyClass="relative" footer={
        <div className="text-right w-full">
          <Button size="sm" className="mr-2" onClick={isEditDrawerOpen ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting}>Cancel</Button>
          <Button size="sm" variant="solid" form="roleForm" type="submit" loading={isSubmitting} disabled={!formState.isValid || isSubmitting}>Save</Button>
        </div>
      }>
        <Form id="roleForm" onSubmit={handleSubmit(isEditDrawerOpen ? onEditRoleSubmit : onAddRoleSubmit)} className="flex flex-col gap-4">
          <FormItem label="Department *" invalid={!!formState.errors.department_id} errorMessage={formState.errors.department_id?.message}>
            <Controller name="department_id" control={control} render={({ field }) =>
              <Select
                placeholder="Select Department"
                options={departmentOptions}
                {...field}
                onChange={val => {
                  field.onChange(val?.value);
                  setValue('designation_id', '');
                }}
                value={departmentOptions.find(o => o.value === field.value)}
              />}
            />
          </FormItem>
          <FormItem label="Designation *" invalid={!!formState.errors.designation_id} errorMessage={formState.errors.designation_id?.message}>
            <Controller name="designation_id" control={control} render={({ field }) =>
              <Select
                placeholder="Select Designation"
                options={designationOptionsForForm}
                {...field}
                isDisabled={!watchedDepartmentId || designationOptionsForForm.length === 0}
                value={designationOptionsForForm.find(o => o.value === field.value)}
                onChange={val => field.onChange(val?.value)}
              />}
            />
          </FormItem>
          <FormItem label="Display Name *" invalid={!!formState.errors.display_name} errorMessage={formState.errors.display_name?.message}>
            <Controller name="display_name" control={control} render={({ field }) => <Input {...field} prefix={<TbUserShield />} placeholder="e.g., Content Manager" />} />
          </FormItem>
          <FormItem label="Role Name / System Key" invalid={!!formState.errors.name} errorMessage={formState.errors.name?.message}>
            <Controller name="name" control={control} render={({ field }) => <Input {...field} prefix={<TbLockAccess />} placeholder="Auto-generated from selections" disabled />} />
          </FormItem>
          <FormItem label="Description *" invalid={!!formState.errors.description} errorMessage={formState.errors.description?.message}>
            <Controller name="description" control={control} render={({ field }) => <Input textArea {...field} prefix={<TbFileDescription />} placeholder="Briefly describe what this role can do." />} />
          </FormItem>
        </Form>
        {isEditDrawerOpen && editingRole && (
          <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-4">
            <div>
              <p className="font-semibold">Last Update By:</p>
              <p>{editingRole.updated_by_user?.name || 'N/A'}</p>
              <p>{editingRole.updated_by_user?.roles?.[0]?.display_name || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p><span className="font-semibold">Created:</span> {formatCustomDateTime(editingRole.created_at)}</p>
              <p><span className="font-semibold">Updated:</span> {formatCustomDateTime(editingRole.updated_at)}</p>
            </div>
          </div>
        )}
      </Drawer>

      <Dialog isOpen={isViewModalOpen} onClose={closeViewModal} width={600} title="Role Details">
        {viewingRole && (
          <div className="p-4 space-y-4">
            <h4 className="text-lg font-bold">{viewingRole.display_name}</h4>
            <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
              <div className="font-semibold text-gray-600 dark:text-gray-300">System Key:</div><div className="col-span-2">{viewingRole.name}</div>
              <div className="font-semibold text-gray-600 dark:text-gray-300">Department:</div><div className="col-span-2">{viewingRole.department?.name || 'N/A'}</div>
              <div className="font-semibold text-gray-600 dark:text-gray-300">Designation:</div><div className="col-span-2">{viewingRole.designation?.name || 'N/A'}</div>
              <div className="font-semibold text-gray-600 dark:text-gray-300 col-span-3 border-t pt-2 mt-2">Description:</div><div className="col-span-3 text-gray-800 dark:text-gray-100">{viewingRole.description}</div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 border-t pt-2 mt-2">
              <p><strong>Created:</strong> {formatCustomDateTime(viewingRole.created_at)}</p>
              <p><strong>Last Updated:</strong> {formatCustomDateTime(viewingRole.updated_at)} by <strong>{viewingRole.updated_by_user?.name || 'N/A'}</strong></p>
            </div>
          </div>
        )}
      </Dialog>

      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"}>
        <p className="mb-4">Please provide a reason for exporting this data.</p>
        <Form id="exportReasonForm" onSubmit={(e) => e.preventDefault()}>
          <FormItem invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}>
            <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => <Input textArea {...field} placeholder="Enter reason..." />} />
          </FormItem>
        </Form>
      </ConfirmDialog>

      <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} shouldCloseOnOverlayClick={true} shouldCloseOnEsc={true} width={600}>
        <div className="flex justify-center items-center p-4">
          {imageToView ? (
            <img src={imageToView} alt="User Profile" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} />
          ) : (
            <p>No image to display.</p>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default RolesListing;