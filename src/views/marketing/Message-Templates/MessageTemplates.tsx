// src/views/your-path/MessageTemplates.tsx (New file name)

import React, { useState, useMemo, useCallback, Ref } from "react";
import { Link, useNavigate } from "react-router-dom";
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Avatar from "@/components/ui/Avatar"; // Keep if needed elsewhere, maybe icon for template type?
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";
import DebouceInput from "@/components/shared/DebouceInput";
import {
  TbMessage2,
  TbFileText,
  TbFilter,
  TbCloudUpload,
} from "react-icons/tb"; // Placeholder icons

// Icons
import { TbPencil, TbTrash, TbChecks, TbSearch, TbPlus } from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// --- Define Item Type ---
export type MessageTemplateItem = {
  id: string; // Unique ID for the template record
  name: string; // User-friendly name (e.g., "Password Reset SMS", "Appointment Reminder")
  // Add createdDate if needed for sorting/display
  createdDate?: Date;
};
// --- End Item Type ---

// --- Constants ---
const initialDummyMessageTemplates: MessageTemplateItem[] = [
  {
    id: "MSG001",
    name: "Appointment Reminder SMS",
    createdDate: new Date(2023, 10, 1),
  },
  {
    id: "MSG002",
    name: "Password Reset OTP Email",
    createdDate: new Date(2023, 9, 15),
  },
  {
    id: "MSG003",
    name: "Order Shipped Notification Push",
    createdDate: new Date(2023, 8, 20),
  },
  {
    id: "MSG004",
    name: "Account Verification Email",
    createdDate: new Date(2023, 7, 10),
  },
  {
    id: "MSG005",
    name: "Promotional Offer SMS",
    createdDate: new Date(2023, 10, 5),
  },
  {
    id: "MSG006",
    name: "Two-Factor Authentication Code",
    createdDate: new Date(2023, 6, 5),
  },
  {
    id: "MSG007",
    name: "Subscription Renewal Reminder",
    createdDate: new Date(2023, 9, 1),
  },
  {
    id: "MSG008",
    name: "Support Ticket Received Auto-Reply",
    createdDate: new Date(2023, 8, 1),
  },
];
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const iconButtonClass =
    "text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";

  return (
    <div className="flex items-center justify-center">
      {/* Edit Button */}
      <Tooltip title="Edit Template">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
          )}
          role="button"
          onClick={onEdit}
        >
          {" "}
          <TbPencil />{" "}
        </div>
      </Tooltip>
      {/* Delete Button */}
      <Tooltip title="Delete Template">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
          )}
          role="button"
          onClick={onDelete}
        >
          {" "}
          <TbTrash />{" "}
        </div>
      </Tooltip>
    </div>
  );
};
// --- End ActionColumn ---

// --- TemplateTable Component ---
const TemplateTable = ({
  columns,
  data,
  loading,
  pagingData,
  selectedTemplates,
  onPaginationChange,
  onSelectChange,
  onSort,
  onRowSelect,
  onAllRowSelect,
}: {
  columns: ColumnDef<MessageTemplateItem>[];
  data: MessageTemplateItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedTemplates: MessageTemplateItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: MessageTemplateItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<MessageTemplateItem>[]) => void;
}) => {
  return (
    <DataTable
      selectable
      columns={columns}
      data={data}
      loading={loading}
      pagingData={pagingData}
      checkboxChecked={(row) =>
        selectedTemplates.some((selected) => selected.id === row.id)
      }
      onPaginationChange={onPaginationChange}
      onSelectChange={onSelectChange}
      onSort={onSort}
      onCheckBoxChange={onRowSelect}
      onIndeterminateCheckBoxChange={onAllRowSelect}
      noData={!loading && data.length === 0}
    />
  );
};
// --- End TemplateTable ---

// --- TemplateSearch Component ---
type TemplateSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const TemplateSearch = React.forwardRef<HTMLInputElement, TemplateSearchProps>(
  ({ onInputChange }, ref) => {
    return (
      <DebouceInput
        ref={ref}
        placeholder="Quick Search..."
        suffix={<TbSearch className="text-lg" />}
        onChange={(e) => onInputChange(e.target.value)}
      />
    );
  }
);
TemplateSearch.displayName = "TemplateSearch";
// --- End TemplateSearch ---

