// src/views/documents/AllDocuments.tsx (or your preferred path)
import React, { useEffect, useState, useRef, useMemo, Fragment, ReactNode } from 'react';
import { useFileManagerStore } // Assuming types are co-located or imported
    from './store/useFileManagerStore'; // Adjust path as needed

// UI Components
import Table from '@/components/ui/Table';
import Drawer from '@/components/ui/Drawer';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import CloseButton from '@/components/ui/CloseButton';
import Dialog from '@/components/ui/Dialog';
import Dropdown, { DropdownRef } from '@/components/ui/Dropdown'; // Import DropdownRef
import Input from '@/components/ui/Input';
import Notification from '@/components/ui/Notification';
import Segment from '@/components/ui/Segment';
import Upload from '@/components/ui/Upload';
import toast from '@/components/ui/toast';
import Card from '@/components/ui/Card'; // Added for main layout
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import DebouceInput from '@/components/shared/DebouceInput';
import EllipsisButton from '@/components/shared/EllipsisButton';
import FileIcon from '@/components/view/FileIcon'; // Assuming this is a custom component
import MediaSkeleton from '@/components/shared/loaders/MediaSkeleton';
import TableRowSkeleton from '@/components/shared/loaders/TableRowSkeleton';

// Icons
import {
    TbChevronRight,
    TbLayoutGrid,
    TbList,
    TbCloudDownload,
    TbPencil,
    TbUserPlus,
    TbTrash,
    TbFolderSymlink,
    TbLink,
    TbPlus, // For UploadFile and Share dialog
} from 'react-icons/tb';
import UploadMedia from '@/assets/svg/UploadMedia'; // Ensure this path is correct

// Utils & Services
import fileSizeUnit from '@/utils/fileSizeUnit';
import dayjs from 'dayjs';
import classNames from '@/utils/classNames'; // Assuming this is from your utils
import sleep from '@/utils/sleep'; // For simulating API calls
import { apiGetFiles } from '@/services/FileService'; // Ensure this path is correct
import useSWRMutation from 'swr/mutation'; // For data fetching

// Types from your provided code
export type FileItem = { // Renamed from 'File' to avoid conflict with global File type
    id: string;
    name: string;
    fileType: string;
    srcUrl: string;
    size: number;
    author: {
        name: string;
        email: string;
        img: string;
    };
    activities: {
        userName: string;
        userImg: string;
        actionType: string;
        timestamp: number;
    }[];
    permissions: {
        userName: string;
        userImg: string;
        role: string;
    }[];
    uploadDate: number;
    recent: boolean;
};

export type DropdownItemCallbackProps = {
    onOpen?: () => void;
    onDownload?: () => void;
    onShare?: () => void;
    onRename?: () => void;
    onDelete?: () => void;
};

export type Layout = 'grid' | 'list';
export type Files = FileItem[];
export type Directories = { id: string; label: string }[];
export type GetFileListResponse = { list: Files; directory: Directories };
export type BaseFileItemProps = {
    name?: string;
    fileType?: string;
    size?: number;
    loading?: boolean;
    onClick?: () => void;
} & DropdownItemCallbackProps;


// --- FileType Component ---
const getFileTypeLabel = (type: string) => {
    switch (type) {
        case 'pdf': return 'PDF';
        case 'xls': case 'xlsx': return 'Excel';
        case 'doc': case 'docx': return 'Word';
        case 'ppt': case 'pptx': return 'PowerPoint';
        case 'figma': return 'Figma';
        case 'image/jpeg': case 'jpeg': return 'JPEG';
        case 'image/png': case 'png': return 'PNG';
        case 'directory': return 'Folder';
        default: return type.toUpperCase(); // Fallback to uppercase type
    }
};

const FileTypeDisplay = ({ type }: { type: string }) => {
    return <>{getFileTypeLabel(type)}</>;
};

