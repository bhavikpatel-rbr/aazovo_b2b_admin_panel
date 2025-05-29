// src/views/your-path/PermissionsListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
// import { Link, useNavigate } from 'react-router-dom'; // useNavigate replaced by drawer logic
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames";
import { useForm, Controller } from "react-hook-form"; // Added
import { zodResolver } from "@hookform/resolvers/zod"; // Added
import { z } from "zod"; // Added
// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
// import Dialog from '@/components/ui/Dialog'; // Not actively used, can remove if not planned
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";
import DebouceInput from "@/components/shared/DebouceInput";
import {
  Checkbox,
  Drawer,
  Form,
  FormItem,
  Input,
  Select as UiSelect,
} from "@/components/ui"; // Added Drawer, Form, FormItem, UiSelect, Textarea

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbEye,
  TbDotsVertical,
  TbShare,
  TbKey,
  TbShieldLock,
  TbFileDescription,
  TbPointerPause, // Additional icons
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import PermissionDataTable from "./PermissionDataTable";
import { useNavigate } from "react-router-dom";

// --- Define Item Type ---
export type PermissionItem = {
  module : string,
  view : boolean,
  add : boolean,
  edit : boolean,
  delete : boolean,
  export : boolean,
};
// --- End Item Type ---

// --- Zod Schema for Add/Edit Permission Form ---
const permissionFormSchema = z.object({
  id: z
    .string()
    .min(1, "Permission ID (system key) is required.")
    .max(100)
    .regex(
      /^[a-z0-9_:-]+$/,
      "ID can only contain lowercase letters, numbers, underscores, colons, and hyphens."
    ),
  name: z.string().min(1, "Display Name is required.").max(150),
  description: z.string().min(1, "Description is required.").max(500),
  module: z.string().max(50).optional().nullable(), // Optional module/group
});
type PermissionFormData = z.infer<typeof permissionFormSchema>;

// --- Zod Schema for Filter Form ---
const permissionFilterFormSchema = z.object({
  filterName: z.string().optional(),
  filterModule: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type PermissionFilterFormData = z.infer<typeof permissionFilterFormSchema>;

// --- Constants ---
const initialDummyPermissions: PermissionItem[] = [
  {
    module : "Dashboard",
    view : true,
    add : true,
    edit : true,
    delete : true,
    export : true,
  },
  {
    module : "Master",
    view : true,
    add : true,
    edit : true,
    delete : false,
    export : true,
  },
  {
    module : "Sales & Leads",
    view : true,
    add : true,
    edit : false,
    delete : false,
    export : true,
  },
  {
    module : "Employees",
    view : true,
    add : false,
    edit : false,
    delete : false,
    export : true,
  },
  {
    module : "Access Control",
    view : false,
    add : false,
    edit : false,
    delete : false,
    export : true,
  },
];
// --- End Constants ---

// --- Main PermissionsListing Component ---
const PermissionsListing = () => {
  const pageTitle = "System Permissions";

  const [permissions, setPermissions] = useState<PermissionItem[]>(
    initialDummyPermissions
  );
  const [masterLoadingStatus, setMasterLoadingStatus] = useState<
    "idle" | "loading"
  >("idle");

  const navigate = useNavigate()

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filterCriteria, setFilterCriteria] =
    useState<PermissionFilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 50,
    sort: { order: "", key: "" },
    query: "",
  });

  // --- Data Processing ---
  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: PermissionItem[] = cloneDeep(permissions);
    if (filterCriteria.filterName && filterCriteria.filterName.trim() !== "") {
      const q = filterCriteria.filterName.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q)
      );
    }
    if (tableData.query && tableData.query.trim() !== "") {
      const q = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          item.id.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.module && item.module.toLowerCase().includes(q))
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && processedData.length > 0) {
      processedData.sort((a, b) => {
        const aVal = a[key as keyof PermissionItem] as any;
        const bVal = b[key as keyof PermissionItem] as any;
        const aStr = String(aVal ?? "").toLowerCase();
        const bStr = String(bVal ?? "").toLowerCase();
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
  }, [permissions, tableData, filterCriteria]);


  const columns: ColumnDef<PermissionItem>[] = useMemo(
    () => [
      {
        header: "Modules",
        accessorKey: "module",
        enableSorting: true,
        size: 250,
      },
      { 
        header: "view", 
        accessorKey: "view",
        meta: { HeaderClass: "text-center" },
        cell: (props) => {
          console.log("view", props.getValue())
          return <div className="flex items-center justify-center gap-2">
            <Checkbox checked={props.getValue()} />
          </div>
        }, 
      },
      {
        header: "Add",
        accessorKey: "add",
        meta: { HeaderClass: "text-center" },
        cell: (props) => {
          return <div className="flex items-center justify-center gap-2">
            <Checkbox checked={props.getValue()} />
          </div>
        },
      },
      {
        header: "Edit",
        accessorKey: "edit",
        meta: { HeaderClass: "text-center" },
        cell: (props) => {
          return <div className="flex items-center justify-center gap-2">
            <Checkbox checked={props.getValue()} />
          </div>
        },
      },
      {
        header: "Delete",
        accessorKey: "delete",
        meta: { HeaderClass: "text-center" },
        cell: (props) => {
          return <div className="flex items-center justify-center gap-2">
            <Checkbox checked={props.getValue()} />
          </div>
        },
      },
      {
        header: "Export",
        accessorKey: "export",
        meta: { HeaderClass: "text-center" },
        cell: (props) => {
          return <div className="flex items-center justify-center gap-2">
            <Checkbox checked={props.getValue()} />
          </div>
        },
      },
    ],
    []
  ); // openEditDrawer, handleDeleteClick are stable

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">{pageTitle}</h5>
            {/* <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New
            </Button> */}
          </div>
          
          <div className="mt-4 flex-grow overflow-auto">
            <PermissionDataTable
              columns={columns}
              data={pageData}
              loading={
                masterLoadingStatus === "loading" || isSubmitting || isDeleting
              }
              noData={!masterLoadingStatus && pageData.length === 0}
            />
          </div>
        </AdaptiveCard>
        <div className="flex justify-end gap-2 mt-3">
          <Button type="button" onClick={()=>navigate("/access-control/roles")}>Cancel</Button>
          <Button type="button" onClick={()=>navigate("/access-control/roles")} variant="solid">Update Permission</Button>
        </div>
      </Container>
     
    </>
  );
};

export default PermissionsListing;
