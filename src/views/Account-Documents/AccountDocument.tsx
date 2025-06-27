import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form"; // For Filter, Assign, Change Status drawers
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { useNavigate } from "react-router-dom";

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Tag from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";
import DebouceInput from "@/components/shared/DebouceInput";
import {
  Drawer,
  Form,
  Input,
  Select as UiSelect,
  DatePicker,
  FormItem,
  Select,
  Card,
} from "@/components/ui";
import Dropdown from "@/components/ui/Dropdown";

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbSearch,
  TbCloudUpload,
  TbFilter,
  TbPlus,
  TbDotsVertical,
  TbEye,
  TbUserPlus,
  TbArrowsExchange,
  TbRocket,
  TbInfoCircle,
  TbBulb,
  TbReload,
  TbUser,
  TbMailShare,
  TbBrandWhatsapp,
  TbTagStarred,
  TbCalendarClock,
  TbBell,
  TbChecklist,
  TbCloudDownload,
  TbBrandGoogleDrive,
  TbFileAlert,
  TbFileCertificate,
  TbFileDislike,
  TbFileCheck,
  TbFileExcel,
  TbForms,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
  CellContext,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import type {
  AccountDocumentStatus,
  EnquiryType,
  AccountDocumentListItem,
  AccountDocumentSourcingDetails,
} from "./types"; // Import from your types file
import {
  AccountDocumentStatusOptions as accountDocumentStatusOptionsConst,
  enquiryTypeOptions as enquiryTypeOptionsConst,
  AccountDocumentIntentOptions as accountDocumentIntentOptionsConst,
} from "./types";

// Redux
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/reduxtool/store";
import { BsThreeDotsVertical } from "react-icons/bs";

const dummyAccountDocumentData: AccountDocumentListItem[] = [
  {
    status: "approved",
    leadNumber: "LD-202405-001",
    enquiryType: "purchase",
    memberName: "ABC Enterprise",

    companyId: "5067974",
    companyName: "ABC Enterprise",
    userId: "7039521",
    userName: "Dharmesh Soni",

    companyDocumentType: "OMC",

    documentType: "Sales Order",
    documentNumber: "ND-PO-2526-38",
    invoiceNumber: "OMC-117/25-26",
    formType: "CRM PI 1.0.2",

    createdAt: "2025-05-20T14:30:00Z",
  },
  {
    status: "pending",
    leadNumber: "LD-202405-002",
    enquiryType: "sales",
    memberName: "XYZ Traders",

    companyId: "5069981",
    companyName: "XYZ Traders",
    userId: "7039123",
    userName: "Kiran Patel",

    companyDocumentType: "GST",

    documentType: "Purchase Order",
    documentNumber: "ND-PO-2632-45",
    invoiceNumber: "GST-200/25-26",
    formType: "CRM PI 1.0.3",

    createdAt: "2025-05-22T10:15:00Z",
  },
  {
    status: "rejected",
    leadNumber: "LD-202405-003",
    enquiryType: "service",
    memberName: "PQR Solutions",

    companyId: "5071111",
    companyName: "PQR Solutions",
    userId: "7039333",
    userName: "Meena Shah",

    companyDocumentType: "TRN",

    documentType: "Service Invoice",
    documentNumber: "SV-IN-8899",
    invoiceNumber: "TRN-301/25-26",
    formType: "CRM SV 1.2.0",

    createdAt: "2025-05-23T08:00:00Z",
  },
];

// --- UI Constants (Colors remain, options imported or fetched) ---
const accountDocumentStatusColor: Record<
  AccountDocumentStatus | "default",
  string
