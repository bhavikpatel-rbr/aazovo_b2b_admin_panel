import { ReactElement, useState, useMemo, useCallback } from "react";
import Avatar from "@/components/ui/Avatar"; // Can remove if forms don't have images
import Tooltip from "@/components/ui/Tooltip";
import DataTable from "@/components/shared/DataTable";
import { Link, useNavigate } from "react-router-dom";
import cloneDeep from "lodash/cloneDeep";
// Import new icons
import {
  TbPencil,
  TbEye,
  TbCopy,
  TbUser,
  TbSwitchHorizontal,
  TbTrash,
  TbSend2,
  TbMessageReply,
} from "react-icons/tb";
import { IoEyeOutline } from "react-icons/io5";

import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

import {
  Button,
  Drawer,
  Form,
  FormItem,
  Input,
  Card,
  Tag,
} from "@/components/ui";
import { Controller, useForm } from "react-hook-form";
import { LuForward, LuReply } from "react-icons/lu";
import { MdNotificationAdd } from "react-icons/md";

import userIcon from "/img/avatars/thumb-1.jpg";

// --- Define Form Type ---
export type FormItem = {
  id: string;
  memberId: string;
  name: string; // Name
  tokenNumber: string;
  from: string;
  type: string; // From
  department: string;
  email: string; // Email
  phone: string; // Phone
  date: string; // Date
  status: "active" | "inactive"; // Changed status options
  // Add other form-specific fields if needed later
};
// --- End Form Type Definition ---

// --- Updated Status Colors ---
const statusColor: Record<FormItem["status"], string> = {
  active: "bg-green-200 dark:bg-green-200 text-green-600 dark:text-green-600",
  inactive: "bg-red-200 dark:bg-red-200 text-red-600 dark:text-red-600", // Example color for inactive
};

// Helper Function
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// --- ActionColumn Component ---
const ActionColumn = ({
  // onEdit,
  // onViewDetail,
  onClone,
  View,
  Reply,
  Notify,
  onChangeStatus,
}: {
  // onEdit: () => void
  // onViewDetail: () => void
  onClone: () => void;
  View: () => ReactElement;
  Reply: () => ReactElement;
  Notify: () => ReactElement;
  onChangeStatus: () => void;
}) => {
  const iconButtonClass =
    "text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";

  return (
    <div className="flex items-center justify-center gap-2">
      {/* <View/> */}
      <View />

      {/* Change status */}
      <Tooltip title="Change Status">
        <div
          className={`text-xl cursor-pointer select-none font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400`}
          role="button"
          onClick={onChangeStatus}
        >
          <TbSwitchHorizontal />
        </div>
      </Tooltip>

      {/* Reply */}
      <Reply />

      {/* Forward */}
      <Notify />

      {/* Delete */}
      <Tooltip title="Delete">
        <div
          className={`text-xl cursor-pointer select-none font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400`}
          role="button"
        >
          <TbTrash />
        </div>
      </Tooltip>
    </div>
  );
};

// --- Initial Dummy Data ---
const initialDummyForms: FormItem[] = [
  {
    id: "F001",
    memberId: "M001",
    name: "John Doe",
    tokenNumber: "T001",
    from: "Request",
    type: "Website",
    department: "Sales",
    email: "john.doe@example.com",
    phone: "+1-123-456-7890",
    date: "2023-05-01",
    status: "active",
  },
  {
    id: "F002",
    memberId: "M002",
    name: "Jane Smith",
    tokenNumber: "T002",
    from: "Feedback",
    type: "Inquiry",
    department: "Marketing",
    email: "jane.smith@example.com",
    phone: "+1-987-654-3210",
    date: "2023-05-02",
    status: "active",
  },
  {
    id: "F003",
    memberId: "M003",
    name: "Michael Johnson",
    tokenNumber: "T003",
    from: "Request",
    type: "New Product",
    department: "Support",
    email: "michael.johnson@example.com",
    phone: "+44-20-7946-0958",
    date: "2023-05-03",
    status: "active",
  },
  {
    id: "F004",
    memberId: "M004",
    name: "Emily Davis",
    tokenNumber: "T004",
    from: "Feedback",
    type: "Website",
    department: "Development",
    email: "emily.davis@example.com",
    phone: "+91-98765-43210",
    date: "2023-05-04",
    status: "active",
  },
  {
    id: "F005",
    memberId: "M005",
    name: "William Brown",
    tokenNumber: "T005",
    from: "Request",
    type: "Inquiry",
    department: "HR",
    email: "william.brown@example.com",
    phone: "+81-3-1234-5678",
    date: "2023-05-05",
    status: "active",
  },
];
// --- End Dummy Data ---

