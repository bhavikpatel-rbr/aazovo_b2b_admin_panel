// src/views/your-path/PermissionsListing.tsx

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { Checkbox, Button, Notification, toast,  } from "@/components/ui";
import DataTable from "@/components/shared/DataTable";
import { useAppDispatch } from "@/reduxtool/store";
import { updatePermissionsAction } from "@/reduxtool/master/middleware"; // Assuming this action exists
import type { ColumnDef } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { AdaptiveCard, Container } from "@/components/shared";

// --- Define Item Types ---
export type PermissionModule = {
  module: string;
  is_view: boolean;
  is_add: boolean;
  is_edit: boolean;
  is_delete: boolean;
};

// A comprehensive list of all possible modules in the system.
const ALL_SYSTEM_MODULES = [
    "company", "member", "partner", "inquiry", "all_documents", "brands",
    "category", "products", "wall_listing", "opportunity", "offer_demand",
    "leads", "account_documents", "subscriber", "request_feedback", "task_list",
    "task_board", "automation_email", "email_campaign", "auto_email_templates",
    "email_templates", "employees", "designation", "department", "job_application",
    "job_post", "roles", "row_data", "form_builder", "bug_report",
    "activity_log", "company_profile", "number_system", "trending_image",
    "trending_carousel", "sliders", "blog", "document_list", "price_list",
    "countries", "continents", "unit", "currency", "product_spec",
    "payment_terms", "member_type", "document_type", "permission", "export_mapping"
];

