// src/views/your-path/DesignationListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import classNames from "classnames";

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
import Select from "@/components/ui/Select";
import { Card, Drawer, Form, FormItem, Input, Tag } from "@/components/ui";

// Icons
import {
  TbPencil,
  TbDotsVertical,
  TbEye,
  TbShare,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbBriefcase,
  TbUserCircle,
  TbTrash,
  TbReload,
  TbUsers,
  TbPresentation,
  TbPresentationAnalytics,
  TbPresentationOff,
  TbUserX,
  TbUser,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from "@/reduxtool/store"; // For dispatching actions
import {
  // Ensure these actions are correctly defined in your middleware
  // and update the 'designationsData' (or similar) field in your masterSlice
  getDesignationsAction,
  addDesignationAction,
  editDesignationAction,
  deleteDesignationAction,
  deleteAllDesignationsAction, // For bulk delete
} from "@/reduxtool/master/middleware"; // Adjust path as necessary
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice"; // Selector for the master state

// --- Define Designation Type ---
export type DesignationItem = {
  id: string | number;
  name: string;
  created_at?: string;
  updated_at?: string;
};

// --- Zod Schema for Add/Edit Designation Form ---
const designationFormSchema = z.object({
  name: z
    .string()
    .min(1, "Designation name is required.")
    .max(150, "Designation name cannot exceed 150 characters."),
});
type DesignationFormData = z.infer<typeof designationFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterNames: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCreatedBy: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS_DES = ["ID", "Designation Name", "Date Created"];
const CSV_KEYS_DES: (keyof DesignationItem)[] = ["id", "name", "created_at"];

function exportDesignationsToCsv(filename: string, rows: DesignationItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info" duration={2000}>
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const separator = ",";
  const csvContent =
    CSV_HEADERS_DES.join(separator) +
    "\n" +
    rows
      .map((row) =>
        CSV_KEYS_DES.map((k) => {
          let cell = row[k];
          if (k === "created_at" && cell) {
            try {
              cell = new Date(cell as string).toLocaleDateString();
            } catch (e) {
              /* keep original if invalid */
            }
          }
          if (cell === null || cell === undefined) cell = "";
          else cell = String(cell).replace(/"/g, '""');
          if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
          return cell;
        }).join(separator)
      )
      .join("\n");

  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }
  toast.push(
    <Notification title="Export Failed" type="danger" duration={3000}>
      Browser does not support this feature.
    </Notification>
  );
  return false;
}

// --- ActionColumn Component ---
const ActionColumn = ({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      {/* <Tooltip title="Delete">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`}
          role="button"
          // IMPORTANT: You have onClick={onViewDetail} here. It should be onClick={onDelete}
          onClick={onDelete} // Corrected: This should call the onDelete prop
        >
          <TbTrash />
        </div>
      </Tooltip> */}
      
    </div>
  );
};
ActionColumn.displayName = "ActionColumn";

// --- DesignationsSearch Component ---
type DesignationsSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const DesignationsSearch = React.forwardRef<
  HTMLInputElement,
  DesignationsSearchProps
>(({ onInputChange }, ref) => (
  <DebouceInput
    ref={ref}
    className="w-full"
    placeholder="Quick Search..."
    suffix={<TbSearch className="text-lg" />}
    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
      onInputChange(e.target.value)
    }
  />
));
DesignationsSearch.displayName = "DesignationsSearch";

// --- DesignationsTableTools Component ---
const DesignationsTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
  onClearFilters,
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow">
      <DesignationsSearch onInputChange={onSearchChange} />
    </div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Tooltip title="Clear Filters">
        <Button icon={<TbReload />} onClick={onClearFilters}></Button>
      </Tooltip>
      <Button
        icon={<TbFilter />}
        onClick={onFilter}
        className="w-full sm:w-auto"
      >
        Filter
      </Button>
      <Button
        icon={<TbCloudUpload />}
        onClick={onExport}
        className="w-full sm:w-auto"
      >
        Export
      </Button>
    </div>
  </div>
);
DesignationsTableTools.displayName = "DesignationsTableTools";

