// FormListTable.tsx (for Partners - new design inspired by Company example)

import React, { useState, useMemo, useCallback } from "react";
import Avatar from "@/components/ui/Avatar";
import Tag from "@/components/ui/Tag";
import Tooltip from "@/components/ui/Tooltip";
import DataTable from "@/components/shared/DataTable";
import { useNavigate } from "react-router-dom";
import cloneDeep from "lodash/cloneDeep";
import {
  TbPencil,
  TbEye,
  TbCopy, // Assuming clone is a desired action
  TbSwitchHorizontal, // Assuming status change is a desired action
  TbTrash,
  TbShare,
  TbDotsVertical,
  TbExternalLink,
  TbCertificate,
  TbBriefcase,
  TbMapPin,
  TbUserCircle, // Fallback icon for Avatar
  TbFileDescription, // For documents
  TbClockHour4, // For lead time
  TbCreditCard, // For payment terms
} from "react-icons/tb";
import {
  MdCheckCircle,
  MdErrorOutline,
  MdHourglassEmpty,
  MdLink,
} from "react-icons/md";
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { Dropdown } from "@/components/ui"; // For "More" actions

// --- Define PartnerListItem Type (Refined) ---
export type PartnerListItem = {
  id: string;
  // For "Partner Details" Column
  partner_name: string;
  partner_logo: string; // URL
  partner_email_id: string;
  partner_contact_number: string;
  partner_reference_id?: string; // Optional
  status: "active" | "inactive"; // Overall status of the entry in this list

  // For "Business Focus" Column
  partner_business_type: string;
  business_category: string[];
  partner_service_offerings: string[];
  partner_interested_in: "Buy" | "Sell" | "Both" | "None";

  // For "Status & Scores" Column
  partner_status_orig: "Active" | "Inactive" | "Pending"; // The partner's specific operational status
  partner_kyc_status: string; // e.g., 'Verified', 'Pending', 'Under Review', 'Not Submitted'
  partner_profile_completion: number; // Percentage
  partner_join_date: string; // ISO date string
  partner_trust_score: number;
  partner_activity_score: number;

  // For "Location & Links" Column
  partner_location: string;
  partner_website?: string; // Optional
  partner_profile_link?: string; // Optional
  partner_certifications: string[];

  // Additional Info Column (New)
  partner_payment_terms?: string;
  partner_lead_time?: number; // In days
  partner_document_upload?: string; // URL to a document
};
// --- End PartnerListItem Type ---

// --- Status Colors ---
const partnerDisplayStatusColors: Record<string, string> = {
  Active:
    "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  Inactive: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  Pending:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  Verified: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "Under Review":
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  "Not Submitted":
    "bg-gray-100 text-gray-600 dark:bg-gray-600/20 dark:text-gray-400",
  active:
    "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  inactive: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
};

const getDisplayStatusClass = (statusValue?: string): string => {
  if (!statusValue) return "bg-gray-100 text-gray-500";
  return partnerDisplayStatusColors[statusValue] || "bg-gray-100 text-gray-500";
};
// --- End Status Colors ---

