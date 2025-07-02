import React, {
    Fragment,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { create } from "zustand";
import useSWRMutation from "swr/mutation";
import dayjs from "dayjs";
import {
    TbChevronRight,
    TbCloudDownload,
    TbFolderSymlink,
    TbLayoutGrid,
    TbLink,
    TbList,
    TbPencil,
    TbPlus,
    TbTrash,
    TbUserPlus,
} from "react-icons/tb";

// --- UI & SHARED COMPONENT IMPORTS ---
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import CloseButton from "@/components/ui/CloseButton";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DebouceInput from "@/components/shared/DebouceInput";
import Dialog from "@/components/ui/Dialog";
import Drawer from "@/components/ui/Drawer";
import Dropdown from "@/components/ui/Dropdown";
import Input from "@/components/ui/Input";
import Notification from "@/components/ui/Notification";
import Segment from "@/components/ui/Segment";
import Table from "@/components/ui/Table";
import toast from "@/components/ui/toast";
import Upload from "@/components/ui/Upload";
import type { DropdownRef } from "@/components/ui/Dropdown";
import type { MouseEvent, ReactNode, SyntheticEvent } from "react";

// --- REDUX IMPORTS ---
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from "react-redux";
import { getAllDocumentsAction } from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- TYPE DEFINITIONS ---
type File = {
    id: string;
    name: string;
    fileType: string;
    size: number;
    srcUrl: string;
    uploadDate: number;
    activities: { timestamp: number }[];
    permissions: { userName: string; userImg: string; role: string }[];
};
type Files = File[];
type Directory = { id: string; label: string };
type Directories = Directory[];
type Layout = "grid" | "list";
type DialogProps = { id: string; open: boolean };
type GetFileListResponse = { list: Files; directory: Directories };
type DropdownItemCallbackProps = {
    onDelete?: () => void;
    onShare?: () => void;
    onRename?: () => void;
    onDownload?: () => void;
    onOpen?: () => void;
};
type BaseFileItemProps = DropdownItemCallbackProps & {
    fileType?: string;
    size?: number;
    name?: string;
    onClick?: () => void;
    loading?: boolean;
};

// --- ZUSTAND STORE ---
export type FileManagerState = {
    fileList: Files; layout: Layout; selectedFile: string; openedDirectoryId: string; directories: Directories; deleteDialog: DialogProps; inviteDialog: DialogProps; renameDialog: DialogProps;
};
type FileManagerAction = {
    setFileList: (p: Files) => void; setLayout: (p: Layout) => void; setOpenedDirectoryId: (p: string) => void; setDirectories: (p: Directories) => void; setSelectedFile: (p: string) => void; setDeleteDialog: (p: DialogProps) => void; setInviteDialog: (p: DialogProps) => void; setRenameDialog: (p: DialogProps) => void; deleteFile: (p: string) => void; renameFile: (p: { id: string; fileName: string }) => void;
};
const useFileManagerStore = create<FileManagerState & FileManagerAction>(
    (set, get) => ({
        fileList: [], layout: "grid", selectedFile: "", openedDirectoryId: "", directories: [], deleteDialog: { open: false, id: "" }, inviteDialog: { open: false, id: "" }, renameDialog: { open: false, id: "" },
        setFileList: (payload) => set(() => ({ fileList: payload })),
        setLayout: (payload) => set(() => ({ layout: payload })),
        setOpenedDirectoryId: (payload) => set(() => ({ openedDirectoryId: payload })),
        setSelectedFile: (payload) => set(() => ({ selectedFile: payload })),
        setDirectories: (payload) => set(() => ({ directories: payload })),
        setDeleteDialog: (payload) => set(() => ({ deleteDialog: payload })),
        setInviteDialog: (payload) => set(() => ({ inviteDialog: payload })),
        setRenameDialog: (payload) => set(() => ({ renameDialog: payload })),
        deleteFile: (payload) => set(() => ({ fileList: get().fileList.filter((file) => file.id !== payload) })),
        renameFile: (payload) => set(() => ({ fileList: get().fileList.map((file) => { if (file.id === payload.id) { file.name = payload.fileName } return file; }),})),
    })
);

// --- MOCKED UTILITIES & COMPONENTS (for standalone functionality) ---
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const fileSizeUnit = (bytes: number) => { if (bytes === 0) return "0 Bytes"; const k = 1024; const i = Math.floor(Math.log(bytes) / Math.log(k)); return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${["Bytes", "KB", "MB", "GB"][i]}`; };
const EllipsisButton = (props: { onClick: (e: MouseEvent) => void }) => (<Button {...props} shape="circle" variant="plain" size="sm" icon={<span className="text-xl">⋮</span>} />);
const FileIcon = ({ type }: { type: string }) => { const iconMap: Record<string, string> = { pdf: "📄", doc: "📝", directory: "📁", image: "🖼️", png: "🖼️", jpeg: "🖼️", jpg: "🖼️", default: "📎", }; return <span style={{ fontSize: "24px" }}>{iconMap[type] || iconMap.default}</span>; };
const UploadMedia = ({ width, height }: { width: number, height: number }) => (<svg width={width} height={height} viewBox="0 0 100 100"><rect width="100" height="100" fill="#f0f0f0" /><text x="50" y="55" textAnchor="middle" dominantBaseline="middle">Upload</text></svg>);
const MediaSkeleton = ({ avatarProps }: { avatarProps: any }) => (<div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: avatarProps.width, height: avatarProps.height, backgroundColor: "#e0e0e0", borderRadius: "50%" }}></div><div style={{ flex: 1 }}><div style={{ height: "1em", backgroundColor: "#e0e0e0", marginBottom: "4px" }}></div><div style={{ height: "0.8em", width: "60%", backgroundColor: "#e0e0e0" }}></div></div></div>);
const TableRowSkeleton = ({ rows = 5, columns = 4, avatarInColumns = [] as number[] }) => (<tbody>{[...Array(rows)].map((_, i) => (<tr key={i}>{[...Array(columns)].map((_, j) => (<td key={j} style={{ padding: "16px" }}>{avatarInColumns.includes(j) ? <MediaSkeleton avatarProps={{ width: 30, height: 30 }} /> : <div style={{ height: "1em", backgroundColor: "#e0e0e0" }}></div>}</td>))}</tr>))}</tbody>);

// --- DATA TRANSFORMATION LOGIC ---
let fileSystemData: Record<string, GetFileListResponse> = {};

const getFileNameFromUrl = (url: string) => url.substring(url.lastIndexOf("/") + 1);
const getFileExtension = (fileName: string) => fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
const getFileTypeFromExtension = (ext: string) => { if (["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(ext)) return "image"; if (["pdf"].includes(ext)) return "pdf"; if (["doc", "docx"].includes(ext)) return "doc"; return ext;};
const createFolder = (id: string, name: string): File => ({ id, name, fileType: "directory", size: 0, srcUrl: "", uploadDate: Date.now() / 1000, activities: [], permissions: [],});
const createFile = (url: string, idPrefix: string): File | null => { if (!url || typeof url !== "string") return null; const name = getFileNameFromUrl(url); const extension = getFileExtension(name); return { id: `${idPrefix}-${name}`, name, fileType: getFileTypeFromExtension(extension), size: Math.floor(Math.random() * 5000000), srcUrl: url, uploadDate: Date.now() / 1000, activities: [], permissions: [], };};
const addEntry = (parentId: string, entry: File, breadcrumbs: Directory[]) => { if (!fileSystemData[parentId]) fileSystemData[parentId] = { list: [], directory: [] }; fileSystemData[parentId].list.push(entry); if (entry.fileType === "directory") { fileSystemData[entry.id] = { list: [], directory: breadcrumbs }; }};

const transformApiData = (apiData: any) => {
    fileSystemData = { "": { list: [], directory: [] } };
    Object.entries(apiData).forEach(([moduleKey, items]) => {
        if (!Array.isArray(items) || items.length === 0) return;
        const moduleName = moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1).replace(/_/g, " ");
        const moduleFolder = createFolder(`module-${moduleKey}`, moduleName);
        addEntry("", moduleFolder, [{ id: "", label: "File Manager" }]);
        items.forEach((item: any) => {
            const itemName = item.company_name || item.partner_name || item.name || item.inquiry_subject || `Item ${item.id}`;
            const itemFolder = createFolder(`item-${moduleKey}-${item.id}`, itemName);
            addEntry(moduleFolder.id, itemFolder, [...(fileSystemData[moduleFolder.id]?.directory || []), { id: moduleFolder.id, label: moduleFolder.name }]);
            const processDocs = (docObj: any, folderName: string, folderId: string) => {
                const docFiles = Object.values(docObj).flatMap((doc: any) => {
                    if (typeof doc === "string") return createFile(doc, folderId);
                    if (Array.isArray(doc)) return doc.map((subDoc) => createFile(subDoc, folderId));
                    return [];
                }).filter(Boolean) as File[];

                if (docFiles.length > 0) {
                    const docFolder = createFolder(folderId, folderName);
                    addEntry(itemFolder.id, docFolder, [...(fileSystemData[itemFolder.id]?.directory || []), { id: itemFolder.id, label: itemFolder.name }]);
                    docFiles.forEach((file) => addEntry(docFolder.id, file, []));
                }
            };
            if (item.all_documents) processDocs(item.all_documents, "All Documents",`docs-${moduleKey}-${item.id}`);
            if (item.attachments) processDocs({ attachments: item.attachments }, "Attachments", `attach-${moduleKey}-${item.id}`);
            if (item.images) processDocs(item.images, "Images", `images-${moduleKey}-${item.id}`);
            if (item.icons) processDocs(item.icons, "Icons", `icons-${moduleKey}-${item.id}`);

            const nestedArrays = Object.entries(item).filter(([key, value]) => Array.isArray(value) && !["attachments", "images", "icons"].includes(key));
            nestedArrays.forEach(([key, value]) => {
                const arrayFolderName = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
                const arrayFolder = createFolder(`array-${moduleKey}-${item.id}-${key}`, arrayFolderName);
                addEntry(itemFolder.id, arrayFolder, [...(fileSystemData[itemFolder.id]?.directory || []), { id: itemFolder.id, label: itemFolder.name }]);
                (value as any[]).forEach((subItem, index) => {
                    const docPath = subItem.upload_certificate_path || subItem.photo_upload_path || subItem.document || subItem.icon_url || subItem.attachment_url || (subItem.path && subItem.name ? subItem.path : null) || subItem.attachments;
                    const docName = subItem.certificate_name || subItem.document_name || subItem.name || subItem.title || `Sub-item ${subItem.id || index}`;
                    if (docPath) {
                        const file = createFile(docPath, `file-${key}-${subItem.id || index}`);
                        if (file) {
                            addEntry(arrayFolder.id, { ...file, name: `${docName}.${getFileExtension(file.name)}` }, []);
                        }
                    }
                });
            });
        });
    });
};

// --- SUB-COMPONENTS (definitions are inlined for brevity) ---
const FileType = ({ type }: { type: string }) => { const getFileTypeString = (t: string) => { switch (t) { case "pdf": return "PDF"; case "doc": return "DOC"; case "image": return "Image"; case "directory": return "Folder"; default: return t.toUpperCase(); } }; return <>{getFileTypeString(type)}</>; };
const FileItemDropdown = (props: DropdownItemCallbackProps) => { const { onDelete, onShare, onRename, onDownload, onOpen } = props; const dropdownRef = useRef<DropdownRef>(null); const handleDropdownClick = (e: MouseEvent) => { e.stopPropagation(); dropdownRef.current?.handleDropdownOpen(); }; const handleDropdownItemClick = (e: SyntheticEvent, callback?: () => void) => { e.stopPropagation(); callback?.(); }; return <Dropdown ref={dropdownRef} renderTitle={<EllipsisButton onClick={handleDropdownClick} />} placement="bottom-end">{onOpen && <Dropdown.Item eventKey="Open" onClick={(e) => handleDropdownItemClick(e, onOpen)}><TbFolderSymlink className="text-xl" /><span>Open</span></Dropdown.Item>}<Dropdown.Item eventKey="download" onClick={(e) => handleDropdownItemClick(e, onDownload)}><TbCloudDownload className="text-xl" /><span>Download</span></Dropdown.Item><Dropdown.Item eventKey="rename" onClick={(e) => handleDropdownItemClick(e, onRename)}><TbPencil className="text-xl" /><span>Rename</span></Dropdown.Item><Dropdown.Item eventKey="share" onClick={(e) => handleDropdownItemClick(e, onShare)}><TbUserPlus className="text-xl" /><span>Share</span></Dropdown.Item><Dropdown.Item eventKey="delete" onClick={(e) => handleDropdownItemClick(e, onDelete)}><span className="flex items-center gap-2 text-red-500"><TbTrash className="text-xl" /><span>Delete</span></span></Dropdown.Item></Dropdown> };
const FileRow = (props: BaseFileItemProps & { fileType: string, size: number, name: string }) => { const { fileType, size, name, onClick, ...rest } = props; return (<Table.Tr><Table.Td width="70%"><div className="inline-flex items-center gap-2 cursor-pointer group" role="button" onClick={onClick}><div className="text-3xl"><FileIcon type={fileType} /></div><div className="font-bold heading-text group-hover:text-primary-600">{name}</div></div></Table.Td><Table.Td>{fileSizeUnit(size)}</Table.Td><Table.Td><FileType type={fileType} /></Table.Td><Table.Td><div className="flex justify-end"><FileItemDropdown {...rest} /></div></Table.Td></Table.Tr>); };
const FileSegment = (props: BaseFileItemProps) => { const { fileType, size, name, onClick, loading, ...rest } = props; return (<div className="bg-white rounded-2xl dark:bg-gray-800 border border-gray-200 dark:border-transparent py-4 px-3.5 flex items-center justify-between gap-2 transition-all hover:shadow-[0_0_1rem_0.25rem_rgba(0,0,0,0.04),0px_2rem_1.5rem_-1rem_rgba(0,0,0,0.12)] cursor-pointer" role="button" onClick={onClick}>{loading ? (<MediaSkeleton avatarProps={{ width: 33, height: 33 }} />) : (<><div className="flex items-center gap-2"><div className="text-3xl"><FileIcon type={fileType || ""} /></div><div><div className="font-bold heading-text">{name}</div><span className="text-xs">{fileSizeUnit(size || 0)}</span></div></div><FileItemDropdown {...rest} /></>)}</div>); };
const FileList = ({ fileList, layout, ...rest }: any) => { const folders = useMemo(() => fileList.filter((f: File) => f.fileType === "directory"), [fileList]); const files = useMemo(() => fileList.filter((f: File) => f.fileType !== "directory"), [fileList]); const render = (list: Files, isFolder?: boolean) => layout === "grid" ? (<div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mt-4 gap-4 lg:gap-6">{list.map((file) => <FileSegment key={file.id} {...file} onClick={() => rest.onClick(file.id)} onDownload={rest.onDownload} onShare={() => rest.onShare(file.id)} onDelete={() => rest.onDelete(file.id)} onRename={() => rest.onRename(file.id)} {...(isFolder ? { onOpen: () => rest.onOpen(file.id) } : {})} />)}</div>) : (<Table className="mt-4"><Table.THead><Table.Tr><Table.Th>File</Table.Th><Table.Th>Size</Table.Th><Table.Th>Type</Table.Th><Table.Th></Table.Th></Table.Tr></Table.THead><Table.TBody>{list.map((file) => <FileRow key={file.id} {...file} onClick={() => rest.onClick(file.id)} onDownload={rest.onDownload} onShare={() => rest.onShare(file.id)} onDelete={() => rest.onDelete(file.id)} onRename={() => rest.onRename(file.id)} {...(isFolder ? { onOpen: () => rest.onOpen(file.id) } : {})} />)}</Table.TBody></Table>); return <div>{folders.length > 0 && <div><h4>Folders</h4>{render(folders, true)}</div>}{files.length > 0 && <div className="mt-8"><h4>Files</h4>{render(files)}</div>}</div>; };
const FileDetails = ({ onShare }: { onShare: (id: string) => void }) => { const { selectedFile, setSelectedFile, fileList } = useFileManagerStore(); const file = useMemo(() => fileList.find((f) => selectedFile === f.id), [fileList, selectedFile]); const handleDrawerClose = () => setSelectedFile(""); return (<Drawer title={null} closable={false} isOpen={Boolean(selectedFile)} showBackdrop={false} width={350} onClose={handleDrawerClose} onRequestClose={handleDrawerClose}>{file && (<div><div className="flex justify-end"><CloseButton onClick={handleDrawerClose} /></div><div className="mt-10 flex justify-center">{file.fileType.startsWith("image") ? <img src={file.srcUrl} className="max-h-[170px] rounded-xl" alt={file.name} /> : <FileIcon type={file.fileType} />}</div><div className="mt-10 text-center"><h4>{file.name}</h4></div><div className="mt-8"><h6>Info</h6><div className="mt-4 flex flex-col gap-4"><span>Size: {fileSizeUnit(file.size)}</span><span>Type: <FileType type={file.fileType} /></span><span>Created: {dayjs.unix(file.uploadDate).format("MMM DD, YYYY")}</span></div></div><div className="mt-10"><div className="flex justify-between items-center"><h6>Shared with</h6><Button type="button" shape="circle" icon={<TbPlus />} size="xs" onClick={() => onShare(file.id)} /></div></div></div>)}</Drawer>); };
const FileManagerDeleteDialog = () => { const { deleteDialog, setDeleteDialog, deleteFile } = useFileManagerStore(); const handleClose = () => setDeleteDialog({ id: "", open: false }); const handleConfirm = () => { deleteFile(deleteDialog.id); handleClose(); }; return <ConfirmDialog isOpen={deleteDialog.open} type="danger" title="Delete file" onClose={handleClose} onCancel={handleClose} onConfirm={handleConfirm}><p>Are you sure you want to delete this file? This action cannot be undone.</p></ConfirmDialog> };
const FileManagerInviteDialog = () => { const { inviteDialog, setInviteDialog } = useFileManagerStore(); const [inviting, setInviting] = useState(false); const handleClose = () => setInviteDialog({ id: "", open: false }); const handleInvite = async () => { setInviting(true); await sleep(500); toast.push(<Notification type="success" title="Invitation sent!"></Notification>, { placement: "top-end" }); setInviting(false); }; return <Dialog isOpen={inviteDialog.open} onClose={handleClose}><h4 className="mb-4">Share this file</h4><Input placeholder="Email" suffix={<Button size="sm" loading={inviting} onClick={handleInvite}>Invite</Button>} /><div className="mt-4 flex justify-between"><Button variant="plain" icon={<TbLink />} onClick={() => toast.push(<Notification type="success" title="Link Copied!" />)}>Copy link</Button><Button variant="solid" onClick={handleClose}>Done</Button></div></Dialog> };
const FileManagerRenameDialog = () => { const { renameDialog, setRenameDialog, renameFile } = useFileManagerStore(); const [newName, setNewName] = useState(""); const handleClose = () => setRenameDialog({ id: "", open: false }); const handleSubmit = () => { renameFile({ id: renameDialog.id, fileName: newName }); handleClose(); }; return <Dialog isOpen={renameDialog.open} onClose={handleClose}><h4 className="mb-4">Rename</h4><DebouceInput placeholder="New name" onChange={(e) => setNewName(e.target.value)} /><div className="mt-4 text-right"><Button size="sm" className="mr-2" onClick={handleClose}>Cancel</Button><Button variant="solid" size="sm" disabled={!newName} onClick={handleSubmit}>OK</Button></div></Dialog> };
const UploadFile = () => { const [isOpen, setIsOpen] = useState(false); const [isUploading, setUploading] = useState(false); const [files, setFiles] = useState<File[]>([]); const handleUpload = async () => { setUploading(true); await sleep(500); setUploading(false); setIsOpen(false); toast.push(<Notification title="Successfully uploaded" type="success" />, { placement: "top-center", }); }; return <><Button variant="solid" onClick={() => setIsOpen(true)}>Upload</Button><Dialog isOpen={isOpen} onClose={() => setIsOpen(false)}><h4>Upload Files</h4><Upload draggable className="mt-6" onChange={setFiles} onFileRemove={setFiles}><div className="my-4 text-center"><UploadMedia height={150} width={200} /><p className="font-semibold">Drop files here, or <span className="text-blue-500">browse</span></p></div></Upload><div className="mt-4"><Button block loading={isUploading} variant="solid" disabled={files.length === 0} onClick={handleUpload}>Upload</Button></div></Dialog></>; };
const FileManagerHeader = ({ onEntryClick, onDirectoryClick }: { onEntryClick: () => void; onDirectoryClick: (id: string) => void; }) => { const { directories, layout, setLayout } = useFileManagerStore(); return (<div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div>{directories.length > 0 ? (<div className="flex items-center gap-2"><h3 className="flex items-center gap-2 text-base sm:text-2xl"><span className="hover:text-primary-600 cursor-pointer" role="button" onClick={onEntryClick}>File Manager</span>{directories.map((dir, index) => (<Fragment key={dir.id}><TbChevronRight className="text-lg" />{directories.length - 1 === index ? (<span>{dir.label}</span>) : (<span className="hover:text-primary-600 cursor-pointer" role="button" onClick={() => onDirectoryClick(dir.id)}>{dir.label}</span>)}</Fragment>))}</h3></div>) : (<h3>File Manager</h3>)}</div><div className="flex items-center gap-2"><Segment value={layout} onChange={(val) => setLayout(val as Layout)}><Segment.Item value="grid" className="text-xl px-3"><TbLayoutGrid /></Segment.Item><Segment.Item value="list" className="text-xl px-3"><TbList /></Segment.Item></Segment><UploadFile /></div></div>); };

// --- MAIN COMPONENT ---
async function getFilesFromFS(_: string, { arg }: { arg: string }) {
    await sleep(200); // Simulate FS read delay
    return fileSystemData[arg] || { list: [], directory: [] };
}

const FileManager = () => {
    const dispatch = useAppDispatch();
    const { allDocuments, status: masterLoadingStatus } = useSelector(masterSelector);
    // console.log("allDocuments", allDocuments)

    const { layout, fileList, setFileList, setDeleteDialog, setInviteDialog, setRenameDialog, openedDirectoryId, setOpenedDirectoryId, setDirectories, setSelectedFile, } = useFileManagerStore();
    const { trigger, isMutating } = useSWRMutation(
        `/api/files/${openedDirectoryId}`,
        getFilesFromFS,
        {
            onSuccess: (resp) => {
                setDirectories(resp.directory);
                setFileList(resp.list);
            },
        }
    );

    useEffect(() => {
        dispatch(getAllDocumentsAction());
    }, [dispatch]);

    useEffect(() => {
        if (allDocuments && Object.keys(allDocuments).length > 0) {
            transformApiData(allDocuments);
            trigger(""); // Trigger render for the root directory
        }
    }, [allDocuments, trigger]);

    const handleShare = (id: string) => setInviteDialog({ id, open: true });
    const handleDelete = (id: string) => setDeleteDialog({ id, open: true });
    const handleDownload = () => { toast.push(<Notification type="success" title="Download started!" />);};
    const handleRename = (id: string) => setRenameDialog({ id, open: true });
    const handleNavigate = (id: string) => { setOpenedDirectoryId(id); trigger(id); };
    const handleClick = (fileId: string) => setSelectedFile(fileId);

    const isLoading = masterLoadingStatus === 'loading' || isMutating;

    return (
        <div className="p-4">
            <FileManagerHeader onEntryClick={() => handleNavigate("")} onDirectoryClick={handleNavigate}/>
            <div className="mt-6">
                {isLoading ? (
                    layout === "grid" ? (
                        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mt-4 gap-4 lg:gap-6">
                            {[...Array(8)].map((_, i) => <FileSegment key={i} loading={isLoading} />)}
                        </div>
                    ) : (
                        <Table>
                            <Table.THead><Table.Tr><Table.Th>File</Table.Th><Table.Th>Size</Table.Th><Table.Th>Type</Table.Th><Table.Th></Table.Th></Table.Tr></Table.THead>
                            <TableRowSkeleton avatarInColumns={[0]} columns={4} rows={8} />
                        </Table>
                    )
                ) : (
                    <FileList fileList={fileList} layout={layout} onDownload={handleDownload} onShare={handleShare} onDelete={handleDelete} onRename={handleRename} onOpen={handleNavigate} onClick={handleClick}/>
                )}
            </div>
            <FileDetails onShare={handleShare} />
            <FileManagerDeleteDialog />
            <FileManagerInviteDialog />
            <FileManagerRenameDialog />
        </div>
    );
};

export default FileManager;