// --- DesignationsSelectedFooter Component ---
type DesignationsSelectedFooterProps = {
  selectedItems: DesignationItem[];
  onDeleteSelected: () => void;
  disabled?: boolean;
};
const DesignationsSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
  disabled,
}: DesignationsSelectedFooterProps) => {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const handleDeleteClick = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const handleConfirmDelete = () => {
    onDeleteSelected();
    setDeleteConfirmationOpen(false);
  };
  if (selectedItems.length === 0) return null;
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
              <span className="heading-text">{selectedItems.length}</span>
              <span>
                Designation{selectedItems.length > 1 ? "s" : ""} selected
              </span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={handleDeleteClick}
              disabled={disabled}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Designation${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        loading={disabled}
      >
        <p>
          Are you sure you want to delete the selected designation
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};
DesignationsSelectedFooter.displayName = "DesignationsSelectedFooter";

// --- Main DesignationListing Component ---
const DesignationListing = () => {
  const dispatch = useAppDispatch();
  // Get data from Redux store. Ensure 'designationsData' key matches your masterSlice.
  const {
    designationsData = [], // Default to empty array
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DesignationItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // isSubmitting and isDeleting are still useful for button loading states independent of global masterLoadingStatus
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DesignationItem | null>(
    null
  );

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterNames: [],
    filterCreatedBy: [],
  });

  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<DesignationItem[]>([]);

  // Fetch initial data
  useEffect(() => {
    dispatch(getDesignationsAction());
  }, [dispatch]);

  const addFormMethods = useForm<DesignationFormData>({
    resolver: zodResolver(designationFormSchema),
    defaultValues: { name: "" },
    mode: "onChange",
  });
  const editFormMethods = useForm<DesignationFormData>({
    resolver: zodResolver(designationFormSchema),
    defaultValues: { name: "" },
    mode: "onChange",
  });
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openAddDrawer = useCallback(() => {
    addFormMethods.reset({ name: "" });
    setIsAddDrawerOpen(true);
  }, [addFormMethods]);
  const closeAddDrawer = useCallback(() => {
    addFormMethods.reset({ name: "" });
    setIsAddDrawerOpen(false);
  }, [addFormMethods]);

  const onAddDesignationSubmit = useCallback(
    async (data: DesignationFormData) => {
      setIsSubmitting(true);
      try {
        // Dispatch Redux action for adding
        await dispatch(addDesignationAction(data)).unwrap(); // Assuming payload is {name, created_by}
        toast.push(
          <Notification
            title="Designation Added"
            type="success"
            duration={2000}
          >{`Designation "${data.name}" added.`}</Notification>
        );
        closeAddDrawer();
        dispatch(getDesignationsAction()); // Refresh the list from server
      } catch (error: any) {
        const message =
          error?.message ||
          error?.data?.message ||
          "Could not add designation.";
        toast.push(
          <Notification title="Failed to Add" type="danger" duration={3000}>
            {message}
          </Notification>
        );
        console.error("Add Designation Error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, closeAddDrawer]
  );

  const openEditDrawer = useCallback(
    (item: DesignationItem) => {
      setEditingItem(item);
      editFormMethods.reset({ name: item.name });
      setIsEditDrawerOpen(true);
    },
    [editFormMethods]
  );

  const closeEditDrawer = useCallback(() => {
    setEditingItem(null);
    editFormMethods.reset({ name: "" });
    setIsEditDrawerOpen(false);
  }, [editFormMethods]);

  const onEditDesignationSubmit = useCallback(
    async (data: DesignationFormData) => {
      if (!editingItem?.id) {
        toast.push(
          <Notification title="Error" type="danger">
            Cannot edit: Designation ID is missing.
          </Notification>
        );
        return;
      }
      setIsSubmitting(true);
      try {
        // Dispatch Redux action for editing
        const payload = { id: editingItem.id, ...data }; // Payload: {id, name, created_by}
        await dispatch(editDesignationAction(payload)).unwrap();
        toast.push(
          <Notification
            title="Designation Updated"
            type="success"
            duration={2000}
          >{`Designation "${data.name}" updated.`}</Notification>
        );
        closeEditDrawer();
        dispatch(getDesignationsAction()); // Refresh the list
      } catch (error: any) {
        const message =
          error?.message ||
          error?.data?.message ||
          "Could not update designation.";
        toast.push(
          <Notification title="Failed to Update" type="danger" duration={3000}>
            {message}
          </Notification>
        );
        console.error("Edit Designation Error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, editingItem, closeEditDrawer]
  );

  const handleDeleteClick = useCallback((item: DesignationItem) => {
    if (item.id === undefined || item.id === null) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Designation ID is missing.
        </Notification>
      );
      return;
    }
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);

  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete?.id) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Designation ID is missing.
        </Notification>
      );
      setIsDeleting(false);
      setItemToDelete(null);
      setSingleDeleteConfirmOpen(false);
      return;
    }
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false); // Close dialog before async operation
    try {
      // Dispatch Redux action for deleting
      await dispatch(deleteDesignationAction({ id: itemToDelete.id })).unwrap(); // Assuming action takes {id}
      toast.push(
        <Notification
          title="Designation Deleted"
          type="success"
          duration={2000}
        >{`Designation "${itemToDelete.name}" deleted.`}</Notification>
      );
      setSelectedItems((prev) =>
        prev.filter((item) => item.id !== itemToDelete!.id)
      );
      dispatch(getDesignationsAction()); // Refresh the list
    } catch (error: any) {
      const message =
        error?.message ||
        error?.data?.message ||
        "Could not delete designation.";
      toast.push(
        <Notification title="Failed to Delete" type="danger" duration={3000}>
          {message}
        </Notification>
      );
      console.error("Delete Designation Error:", error);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  }, [dispatch, itemToDelete]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) {
      toast.push(
        <Notification title="No Selection" type="info">
          Please select items to delete.
        </Notification>
      );
      return;
    }
    setIsDeleting(true);
    const validItemsToDelete = selectedItems.filter(
      (item) => item.id !== undefined && item.id !== null
    );

    if (validItemsToDelete.length !== selectedItems.length) {
      toast.push(
        <Notification title="Deletion Warning" type="warning" duration={3000}>
          Some selected items had missing IDs and were skipped.
        </Notification>
      );
    }
    if (validItemsToDelete.length === 0) {
      toast.push(
        <Notification title="No Valid Items" type="info">
          No valid items to delete.
        </Notification>
      );
      setIsDeleting(false);
      return;
    }
    const idsToDelete = validItemsToDelete.map((item) => String(item.id));
    try {
      // Dispatch Redux action for bulk deleting
      await dispatch(
        deleteAllDesignationsAction({ ids: idsToDelete.join(",") })
      ).unwrap(); // Expects {ids: "id1,id2"}
      toast.push(
        <Notification
          title="Deletion Successful"
          type="success"
          duration={2000}
        >{`${validItemsToDelete.length} designation(s) deleted.`}</Notification>
      );
      setSelectedItems([]);
      dispatch(getDesignationsAction()); // Refresh the list
    } catch (error: any) {
      const message =
        error?.message ||
        error?.data?.message ||
        "Failed to delete selected designations.";
      toast.push(
        <Notification title="Deletion Failed" type="danger" duration={3000}>
          {message}
        </Notification>
      );
      console.error("Delete Selected Designations Error:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, selectedItems]);

  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
  }, []);

  const onApplyFiltersSubmit = useCallback(
    (data: FilterFormData) => {
      setFilterCriteria({
        filterNames: data.filterNames || [],
        filterCreatedBy: data.filterCreatedBy || [],
      });
      handleSetTableData({ pageIndex: 1 });
      closeFilterDrawer();
    },
    [closeFilterDrawer, handleSetTableData]
  );

  const onClearFilters = useCallback(() => {
    const defaultFilters = { filterNames: [], filterCreatedBy: [] };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 });
  }, [filterFormMethods, handleSetTableData]);

  const designationNameOptions = useMemo(() => {
    if (!Array.isArray(designationsData)) return [];
    const uniqueNames = new Set(designationsData.map((item) => item.name));
    return Array.from(uniqueNames).map((name) => ({
      value: name,
      label: name,
    }));
  }, [designationsData]);

  const createdByOptions = useMemo(() => {
    if (!Array.isArray(designationsData)) return [];
    const uniqueCreators = new Set(
      designationsData.map((item) => item.created_by)
    );
    return Array.from(uniqueCreators).map((creator) => ({
      value: creator,
      label: creator,
    }));
  }, [designationsData]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    // Data now comes from Redux store (designationsData)
    const sourceData: DesignationItem[] = Array.isArray(designationsData)
      ? designationsData
      : [];
    let processedData: DesignationItem[] = cloneDeep(sourceData);

    if (filterCriteria.filterNames && filterCriteria.filterNames.length > 0) {
      const selectedNames = filterCriteria.filterNames.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter(
        (item) => item.name && selectedNames.includes(item.name.toLowerCase())
      );
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          String(item.id).toLowerCase().includes(query) ||
          (item.name && item.name.toLowerCase().includes(query))
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      processedData.length > 0 &&
      processedData[0].hasOwnProperty(key)
    ) {
      processedData.sort((a, b) => {
        const aValue = a[key as keyof DesignationItem];
        const bValue = b[key as keyof DesignationItem];
        if (aValue === null || aValue === undefined)
          return order === "asc" ? -1 : 1;
        if (bValue === null || bValue === undefined)
          return order === "asc" ? 1 : -1;
        if (
          key === "id" &&
          typeof aValue === "number" &&
          typeof bValue === "number"
        ) {
          return order === "asc" ? aValue - bValue : bValue - aValue;
        }
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        return order === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }
    const dataToExport = [...processedData];
    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
    return {
      pageData: dataForPage,
      total: currentTotal,
      allFilteredAndSortedData: dataToExport,
    };
  }, [designationsData, tableData, filterCriteria]);

  const handleExportData = useCallback(() => {
    const success = exportDesignationsToCsv(
      "designations_export.csv",
      allFilteredAndSortedData
    );
    if (success)
      toast.push(
        <Notification title="Export Successful" type="success" duration={2000}>
          Data exported.
        </Notification>
      );
  }, [allFilteredAndSortedData]);

  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handleSelectChange = useCallback(
    (value: number) => {
      handleSetTableData({ pageSize: Number(value), pageIndex: 1 });
      setSelectedItems([]);
    },
    [handleSetTableData]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => {
      handleSetTableData({ sort: sort, pageIndex: 1 });
    },
    [handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
    [handleSetTableData]
  );

  const handleRowSelect = useCallback(
    (checked: boolean, row: DesignationItem) => {
      setSelectedItems((prev) => {
        if (checked)
          return prev.some((item) => item.id === row.id)
            ? prev
            : [...prev, row];
        return prev.filter((item) => item.id !== row.id);
      });
    },
    []
  );

  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<DesignationItem>[]) => {
      const currentPageRowOriginals = currentRows.map((r) => r.original);
      if (checked) {
        setSelectedItems((prevSelected) => {
          const prevSelectedIds = new Set(prevSelected.map((item) => item.id));
          const newRowsToAdd = currentPageRowOriginals.filter(
            (r) => r.id !== undefined && !prevSelectedIds.has(r.id)
          );
          return [...prevSelected, ...newRowsToAdd];
        });
      } else {
        const currentPageRowIds = new Set(
          currentPageRowOriginals
            .map((r) => r.id)
            .filter((id) => id !== undefined)
        );
        setSelectedItems((prevSelected) =>
          prevSelected.filter(
            (item) => item.id !== undefined && !currentPageRowIds.has(item.id)
          )
        );
      }
    },
    []
  );

  const columns: ColumnDef<DesignationItem>[] = useMemo(
    () => [
      // { header: "ID", accessorKey: "id", enableSorting: true, size: 100 },
      { header: "Designation", accessorKey: "name", enableSorting: true },
      { header: "Department", accessorKey: "department", enableSorting: true, cell : props => <div>-</div> },
      { header: "Reporting to", accessorKey: "reporting", enableSorting: true, cell : props => <div>-</div> },
      { header: "Total Employees", accessorKey: "employees", enableSorting: true, cell : props => <div>-</div> },
      {
        header: "Status", accessorKey: "status", enableSorting: true, size: 80, meta: { HeaderClass: "text-red-500" },
        cell: () => {
          return (
            <Tag className="bg-green-100 text-green-500">Active</Tag>
          )
        }
      },
      {
        header: "Actions",
        id: "action",
        size: 120,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)} // This 
          />
        ),
      },
    ],
    [openEditDrawer, handleDeleteClick]
  );

  // DataTable loading state should reflect Redux loading status and local submitting/deleting states
  const tableIsLoading =
    masterLoadingStatus === "loading" || isSubmitting || isDeleting;

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">
               Designations
            </h5>
            <Button
              variant="solid"
              icon={<TbPlus />}
              onClick={openAddDrawer}
              disabled={tableIsLoading} // Disable if any loading operation is in progress
            >
              Add New
            </Button>
          </div>

          <div className="grid grid-cols-6 mb-4 gap-2">
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                <TbPresentation size={24} />
              </div>
              <div>
                <h6 className="text-blue-500">12</h6>
                <span className="font-semibold text-xs">Total</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-violet-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
                <TbPresentationAnalytics size={24} />
              </div>
              <div>
                <h6 className="text-violet-500">4</h6>
                <span className="font-semibold text-xs">Active</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-pink-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500">
                <TbPresentationOff size={24} />
              </div>
              <div>
                <h6 className="text-pink-500">8</h6>
                <span className="font-semibold text-xs">Inactive</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-orange-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500">
                <TbUsers size={24} />
              </div>
              <div>
                <h6 className="text-orange-500">34</h6>
                <span className="font-semibold text-xs">Total Emp.</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                <TbUser size={24} />
              </div>
              <div>
                <h6 className="text-green-500">34</h6>
                <span className="font-semibold text-xs">Active Emp.</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                <TbUserX size={24} />
              </div>
              <div>
                <h6 className="text-red-500">34</h6>
                <span className="font-semibold text-xs">Inactive Emp.</span>
              </div>
            </Card>
          </div>

          <DesignationsTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
            onClearFilters={onClearFilters}
          />
          <div className="mt-4 flex-grow overflow-auto">
            <DataTable
              columns={columns}
              data={pageData}
              loading={tableIsLoading}
              pagingData={{
                total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              // selectable
              checkboxChecked={(row) =>
                selectedItems.some((selected) => selected.id === row.id)
              }
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectChange}
              onSort={handleSort}
              onCheckBoxChange={handleRowSelect}
              onIndeterminateCheckBoxChange={handleAllRowSelect}
              noData={!tableIsLoading && pageData.length === 0} // Show noData only if not loading and data is empty
            />
          </div>
        </AdaptiveCard>
      </Container>

      <DesignationsSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
        disabled={isDeleting || masterLoadingStatus === "loading"}
      />

      <Drawer
        title="Add Designation"
        isOpen={isAddDrawerOpen}
        onClose={closeAddDrawer}
        onRequestClose={closeAddDrawer}
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              onClick={closeAddDrawer}
              disabled={isSubmitting}
              type="button"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="addDesignationForm"
              type="submit"
              loading={isSubmitting}
              disabled={!addFormMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Save"}
            </Button>
          </div>
        }
      >
        <Form
          id="addDesignationForm"
          onSubmit={addFormMethods.handleSubmit(onAddDesignationSubmit)}
          className="flex flex-col gap-y-6"
        >
          <FormItem
            label={<div>Designation Name<span className="text-red-500"> * </span></div>}
            invalid={!!addFormMethods.formState.errors.name}
            errorMessage={addFormMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter Designation Name" />
              )}
            />
          </FormItem>
          <FormItem
            label={<div>Department<span className="text-red-500"> * </span></div>}
          >
            <Controller
              name="department"
              control={addFormMethods.control}
              render={({ field }) => (
                <Select {...field} placeholder="Select Department" 
                  options={[
                    {label:"IT" , value:"IT"},
                    {label:"Sales" , value:"Sales"},
                  ]}
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Reporting To"
          >
            <Controller
              name="Reporting To"
              control={addFormMethods.control}
              render={({ field }) => (
                <Select {...field} placeholder="Select Reporting Person" 
                  options={[
                    {label:"Tushar Joshi" , value:"Tushar Joshi"},
                    {label:"Rahul Bayad" , value:"Rahul Bayad"},
                  ]}
                />
              )}
            />
          </FormItem>
          <FormItem
            label={<div>Status<span className="text-red-500"> * </span></div>}
          >
            <Controller
              name="Status"
              control={addFormMethods.control}
              render={({ field }) => (
                <Select {...field} placeholder="Select Status" 
                  options={[
                    {label:"Active" , value:"Active"},
                    {label:"Inactive", value:"Inactive"},
                  ]}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      <Drawer
        title="Edit Designation"
        isOpen={isEditDrawerOpen}
        onClose={closeEditDrawer}
        onRequestClose={closeEditDrawer}
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              onClick={closeEditDrawer}
              disabled={isSubmitting}
              type="button"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="editDesignationForm"
              type="submit"
              loading={isSubmitting}
              disabled={
                !editFormMethods.formState.isValid ||
                isSubmitting ||
                !editFormMethods.formState.isDirty
              }
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        <Form
          id="editDesignationForm"
          onSubmit={editFormMethods.handleSubmit(onEditDesignationSubmit)}
          className="flex flex-col gap-y-6"
        >
          <FormItem
            label={<div>Designation Name<span className="text-red-500"> * </span></div>}
            invalid={!!editFormMethods.formState.errors.name}
            errorMessage={editFormMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter Designation Name" />
              )}
            />
          </FormItem>
          <FormItem
            label={<div>Department Name<span className="text-red-500"> * </span></div>}
          >
            <Controller
              name="department"
              control={addFormMethods.control}
              render={({ field }) => (
                <Select {...field} placeholder="Select Department" 
                  options={[
                    {label:"IT" , value:"IT"},
                    {label:"Sales" , value:"Sales"},
                  ]}
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Reporting To"
          >
            <Controller
              name="Reporting To"
              control={addFormMethods.control}
              render={({ field }) => (
                <Select {...field} placeholder="Select Reporting Person" 
                  options={[
                    {label:"Tushar Joshi" , value:"Tushar Joshi"},
                    {label:"Rahul Bayad" , value:"Rahul Bayad"},
                  ]}
                />
              )}
            />
          </FormItem>
          <FormItem
            label={<div>Status<span className="text-red-500"> * </span></div>}
          >
            <Controller
              name="Status"
              control={addFormMethods.control}
              render={({ field }) => (
                <Select {...field} placeholder="Select Status" 
                  options={[
                    {label:"Active" , value:"Active"},
                    {label:"Inactive", value:"Inactive"},
                  ]}
                />
              )}
            />
          </FormItem>
        </Form>
        <div className="absolute bottom-[14%] w-[88%]">
          <div className="flex justify-between gap-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
            <div className="">
              <b className="mt-3 mb-3 font-semibold text-primary">Latest Update:</b><br/>
              <p className="text-sm font-semibold">Tushar Joshi</p>
              <p>System Admin</p>
            </div>
            <div className="w-[210px]"><br/>
              <span className="font-semibold">Created At:</span> <span>27 May, 2025, 2:00 PM</span><br/>
              <span className="font-semibold">Updated At:</span> <span>27 May, 2025, 2:00 PM</span>
            </div>
          </div>
        </div>
      </Drawer>

      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            <div>
              <Button
                size="sm"
                className="mr-2"
                onClick={closeFilterDrawer}
                type="button"
              >
                Clear
              </Button>
              <Button
                size="sm"
                variant="solid"
                form="filterDesignationForm"
                type="submit"
              >
                Apply
              </Button>
            </div>
          </div>
        }
      >
        <Form
          id="filterDesignationForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-y-6"
        >
          <FormItem label="Designation Name">
            <Controller
              name="filterNames"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select designation names..."
                  options={designationNameOptions}
                  value={field.value || []}
                  onChange={(selectedVal) => field.onChange(selectedVal || [])}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Designation"
        onClose={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onRequestClose={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onCancel={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={onConfirmSingleDelete}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete the designation "
          <strong>{itemToDelete?.name}</strong>"? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

export default DesignationListing;