// --- FileItemDropdown Component ---
const FileItemDropdown = (props: DropdownItemCallbackProps) => {
    const { onDelete, onShare, onRename, onDownload, onOpen } = props;
    const dropdownRef = useRef<DropdownRef>(null);

    const handleDropdownClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        dropdownRef.current?.handleDropdownOpen();
    };

    const handleDropdownItemClick = (e: React.SyntheticEvent, callback?: () => void) => {
        e.stopPropagation();
        callback?.();
    };

    return (
        <Dropdown ref={dropdownRef} renderTitle={<EllipsisButton onClick={handleDropdownClick} />} placement="bottom-end">
            {onOpen && <Dropdown.Item eventKey="Open" onClick={(e) => handleDropdownItemClick(e, onOpen)}><TbFolderSymlink className="text-xl mr-2" />Open</Dropdown.Item>}
            <Dropdown.Item eventKey="download" onClick={(e) => handleDropdownItemClick(e, onDownload)}><TbCloudDownload className="text-xl mr-2" />Download</Dropdown.Item>
            <Dropdown.Item eventKey="rename" onClick={(e) => handleDropdownItemClick(e, onRename)}><TbPencil className="text-xl mr-2" />Rename</Dropdown.Item>
            <Dropdown.Item eventKey="share" onClick={(e) => handleDropdownItemClick(e, onShare)}><TbUserPlus className="text-xl mr-2" />Share</Dropdown.Item>
            <Dropdown.Item eventKey="delete" onClick={(e) => handleDropdownItemClick(e, onDelete)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><TbTrash className="text-xl mr-2" />Delete</Dropdown.Item>
        </Dropdown>
    );
};

// --- FileRow Component (for List View) ---
const { Tr, Td, TBody, THead, Th } = Table; // Destructure Table components
const FileRow = (props: BaseFileItemProps) => {
    const { fileType = '', size = 0, name = 'Unnamed File', onClick, ...rest } = props;
    return (
        <Tr onClick={onClick} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <Td width="70%">
                <div className="inline-flex items-center gap-2 group">
                    <div className="text-3xl"><FileIcon type={fileType} /></div>
                    <div className="font-bold heading-text group-hover:text-primary-600 dark:group-hover:text-primary-400">{name}</div>
                </div>
            </Td>
            <Td>{fileSizeUnit(size)}</Td>
            <Td><FileTypeDisplay type={fileType} /></Td>
            <Td><div className="flex justify-end"><FileItemDropdown {...rest} /></div></Td>
        </Tr>
    );
};

// --- FileSegment Component (for Grid View) ---
const FileSegment = (props: BaseFileItemProps) => {
    const { fileType = '', size = 0, name = 'Unnamed File', onClick, loading, ...rest } = props;
    return (
        <div
            className="bg-white rounded-2xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-4 px-3.5 flex items-center justify-between gap-2 transition-all hover:shadow-lg dark:hover:border-gray-600 cursor-pointer"
            role="button"
            onClick={onClick}
        >
            {loading ? (
                <MediaSkeleton avatarProps={{ width: 33, height: 33 }} />
            ) : (
                <>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="text-3xl flex-shrink-0"><FileIcon type={fileType} /></div>
                        <div className="overflow-hidden">
                            <div className="font-bold heading-text truncate" title={name}>{name}</div>
                            <span className="text-xs">{fileSizeUnit(size)}</span>
                        </div>
                    </div>
                    <div className="flex-shrink-0"><FileItemDropdown {...rest} /></div>
                </>
            )}
        </div>
    );
};

