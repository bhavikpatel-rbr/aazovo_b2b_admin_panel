import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

// UI Components
import { Button, DatePicker, Dialog, FormItem, Input, Select, Avatar, Tooltip, Notification, toast, Tag, Table } from '@/components/ui';
import RichTextEditor from '@/components/shared/RichTextEditor';

// Types
import { CompanyItem } from '../Company'; // Adjust the import path as needed

// Icons
import { TbUserCircle, TbFileText, TbFileZip, TbClock, TbMessageCircle, TbCheck, TbAlertTriangle, TbReportMoney, TbDownload, TbCalendar, TbMail, TbUser, TbClipboardText } from 'react-icons/tb';

// --- Helper Data (for demos) ---
const dummyUsers = [ { value: 'user1', label: 'Alice Johnson' }, { value: 'user2', label: 'Bob Williams' }, { value: 'user3', label: 'Charlie Brown' }];
const priorityOptions = [ { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }];
const eventTypeOptions = [ { value: 'meeting', label: 'Meeting' }, { value: 'call', label: 'Follow-up Call' }, { value: 'deadline', label: 'Project Deadline' }];
const dummyMembers = [ { id: 'm1', name: 'Eleanor Vance', role: 'CEO', avatar: '/img/avatars/default-user.jpg' }, { id: 'm2', name: 'Cedric Diggory', role: 'CTO', avatar: '/img/avatars/thumb-2.jpg' }, { id: 'm3', name: 'Frank Bryce', role: 'Lead Developer', avatar: '/img/avatars/thumb-3.jpg' }];
const dummyAlerts = [ { id: 1, severity: 'danger', message: 'Invoice #INV-0012 is 30 days overdue.', time: '2 days ago' }, { id: 2, severity: 'warning', message: 'Subscription ends in 7 days.', time: '5 days ago' }];
const dummyTimeline = [ { id: 1, icon: <TbMail />, title: 'Email Sent', desc: 'Sent Q4 proposal.', time: '2023-10-25' }, { id: 2, icon: <TbCalendar />, title: 'Meeting Scheduled', desc: 'Discovery call with their tech lead.', time: '2023-10-20' }, { id: 3, icon: <TbUser />, title: 'Member Added', desc: 'Jane Doe joined as a contact.', time: '2023-10-18' }];
const dummyTransactions = [ { id: 'tx1', date: '2023-10-15', desc: 'Invoice #INV-0012', amount: '$5,000.00', status: 'Overdue' }, { id: 'tx2', date: '2023-09-20', desc: 'Subscription Fee', amount: '$500.00', status: 'Paid' }];
const dummyDocs = [{ id: 'doc1', name: 'Service_Agreement.pdf', type: 'pdf', size: '2.5 MB' }, { id: 'doc2', name: 'Onboarding_Kit.zip', type: 'zip', size: '10.1 MB' }];

// --- Type Definitions for Modals ---
export type ModalType = | 'email' | 'whatsapp' | 'notification' | 'task' | 'active' | 'calendar' | 'members' | 'alert' | 'trackRecord' | 'engagement' | 'transaction' | 'document';

export interface ModalState {
    isOpen: boolean;
    type: ModalType | null;
    data: CompanyItem | null;
}

interface CompanyModalsProps {
    modalState: ModalState;
    onClose: () => void;
}

// --- Main Modals Component ---
const CompanyModals: React.FC<CompanyModalsProps> = ({ modalState, onClose }) => {
    const { type, data: company, isOpen } = modalState;

    if (!isOpen || !company) {
        return null;
    }

    const renderModalContent = () => {
        switch (type) {
            case 'email': return <SendEmailDialog company={company} onClose={onClose} />;
            case 'whatsapp': return <SendWhatsAppDialog company={company} onClose={onClose} />;
            case 'notification': return <AddNotificationDialog company={company} onClose={onClose} />;
            case 'task': return <AssignTaskDialog company={company} onClose={onClose} />;
            case 'calendar': return <AddScheduleDialog company={company} onClose={onClose} />;
            case 'members': return <ViewMembersDialog company={company} onClose={onClose} />;
            case 'alert': return <ViewAlertDialog company={company} onClose={onClose} />;
            case 'trackRecord': return <TrackRecordDialog company={company} onClose={onClose} />;
            case 'engagement': return <ViewEngagementDialog company={company} onClose={onClose} />;
            case 'transaction': return <ViewTransactionDialog company={company} onClose={onClose} />;
            case 'document': return <DownloadDocumentDialog company={company} onClose={onClose} />;
            default: return <GenericActionDialog type={type} company={company} onClose={onClose} />;
        }
    };

    return <>{renderModalContent()}</>;
};