// --- ActionColumn ---
const ActionColumn = ({
  rowData,
  onEdit,
  onViewDetail,
  onClone,
  onChangeStatus,
  onDelete,
  onShare,
}: {
  rowData: PartnerListItem; // Pass full row data for context
  onEdit: (id: string) => void;
  onViewDetail: (id: string) => void;
  onClone: (id: string) => void;
  onChangeStatus: (
    id: string,
    currentStatus: PartnerListItem["status"]
  ) => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
}) => {
  const navigate = useNavigate(); // If navigation is needed from actions

  const MoreToggle = (
    <Tooltip title="More">
      <div
        className="text-xl cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
        role="button"
      >
        <TbDotsVertical />
      </div>
    </Tooltip>
  );
  return (
    <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
      <Tooltip title="Edit">
        <div
          className="text-xl cursor-pointer hover:text-emerald-600"
          role="button"
          onClick={() => onEdit(rowData.id)}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View Details">
        <div
          className="text-xl cursor-pointer hover:text-blue-600"
          role="button"
          onClick={() => onViewDetail(rowData.id)}
        >
          <TbEye />
        </div>
      </Tooltip>
      <Tooltip title="Share">
        <div
          className="text-xl cursor-pointer hover:text-orange-600"
          role="button"
          onClick={() => onShare(rowData.id)}
        >
          <TbShare />
        </div>
      </Tooltip>
      <Dropdown renderTitle={MoreToggle} placement="bottom-end">
        <Dropdown.Item eventKey="clone" onClick={() => onClone(rowData.id)}>
          <TbCopy className="mr-2" /> Clone Partner
        </Dropdown.Item>
        <Dropdown.Item
          eventKey="changeStatus"
          onClick={() => onChangeStatus(rowData.id, rowData.status)}
        >
          <TbSwitchHorizontal className="mr-2" /> Change Status
        </Dropdown.Item>
        <Dropdown.Item
          eventKey="delete"
          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
          onClick={() => onDelete(rowData.id)}
        >
          <TbTrash className="mr-2" /> Delete Partner
        </Dropdown.Item>
      </Dropdown>
    </div>
  );
};
// --- End ActionColumn ---

// --- Initial Partner Data (Mapped to PartnerListItem) ---
const initialPartnerData: PartnerListItem[] = [
  {
    id: "F001",
    status: "active", // Overall status of this entry
    partner_name: "Alpha Tech Solutions",
    partner_contact_number: "+1-202-555-0143",
    partner_email_id: "contact@alphatech.com",
    partner_logo: "https://i.pravatar.cc/80?u=alpha",
    partner_status_orig: "Active", // Specific partner status
    partner_join_date: "2023-01-15T10:00:00Z",
    partner_location: "New York, USA",
    partner_profile_completion: 95.5,
    partner_trust_score: 88,
    partner_activity_score: 75,
    partner_kyc_status: "Verified",
    business_category: [
      "IT Services",
      "Cloud Consulting",
      "Software Development",
      "AI Solutions",
    ],
    partner_interested_in: "Both",
    partner_business_type: "B2B Enterprise Solutions",
    partner_profile_link: "https://linkedin.com/company/alphatech",
    partner_certifications: [
      "ISO 9001",
      "CMMI Level 3",
      "AWS Certified Partner",
    ],
    partner_service_offerings: [
      "Custom Software Development",
      "Cloud Migration",
      "AI Chatbots",
      "Data Analytics",
    ],
    partner_website: "https://alphatech.com",
    partner_payment_terms: "Net 30 Days",
    partner_reference_id: "REF-ALPHA-001",
    partner_document_upload: "https://example.com/docs/alpha_agreement.pdf",
    partner_lead_time: 7,
  },
  {
    id: "F002",
    status: "inactive",
    partner_name: "Beta Logistics Group",
    partner_contact_number: "+44-161-555-0199",
    partner_email_id: "info@betalogs.co.uk",
    partner_logo: "https://i.pravatar.cc/80?u=beta",
    partner_status_orig: "Inactive",
    partner_join_date: "2022-10-01T14:30:00Z",
    partner_location: "Manchester, UK",
    partner_profile_completion: 78.2,
    partner_trust_score: 72,
    partner_activity_score: 60,
    partner_kyc_status: "Pending",
    business_category: ["Logistics", "Supply Chain", "Warehousing"],
    partner_interested_in: "Sell",
    partner_business_type: "Freight & Storage Services",
    partner_profile_link: "https://business.facebook.com/betalogs",
    partner_certifications: ["ISO 27001", "Logistics UK Member"],
    partner_service_offerings: [
      "International Freight",
      "Secure Warehousing",
      "Last-Mile Delivery",
    ],
    partner_website: "https://betalogs.co.uk",
    partner_payment_terms: "50% Advance, 50% on Delivery",
    partner_reference_id: "REF-BETA-002",
    partner_document_upload: "https://example.com/docs/beta_license.pdf",
    partner_lead_time: 10,
  },
  {
    id: "F003",
    status: "active",
    partner_name: "Gamma Retailers Inc.",
    partner_contact_number: "+91-9876543210",
    partner_email_id: "sales@gammaretail.in",
    partner_logo: "https://i.pravatar.cc/80?u=gamma",
    partner_status_orig: "Pending",
    partner_join_date: "2024-03-21T08:00:00Z",
    partner_location: "Mumbai, India",
    partner_profile_completion: 67.0,
    partner_trust_score: 55,
    partner_activity_score: 49,
    partner_kyc_status: "Under Review",
    business_category: ["Retail", "E-commerce", "FMCG Distribution"],
    partner_interested_in: "Buy",
    partner_business_type: "Multi-channel Retailer",
    partner_profile_link: "https://example.com/partners/gamma",
    partner_certifications: ["FSSAI Licensed", "GST Registered"],
    partner_service_offerings: [
      "Online Grocery Sales",
      "Apparel Retail",
      "Electronics Store",
    ],
    partner_website: "https://gammaretail.in",
    partner_payment_terms: "Net 15 Days",
    partner_reference_id: "REF-GAMMA-003",
    partner_document_upload: "https://example.com/docs/gamma_docs.pdf",
    partner_lead_time: 5,
  },
];
// --- End Initial Partner Data ---