// --- UploadFile Component ---
const UploadFile = () => {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    // const { addFilesToStore } = useFileManagerStore(); // Assuming you'd add this to your store

    const handleUploadDialogClose = () => {
        setUploadDialogOpen(false);
        setUploadedFiles([]); // Clear files on close
    };

    const handleUpload = async () => {
        setIsUploading(true);
        await sleep(1000); // Simulate upload
        // In a real app, you would dispatch an action or call an API here
        // For example: addFilesToStore(uploadedFiles.map(file => ({...create FileItem structure...})));
        console.log("Uploaded files:", uploadedFiles.map(f => f.name));
        handleUploadDialogClose();
        setIsUploading(false);
        toast.push(<Notification title="Successfully uploaded" type="success" />, { placement: 'top-center' });
    };

    return (
        <>
            <Button variant="solid" onClick={() => setUploadDialogOpen(true)} icon={<TbPlus />}>Upload</Button>
            <Dialog isOpen={uploadDialogOpen} onClose={handleUploadDialogClose} onRequestClose={handleUploadDialogClose}>
                <h4 className="mb-2">Upload Files</h4>
                <p className="mb-4 text-sm">Select files to upload to the current directory.</p>
                <Upload
                    draggable
                    className="mt-6 bg-gray-100 dark:bg-gray-700/60 p-4 rounded-md"
                    onChange={setUploadedFiles}
                    onFileRemove={setUploadedFiles} // This might need adjustment based on Upload component's API
                >
                    <div className="my-4 text-center">
                        <div className="text-6xl mb-4 flex justify-center">
                            <UploadMedia height={120} width={150} />
                        </div>
                        <p className="font-semibold">
                            <span className="text-gray-800 dark:text-white">Drop your files here, or{' '}</span>
                            <span className="text-primary-600 dark:text-primary-400 cursor-pointer">browse</span>
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Supports all common file types.</p>
                    </div>
                </Upload>
                <div className="mt-6 text-right">
                    <Button className="mr-2" onClick={handleUploadDialogClose}>Cancel</Button>
                    <Button block={uploadedFiles.length === 0} loading={isUploading} variant="solid" disabled={uploadedFiles.length === 0} onClick={handleUpload}>
                        Upload {uploadedFiles.length > 0 ? `(${uploadedFiles.length})` : ''}
                    </Button>
                </div>
            </Dialog>
        </>
    );
};


// --- FileManagerHeader Component ---
type FileManagerHeaderProps = {
    onEntryClick: () => void;
    onDirectoryClick: (id: string) => void;
};
const FileManagerHeader = ({ onEntryClick, onDirectoryClick }: FileManagerHeaderProps) => {
    const { directories, layout, setLayout } = useFileManagerStore();
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                {directories.length > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap"> {/* Added flex-wrap */}
                        <h5 className="flex items-center gap-2">
                            <span className="hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer" role="button" onClick={onEntryClick}>
                                All Documents
                            </span>
                            {directories.map((dir, index) => (
                                <Fragment key={dir.id}>
                                    <TbChevronRight className="text-lg text-gray-400" />
                                    {directories.length - 1 === index ? (
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{dir.label}</span>
                                    ) : (
                                        <span className="hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer" role="button" onClick={() => onDirectoryClick(dir.id)}>
                                            {dir.label}
                                        </span>
                                    )}
                                </Fragment>
                            ))}
                        </h5>
                    </div>
                ) : (
                    <h5>All Documents</h5>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Segment value={layout} onChange={(val) => setLayout(val as Layout)} size="sm">
                    <Segment.Item value="grid" className="text-xl py-1.5 px-2.5"><TbLayoutGrid /></Segment.Item>
                    <Segment.Item value="list" className="text-xl py-1.5 px-2.5"><TbList /></Segment.Item>
                </Segment>
                <UploadFile />
            </div>
        </div>
    );
};

