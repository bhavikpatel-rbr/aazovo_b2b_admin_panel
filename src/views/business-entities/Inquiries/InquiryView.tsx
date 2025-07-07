// src/views/inquiries/InquiryViewPage.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '@/reduxtool/store';

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard';
import Container from '@/components/shared/Container';
import { Button, Card, Tag, Spinner, Notification, toast } from '@/components/ui';

// Icons
import { TbArrowLeft, TbPencil, TbDownload } from 'react-icons/tb';

// Services & Types
import axiosInstance from '@/services/api/api';
import type { ApiInquiryItem, InquiryItem } from './Inquiries'; // Assuming types are exported from Inquiries.tsx

// --- Helper: Data Processing ---
const processSingleApiDataToInquiryItem = (apiItem: ApiInquiryItem): InquiryItem | null => {
    if (!apiItem || typeof apiItem !== 'object') return null;
    return {
      id: String(apiItem.id),
      inquiry_id: apiItem.inquiry_id || `INQ-${apiItem.id}`,
      company_name: apiItem.company_name || 'N/A',
      contact_person_name: apiItem.contact_person_name || apiItem.name || 'N/A',
      contact_person_email: apiItem.contact_person_email || apiItem.email || 'N/A',
      contact_person_phone: apiItem.contact_person || apiItem.mobile_no || 'N/A',
      inquiry_type: apiItem.inquiry_type || 'N/A',
      inquiry_subject: apiItem.inquiry_subject || 'N/A',
      inquiry_description: apiItem.requirements || apiItem.inquiry_description || 'N/A',
      inquiry_priority: apiItem.inquiry_priority || apiItem.priority || 'N/A',
      inquiry_status: apiItem.inquiry_status || apiItem.status || 'N/A',
      assigned_to: apiItem.assigned_to_name || 'Unassigned',
      department: apiItem.inquiry_department_name || undefined,
      inquiry_date: apiItem.inquiry_date || apiItem.created_at || 'N/A',
      response_date: apiItem.response_date || 'N/A',
      resolution_date: apiItem.resolution_date || 'N/A',
      follow_up_date: apiItem.follow_up_date || 'N/A',
      feedback_status: apiItem.feedback_status || 'N/A',
      inquiry_resolution: apiItem.inquiry_resolution || 'N/A',
      inquiry_attachments: apiItem.inquiry_attachments_array || [],
      status: apiItem.deleted_at ? 'inactive' : 'active',
    };
  };

// --- Helper Components for Display ---
const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="mb-3">
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    <div className="text-sm font-semibold break-words">
      {value === '' || value === undefined || value === null ? (
        <span className="text-gray-400 dark:text-gray-500">N/A</span>
      ) : (
        value
      )}
    </div>
  </div>
);

const formatDate = (dateString?: string, label?: string) => {
    if (!dateString || dateString === 'N/A') return <DetailItem label={label || 'Date'} value="N/A" />;
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return <DetailItem label={label || 'Date'} value="Invalid Date" />;
        const formatted = date.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' });
        return <DetailItem label={label || 'Date'} value={formatted} />;
    } catch (e) {
        return <DetailItem label={label || 'Date'} value="Error" />;
    }
};

// --- Color Mappings ---
const priorityColors: Record<string, string> = { High: "bg-red-100 text-red-700", Medium: "bg-yellow-100 text-yellow-700", Low: "bg-blue-100 text-blue-700", "N/A": "bg-gray-100 text-gray-700" };
const inquiryCurrentStatusColors: Record<string, string> = { New: "bg-sky-100 text-sky-700", "In Progress": "bg-amber-100 text-amber-700", Resolved: "bg-emerald-100 text-emerald-700", Closed: "bg-gray-100 text-gray-700", "N/A": "bg-gray-100 text-gray-700" };