const PermissionsListing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const [roleData, setRoleData] = useState<any | null>(null);
  const [permissions, setPermissions] = useState<PermissionModule[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State to manage pagination
  const [tableData, setTableData] = useState<{
    pageIndex: number;
    pageSize: number;
  }>({
    pageIndex: 1,
    pageSize: 10,
  });

  useEffect(() => {
    const roleFromState = location.state?.role as any;

    if (roleFromState) {
      setRoleData(roleFromState);
      const existingPermissions = roleFromState.permission?.permissions || [];
      const permissionMap = new Map(existingPermissions.map(p => [p.module, p]));
      const fullPermissionsList = ALL_SYSTEM_MODULES.map(moduleName => {
        const existing = permissionMap.get(moduleName);
        if (existing) {
          return existing;
        }
        return {
          module: moduleName,
          is_view: false,
          is_add: false,
          is_edit: false,
          is_delete: false,
          is_export: false,
        };
      });
      setPermissions(fullPermissionsList);
    } else {
      toast.push(<Notification title="No Role Selected" type="danger">Redirecting back to roles list.</Notification>);
      navigate('/access-control/roles');
    }
  }, [location.state, navigate]);

  const handlePermissionChange = useCallback((moduleName: string, key: keyof Omit<PermissionModule, 'module'>, value: boolean) => {
    setPermissions(currentPermissions =>
      currentPermissions.map(p =>
        p.module === moduleName ? { ...p, [key]: value } : p
      )
    );
  }, []);

  const handleSelectAllForRow = (moduleName: string, checked: boolean) => {
      setPermissions(currentPermissions =>
        currentPermissions.map(p =>
          p.module === moduleName ? { ...p, is_view: checked, is_add: checked, is_edit: checked, is_delete: checked ,is_export :checked } : p
        )
      )
  }

  const onUpdatePermissions = async () => {
    if (!roleData) return;
    setIsSubmitting(true);
    const payload = { role_id: roleData.id, permissions: permissions };
console.log("payload",payload);

    // This should be your actual API call
    const resultAction = await dispatch(updatePermissionsAction(payload));

    if (updatePermissionsAction.fulfilled.match(resultAction)) {
        toast.push(<Notification title="Permissions Updated" type="success" />);
        navigate('/access-control/roles');
    } else {
        toast.push(<Notification title="Update Failed" type="danger" children={(resultAction.payload as any)?.message || "Could not update permissions."} />);
    }
    setIsSubmitting(false);
  };

  // Handlers for pagination
  const handlePaginationChange = useCallback((page: number) => {
    setTableData(prev => ({ ...prev, pageIndex: page }));
  }, []);

  const handleSelectChange = useCallback((pageSize: number) => {
    setTableData(prev => ({ ...prev, pageSize, pageIndex: 1 }));
  }, []);

  // Memoize the paginated data
  const { pageData, total } = useMemo(() => {
    const { pageIndex, pageSize } = tableData;
    const totalRecords = permissions.length;
    const startIndex = (pageIndex - 1) * pageSize;
    const paginatedData = permissions.slice(startIndex, startIndex + pageSize);
    return {
      pageData: paginatedData,
      total: totalRecords,
    };
  }, [permissions, tableData]);

  const columns: ColumnDef<PermissionModule>[] = useMemo(
    () => [
      {
        header: "Modules",
        accessorKey: "module",
        cell: ({row}) => <span className="font-semibold capitalize">{row.original.module.replace(/_/g, ' ')}</span>,
      },
      {
          header: "All",
          id: "all",
          meta: { HeaderClass: "text-center" },
          cell: ({row}) => {
              const { is_view, is_add, is_edit, is_delete , is_export } = row.original;
              const allChecked = is_view && is_add && is_edit && is_delete && is_export;
              return (
                  <div className="flex justify-center">
                    <Checkbox checked={allChecked} onChange={(checked) => handleSelectAllForRow(row.original.module, checked)} />
                  </div>
              )
          }
      },
      { 
        header: "View", 
        accessorKey: "is_view",
        meta: { HeaderClass: "text-center" },
        cell: ({ row, getValue }) => (
            <div className="flex justify-center">
                <Checkbox checked={getValue()} onChange={(checked) => handlePermissionChange(row.original.module, 'is_view', checked)} />
            </div>
        ), 
      },
      {
        header: "Add",
        accessorKey: "is_add",
        meta: { HeaderClass: "text-center" },
        cell: ({ row, getValue }) => (
            <div className="flex justify-center">
                <Checkbox checked={getValue()} onChange={(checked) => handlePermissionChange(row.original.module, 'is_add', checked)} />
            </div>
        ),
      },
      {
        header: "Edit",
        accessorKey: "is_edit",
        meta: { HeaderClass: "text-center" },
        cell: ({ row, getValue }) => (
            <div className="flex justify-center">
                <Checkbox checked={getValue()} onChange={(checked) => handlePermissionChange(row.original.module, 'is_edit', checked)} />
            </div>
        ),
      },
      {
        header: "Delete",
        accessorKey: "is_delete",
        meta: { HeaderClass: "text-center" },
        cell: ({ row, getValue }) => (
            <div className="flex justify-center">
                <Checkbox checked={getValue()} onChange={(checked) => handlePermissionChange(row.original.module, 'is_delete', checked)} />
            </div>
        ),
      },
       {
        header: "Export",
        accessorKey: "is_export",
        meta: { HeaderClass: "text-center" },
        cell: ({ row, getValue }) => (
            <div className="flex justify-center">
                <Checkbox checked={getValue()} onChange={(checked) => handlePermissionChange(row.original.module, 'is_export', checked)} />
            </div>
        ),
      },
    ],
    [handlePermissionChange, handleSelectAllForRow]
  ); 

  const pageTitle = `Permissions for: ${roleData?.display_name || '...'}`;

  return (
    <Container className="h-auto">
      <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
        <h3 className="mb-4">{pageTitle}</h3>
        <div className="flex-grow overflow-auto">
          <DataTable
            columns={columns}
            data={pageData} // Pass the paginated data
            loading={isSubmitting}
            noData={pageData.length === 0}
            pagingData={{
              total: total,
              pageIndex: tableData.pageIndex,
              pageSize: tableData.pageSize,
            }}
            onPaginationChange={handlePaginationChange}
            onSelectChange={handleSelectChange}
          />
        </div>
      </AdaptiveCard>
      <div className="flex justify-end gap-4 mt-6">
        <Button onClick={() => navigate("/access-control/roles")} disabled={isSubmitting}>
            Cancel
        </Button>
        <Button variant="solid" onClick={onUpdatePermissions} loading={isSubmitting} disabled={!roleData}>
            Update Permissions
        </Button>
      </div>
    </Container>
  );
};

export default PermissionsListing;