const FormListTable = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [partners, setPartners] =
    useState<PartnerListItem[]>(initialPartnerData);
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedPartners, setSelectedPartners] = useState<PartnerListItem[]>(
    []
  );

  const { pageData, total } = useMemo(() => {
    let filteredData = [...partners];
    if (tableData.query) {
      const query = tableData.query.toLowerCase();
      filteredData = partners.filter(
        (form) =>
          form.id.toLowerCase().includes(query) ||
          form.partner_name.toLowerCase().includes(query) ||
          form.partner_contact_number.toLowerCase().includes(query) ||
          form.partner_email_id.toLowerCase().includes(query) ||
          form.partner_status_orig.toLowerCase().includes(query) ||
          form.partner_location.toLowerCase().includes(query) ||
          form.partner_kyc_status.toLowerCase().includes(query) ||
          form.status.toLowerCase().includes(query) ||
          form.partner_business_type.toLowerCase().includes(query) ||
          form.business_category.some((cat) =>
            cat.toLowerCase().includes(query)
          )
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      filteredData.sort((a, b) => {
        const aValue = a[key as keyof PartnerListItem] ?? "";
        const bValue = b[key as keyof PartnerListItem] ?? "";
        if (
          [
            "partner_profile_completion",
            "partner_trust_score",
            "partner_activity_score",
            "partner_lead_time",
          ].includes(aValue as string)
        ) {
          const numA = Number(aValue);
          const numB = Number(bValue);
          if (!isNaN(numA) && !isNaN(numB))
            return order === "asc" ? numA - numB : numB - numA;
        }
        if (key === "partner_join_date") {
          const dateA = new Date(aValue as string).getTime();
          const dateB = new Date(bValue as string).getTime();
          return order === "asc" ? dateA - dateB : dateB - dateA;
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
  }, [partners, tableData]);

  const handleEditPartner = (id: string) => {
    console.log("Edit Partner:", id); /* navigate(`/app/partners/edit/${id}`) */
  };
  const handleViewPartnerDetails = (id: string) => {
    console.log(
      "View Partner Details:",
      id
    ); /* navigate(`/app/partners/details/${id}`) */
  };
  const handleClonePartner = (id: string) => {
    const partnerToClone = partners.find((p) => p.id === id);
    if (!partnerToClone) return;
    const newId = `P-CLONE-${Date.now()}`;
    const clonedPartner: PartnerListItem = {
      ...cloneDeep(partnerToClone), // Deep clone to avoid issues with array references
      id: newId,
      partner_name: `${partnerToClone.partner_name} (Clone)`,
      status: "inactive",
      partner_status_orig: "Inactive",
    };
    setPartners((prev) => [clonedPartner, ...prev]);
    console.log("Cloned Partner:", newId);
  };
  const handleChangePartnerOverallStatus = (
    id: string,
    currentStatus: PartnerListItem["status"]
  ) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    setPartners((current) =>
      current.map((p) =>
        p.id === id
          ? {
              ...p,
              status: newStatus,
              partner_status_orig:
                newStatus === "active" ? "Active" : "Inactive",
            }
          : p
      )
    );
    console.log(`Overall status changed for ${id} to ${newStatus}`);
  };
  const handleDeletePartner = (id: string) => {
    // Add confirmation dialog logic here
    console.log("Attempting to delete Partner:", id);
    setPartners((current) => current.filter((p) => p.id !== id));
  };
  const handleSharePartner = (id: string) => {
    console.log("Share Partner:", id);
  };

  const columns: ColumnDef<PartnerListItem>[] = useMemo(
    () => [
      {
        header: "Partner Details",
        accessorKey: "partner_name",
        enableSorting: true,
        size: 280, // Adjusted for more info
        cell: ({ row }) => {
          const {
            partner_name,
            partner_logo,
            partner_email_id,
            partner_contact_number,
            status,
            partner_reference_id,
            id,
          } = row.original;
          return (
            <div className="flex items-start gap-3">
              {" "}
              {/* items-start for better alignment */}
              <Avatar
                src={partner_logo}
                size="lg"
                shape="circle"
                icon={<TbUserCircle />}
              />
              <div className="flex flex-col text-xs min-w-0">
                {" "}
                {/* min-w-0 for truncate */}
                <span
                  className="font-semibold text-sm text-gray-800 dark:text-gray-100 hover:text-blue-600 cursor-pointer truncate"
                  onClick={() => handleViewPartnerDetails(id)}
                  title={partner_name}
                >
                  {partner_name}
                </span>
                <span
                  className="text-gray-500 dark:text-gray-400 truncate"
                  title={partner_email_id}
                >
                  {partner_email_id}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {partner_contact_number}
                </span>
                {partner_reference_id && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    Ref: {partner_reference_id}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        header: "Business Focus",
        accessorKey: "partner_business_type",
        enableSorting: true,
        size: 250, // Adjusted
        cell: ({ row }) => {
          const {
            partner_business_type,
            business_category,
            partner_interested_in,
            partner_service_offerings,
          } = row.original;
          return (
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center">
                <TbBriefcase className="inline mr-1.5 text-gray-500 flex-shrink-0" />
                <span className="font-semibold mr-1">Type:</span>
                <span
                  className="text-gray-600 dark:text-gray-400 truncate"
                  title={partner_business_type}
                >
                  {partner_business_type}
                </span>
              </div>
              {business_category?.length > 0 && (
                <div className="flex items-start">
                  <span className="font-semibold mr-1.5">
                    Category:&nbsp;
                    <Tooltip
                      placement="top"
                      title={business_category.join(" | ")}
                    >
                      <span className="text-gray-600 dark:text-gray-400">
                        {business_category.slice(0, 3).join(", ") +
                          (business_category.length > 3 ? "..." : "")}
                      </span>
                    </Tooltip>
                  </span>
                </div>
              )}
              {partner_service_offerings?.length > 0 && (
                <div className="flex items-start">
                  <span className="font-semibold mr-1.5">
                    Services:&nbsp;
                    <Tooltip
                      placement="top"
                      title={partner_service_offerings.join(" | ")}
                    >
                      <span className="text-gray-600 dark:text-gray-400">
                        {partner_service_offerings.slice(0, 3).join(", ") +
                          (partner_service_offerings.length > 3 ? "..." : "")}
                      </span>
                    </Tooltip>
                  </span>
                </div>
              )}

              <div className="flex items-start">
                <span className="font-semibold mr-1.5">
                  Interested In:&nbsp;
                  <Tooltip placement="top" title={partner_interested_in}>
                    <span className="text-gray-600 dark:text-gray-400">
                      {partner_interested_in.length > 50
                        ? partner_interested_in.slice(0, 50) + "..."
                        : partner_interested_in}
                    </span>
                  </Tooltip>
                </span>
              </div>
            </div>
          );
        },
      },
      {
        header: "Status & Scores",
        accessorKey: "partner_status_orig",
        enableSorting: true,
        size: 220,
        cell: ({ row }) => {
          const {
            partner_status_orig,
            partner_kyc_status,
            partner_profile_completion,
            partner_trust_score,
            partner_activity_score,
            partner_join_date,
          } = row.original;
          let kycIcon = (
            <MdHourglassEmpty
              className="text-orange-500 inline mr-0.5"
              size={12}
            />
          );
          if (partner_kyc_status === "Verified")
            kycIcon = (
              <MdCheckCircle
                className="text-green-500 inline mr-0.5"
                size={12}
              />
            );
          else if (["Not Submitted", "Rejected"].includes(partner_kyc_status))
            kycIcon = (
              <MdErrorOutline
                className="text-red-500 inline mr-0.5"
                size={12}
              />
            );

          return (
            <div className="flex flex-col gap-1 text-xs">
              <Tag
                className={`${getDisplayStatusClass(
                  partner_status_orig
                )} capitalize font-semibold border-0 self-start px-2 py-0.5 !text-[10px]`}
              >
                Partner: {partner_status_orig}
              </Tag>
              <Tooltip
                title={`KYC: ${partner_kyc_status}`}
                className="text-xs mt-0.5"
              >
                <Tag
                  className={`${getDisplayStatusClass(
                    partner_kyc_status
                  )} capitalize !text-[9px] px-1.5 py-0.5 border self-start flex items-center`}
                >
                  {kycIcon}
                  {partner_kyc_status}
                </Tag>
              </Tooltip>
              <Tooltip
                title={`Profile: ${partner_profile_completion}% | Joined: ${new Date(
                  partner_join_date
                ).toLocaleDateString()}`}
              >
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 my-1">
                  {" "}
                  {/* Increased height slightly */}
                  <div
                    className="bg-blue-500 h-full rounded-full flex items-center justify-end text-white pr-1 text-[8px]"
                    style={{ width: `${partner_profile_completion}%` }}
                  >
                    {partner_profile_completion > 15 &&
                      `${partner_profile_completion}%`}
                  </div>
                </div>
              </Tooltip>
              <div className="flex justify-between items-center text-[10px] gap-1">
                <Tooltip title={`Trust: ${partner_trust_score}%`}>
                  <Tag className="flex-1 text-center !py-0.5 bg-blue-100 text-blue-700">
                    T: {partner_trust_score}%
                  </Tag>
                </Tooltip>
                <Tooltip title={`Activity: ${partner_activity_score}%`}>
                  <Tag className="flex-1 text-center !py-0.5 bg-purple-100 text-purple-700">
                    A: {partner_activity_score}%
                  </Tag>
                </Tooltip>
              </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                Joined Date: {new Date(partner_join_date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                }).replace(/ /g, "/")}
                </div>
            </div>
          );
        },
      },
      {
        header: "Location & Links",
        accessorKey: "partner_location",
        enableSorting: true,
        size: 220, // Adjusted
        cell: ({ row }) => {
          const {
            partner_location,
            partner_website,
            partner_profile_link,
            partner_certifications,
            partner_document_upload,
            partner_payment_terms,
            partner_lead_time,
          } = row.original;
          // Function to create a short display for certifications
          const getShortCertificationsDisplay = (
            certs: string[] | undefined
          ): string => {
            if (!certs || certs.length === 0) {
              return "N/A";
            }
            if (certs.length === 1) {
              return certs[0].length > 15
                ? certs[0].substring(0, 12) + "..."
                : certs[0]; // Show more of a single cert
            }
            // Example: "ISO 9, CMMI, +1 more" or just first few joined
            const firstFew = certs
              .slice(0, 1)
              .map(
                (cert) => cert.substring(0, 8) + (cert.length > 8 ? ".." : "")
              ); // Show first cert shortened
            let display = firstFew.join(", ");
            if (certs.length > 1) {
              display += `, +${certs.length - 1}`;
            }
            return display;
          };
          return (
            <div className="flex flex-col gap-1 text-xs">
              {partner_location && (
                <div className="flex items-center">
                  <TbMapPin className="text-gray-500 mr-1.5 flex-shrink-0" />{" "}
                  {partner_location}
                </div>
              )}
              {partner_website && (
                <a
                  href={partner_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate flex items-center"
                >
                  <TbExternalLink className="mr-1.5 flex-shrink-0" /> Website
                </a>
              )}
              {partner_profile_link && (
                <a
                  href={partner_profile_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate flex items-center"
                >
                  <MdLink className="mr-1.5 flex-shrink-0" size={14} /> Profile
                </a>
              )}
              {partner_certifications && partner_certifications.length > 0 && (
                <Tooltip
                  placement="top"
                  title={partner_certifications.join(" | ")}
                >
                  <div className="text-gray-600 dark:text-gray-400 truncate flex items-center">
                    <TbCertificate className="text-gray-500 mr-1.5 flex-shrink-0" />{" "}
                    {getShortCertificationsDisplay(partner_certifications)}
                  </div>
                </Tooltip>
              )}
              {partner_document_upload && (
                <a
                  href={partner_document_upload}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate flex items-center"
                >
                  <TbFileDescription className="mr-1.5 flex-shrink-0" />{" "}
                  Document
                </a>
              )}
              {partner_payment_terms && (
                <div className="flex items-center">
                  <TbCreditCard className="text-gray-500 mr-1.5 flex-shrink-0" />{" "}
                  {partner_payment_terms}
                </div>
              )}
              {partner_lead_time !== undefined && (
                <div className="flex items-center">
                  <TbClockHour4 className="text-gray-500 mr-1.5 flex-shrink-0" />{" "}
                  Lead: {partner_lead_time} days
                </div>
              )}
            </div>
          );
        },
      },
      {
        header: "Actions",
        id: "action",
        size: 130, // Increased for Dropdown
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            rowData={props.row.original}
            onEdit={handleEditPartner}
            onViewDetail={handleViewPartnerDetails}
            onClone={handleClonePartner}
            onChangeStatus={handleChangePartnerOverallStatus}
            onDelete={handleDeletePartner}
            onShare={handleSharePartner}
          />
        ),
      },
    ],
    [
      handleViewPartnerDetails,
      handleEditPartner,
      handleClonePartner,
      handleChangePartnerOverallStatus,
      handleDeletePartner,
      handleSharePartner,
    ]
  );

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    /* ... */
  }, []);
  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handleSelectChange = useCallback(
    (value: number) =>
      handleSetTableData({ pageSize: Number(value), pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleRowSelect = useCallback(
    (checked: boolean, row: PartnerListItem) => {
      /* ... */
    },
    []
  );
  const handleAllRowSelect = useCallback(
    (checked: boolean, rows: Row<PartnerListItem>[]) => {
      /* ... */
    },
    []
  );

  return (
    <DataTable
      selectable
      columns={columns}
      data={pageData}
      noData={!isLoading && partners.length === 0}
      loading={isLoading}
      pagingData={{
        total: total,
        pageIndex: tableData.pageIndex as number,
        pageSize: tableData.pageSize as number,
      }}
      checkboxChecked={(row) =>
        selectedPartners.some((selected) => selected.id === row.id)
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