const FormListTable = () => {
  const navigate = useNavigate();

  // --- Local State for Table Data and Selection ---
  const [isLoading, setIsLoading] = useState(false);
  const [forms, setForms] = useState<FormItem[]>(initialDummyForms); // Make forms stateful
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedForms, setSelectedForms] = useState<FormItem[]>([]); // Renamed state
  // --- End Local State ---

  // Simulate data fetching and processing based on tableData
  const { pageData, total } = useMemo(() => {
    let filteredData = [...forms]; // Use the stateful forms data

    // --- Filtering ---
    if (tableData.query) {
      const query = tableData.query.toLowerCase();
      filteredData = forms.filter(
        (form) =>
          form.id.toLowerCase().includes(query) ||
          form.name.toLowerCase().includes(query) ||
          form.status.toLowerCase().includes(query)
      );
    }

    // --- Sorting ---
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      filteredData.sort((a, b) => {
        const aValue = a[key as keyof FormItem] ?? "";
        const bValue = b[key as keyof FormItem] ?? "";

        if (typeof aValue === "string" && typeof bValue === "string") {
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        // Add number comparison if forms have numeric fields to sort
        return 0;
      });
    }

    // --- Pagination ---
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const dataTotal = filteredData.length; // Use filtered length for total
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = filteredData.slice(startIndex, startIndex + pageSize);

    return { pageData: dataForPage, total: dataTotal };
  }, [forms, tableData]); // Depend on forms state and tableData

  // --- Action Handlers ---
  const handleEdit = (form: FormItem) => {
    // Navigate to a hypothetical form edit page
    console.log("Navigating to edit form:", form.id);
    // navigate(`/forms/edit/${form.id}`) // Example navigation
  };

  const View = ({ data }) => {
    const [isViewDrawerOpen, setIsViewDrawerOpen] = useState<boolean>(false);
    const openViewDrawer = () => setIsViewDrawerOpen(true);
    const closeViewDrawer = () => setIsViewDrawerOpen(false);

    return (
      <>
        <Tooltip title="View Record">
          <div
            className="text-xl cursor-pointer select-none font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
            role="button"
            onClick={openViewDrawer}
          >
            {" "}
            <TbEye />{" "}
          </div>
        </Tooltip>
        <Drawer
          title="View"
          isOpen={isViewDrawerOpen}
          onClose={closeViewDrawer}
          onRequestClose={closeViewDrawer}
          footer={
            <div className="text-right w-full">
              <Button size="sm" className="mr-2" onClick={closeViewDrawer}>
                Cancel
              </Button>
            </div>
          }
        >
          <Card>
            <div className="flex justify-between">
              <Tag className="h-7">Token: #{data?.tokenNumber}</Tag>
              <div className="flex gap-4">
                <b className="text-xs flex items-center h-7">Assigned to</b>
                <Tag className="flex gap-1">
                  <Tooltip title="Tushar Joshi">
                    <img
                      src={userIcon}
                      alt="icon"
                      className="border h-5 w-5 aspect-square rounded-full"
                    />
                  </Tooltip>
                  <Tooltip title="Rahul Bayad">
                    <img
                      src={userIcon}
                      alt="icon"
                      className="border h-5 w-5 aspect-square rounded-full"
                    />
                  </Tooltip>
                </Tag>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <figure className="flex gap-3 mt-2 items-start">
                <img
                  src={userIcon}
                  alt="icon"
                  className="border h-10 w-10 aspect-square rounded-full"
                />
                <figcaption className="flex flex-col">
                  <div className="flex gap-2">
                    <h6 className="font-semibold text-black dark:text-white">
                      {data?.memberId}
                    </h6>{" "}
                    |
                    <h6 className="font-semibold text-black dark:text-white">
                      {data?.name}
                    </h6>
                    {/* <Tag className={` ${statusColor[data?.status]} text-xs inline w-auto`}>{data?.status}</Tag> */}
                  </div>
                  <span className="text-xs">
                    {data?.email} | {data?.phone}
                  </span>
                </figcaption>
              </figure>
              <div className="mt-1">
                <p className="text-xs">
                  <span className="font-semibold text-black  dark:text-white">
                    From:{" "}
                  </span>
                  <span>{data?.from}</span>
                </p>
                <p className="text-xs">
                  <span className="font-semibold text-black  dark:text-white">
                    Type:{" "}
                  </span>
                  <span>{data?.type}</span>
                </p>
                <p className="text-xs">
                  <span className="font-semibold text-black  dark:text-white">
                    Department:{" "}
                  </span>
                  <span>{data?.department}</span>
                </p>
                <p className="text-xs">
                  <span className="font-semibold text-black  dark:text-white">
                    Date:{" "}
                  </span>
                  <span>
                    {data?.subscribedDate?.toLocaleDateString() +
                      " " +
                      "20:00 PM"}
                  </span>
                </p>
                <p className="text-xs">
                  <span className="font-semibold text-black  dark:text-white">
                    Status:{" "}
                  </span>
                  <Tag
                    className={`${statusColor[data?.status]} text-xs w-auto`}
                  >
                    {data?.status}
                  </Tag>
                </p>
                <p className="text-xs mt-1">
                  <span className="font-semibold text-black  dark:text-white">
                    Message:{" "}
                  </span>
                  <p>
                    My name is john doe, I work in IT Department. I find a bug
                    in your website, which i can help to solve this.
                  </p>
                </p>
              </div>
            </div>
          </Card>
          <div className="mt-2">
            <Input textArea placeholder="Write a reply" />
            <Button icon={<TbSend2 />} className="relative float-right">
              Send
            </Button>
          </div>
        </Drawer>
      </>
    );
  };

  const Reply = ({ data }) => {
    const [isReplyDrawerOpen, setIsReplyDrawerOpen] = useState<boolean>(false);
    const openReplyDrawer = () => setIsReplyDrawerOpen(true);
    const closeReplyDrawer = () => setIsReplyDrawerOpen(false);

    return (
      <>
        <Tooltip title="Reply">
          <div
            className={`text-xl cursor-pointer select-none font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400`}
            role="button"
            onClick={openReplyDrawer}
          >
            <TbMessageReply />
          </div>
        </Tooltip>
        <Drawer
          title="Reply"
          isOpen={isReplyDrawerOpen}
          onClose={closeReplyDrawer}
          onRequestClose={closeReplyDrawer}
          footer={
            <>
              <Button size="sm" className="" onClick={closeReplyDrawer}>
                Cancel
              </Button>
              <Button
                icon={<TbSend2 />}
                size="sm"
                className=""
                onClick={closeReplyDrawer}
              >
                Reply
              </Button>
            </>
          }
        >
          <Card>
            <div className="flex justify-between">
              <Tag className="h-7">Token: #{data?.tokenNumber}</Tag>
              <div className="flex gap-4">
                <b className="text-xs flex items-center h-7">Assigned to</b>
                <Tag className="flex gap-1">
                  <Tooltip title="Tushar Joshi">
                    <img
                      src={userIcon}
                      alt="icon"
                      className="border h-5 w-5 aspect-square rounded-full"
                    />
                  </Tooltip>
                  <Tooltip title="Rahul Bayad">
                    <img
                      src={userIcon}
                      alt="icon"
                      className="border h-5 w-5 aspect-square rounded-full"
                    />
                  </Tooltip>
                </Tag>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <figure className="flex gap-3 mt-2 items-start">
                <img
                  src={userIcon}
                  alt="icon"
                  className="border h-10 w-10 aspect-square rounded-full"
                />
                <figcaption className="flex flex-col">
                  <div className="flex gap-2">
                    <h6 className="font-semibold text-black dark:text-white">
                      {data?.memberId}
                    </h6>{" "}
                    |
                    <h6 className="font-semibold text-black dark:text-white">
                      {data?.name}
                    </h6>
                    {/* <Tag className={` ${statusColor[data?.status]} text-xs inline w-auto`}>{data?.status}</Tag> */}
                  </div>
                  <span className="text-xs">
                    {data?.email} | {data?.phone}
                  </span>
                </figcaption>
              </figure>
              <div className="mt-1">
                <p className="text-xs mt-1">
                  <span className="font-semibold text-black  dark:text-white">
                    Message:{" "}
                  </span>
                  <p>
                    My name is john doe, I work in IT Department. I find a bug
                    in your website, which i can help to solve this.
                  </p>
                </p>
              </div>
            </div>
          </Card>
          <div className="mt-2">
            <Input textArea placeholder="Write a reply" />
          </div>
        </Drawer>
      </>
    );
  };

  const Notify = ({ data }) => {
    const [assignedMember, setAssignedMember] = useState([]);
    const [isNotifyDrawerOpen, setIsNotifyDrawerOpen] =
      useState<boolean>(false);
    const openNotifyDrawer = () => setIsNotifyDrawerOpen(true);
    const closeNotifyDrawer = () => setIsNotifyDrawerOpen(false);

    return (
      <>
        <Tooltip title="Notify">
          <div
            className={`text-xl cursor-pointer select-none font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400`}
            role="button"
            onClick={openNotifyDrawer}
          >
            <MdNotificationAdd />
          </div>
        </Tooltip>
        <Drawer
          title="Notify"
          isOpen={isNotifyDrawerOpen}
          onClose={closeNotifyDrawer}
          onRequestClose={closeNotifyDrawer}
          footer={
            <div className="text-right w-full">
              <Button size="sm" onClick={closeNotifyDrawer}>
                Cancel
              </Button>
            </div>
          }
        >
          <Input type="search" placeholder="Quick Search Team Member" />

          <div className="text-xs font-semibold !my-2 pl-1">
            15 TEAM MEMBERS AVAILABLE
          </div>
          <ul className="mt-4 flex flex-col">
            <li className="flex justify-between items-center py-2">
              <figure className="flex gap-3 items-center">
                <img src={userIcon} alt="" className="h-10 w-10 rounded-full" />
                <figcaption>Angelina Gotelli</figcaption>
              </figure>
              <Button>Assign</Button>
            </li>
            <li className="flex justify-between items-center py-2">
              <figure className="flex gap-3 items-center">
                <img src={userIcon} alt="" className="h-10 w-10 rounded-full" />
                <figcaption>Angelina Gotelli</figcaption>
              </figure>
              <Button className="border-1 border-red-500 text-red-500  hover:shadow-none">
                Remove
              </Button>
            </li>
            <li className="flex justify-between items-center py-2">
              <figure className="flex gap-3 items-center">
                <img src={userIcon} alt="" className="h-10 w-10 rounded-full" />
                <figcaption>Angelina Gotelli</figcaption>
              </figure>
              <Button>Assign</Button>
            </li>
            <li className="flex justify-between items-center py-2">
              <figure className="flex gap-3 items-center">
                <img src={userIcon} alt="" className="h-10 w-10 rounded-full" />
                <figcaption>Angelina Gotelli</figcaption>
              </figure>
              <Button>Assign</Button>
            </li>
            <li className="flex justify-between items-center py-2">
              <figure className="flex gap-3 items-center">
                <img src={userIcon} alt="" className="h-10 w-10 rounded-full" />
                <figcaption>Angelina Gotelli</figcaption>
              </figure>
              <Button>Assign</Button>
            </li>
            <li className="flex justify-between items-center py-2">
              <figure className="flex gap-3 items-center">
                <img src={userIcon} alt="" className="h-10 w-10 rounded-full" />
                <figcaption>Angelina Gotelli</figcaption>
              </figure>
              <Button>Assign</Button>
            </li>
          </ul>
        </Drawer>
      </>
    );
  };

  const handleViewDetails = (form: FormItem) => {
    // Navigate to a hypothetical form details page
    console.log("Navigating to view form:", form.id);
    // navigate(`/forms/details/${form.id}`) // Example navigation
  };

  const handleCloneForm = (form: FormItem) => {
    // Logic to clone the form (e.g., API call or local duplication)
    // Example: Add a cloned item locally for demo
    const newId = `F${Math.floor(Math.random() * 9000) + 1000}`; // Generate pseudo-random ID
    const clonedForm: FormItem = {
      ...form,
      id: newId,
      // Add other necessary fields for the cloned form
      status: "inactive", // Cloned forms start as inactive
    };
    setForms((prev) => [clonedForm, ...prev]); // Add to the beginning of the list
    // Optionally navigate to the edit page of the cloned form
    // navigate(`/forms/edit/${newId}`)
  };

  const handleChangeStatus = (form: FormItem) => {
    // Logic to change the status (e.g., API call and update state)
    const newStatus = form.status === "active" ? "inactive" : "active";
    console.log(`Changing status of form ${form.id} to ${newStatus}`);

    // Update the status in the local state for visual feedback
    setForms((currentForms) =>
      currentForms.map((f) =>
        f.id === form.id ? { ...f, status: newStatus } : f
      )
    );
  };
  // --- End Action Handlers ---

  // --- Columns Definition ---
  const columns: ColumnDef<FormItem>[] = useMemo(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        size: 50,
        // Simple cell to display ID, enable sorting
        enableSorting: true,
        cell: (props) => <span>{props.row.original.id}</span>,
      },
      {
        header: "Member",
        accessorKey: "name",
        enableSorting: true,
        cell: (props) => {
          return (
            <div className="flex flex-col">
              <span>
                <b>Member Id:</b> {props.row.original.memberId}
              </span>
              <span>
                <b>Name:</b> {props.row.original.name}
              </span>
              <span>
                <b>Email:</b> {props.row.original.email}
              </span>
              <span>
                <b>Phone:</b> {props.row.original.phone}
              </span>
            </div>
          );
        },
      },
      {
        header: "Request/Feedback",
        accessorKey: "tokenNumber",
        enableSorting: true,
        cell: (props) => {
          return (
            <div className="flex flex-col">
              <span>
                <b>Token:</b> {props.row.original.tokenNumber}
              </span>
              <span>
                <b>From:</b> {props.row.original.from}
              </span>
              <span>
                <b>Department:</b> {props.row.original.department}
              </span>
              <span>
                <b>Type:</b> {props.row.original.type}
              </span>
            </div>
          );
        },
      },
      {
        header: "Date",
        accessorKey: "date",
        size: 90,
        enableSorting: true,
        cell: (props) => <span>{props.row.original.date}</span>,
      },
      {
        header: "Status",
        accessorKey: "status",
        size: 80,
        // Enable sorting
        enableSorting: true,
        cell: (props) => {
          const { status } = props.row.original;
          return (
            <div className="flex items-center">
              <Tag className={statusColor[status]}>
                <span className="capitalize">{status}</span>
              </Tag>
            </div>
          );
        },
      },
      {
        header: "Action", // Keep header empty for actions
        id: "action",
        size: 120,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            // Pass new handlers
            onClone={() => handleCloneForm(props.row.original)}
            onChangeStatus={() => handleChangeStatus(props.row.original)}
            // Keep existing handlers if needed
            onEdit={() => handleEdit(props.row.original)}
            // onViewDetail={() =>
            //     handleViewDetails(props.row.original)
            // }
            View={() => <View data={props.row.original} />}
            Reply={() => <Reply data={props.row.original} />}
            Notify={() => <Notify data={props.row.original} />}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Handlers are defined outside, state dependency handled by component re-render
  );
  // --- End Columns Definition ---

  // --- Table Interaction Handlers (Pagination, Selection, etc.) ---
  const handleSetTableData = useCallback(
    (data: TableQueries) => {
      setTableData(data);
      if (selectedForms.length > 0) {
        setSelectedForms([]); // Clear selection on data change
      }
    },
    [selectedForms.length] // Dependency needed
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

  const handleRowSelect = useCallback((checked: boolean, row: FormItem) => {
    setSelectedForms((prev) => {
      if (checked) {
        return prev.some((f) => f.id === row.id) ? prev : [...prev, row];
      } else {
        return prev.filter((f) => f.id !== row.id);
      }
    });
  }, []);

  const handleAllRowSelect = useCallback(
    (checked: boolean, rows: Row<FormItem>[]) => {
      if (checked) {
        const originalRows = rows.map((row) => row.original);
        setSelectedForms(originalRows);
      } else {
        setSelectedForms([]);
      }
    },
    []
  );
  // --- End Table Interaction Handlers ---

  return (
    <DataTable
      selectable
      columns={columns}
      data={pageData} // Use processed page data
      noData={!isLoading && forms.length === 0} // Check stateful forms length
      // Remove skeleton avatar if not used
      // skeletonAvatarColumns={[0]}
      // skeletonAvatarProps={{ width: 28, height: 28 }}
      loading={isLoading}
      pagingData={{
        total: total, // Use calculated total from filtered data
        pageIndex: tableData.pageIndex as number,
        pageSize: tableData.pageSize as number,
      }}
      checkboxChecked={
        (row) => selectedForms.some((selected) => selected.id === row.id) // Use selectedForms state
      }
      onPaginationChange={handlePaginationChange}
      onSelectChange={handleSelectChange}
      onSort={handleSort}
      onCheckBoxChange={handleRowSelect} // Pass correct handler
      onIndeterminateCheckBoxChange={handleAllRowSelect} // Pass correct handler
    />
  );
};

export default FormListTable;