// --- TemplateTableTools Component ---
const TemplateTableTools = ({
  onSearchChange,
}: {
  onSearchChange: (query: string) => void;
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
      <div className="flex-grow">
        <TemplateSearch onInputChange={onSearchChange} />
      </div>
      <Button icon={<TbFilter />} className="">
        Filter
      </Button>
      <Button icon={<TbCloudUpload />}>Export</Button>
    </div>
  );
};
// --- End TemplateTableTools ---

// --- TemplateActionTools Component ---
const TemplateActionTools = ({
  allTemplates,
}: {
  allTemplates: MessageTemplateItem[];
}) => {
  const navigate = useNavigate();
  const handleAdd = () => navigate("/message-templates/create"); // Adjust route

  return (
    <div className="flex flex-col md:flex-row gap-3">
      {" "}
      <Button variant="solid" icon={<TbPlus />} onClick={handleAdd} block>
        {" "}
        Add New{" "}
      </Button>{" "}
    </div>
  );
};
// --- End TemplateActionTools ---

// --- TemplateSelected Component ---
const TemplateSelected = ({
  selectedTemplates,
  setSelectedTemplates,
  onDeleteSelected,
}: {
  selectedTemplates: MessageTemplateItem[];
  setSelectedTemplates: React.Dispatch<
    React.SetStateAction<MessageTemplateItem[]>
  >;
  onDeleteSelected: () => void;
}) => {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const handleDeleteClick = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const handleConfirmDelete = () => {
    onDeleteSelected();
    setDeleteConfirmationOpen(false);
  };

  if (selectedTemplates.length === 0) return null;

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
              <span className="heading-text">{selectedTemplates.length}</span>
              <span>
                Template
                {selectedTemplates.length > 1 ? "s" : ""} selected
              </span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={handleDeleteClick}
            >
              Delete
            </Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedTemplates.length} Template${
          selectedTemplates.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>
          Are you sure you want to delete the selected template
          {selectedTemplates.length > 1 ? "s" : ""}? This action cannot be
          undone.
        </p>
      </ConfirmDialog>
    </>
  );
};
// --- End TemplateSelected ---