// --- FileList Component ---
type FileListProps = {
    fileList: Files;
    layout: Layout;
    onRename: (id: string) => void;
    onDownload: (file: FileItem) => void; // Pass the file item for potential name/type info
    onShare: (id: string) => void;
    onDelete: (id: string) => void;
    onOpen: (id: string) => void;
    onClick: (id: string) => void;
};
const FileListComponent = (props: FileListProps) => {
    const { layout, fileList, onDelete, onDownload, onShare, onRename, onOpen, onClick } = props;
    const folders = useMemo(() => fileList.filter((file) => file.fileType === 'directory'), [fileList]);
    const files = useMemo(() => fileList.filter((file) => file.fileType !== 'directory'), [fileList]);

    const renderFileSegment = (list: Files, isFolder?: boolean) => (
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mt-4 gap-4 lg:gap-6">
            {list.map((file) => (
                <FileSegment key={file.id} {...file} onClick={() => onClick(file.id)} onDownload={() => onDownload(file)} onShare={() => onShare(file.id)} onDelete={() => onDelete(file.id)} onRename={() => onRename(file.id)} {...(isFolder ? { onOpen: () => onOpen(file.id) } : {})} />
            ))}
        </div>
    );

    const renderFileRow = (list: Files, isFolder?: boolean) => (
        <Table className="mt-4">
            <THead>
                <Tr><Th>File</Th><Th>Size</Th><Th>Type</Th><Th></Th></Tr>
            </THead>
            <TBody>
                {list.map((file) => (
                    <FileRow key={file.id} {...file} onClick={() => onClick(file.id)} onDownload={() => onDownload(file)} onShare={() => onShare(file.id)} onDelete={() => onDelete(file.id)} onRename={() => onRename(file.id)} {...(isFolder ? { onOpen: () => onOpen(file.id) } : {})} />
                ))}
            </TBody>
        </Table>
    );
    // Grouping by entity type (Company, Member, Partner)
    // This assumes your API or store provides files already categorized or you have a way to determine this.
    // For this example, I'll keep the simple folder/file distinction.
    // To implement entity grouping, you'd need an additional property on `FileItem` like `entityType: 'Company' | 'Member' | 'Partner'`
    // Then filter based on that. For simplicity, the original structure is maintained.

    return (
        <div>
            {folders.length > 0 && (
                <div>
                    <h6 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-2">Companies</h6>
                    {layout === 'grid' ? renderFileSegment(folders, true) : renderFileRow(folders, true)}
                </div>
            )}
            {folders.length > 0 && (
                <div>
                    <h6 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-2">Members</h6>
                    {layout === 'grid' ? renderFileSegment(folders, true) : renderFileRow(folders, true)}
                </div>
            )}
            {folders.length > 0 && (
                <div>
                    <h6 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-2">Partners</h6>
                    {layout === 'grid' ? renderFileSegment(folders, true) : renderFileRow(folders, true)}
                </div>
            )}
            {folders.length === 0 && files.length === 0 && (
                 <div className="text-center py-10">
                    <p className="text-gray-500">No files or folders in this directory.</p>
                </div>
            )}
        </div>
    );
};