// --- Main View Component ---
const InquiryViewPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [inquiry, setInquiry] = useState<InquiryItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        if (!id) {
            toast.push(<Notification type="danger" title="Error">No Inquiry ID provided.</Notification>);
            navigate('/business-entities/inquiries');
            return;
        }

        const fetchInquiry = async () => {
            setIsLoading(true);
            try {
                const response = await axiosInstance.get(`/inquiry/${id}`);
                if (response.data?.status === true && response.data.data) {
                    const processedData = processSingleApiDataToInquiryItem(response.data.data);
                    setInquiry(processedData);
                } else {
                    toast.push(<Notification type="danger" title="Fetch Error">{response.data?.message || 'Failed to load inquiry data.'}</Notification>);
                    navigate('/business-entities/inquiries');
                }
            } catch (error: any) {
                toast.push(<Notification type="danger" title="Fetch Error">{error?.response?.data?.message || 'An error occurred.'}</Notification>);
                navigate('/business-entities/inquiries');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInquiry();
    }, [id, navigate]);

    if (isLoading) {
        return <Container className="h-full flex justify-center items-center"><Spinner size={40} /></Container>;
    }

    if (!inquiry) {
        return <Container><Card className="text-center p-8"><p>Inquiry not found.</p><Button className="mt-4" onClick={() => navigate('/business-entities/inquiries')}>Back to List</Button></Card></Container>;
    }

    return (
        <Container>
            <AdaptiveCard>
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <p className="text-gray-500 text-sm">Inquiry ID</p>
                        <h4 className="font-bold">{inquiry.inquiry_id}</h4>
                        <p className="text-gray-600 mt-1">{inquiry.inquiry_subject}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <Button icon={<TbArrowLeft />} onClick={() => navigate('/business-entities/inquiries')}>Back to List</Button>
                        <Button variant="solid" icon={<TbPencil />} onClick={() => navigate('/business-entities/create-inquiry', { state: id })}>Edit</Button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="mt-8 flex flex-col gap-6">
                    <Card bordered>
                        <h5 className="mb-4">Contact & Company Details</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1">
                            <DetailItem label="Company Name" value={inquiry.company_name} />
                            <DetailItem label="Contact Person" value={inquiry.contact_person_name} />
                            <DetailItem label="Email" value={<a href={`mailto:${inquiry.contact_person_email}`} className="text-blue-600 hover:underline">{inquiry.contact_person_email}</a>} />
                            <DetailItem label="Phone" value={inquiry.contact_person_phone} />
                        </div>
                    </Card>

                    <Card bordered>
                        <h5 className="mb-4">Inquiry Status & Assignment</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1">
                            <DetailItem label="Type" value={<Tag>{inquiry.inquiry_type}</Tag>} />
                            <DetailItem label="Priority" value={<Tag className={`${priorityColors[inquiry.inquiry_priority] || priorityColors['N/A']}`}>{inquiry.inquiry_priority}</Tag>} />
                            <DetailItem label="Status" value={<Tag className={`${inquiryCurrentStatusColors[inquiry.inquiry_status] || inquiryCurrentStatusColors['N/A']}`}>{inquiry.inquiry_status}</Tag>} />
                            <DetailItem label="Assigned To" value={inquiry.assigned_to} />
                            <DetailItem label="Department" value={inquiry.department} />
                            <DetailItem label="Feedback Status" value={inquiry.feedback_status} />
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card bordered className="lg:col-span-1">
                            <h5 className="mb-4">Description</h5>
                            <div className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md min-h-[100px] whitespace-pre-wrap overflow-y-auto">
                                {inquiry.inquiry_description}
                            </div>
                        </Card>
                        <Card bordered className="lg:col-span-1">
                            <h5 className="mb-4">Resolution Notes</h5>
                             <div className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md min-h-[100px] whitespace-pre-wrap overflow-y-auto">
                                {inquiry.inquiry_resolution}
                            </div>
                        </Card>
                    </div>

                    <Card bordered>
                        <h5 className="mb-4">Timeline</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1">
                            {formatDate(inquiry.inquiry_date, 'Inquiry Date')}
                            {formatDate(inquiry.response_date, 'Response Date')}
                            {formatDate(inquiry.resolution_date, 'Resolution Date')}
                            {formatDate(inquiry.follow_up_date, 'Follow-up Date')}
                        </div>
                    </Card>

                    {inquiry.inquiry_attachments.length > 0 && (
                        <Card bordered>
                            <h5 className="mb-4">Attachments</h5>
                            <div className="flex flex-col gap-2">
                                {inquiry.inquiry_attachments.map((url, index) => {
                                    const fileName = url.split('/').pop()?.split('?')[0] || `Attachment ${index + 1}`;
                                    return (
                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                            <span className="text-sm truncate pr-4">{fileName}</span>
                                            <a href={url} target="_blank" rel="noopener noreferrer">
                                                <Button size="sm" icon={<TbDownload />}>Download</Button>
                                            </a>
                                        </div>
                                    )
                                })}
                            </div>
                        </Card>
                    )}
                </div>
            </AdaptiveCard>
        </Container>
    );
};

export default InquiryViewPage;