// --- Main MessageTemplates Component ---
const MessageTemplates = () => {
  const navigate = useNavigate();

  // --- State ---
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplateItem[]>(
    initialDummyMessageTemplates
  );
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedTemplates, setSelectedTemplates] = useState<
    MessageTemplateItem[]
  >([]);
  // --- End State ---

  // --- Data Processing ---
  const { pageData, total } = useMemo(() => {
    let processedData = [...templates];

    // Search
    if (tableData.query) {
      const query = tableData.query.toLowerCase();
      processedData = processedData.filter(
        (t) =>
          t.id.toLowerCase().includes(query) ||
          t.name.toLowerCase().includes(query)
      );
    }

    // Sorting
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      const sortedData = [...processedData];
      sortedData.sort((a, b) => {
        if (key === "createdDate" && a.createdDate && b.createdDate) {
          // Check if date exists
          return order === "asc"
            ? a.createdDate.getTime() - b.createdDate.getTime()
            : b.createdDate.getTime() - a.createdDate.getTime();
        }
        const aValue = a[key as keyof MessageTemplateItem] ?? "";
        const bValue = b[key as keyof MessageTemplateItem] ?? "";
        if (typeof aValue === "string" && typeof bValue === "string") {
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        return 0;
      });
      processedData = sortedData;
    }

    // Pagination
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const dataTotal = processedData.length;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);

    return { pageData: dataForPage, total: dataTotal };
  }, [templates, tableData]);
  // --- End Data Processing ---

  // --- Handlers ---
  const handleSetTableData = useCallback((data: TableQueries) => {
    setTableData(data);
  }, []);
  const handlePaginationChange = useCallback(
    (page: number) => {
      handleSetTableData({ ...tableData, pageIndex: page });
    },
    [tableData, handleSetTableData]
  );
  const handleSelectChange = useCallback(
    (value: number) => {
      handleSetTableData({
        ...tableData,
        pageSize: Number(value),
        pageIndex: 1,
      });
      setSelectedTemplates([]);
    },
    [tableData, handleSetTableData]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => {
      handleSetTableData({ ...tableData, sort: sort, pageIndex: 1 });
    },
    [tableData, handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => {
      handleSetTableData({ ...tableData, query: query, pageIndex: 1 });
    },
    [tableData, handleSetTableData]
  );

  const handleRowSelect = useCallback(
    (checked: boolean, row: MessageTemplateItem) => {
      setSelectedTemplates((prev) => {
        if (checked) {
          return prev.some((t) => t.id === row.id) ? prev : [...prev, row];
        } else {
          return prev.filter((t) => t.id !== row.id);
        }
      });
    },
    [setSelectedTemplates]
  );

  const handleAllRowSelect = useCallback(
    (checked: boolean, rows: Row<MessageTemplateItem>[]) => {
      const rowIds = new Set(rows.map((r) => r.original.id));
      setSelectedTemplates((prev) => {
        if (checked) {
          const originalRows = rows.map((row) => row.original);
          const existingIds = new Set(prev.map((t) => t.id));
          const newSelection = originalRows.filter(
            (t) => !existingIds.has(t.id)
          );
          return [...prev, ...newSelection];
        } else {
          return prev.filter((t) => !rowIds.has(t.id));
        }
      });
    },
    [setSelectedTemplates]
  );

  const handleEdit = useCallback(
    (template: MessageTemplateItem) => {
      console.log("Edit template:", template.id);
      navigate(`/message-templates/edit/${template.id}`); // Adjust route
    },
    [navigate]
  );

  const handleDelete = useCallback(
    (templateToDelete: MessageTemplateItem) => {
      console.log("Deleting template:", templateToDelete.id);
      setTemplates((current) =>
        current.filter((t) => t.id !== templateToDelete.id)
      );
      setSelectedTemplates((prev) =>
        prev.filter((t) => t.id !== templateToDelete.id)
      );
      toast.push(
        <Notification
          title="Template Deleted"
          type="success"
          duration={2000}
        >{`Template '${templateToDelete.name}' deleted.`}</Notification>
      );
    },
    [setTemplates, setSelectedTemplates]
  );

  const handleDeleteSelected = useCallback(() => {
    console.log(
      "Deleting selected templates:",
      selectedTemplates.map((t) => t.id)
    );
    const selectedIds = new Set(selectedTemplates.map((t) => t.id));
    setTemplates((current) => current.filter((t) => !selectedIds.has(t.id)));
    setSelectedTemplates([]);
    toast.push(
      <Notification
        title="Templates Deleted"
        type="success"
        duration={2000}
      >{`${selectedIds.size} template(s) deleted.`}</Notification>
    );
  }, [selectedTemplates, setTemplates, setSelectedTemplates]);
  // --- End Handlers ---

  // --- Define Columns ---
  const columns: ColumnDef<MessageTemplateItem>[] = useMemo(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        enableSorting: true,
        width: 120,
      },
      { header: "Name", accessorKey: "name", enableSorting: true },
      // Optionally add Created Date column back if needed
      // {
      //    header: 'Created Date', accessorKey: 'createdDate', enableSorting: true, width: 180,
      //    cell: props => { const date = props.row.original.createdDate; return date ? <span>{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> : <span>-</span>; }
      // },
      {
        header: "Action",
        id: "action",
        size: 100, // Adjusted width for fewer actions
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onEdit={() => handleEdit(props.row.original)}
            onDelete={() => handleDelete(props.row.original)}
            // Clone and Status Change removed
          />
        ),
      },
    ],
    [handleEdit, handleDelete] // Updated dependencies
  );
  // --- End Define Columns ---

  // --- Render Main Component ---
  return (
    <Container className="h-full">
      <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
        {/* Header */}
        <div className="lg:flex items-center justify-between mb-4">
          <h5 className="mb-4 lg:mb-0">Message Templates Listing</h5>
          <TemplateActionTools allTemplates={templates} />
        </div>

        {/* Tools */}
        <div className="mb-4">
          <TemplateTableTools onSearchChange={handleSearchChange} />
          {/* Filter component removed */}
        </div>

        {/* Table */}
        <div className="flex-grow overflow-auto">
          <TemplateTable
            columns={columns}
            data={pageData}
            loading={isLoading}
            pagingData={{
              total,
              pageIndex: tableData.pageIndex as number,
              pageSize: tableData.pageSize as number,
            }}
            selectedTemplates={selectedTemplates}
            onPaginationChange={handlePaginationChange}
            onSelectChange={handleSelectChange}
            onSort={handleSort}
            onRowSelect={handleRowSelect}
            onAllRowSelect={handleAllRowSelect}
          />
        </div>
      </AdaptiveCard>

      {/* Selected Footer */}
      <TemplateSelected
        selectedTemplates={selectedTemplates}
        setSelectedTemplates={setSelectedTemplates}
        onDeleteSelected={handleDeleteSelected}
      />
    </Container>
  );
};
// --- End Main Component ---

export default MessageTemplates;

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
