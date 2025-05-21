import { useState, useMemo, useCallback } from "react";
import Avatar from "@/components/ui/Avatar"; // Assuming this is needed for Company Info
import Tag from "@/components/ui/Tag";
import Tooltip from "@/components/ui/Tooltip";
import DataTable from "@/components/shared/DataTable";
import { useNavigate } from "react-router-dom";
import cloneDeep from "lodash/cloneDeep";
import {
  TbPencil,
  TbCopy, // Added back for cloning if needed
  TbSwitchHorizontal,
  TbTrash,
  TbEye,
  TbShare,
  TbDotsVertical,
} from "react-icons/tb";
import { MdCheckCircle, MdCancel } from "react-icons/md"; // From Overview.tsx
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// --- Define Merged Form Type ---
export type MergedFormItem = {
  id: string;
  name: string;
  company_code?: string;
  type: string;
  interested: string;
  category: string | string[];
  brands: string[];
  country: string;
  noOfMember: number;
  // opportunity?: number // REMOVED
  // leads?: number // REMOVED
  status:
    | "Active"
    | "Pending"
    | "Inactive"
    | "Verified"
    | "active"
    | "inactive";
  progress: number;

  gst_number?: string;
  pan_number?: string;
  company_photo?: string;
  total_members?: number;
  member_participation?: number;
  success_score?: number;
  trust_score?: number;
  health_score?: number;

  wallCountDisplay?: string;
  // opportunityDisplay?: string // REMOVED
  // leadsDisplay?: string // REMOVED
};
// --- End Merged Form Type Definition ---

// --- Status Colors (using Overview's comprehensive one) ---
const overviewStatusColors: Record<string, string> = {
  Active: "bg-green-200 text-green-600",
  Verified: "bg-blue-200 text-blue-600",
  Pending: "bg-orange-200 text-orange-600",
  Inactive: "bg-red-200 text-red-600",
  active: "bg-green-200 text-green-600",
  inactive: "bg-red-200 text-red-600",
};

const getStatusClass = (status: MergedFormItem["status"]): string => {
  return overviewStatusColors[status] || "bg-gray-200 text-gray-600";
};

// --- ActionColumn (can be the more comprehensive one) ---
const ActionColumn = ({
  onEdit,
  onViewDetail,
  onChangeStatus,
}: {
  onEdit: () => void;
  onViewDetail: () => void;
  onChangeStatus: () => void;
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
      <Tooltip title="View">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`}
          role="button"
          onClick={onViewDetail}
        >
          <TbEye />
        </div>
      </Tooltip>
      <Tooltip title="Share">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400`}
          role="button"
        >
          <TbShare />
        </div>
      </Tooltip>
      <Tooltip title="More">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-400`}
          role="button"
        >
          <TbDotsVertical />
        </div>
      </Tooltip>
      {/* <Tooltip title="Delete">
                <div
                    className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`}
                    role="button"
                    onClick={onViewDetail}
                >
                    <TbTrash />
                </div>
            </Tooltip> */}
    </div>
  );
};

// --- MERGED Initial Dummy Data ---
const initialMergedForms: MergedFormItem[] = [
  {
    id: "1",
    name: "TechNova Ltd.",
    company_code: "TNL001",
    type: "Private Limited",
    interested: "Partnership",
    category: ["Electronics", "Automation"],
    brands: ["TechNova", "NovaGear"],
    country: "India",
    noOfMember: 25,
    // opportunity: 7, // REMOVED
    // leads: 14, // REMOVED
    status: "active",
    progress: 85,

    gst_number: "27AAACT2727Q1Z5",
    pan_number: "AAACT2727Q",
    company_photo: "https://picsum.photos/200/200",
    total_members: 100,
    member_participation: 85,
    success_score: 92,
    trust_score: 88,
    health_score: 90,

    wallCountDisplay: "13 | 12 | 25",
    // opportunityDisplay: "34 | 12 | 46", // REMOVED
    // leadsDisplay: "34 | 12 | 46", // REMOVED
  },
  {
    id: "2",
    name: "GreenField Corp.",
    company_code: "GFC002",
    type: "LLP",
    interested: "Investment",
    category: ["Construction", "Sustainability"],
    brands: ["GreenField", "EcoBuild"],
    country: "USA",
    noOfMember: 40,
    // opportunity: 6, // REMOVED
    // leads: 11, // REMOVED
    status: "inactive",
    progress: 78,

    gst_number: "29AACCG1234H1Z6",
    pan_number: "AACCG1234H",
    company_photo: "https://picsum.photos/200/200",
    total_members: 150,
    member_participation: 70,
    success_score: 78,
    trust_score: 82,
    health_score: 75,
    wallCountDisplay: "10 | 8 | 18",
    // opportunityDisplay: "20 | 10 | 30", // REMOVED
    // leadsDisplay: "25 | 5 | 30", // REMOVED
  },
];