> = {
  /* ... (same as your original) ... */
  New: "bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-200",
  Contacted: "bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-200",
  Qualified:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-700/30 dark:text-indigo-200",
  "Proposal Sent":
    "bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-200",
  Negotiation:
    "bg-violet-100 text-violet-700 dark:bg-violet-700/30 dark:text-violet-200",
  "Follow Up":
    "bg-amber-100 text-amber-700 dark:bg-amber-700/30 dark:text-amber-200",
  Won: "bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-200",
  Lost: "bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-200",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-200",
};
const enquiryTypeColor: Record<EnquiryType | "default", string> = {
  /* ... (same as your original) ... */
  "Product Info":
    "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-200",
  "Quote Request":
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-700/30 dark:text-cyan-200",
  "Demo Request":
    "bg-teal-100 text-teal-700 dark:bg-teal-700/30 dark:text-teal-200",
  Support: "bg-pink-100 text-pink-700 dark:bg-pink-700/30 dark:text-pink-200",
  Partnership:
    "bg-lime-100 text-lime-700 dark:bg-lime-700/30 dark:text-lime-200",
  Sourcing:
    "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-700/30 dark:text-fuchsia-200",
  Other: "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-200",
};

// --- Helper Components (AccountDocumentActionColumn, AccountDocumentSearch, etc. - Keep your existing complex ones) ---

const AccountDocumentActionColumn = ({ onDelete }: any) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Fillup Form">
        <div
          className="text-xl cursor-pointer"
          onClick={() => navigate("/fill-up-form")}
        >
          <TbChecklist />
        </div>
      </Tooltip>
      <Tooltip title="Edit">
        <div className="text-xl">
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div className="text-xl">
          <TbEye />
        </div>
      </Tooltip>

      <Dropdown
        renderTitle={
          <BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />
        }
      >
        <Dropdown.Item className="flex items-center gap-2">
          <TbUser size={18} /> <span className="text-xs">Assign to Task</span>
        </Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2">
          <TbMailShare size={18} /> <span className="text-xs">Send Email</span>
        </Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2">
          <TbBrandWhatsapp size={18} />
          <span className="text-xs">Send Whatsapp</span>
        </Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2">
          <TbTagStarred size={18} />
          <span className="text-xs">Add to Active </span>
        </Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2">
          <TbCalendarClock size={18} />
          <span className="text-xs">Add Schedule </span>
        </Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2">
          <TbBell size={18} />
          <span className="text-xs">Add Notification </span>
        </Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2">
          <TbChecklist size={18} />
          <span className="text-xs">Verify Document </span>
        </Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2">
          <TbCloudDownload size={18} />
          <span className="text-xs">Download Document </span>
        </Dropdown.Item>
      </Dropdown>
    </div>
  );
};