// --- Individual Dialog Components ---

const SendEmailDialog: React.FC<{ company: CompanyItem; onClose: () => void }> = ({ company, onClose }) => { /* ... same as previous answer ... */ return <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>...</Dialog>;};
const AssignTaskDialog: React.FC<{ company: CompanyItem; onClose: () => void }> = ({ company, onClose }) => { /* ... same as previous answer ... */ return <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>...</Dialog>;};
const AddScheduleDialog: React.FC<{ company: CompanyItem; onClose: () => void }> = ({ company, onClose }) => { /* ... same as previous answer ... */ return <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>...</Dialog>;};
const ViewMembersDialog: React.FC<{ company: CompanyItem; onClose: () => void }> = ({ company, onClose }) => { /* ... same as previous answer ... */ return <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={600}>...</Dialog>;};

const SendWhatsAppDialog: React.FC<{ company: CompanyItem; onClose: () => void }> = ({ company, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { control, handleSubmit } = useForm({ defaultValues: { message: `Hi ${company.name}, following up on our conversation.` } });

    const onSendMessage = (data: { message: string }) => {
        setIsLoading(true);
        const phone = company.company_contact_number?.replace(/\D/g, '');
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(data.message)}`;
        window.open(url, '_blank');
        toast.push(<Notification type="success" title="Redirecting to WhatsApp" />);
        setIsLoading(false);
        onClose();
    };

    return (
        <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
            <h5 className="mb-4">Send WhatsApp to {company.name}</h5>
            <form onSubmit={handleSubmit(onSendMessage)}>
                <FormItem label="Message Template">
                    <Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={4}/>} />
                </FormItem>
                <div className="text-right mt-6">
                    <Button className="mr-2" onClick={onClose}>Cancel</Button>
                    <Button variant="solid" type="submit" loading={isLoading}>Open WhatsApp</Button>
                </div>
            </form>
        </Dialog>
    );
};

const AddNotificationDialog: React.FC<{ company: CompanyItem; onClose: () => void }> = ({ company, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { control, handleSubmit } = useForm({ defaultValues: { title: '', users: [], message: '' } });

    const onSend = (data: any) => {
        setIsLoading(true);
        console.log("Sending in-app notification for", company.name, "with data:", data);
        setTimeout(() => {
            toast.push(<Notification type="success" title="Notification Sent" />);
            setIsLoading(false);
            onClose();
        }, 1000);
    };

    return (
        <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
            <h5 className="mb-4">Add Notification for {company.name}</h5>
            <form onSubmit={handleSubmit(onSend)}>
                <FormItem label="Notification Title">
                    <Controller name="title" control={control} render={({ field }) => <Input {...field} />} />
                </FormItem>
                 <FormItem label="Send to Users">
                    <Controller name="users" control={control} render={({ field }) => <Select isMulti placeholder="Select Users" options={dummyUsers} {...field} />} />
                </FormItem>
                <FormItem label="Message">
                    <Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={3}/>} />
                </FormItem>
                <div className="text-right mt-6">
                    <Button className="mr-2" onClick={onClose}>Cancel</Button>
                    <Button variant="solid" type="submit" loading={isLoading}>Send Notification</Button>
                </div>
            </form>
        </Dialog>
    );
};

const ViewAlertDialog: React.FC<{ company: CompanyItem; onClose: () => void }> = ({ company, onClose }) => {
    const alertColors: Record<string, string> = { danger: 'red', warning: 'amber', info: 'blue' };
    return (
        <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={600}>
            <h5 className="mb-4">Alerts for {company.name}</h5>
            <div className="mt-4 flex flex-col gap-3">
                {dummyAlerts.length > 0 ? dummyAlerts.map(alert => (
                    <div key={alert.id} className={`p-3 rounded-lg border-l-4 border-${alertColors[alert.severity]}-500 bg-${alertColors[alert.severity]}-50 dark:bg-${alertColors[alert.severity]}-500/10`}>
                        <div className="flex justify-between items-start">
                           <div className="flex items-start gap-2">
                                <TbAlertTriangle className={`text-${alertColors[alert.severity]}-500 mt-1`} size={20}/>
                                <p className="text-sm">{alert.message}</p>
                           </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap">{alert.time}</span>
                        </div>
                    </div>
                )) : <p>No active alerts.</p>}
            </div>
            <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
        </Dialog>
    );
};

const TrackRecordDialog: React.FC<{ company: CompanyItem; onClose: () => void }> = ({ company, onClose }) => {
    return (
        <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={600}>
            <h5 className="mb-4">Track Record for {company.name}</h5>
            <div className="mt-4 -ml-4">
                {dummyTimeline.map(item => (
                    <div key={item.id} className="flex gap-4 relative">
                        <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-600"></div>
                        <div className="flex-shrink-0 z-10 h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-900 text-gray-500 flex items-center justify-center">
                            {React.cloneElement(item.icon, { size: 24 })}
                        </div>
                        <div className="pb-8">
                            <p className="font-semibold">{item.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{item.desc}</p>
                            <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                        </div>
                    </div>
                ))}
            </div>
             <div className="text-right mt-2"><Button variant="solid" onClick={onClose}>Close</Button></div>
        </Dialog>
    );
};

const ViewEngagementDialog: React.FC<{ company: CompanyItem; onClose: () => void }> = ({ company, onClose }) => {
    return (
        <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
            <h5 className="mb-4">Engagement for {company.name}</h5>
            <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500">Last Contact</p>
                    <p className="font-bold text-lg">5 days ago</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500">Health Score</p>
                    <p className="font-bold text-lg text-green-500">{company.health_score}%</p>
                </div>
                 <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500">Emails Opened</p>
                    <p className="font-bold text-lg">12 / 15</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500">Meetings Attended</p>
                    <p className="font-bold text-lg">3</p>
                </div>
            </div>
            <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
        </Dialog>
    );
};

const ViewTransactionDialog: React.FC<{ company: CompanyItem; onClose: () => void }> = ({ company, onClose }) => {
    const statusColors: Record<string, string> = { Paid: 'bg-emerald-500', Overdue: 'bg-red-500' };
    return (
        <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={700}>
            <h5 className="mb-4">Transactions for {company.name}</h5>
            <Table>
                <Table.THead>
                    <Table.Tr><Table.Th>Date</Table.Th><Table.Th>Description</Table.Th><Table.Th>Amount</Table.Th><Table.Th>Status</Table.Th></Table.Tr>
                </Table.THead>
                <Table.TBody>
                    {dummyTransactions.map(tx => (
                        <Table.Tr key={tx.id}>
                            <Table.Td>{tx.date}</Table.Td><Table.Td>{tx.desc}</Table.Td><Table.Td>{tx.amount}</Table.Td>
                            <Table.Td><Tag className="text-white" prefix prefixClass={statusColors[tx.status]}>{tx.status}</Tag></Table.Td>
                        </Table.Tr>
                    ))}
                </Table.TBody>
            </Table>
            <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
        </Dialog>
    );
};

const DownloadDocumentDialog: React.FC<{ company: CompanyItem; onClose: () => void }> = ({ company, onClose }) => {
    const iconMap: Record<string, React.ReactElement> = { pdf: <TbFileText className="text-red-500" />, zip: <TbFileZip className="text-amber-500" /> };
    return (
        <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
            <h5 className="mb-4">Documents for {company.name}</h5>
            <div className="flex flex-col gap-3 mt-4">
                {dummyDocs.map(doc => (
                    <div key={doc.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center gap-3">
                            {React.cloneElement(iconMap[doc.type] || <TbClipboardText />, { size: 28 })}
                            <div>
                                <p className="font-semibold text-sm">{doc.name}</p>
                                <p className="text-xs text-gray-400">{doc.size}</p>
                            </div>
                        </div>
                        <Tooltip title="Download">
                            <Button shape="circle" size="sm" icon={<TbDownload />} />
                        </Tooltip>
                    </div>
                ))}
            </div>
            <div className="text-right mt-6"><Button onClick={onClose}>Close</Button></div>
        </Dialog>
    );
};

const GenericActionDialog: React.FC<{ type: ModalType | null; company: CompanyItem; onClose: () => void }> = ({ type, company, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const title = type ? `Confirm: ${type.charAt(0).toUpperCase() + type.slice(1)}` : 'Confirm Action';

    const handleConfirm = () => {
        setIsLoading(true);
        console.log(`Performing action '${type}' for company ${company.name}`);
        setTimeout(() => {
            toast.push(<Notification type="success" title="Action Completed" />);
            setIsLoading(false);
            onClose();
        }, 1000);
    }
    return (
        <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
            <h5 className="mb-2">{title}</h5>
            <p>Are you sure you want to perform this action for <span className='font-semibold'>{company.name}</span>?</p>
            <div className="text-right mt-6">
                <Button className="mr-2" onClick={onClose}>Cancel</Button>
                <Button variant="solid" onClick={handleConfirm} loading={isLoading}>Confirm</Button>
            </div>
        </Dialog>
    );
};

export default CompanyModals;