const FormListTable = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [forms, setForms] = useState<MergedFormItem[]>(initialMergedForms);
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedForms, setSelectedForms] = useState<MergedFormItem[]>([]);

  const { pageData, total } = useMemo(() => {
    let filteredData = [...forms];
    if (tableData.query) {
      const query = tableData.query.toLowerCase();
      filteredData = forms.filter((form) =>
        Object.values(form).some((value) => {
          if (Array.isArray(value)) {
            return value.some((item) =>
              String(item).toLowerCase().includes(query)
            );
          }
          return String(value).toLowerCase().includes(query);
        })
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      filteredData.sort((a, b) => {
        const aValue = a[key as keyof MergedFormItem] ?? "";
        const bValue = b[key as keyof MergedFormItem] ?? "";
        if (typeof aValue === "number" && typeof bValue === "number") {
          return order === "asc" ? aValue - bValue : bValue - aValue;
        }
        if (typeof aValue === "string" && typeof bValue === "string") {
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        return 0;
      });
    }
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const dataTotal = filteredData.length;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = filteredData.slice(startIndex, startIndex + pageSize);
    return { pageData: dataForPage, total: dataTotal };
  }, [forms, tableData]);

  const handleEdit = (form: MergedFormItem) => {
    console.log("Edit:", form.id);
  };
  const handleDelete = (form: MergedFormItem) => {
    console.log("Delete:", form.id);
  };
  const handleCloneForm = (form: MergedFormItem) => {
    const newId = `F${Math.floor(Math.random() * 9000) + 1000}`;
    const clonedForm: MergedFormItem = {
      ...form,
      id: newId,
      name: `${form.name} (Clone)`,
      status: "inactive",
    };
    setForms((prev) => [clonedForm, ...prev]);
  };
  const handleChangeStatus = (form: MergedFormItem) => {
    let newStatus: MergedFormItem["status"] = "inactive";
    if (form.status === "Active" || form.status === "active")
      newStatus = "inactive";
    else if (form.status === "Inactive" || form.status === "inactive")
      newStatus = "active";

    setForms((currentForms) =>
      currentForms.map((f) =>
        f.id === form.id ? { ...f, status: newStatus } : f
      )
    );
  };

  const columns: ColumnDef<MergedFormItem>[] = useMemo(
    () => [
      {
        header: "Company Info",
        accessorKey: "name",
        enableSorting: true,
        size: 220,
        cell: ({ row }) => {
          const { name, type, country, status, company_photo, company_code } =
            row.original;
          return (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {company_photo && (
                  <Avatar
                    src={company_photo}
                    alt={name}
                    size="sm"
                    shape="circle"
                  />
                )}
                <div>
                  <h6 className="text-xs font-semibold">{company_code}</h6>
                  <span className="text-xs">{name}</span>
                </div>
              </div>
              {/* {company_code && <span className="text-xs text-gray-500 dark:text-gray-400">Code: {company_code}</span>} */}
              <span className="text-xs">
                <span className="font-semibold">Type :</span> {type}
              </span>
              <span className="text-xs">
                <span className="font-semibold">Business Type:</span> Supplier
              </span>
              <div className="text-xs text-gray-500"> Gujarat , India </div>
              {/* <span className="text-xs">
                                <span className="font-semibold">Country:</span> {country}
                            </span> */}
            </div>
          );
        },
      },
      {
        header: "Contact",
        accessorKey: "",
        cell: (props) => {
          return (
            <div className="text-xs flex flex-col">
              <span>
                <b>Owner: </b> Nitin Mehta
              </span>
              <span>+91 9683205942</span>
              <span>nitinmehta@techno.com</span>
              <a href="https://www.google.com" target="_blank">
                www.google.com
              </a>
            </div>
          );
        },
      },
      {
        header: "Legal IDs",
        accessorKey: "gst_number",
        enableSorting: true,
        size: 180,
        cell: ({ row }) => {
          const { gst_number, pan_number, status } = row.original;
          if (!gst_number && !pan_number)
            return <span className="text-xs text-gray-400">N/A</span>;
          return (
            <div className="flex flex-col gap-1 text-[10px]">
              {gst_number && (
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    GST:
                  </span>{" "}
                  <span className="text-gray-600 dark:text-gray-400 break-all">
                    {gst_number}
                  </span>
                </div>
              )}
              {pan_number && (
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    PAN:
                  </span>{" "}
                  <span className="text-gray-600 dark:text-gray-400 break-all">
                    {pan_number}
                  </span>
                </div>
              )}
              <span className="text-xs">
                <Tag className={`${getStatusClass(status)} capitalize`}>
                  {status}
                </Tag>
              </span>
            </div>
          );
        },
      },
      {
        header: "Preferences",
        accessorKey: "interested",
        enableSorting: true,
        size: 180,
        cell: ({ row }) => {
          const { brands, category, interested } = row.original;
          return (
            <div className="flex flex-col gap-1">
              <span className="text-xs">
                <span className="font-semibold">Brands:</span>{" "}
                {brands?.join(", ") || "N/A"}
              </span>
              <span className="text-xs">
                <span className="font-semibold">Category:</span>{" "}
                {Array.isArray(category) ? category.join(", ") : category}
              </span>
              <span className="text-xs">
                <span className="font-semibold">Interested:</span> {interested}
              </span>
            </div>
          );
        },
      },
      {
        header: "Profile & Scores",
        accessorKey: "progress",
        enableSorting: true,
        size: 190,
        cell: ({ row }) => {
          const {
            noOfMember,
            total_members,
            member_participation,
            progress,
            success_score,
            trust_score,
            health_score,
          } = row.original;
          return (
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="flex flex-wrap gap-1 ">
                <span className="font-semibold">Members:</span>
                {noOfMember}/{total_members || 43} (
                {member_participation !== undefined
                  ? `${member_participation}%`
                  : "34%"}
                )
              </span>
              <div className="flex gap-1 items-center">
                <Tooltip
                  title="KYC Verification : 48% (Placeholder)"
                  className="text-xs"
                >
                  <div className="border border-gray-300 dark:border-gray-600 rounded-md py-1 px-1.5 flex items-center gap-1">
                    <MdCheckCircle className="text-green-500 text-lg" />
                    <span>13/27</span>
                  </div>
                </Tooltip>
                <Tooltip
                  title="Enable Billing (Placeholder)"
                  className="text-xs"
                >
                  <MdCancel className="text-red-500 text-lg" />
                </Tooltip>
              </div>
              <Tooltip
                className="text-xs"
                title={`Profile Completion ${progress}%`}
              >
                <div className="h-1.5 w-full rounded-full bg-gray-300 dark:bg-gray-700">
                  <div
                    className="font-bold rounded-full h-1.5 bg-blue-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </Tooltip>
              {(success_score !== undefined ||
                trust_score !== undefined ||
                health_score !== undefined) && (
                <div className="grid grid-cols-3 gap-x-1 text-center mt-1">
                  {success_score !== undefined && (
                    <Tooltip title={`Success: ${success_score}%`}>
                      <div className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 p-0.5 rounded text-[10px]">
                        S: {success_score}%
                      </div>
                    </Tooltip>
                  )}
                  {trust_score !== undefined && (
                    <Tooltip title={`Trust: ${trust_score}%`}>
                      <div className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 p-0.5 rounded text-[10px]">
                        T: {trust_score}%
                      </div>
                    </Tooltip>
                  )}
                  {health_score !== undefined && (
                    <Tooltip title={`Health: ${health_score}%`}>
                      <div className="bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 p-0.5 rounded text-[10px]">
                        H: {health_score}%
                      </div>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>
          );
        },
      },
      {
        header: "Actions",
        id: "action",
        size: 130,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onChangeStatus={() => handleChangeStatus(props.row.original)}
            onEdit={() => handleEdit(props.row.original)}
            onViewDetail={() => handleDelete(props.row.original)}
          />
        ),
      },
    ],
    []
  );

  const handleSetTableData = useCallback(
    (data: TableQueries) => {
      setTableData(data);
      if (selectedForms.length > 0) setSelectedForms([]);
    },
    [selectedForms.length]
  );

  const handlePaginationChange = useCallback(
    (page: number) => {
      const newTableData = cloneDeep(tableData);
      newTableData.pageIndex = page;
      handleSetTableData(newTableData);
    },
    [tableData, handleSetTableData]
  );

  const handleSelectChange = useCallback(
    (value: number) => {
      const newTableData = cloneDeep(tableData);
      newTableData.pageSize = Number(value);
      newTableData.pageIndex = 1;
      handleSetTableData(newTableData);
    },
    [tableData, handleSetTableData]
  );

  const handleSort = useCallback(
    (sort: OnSortParam) => {
      const newTableData = cloneDeep(tableData);
      newTableData.sort = sort;
      handleSetTableData(newTableData);
    },
    [tableData, handleSetTableData]
  );

  const handleRowSelect = useCallback(
    (checked: boolean, row: MergedFormItem) => {
      setSelectedForms((prev) =>
        checked
          ? prev.some((f) => f.id === row.id)
            ? prev
            : [...prev, row]
          : prev.filter((f) => f.id !== row.id)
      );
    },
    []
  );

  const handleAllRowSelect = useCallback(
    (checked: boolean, rows: Row<MergedFormItem>[]) => {
      if (checked) setSelectedForms(rows.map((row) => row.original));
      else setSelectedForms([]);
    },
    []
  );

  return (
    <DataTable
      selectable
      columns={columns}
      data={pageData}
      noData={!isLoading && forms.length === 0}
      loading={isLoading}
      pagingData={{
        total: total,
        pageIndex: tableData.pageIndex as number,
        pageSize: tableData.pageSize as number,
      }}
      checkboxChecked={(row) =>
        selectedForms.some((selected) => selected.id === row.id)
      }
      onPaginationChange={handlePaginationChange}
      onSelectChange={handleSelectChange}
      onSort={handleSort}
      onCheckBoxChange={handleRowSelect}
      onIndeterminateCheckBoxChange={handleAllRowSelect}
    />
  );
};

export default FormListTable;