const AccountDocumentSearch = React.forwardRef<HTMLInputElement, any>(
  (props, ref) => <DebouceInput {...props} ref={ref} />
);
AccountDocumentSearch.displayName = "AccountDocumentSearch";
const AccountDocumentTableTools = (
  { onSearchChange, onFilter }: any /* ... (Keep your original) ... */
) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow">
      <AccountDocumentSearch
        onInputChange={onSearchChange}
        placeholder="Quick Search..."
      />
    </div>
    <div className="flex gap-1">
      <Button icon={<TbReload />}></Button>
      <Button icon={<TbFilter />} onClick={() => onFilter()}>
        Filter
      </Button>
      <Button icon={<TbCloudUpload />}>Export</Button>
    </div>
  </div>
);
const AccountDocumentTable = (props: any) => <DataTable {...props} />;
const AccountDocumentSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
}: any) => {
  /* ... (Keep your original) ... */
  const [open, setOpen] = useState(false);
  if (!selectedItems || selectedItems.length === 0) return null;
  return (
    <>
      <StickyFooter className="p-4 border-t" stickyClass="-mx-4 sm:-mx-8">
        <div className="flex items-center justify-between">
          <span>{selectedItems.length} selected</span>
          <Button size="sm" color="red-500" onClick={() => setOpen(true)}>
            Delete Selected
          </Button>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={open}
        type="danger"
        onConfirm={() => {
          onDeleteSelected();
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
        title="Delete Selected"
      >
        <p>Sure?</p>
      </ConfirmDialog>
    </>
  );
};
const DialogDetailRow: React.FC<any> = ({
  label,
  value,
  isLink,
  preWrap,
  breakAll,
  labelClassName,
  valueClassName,
  className,
}) => {
  /* ... (Keep your original) ... */
  const defaultLabelClass =
    "text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider";
  const defaultValueClass = "text-sm text-slate-700 dark:text-slate-100 mt-0.5";
  return (
    <div className={`py-1.5 ${className || ""}`}>
      <p className={`${labelClassName || defaultLabelClass}`}>{label}</p>
      {isLink ? (
        <a
          href={
            typeof value === "string" &&
            (value.startsWith("http") ? value : `/${value}`)
          }
          target="_blank"
          rel="noopener noreferrer"
          className={`${
            valueClassName || defaultValueClass
          } hover:underline text-blue-600 dark:text-blue-400 ${
            breakAll ? "break-all" : ""
          } ${preWrap ? "whitespace-pre-wrap" : ""}`}
        >
          {value}
        </a>
      ) : (
        <div
          className={`${valueClassName || defaultValueClass} ${
            breakAll ? "break-all" : ""
          } ${preWrap ? "whitespace-pre-wrap" : ""}`}
        >
          {value}
        </div>
      )}
    </div>
  );
};

// --- Main Account Document Component ---
const AccountDocument = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // States for Drawers & Dialogs that remain in this component
  const [isSubmittingDrawer, setIsSubmittingDrawer] = useState(false); // For Assign/Change Status

  // States for table and delete operations
  const filterForm = useForm();
  const addNewDocumentForm = useForm();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [isAddNewDocumentDrawerOpen, setIsAddNewDocumentDrawerOpen] =
    useState<boolean>(false);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] =
    useState<AccountDocumentListItem | null>(null);
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "createdAt" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<AccountDocumentListItem[]>(
    []
  );

  const mappedAccountDocument: AccountDocumentListItem[] = [];

  const { pageData, total, allFilteredAndSortedData } = useMemo((): {
    pageData: AccountDocumentListItem[];
    total: number;
    allFilteredAndSortedData: AccountDocumentListItem[];
  } => {
    // ... (Keep your existing data processing logic) ...
    let processedData: AccountDocumentListItem[] = cloneDeep(
      mappedAccountDocument
    );
    if (tableData.query) {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(query)
        )
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aVal = a[key as keyof AccountDocumentListItem] as any;
        let bVal = b[key as keyof AccountDocumentListItem] as any;
        if (key === "createdAt" || key === "updatedAt")
          return order === "asc"
            ? dayjs(aVal).valueOf() - dayjs(bVal).valueOf()
            : dayjs(bVal).valueOf() - dayjs(aVal).valueOf();
        if (typeof aVal === "number")
          return order === "asc" ? aVal - bVal : bVal - aVal;
        return order === "asc"
          ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
          : String(bVal ?? "").localeCompare(String(aVal ?? ""));
      });
    }
    const currentTotal = processedData.length;
    const { pageIndex = 1, pageSize = 10 } = tableData;
    const startIndex = (pageIndex - 1) * pageSize;
    return {
      pageData: processedData.slice(startIndex, startIndex + pageSize),
      total: currentTotal,
      allFilteredAndSortedData: processedData,
    };
  }, [mappedAccountDocument, tableData]);

  const handleSetTableData = useCallback(
    (data: Partial<TableQueries>) =>
      setTableData((prev) => ({ ...prev, ...data })),
    []
  );
  // --- End Navigation Handlers ---

  // Delete Handlers (Single and Selected)
  const handleDeleteClick = useCallback((item: AccountDocumentListItem) => {
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);

  // Other Handlers (View Dialog, Export, Pagination, Sort, Search, Filter - remain the same)
  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handlePageSizeChange = useCallback(
    (value: number) => {
      handleSetTableData({ pageSize: value, pageIndex: 1 });
      setSelectedItems([]);
    },
    [handleSetTableData]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableData({ query, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleRowSelect = useCallback(
    (checked: boolean, row: AccountDocumentListItem) =>
      setSelectedItems((prev) =>
        checked
          ? prev.some((i) => i.id === row.id)
            ? prev
            : [...prev, row]
          : prev.filter((i) => i.id !== row.id)
      ),
    []
  );
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<AccountDocumentListItem>[]) => {
      /* ... (Keep) ... */ const originals = currentRows.map((r) => r.original);
      if (checked)
        setSelectedItems((prev) => {
          const oldIds = new Set(prev.map((i) => i.id));
          return [...prev, ...originals.filter((o) => !oldIds.has(o.id))];
        });
      else {
        const currentIds = new Set(originals.map((o) => o.id));
        setSelectedItems((prev) => prev.filter((i) => !currentIds.has(i.id)));
      }
    },
    []
  );
  const openFilterDrawer = useCallback(() => setIsFilterDrawerOpen(true), []);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const openAddNewDocumentDrawer = useCallback(
    () => setIsAddNewDocumentDrawerOpen(true),
    []
  );
  const closeAddNewDocumentDrawer = useCallback(
    () => setIsAddNewDocumentDrawerOpen(false),
    []
  );

  const columns: ColumnDef<AccountDocumentListItem>[] = useMemo(
    () => [
      {
        header: "Status",
        accessorKey: "status",
        size: 120,
        cell: (props: CellContext<AccountDocumentListItem, any>) => (
          <Tag
            className={`${
              accountDocumentStatusColor[props.row.original.status] ||
              accountDocumentStatusColor.default
            } capitalize px-2 py-1 text-xs`}
          >
            {props.row.original.status}
          </Tag>
        ),
      },
      {
        header: "Lead",
        accessorKey: "leadNumber",
        size: 130,
        cell: (props) => {
          return (
            <div className="flex flex-col gap-0.5 text-xs">
              <span>{props.getValue()}</span>
              <div>
                <Tag
                  className={`${
                    enquiryTypeColor[props.row.original.enquiryType] ||
                    enquiryTypeColor.default
                  } capitalize px-2 py-1 text-xs`}
                >
                  {props.row.original.enquiryType}
                </Tag>
              </div>
            </div>
          );
        },
      },
      {
        header: "Member",
        accessorKey: "memberName",
        size: 220,
        cell: (props: CellContext<AccountDocumentListItem, any>) => {
          return (
            <div className="flex flex-col gap-0.5 text-xs">
              <b>5067974</b>
              <span>ABC Enterprise</span>
              <b>7039521</b>
              <span>Dharmesh Soni</span>
              <div>
                <b>Compant Document:</b>
                <span>OMC</span>
              </div>
            </div>
          );
        },
      },
      {
        header: "Document",
        size: 220,
        cell: (props) => {
          return (
            <div className="flex flex-col gap-0.5 text-xs">
              <div>
                <b>Doc Type: </b>
                <span>Sales Order</span>
              </div>
              <div>
                <b>Doc No: </b>
                <span>ND-PO-2526-38</span>
              </div>
              <div>
                <b>Invoice No: </b>
                <span>OMC-117/25-26</span>
              </div>
              <div>
                <b>Form Type: </b>
                <span>CRM PI 1.0.2</span>
              </div>
              <b>
                {dayjs(props.row.original.createdAt).format(
                  "DD MMM, YYYY HH:mm"
                )}
              </b>
            </div>
          );
        },
      },
      {
        header: "Actions",
        id: "actions",
        size: 160,
        meta: { HeaderClass: "text-center" },
        cell: (props: CellContext<AccountDocumentListItem, any>) => (
          <AccountDocumentActionColumn
            onDelete={() => handleDeleteClick(props.row.original)}
          />
        ),
      },
    ],
    [handleDeleteClick]
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Account Document</h5>
            <Button
              variant="solid"
              icon={<TbPlus />}
              className="px-5"
              onClick={() => openAddNewDocumentDrawer()}
            >
              Set New Document
            </Button>{" "}
            {/* Updated */}
          </div>

          <div className="grid grid-cols-6 mb-4 gap-2">
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-blue-200"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                <TbBrandGoogleDrive size={24} />
              </div>
              <div>
                <h6 className="text-blue-500">879</h6>
                <span className="font-semibold text-xs">Total</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-orange-200"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500">
                <TbFileAlert size={24} />
              </div>
              <div>
                <h6 className="text-orange-500">3</h6>
                <span className="font-semibold text-xs">Pending</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-green-300"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                <TbFileCertificate size={24} />
              </div>
              <div>
                <h6 className="text-green-500">23</h6>
                <span className="font-semibold text-xs">Approved</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-red-200"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                <TbFileDislike size={24} />
              </div>
              <div>
                <h6 className="text-red-500">34</h6>
                <span className="font-semibold text-xs">Rejected</span>
              </div>
            </Card>

            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-violet-300"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
                <TbFileCheck size={24} />
              </div>
              <div>
                <h6 className="text-violet-500">9</h6>
                <span className="font-semibold text-xs">Uploaded</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-pink-200"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500">
                <TbFileExcel size={24} />
              </div>
              <div>
                <h6 className="text-pink-500">42</h6>
                <span className="font-semibold text-xs">Not Uploaded</span>
              </div>
            </Card>
          </div>

          <AccountDocumentTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
          />
          <div className="mt-4 flex-grow overflow-y-auto">
            <AccountDocumentTable
              selectable
              columns={columns}
              data={dummyAccountDocumentData}
              pagingData={{
                total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              selectedItems={selectedItems}
              onPaginationChange={handlePaginationChange}
              onSelectChange={handlePageSizeChange}
              onSort={handleSort}
              onRowSelect={handleRowSelect}
              onAllRowSelect={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>
      </Container>
      <AccountDocumentSelectedFooter selectedItems={selectedItems} />
      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete"
        onClose={() => setSingleDeleteConfirmOpen(false)}
        loading={isProcessingDelete}
        onCancel={() => setSingleDeleteConfirmOpen(false)}
      >
        <p>
          Delete <strong></strong>?
        </p>
      </ConfirmDialog>

      {/* Filter Drawer  */}
      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" type="button">
              Clear
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterLeadForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form>
          <FormItem label="Status">
            <Controller
              control={filterForm.control}
              name="status"
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Select Status"
                  isMulti
                  options={[
                    { label: "Active", value: "Active" },
                    { label: "Pending", value: "Pending" },
                    { label: "Completed", value: "Completed" },
                    { label: "Force Completed", value: "Force Completed" },
                  ]}
                />
              )}
            />
          </FormItem>
          <FormItem label="Document Type">
            <Controller
              control={filterForm.control}
              name="doc_type"
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Select Document Type"
                  isMulti
                  options={[
                    { label: "Sales Order", value: "Sales Order" },
                    { label: "Purchase Order", value: "Purchase Order" },
                    { label: "Credit Note", value: "Credit Note" },
                    { label: "Debit Note", value: "Debit Note" },
                  ]}
                />
              )}
            />
          </FormItem>
          <FormItem label="Company Document">
            <Controller
              control={filterForm.control}
              name="comp_doc"
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Select Company Document"
                  isMulti
                  options={[
                    { label: "Aazovo", value: "Aazovo" },
                    { label: "OMC", value: "OMC" },
                  ]}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* Add new document Drawer  */}
      <Drawer
        title="Add New Document"
        width={520}
        isOpen={isAddNewDocumentDrawerOpen}
        onClose={closeAddNewDocumentDrawer}
        onRequestClose={closeAddNewDocumentDrawer}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" type="button">
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterLeadForm"
              type="submit"
            >
              Save
            </Button>
          </div>
        }
      >
        <Form>
          <FormItem
            label={
              <div>
                Company Document<span className="text-red-500"> * </span>
              </div>
            }
          >
            <Controller
              control={addNewDocumentForm.control}
              name="comp_doc"
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Select Company Document"
                  options={[
                    { label: "Aazovo", value: "Aazovo" },
                    { label: "OMC", value: "OMC" },
                  ]}
                />
              )}
            />
          </FormItem>
          <FormItem
            label={
              <div>
                Document Type<span className="text-red-500"> * </span>
              </div>
            }
          >
            <Controller
              control={addNewDocumentForm.control}
              name="doc_type"
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Select Document Type"
                  options={[
                    { label: "Sales Order", value: "Sales Order" },
                    { label: "Purchase Order", value: "Purchase Order" },
                    { label: "Credit Note", value: "Credit Note" },
                    { label: "Debit Note", value: "Debit Note" },
                  ]}
                />
              )}
            />
          </FormItem>

          <div className="md:grid grid-cols-2 gap-3">
            <FormItem
              label={
                <div>
                  Document Number<span className="text-red-500"> * </span>
                </div>
              }
            >
              <Controller
                control={addNewDocumentForm.control}
                name="doc_number"
                render={({ field }) => (
                  <Input
                    type="text"
                    placeholder="Enter Document Number"
                    {...field}
                  />
                )}
              />
            </FormItem>
            <FormItem
              label={
                <div>
                  Invoice Number<span className="text-red-500"> * </span>
                </div>
              }
            >
              <Controller
                control={addNewDocumentForm.control}
                name="invoice_number"
                render={({ field }) => (
                  <Input
                    type="text"
                    placeholder="Enter Invoice Number"
                    {...field}
                  />
                )}
              />
            </FormItem>
          </div>
          <div className="md:grid grid-cols-2 gap-3">
            <FormItem
              label={
                <div>
                  Token Form<span className="text-red-500"> * </span>
                </div>
              }
            >
              <Controller
                control={addNewDocumentForm.control}
                name="token_form"
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Form Type"
                    options={[
                      { label: "CRM PI 1.0.2", value: "CRM PI 1.0.2" },
                      { label: "Debit Note", value: "Debit Note" },
                      { label: "Credit Note", value: "Credit Note" },
                      { label: "CRM PO 1.0.3", value: "CRM PO 1.0.3" },
                    ]}
                  />
                )}
              />
            </FormItem>
            <FormItem
              label={
                <div>
                  Employee<span className="text-red-500"> * </span>
                </div>
              }
            >
              <Controller
                control={addNewDocumentForm.control}
                name="employee"
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Employee"
                    options={[
                      { label: "Hevin Patel", value: "Hevin Patel" },
                      { label: "Vinit Chauhan", value: "Vinit Chauhan" },
                    ]}
                  />
                )}
              />
            </FormItem>
          </div>
          <div className="md:grid grid-cols-2 gap-3 items-center">
            <FormItem
              label={
                <div>
                  Member<span className="text-red-500"> * </span>
                </div>
              }
            >
              <Controller
                control={addNewDocumentForm.control}
                name="member"
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Member"
                    options={[
                      {
                        label: "Ajay Patel - 703549",
                        value: "Ajay Patel - 703549",
                      },
                      {
                        label: "Krishnan Iyer - 703752",
                        value: "Krishnan Iyer - 703752",
                      },
                    ]}
                  />
                )}
              />
              {/* If member is not associated with any company then Show this */}
            </FormItem>
            {/* If member is associated with any company then Show this */}
            <div className="text-xs mt-4">
              <b>5039522</b> <br />
              <span>XYZ Enterprise</span>
            </div>
          </div>
          <span className="text-xs">
            Member is not associated with any company.
          </span>
        </Form>
      </Drawer>
    </>
  );
};
export default AccountDocument;