// --- FileDetails Drawer Component ---
const FileDetailsDrawer = ({ onShare }: { onShare: (id: string) => void }) => {
    const { selectedFile, setSelectedFile, fileList } = useFileManagerStore();
    const file = useMemo(() => fileList.find((f) => selectedFile === f.id), [fileList, selectedFile]);
    const handleDrawerClose = () => setSelectedFile('');

    const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
        <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
            <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
            <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{value}</span>
        </div>
    );

    return (
        <Drawer title={null} closable={false} isOpen={Boolean(selectedFile)} showBackdrop={false} width={350} onClose={handleDrawerClose} onRequestClose={handleDrawerClose} bodyClass="p-5">
            {file && (
                <div>
                    <div className="flex justify-end"><CloseButton onClick={handleDrawerClose} /></div>
                    <div className="mt-6 flex justify-center">
                        {file.fileType.startsWith('image/') ? (
                            <img src={file.srcUrl} className="max-h-[170px] rounded-xl object-contain" alt={file.name} />
                        ) : (
                            <FileIcon type={file.fileType} size={100} />
                        )}
                    </div>
                    <div className="mt-6 text-center"><h5 className="truncate" title={file.name}>{file.name}</h5></div>
                    <div className="mt-8">
                        <h6 className="text-sm font-semibold mb-2">Info</h6>
                        <div className="flex flex-col gap-1">
                            <InfoRow label="Size" value={fileSizeUnit(file.size)} />
                            <InfoRow label="Type" value={<FileTypeDisplay type={file.fileType} />} />
                            <InfoRow label="Created" value={dayjs.unix(file.uploadDate).format('MMM DD, YYYY')} />
                            {file.activities?.[0]?.timestamp && <InfoRow label="Last modified" value={dayjs.unix(file.activities[0].timestamp).format('MMM DD, YYYY')} />}
                        </div>
                    </div>
                    {file.permissions && file.permissions.length > 0 && (
                        <div className="mt-8">
                            <div className="flex justify-between items-center mb-2">
                                <h6 className="text-sm font-semibold">Shared with</h6>
                                <Button type="button" shape="circle" icon={<TbPlus />} size="xs" onClick={() => onShare(file.id)} />
                            </div>
                            <div className="flex flex-col gap-3 max-h-40 overflow-y-auto">
                                {file.permissions.map((user) => (
                                    <div key={user.userName} className="flex items-center gap-2">
                                        <Avatar src={user.userImg} size="sm" />
                                        <div>
                                            <div className="font-semibold text-sm">{user.userName}</div>
                                            <div className="text-xs text-gray-500">{user.role}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Drawer>
    );
};

// --- Dialog Components ---
const FileManagerDeleteDialog = () => {
    const { deleteDialog, setDeleteDialog, deleteFile } = useFileManagerStore();
    const handleDeleteDialogClose = () => setDeleteDialog({ id: '', open: false });
    const handleDeleteConfirm = () => { deleteFile(deleteDialog.id); handleDeleteDialogClose(); };
    return (
        <ConfirmDialog isOpen={deleteDialog.open} type="danger" title="Delete file" onClose={handleDeleteDialogClose} onRequestClose={handleDeleteDialogClose} onCancel={handleDeleteDialogClose} onConfirm={handleDeleteConfirm}>
            <p>Are you sure you want to delete this file/folder? This action can't be undone.</p>
        </ConfirmDialog>
    );
};

const FileManagerInviteDialog = () => {
    const { inviteDialog, setInviteDialog } = useFileManagerStore();
    const [inviting, setInviting] = useState(false);
    const handleDialogClose = () => setInviteDialog({ id: '', open: false });
    const handleInvite = async () => {
        setInviting(true); await sleep(500);
        toast.push(<Notification type="success" title="Invitation sent!" />, { placement: 'top-end' });
        setInviting(false);
    };
    const handleCopy = async () => {
        navigator.clipboard.writeText(window.location.href + `?file=${inviteDialog.id}`); // Example link
        toast.push(<Notification type="success" title="Link Copied!" />, { placement: 'top-end' });
    };
    return (
        <Dialog isOpen={inviteDialog.open} contentClassName="pb-0" onClose={handleDialogClose} onRequestClose={handleDialogClose}>
            <h5 className="mb-4">Share this file</h5>
            <div className="mt-6">
                <Input placeholder="Email address" type="email"
                    suffix={ <Button type="button" variant="solid" size="sm" loading={inviting} onClick={handleInvite}>Invite</Button> }
                />
            </div>
            <div className="mt-4 flex justify-between items-center">
                <Button variant="plain" size="sm" icon={<TbLink />} onClick={handleCopy}>Copy link</Button>
                <Button variant="solid" size="sm" onClick={handleDialogClose}>Done</Button>
            </div>
        </Dialog>
    );
};

const FileManagerRenameDialog = () => {
    const { renameDialog, setRenameDialog, renameFile } = useFileManagerStore();
    const [newName, setNewName] = useState('');
    const handleDialogClose = () => { setNewName(''); setRenameDialog({ id: '', open: false }); };
    const handleSubmit = () => { if (newName.trim()) renameFile({ id: renameDialog.id, fileName: newName.trim() }); handleDialogClose(); };
    return (
        <Dialog isOpen={renameDialog.open} onClose={handleDialogClose} onRequestClose={handleDialogClose}>
            <h5 className="mb-4">Rename</h5>
            <div className="mt-6">
                <DebouceInput placeholder="New name" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="mt-6 text-right">
                <Button size="sm" className="mr-2" onClick={handleDialogClose}>Cancel</Button>
                <Button variant="solid" size="sm" disabled={!newName.trim()} onClick={handleSubmit}>Rename</Button>
            </div>
        </Dialog>
    );
};


// --- Main AllDocuments Page Component ---
// API fetch function (can be outside the component or in a service file)
async function fetchFilesApi(_: string, { arg }: { arg: string }) {
    const data = await apiGetFiles<GetFileListResponse, { id?: string }>({ id: arg || undefined }); // Pass undefined if arg is empty
    return data;
}

const AllDocuments = () => {
    const {
        layout, fileList, setFileList, setDeleteDialog, setInviteDialog,
        setRenameDialog, openedDirectoryId, setOpenedDirectoryId,
        setDirectories, setSelectedFile,
    } = useFileManagerStore();

    const { trigger, isMutating } = useSWRMutation(
        `/api/files?id=${openedDirectoryId}`, // Key includes ID for SWR caching
        fetchFilesApi,
        {
            onSuccess: (resp) => {
                if (resp) { // Check if resp is not undefined
                    setDirectories(resp.directory || []);
                    setFileList(resp.list || []);
                } else {
                     // Handle cases where API might return undefined or an error structure
                    setDirectories([]);
                    setFileList([]);
                    console.error("API response was undefined or invalid.");
                }
            },
            onError: (err) => {
                console.error("Error fetching files:", err);
                toast.push(<Notification title="Error" type="danger">Failed to load documents.</Notification>, { placement: 'top-center' });
                setDirectories([]);
                setFileList([]);
            }
        }
    );

    useEffect(() => {
        trigger(openedDirectoryId); // Fetch files for the current directory on mount and when ID changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openedDirectoryId]); // Removed trigger from deps as per SWRMutation best practice

    const handleShare = (id: string) => setInviteDialog({ id, open: true });
    const handleDelete = (id: string) => setDeleteDialog({ id, open: true });
    const handleDownload = (file: FileItem) => {
        // In a real app, you'd fetch the actual file blob
        console.log("Downloading:", file.name);
        const blob = new Blob([`Mock content for ${file.name}`], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = file.name; // Use actual file name
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
    };
    const handleRename = (id: string) => setRenameDialog({ id, open: true });
    const handleOpenFolder = (id: string) => setOpenedDirectoryId(id); // This will trigger useEffect to fetch new files
    const handleEntryClick = () => setOpenedDirectoryId(''); // Go to root
    const handleClickFile = (fileId: string) => setSelectedFile(fileId);

    return (
        <>
            <Card>
                <FileManagerHeader onEntryClick={handleEntryClick} onDirectoryClick={handleOpenFolder} />
                <div className="mt-6">
                    {isMutating && fileList.length === 0 ? ( // Show skeleton only on initial load or full refresh
                        layout === 'grid' ? (
                            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mt-4 gap-4 lg:gap-6">
                                {[...Array(4)].map((_, i) => <FileSegment key={i} loading />)}
                            </div>
                        ) : (
                            <Table><THead><Tr><Th>File</Th><Th>Size</Th><Th>Type</Th><Th></Th></Tr></THead>
                                <TableRowSkeleton avatarInColumns={[0]} columns={4} rows={5} avatarProps={{ width: 30, height: 30 }} />
                            </Table>
                        )
                    ) : (
                        <FileListComponent
                            fileList={fileList}
                            layout={layout}
                            onDownload={handleDownload}
                            onShare={handleShare}
                            onDelete={handleDelete}
                            onRename={handleRename}
                            onOpen={handleOpenFolder}
                            onClick={handleClickFile}
                        />
                    )}
                </div>
            </Card>
            <FileDetailsDrawer onShare={handleShare} />
            <FileManagerDeleteDialog />
            <FileManagerInviteDialog />
            <FileManagerRenameDialog />
        </>
    );
};

export default AllDocuments;