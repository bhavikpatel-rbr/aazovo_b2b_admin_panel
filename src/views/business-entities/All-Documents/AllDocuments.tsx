import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
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
  TbX,
  TbChevronLeft,
  TbFile,
  TbFileSpreadsheet,
  TbFileTypePdf,
} from "react-icons/tb";
import classNames from "classnames";

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
import Spinner from "@/components/ui/Spinner";
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

// --- CUSTOM SVG ICONS ---
import Folder from "@/assets/svg/files/Folder";
import FileDoc from "@/assets/svg/files/FileDoc";
import FilePdf from "@/assets/svg/files/FilePdf";
import FileImage from "@/assets/svg/files/FileImage";
import FileNotFound from "@/assets/svg/FileNotFound";

// --- TYPE DEFINITIONS ---
type File = {
  id: string;
  name: string;
  fileType: string;
  size: number;
  srcUrl: string;
  uploadDate: number;
};
type Directory = { id: string; label: string };
type DialogProps = { open: boolean; id: string };
type Layout = "grid" | "list";

// --- HELPER FUNCTIONS & NEW UNIFIED VIEWER ---

const isImageUrl = (url: string | undefined | null): url is string =>
  typeof url === "string" && /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(url);

const UnifiedFileViewer: React.FC<{
  files: File[];
  startIndex: number;
  onClose: () => void;
}> = ({ files, startIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const [isContentLoaded, setIsContentLoaded] = useState(false);
    const currentFile = files[currentIndex];

    useEffect(() => {
        setIsContentLoaded(false); // Reset loading state on file change
    }, [currentIndex]);

    const handleNext = (e?: MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => Math.min(prev + 1, files.length - 1));
    };

    const handlePrev = (e?: MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!currentFile) return null;

    const renderContent = () => {
        if (isImageUrl(currentFile.srcUrl)) {
            return <img src={currentFile.srcUrl} alt={currentFile.name} className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${isContentLoaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setIsContentLoaded(true)} />;
        }
        if (currentFile.fileType === 'pdf') {
            return <iframe src={currentFile.srcUrl} title={currentFile.name} className={`w-full h-full border-0 bg-white transition-opacity duration-300 ${isContentLoaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setIsContentLoaded(true)}></iframe>;
        }
        
        // Fallback for other file types
        if (!isContentLoaded) setTimeout(() => setIsContentLoaded(true), 10); // Ensure fade-in happens
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-10 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <TbFile className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h5 className="mb-2">{currentFile.name}</h5>
                <p className="mb-4 text-gray-600 dark:text-gray-300">Preview is not available for this file type.</p>
                <a href={currentFile.srcUrl} download target="_blank" rel="noopener noreferrer">
                    <Button variant="solid" icon={<TbCloudDownload />}>Download File</Button>
                </a>
            </div>
        );
    };

    return (
         <Dialog isOpen={true} onClose={onClose} width="auto" height="10vh"  contentClassName=" p-0 bg-transparent">
            <div className="w-screen h-screen bg-black/80 backdrop-blur-sm flex flex-col" onClick={onClose}>
                <header className="flex-shrink-0 h-16 text-white flex items-center justify-between px-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-4">
                        <h6 className="font-semibold truncate" title={currentFile.name}>{currentFile.name}</h6>
                        <span className="text-sm text-gray-400">{currentIndex + 1} / {files.length}</span>
                    </div>
                </header>
                <main className="relative flex-grow flex items-center justify-center " onClick={e => e.stopPropagation()}>
                    {!isContentLoaded && <Spinner size={40} className="absolute" />}
                    {renderContent()}
                </main>
                {files.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                        <Button shape="circle" size="lg" icon={<TbChevronLeft />} className="pointer-events-auto" onClick={handlePrev} disabled={currentIndex === 0} />
                        <Button shape="circle" size="lg" icon={<TbChevronRight />} className="pointer-events-auto" onClick={handleNext} disabled={currentIndex === files.length - 1} />
                    </div>
                )}
            </div>
        </Dialog>
    );
};


const DocumentPlaceholder = ({ file }: { file: File }) => {
  const getFileIcon = () => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf": return <TbFileTypePdf className="text-red-500" size={48} />;
      case "doc": case "docx": return <FileDoc height={48} width={48} />;
      case "xls": case "xlsx": return <TbFileSpreadsheet className="text-green-500" size={48} />;
      default: return <TbFile className="text-gray-500" size={48} />;
    }
  };
  return (
    <div className="w-full h-full p-2 flex flex-col items-center justify-center text-center">
      {getFileIcon()}
      <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 break-all line-clamp-2">
        {file.name}
      </p>
    </div>
  );
};


// --- ZUSTAND STORE ---
export type FileManagerState = {
  fileList: File[];
  layout: Layout;
  selectedFileId: string;
  openedDirectoryId: string;
  directories: Directory[];
  deleteDialog: DialogProps;
  renameDialog: DialogProps;
};
type FileManagerAction = {
  setFileList: (p: File[]) => void;
  setLayout: (p: Layout) => void;
  setOpenedDirectoryId: (p: string) => void;
  setDirectories: (p: Directory[]) => void;
  setSelectedFileId: (p: string) => void;
  setDeleteDialog: (p: DialogProps) => void;
  setRenameDialog: (p: DialogProps) => void;
  deleteFile: (p: string) => void;
  renameFile: (p: { id: string; fileName: string }) => void;
};
const useFileManagerStore = create<FileManagerState & FileManagerAction>(
  (set, get) => ({
    fileList: [],
    layout: "grid",
    selectedFileId: "",
    openedDirectoryId: "",
    directories: [],
    deleteDialog: { open: false, id: "" },
    renameDialog: { open: false, id: "" },
    setFileList: (payload) => set(() => ({ fileList: payload })),
    setLayout: (payload) => set(() => ({ layout: payload })),
    setOpenedDirectoryId: (payload) => set(() => ({ openedDirectoryId: payload })),
    setSelectedFileId: (payload) => set(() => ({ selectedFileId: payload })),
    setDirectories: (payload) => set(() => ({ directories: payload })),
    setDeleteDialog: (payload) => set(() => ({ deleteDialog: payload })),
    setRenameDialog: (payload) => set(() => ({ renameDialog: payload })),
    deleteFile: (payload) => set(() => ({ fileList: get().fileList.filter((file) => file.id !== payload) })),
    renameFile: (payload) => set(() => ({
      fileList: get().fileList.map((file) => {
        if (file.id === payload.id) { file.name = payload.fileName; }
        return file;
      }),
    })),
  })
);


// --- MOCKED & UTILITY COMPONENTS ---
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const EllipsisButton = (props: { onClick: (e: MouseEvent) => void }) => ( <Button {...props} shape="circle" variant="plain" size="sm" icon={<span className="text-xl">⋮</span>} />);
const FileIcon = ({ type }: { type: string }) => {
    const iconMap: Record<string, React.ReactNode> = {
        pdf: <FilePdf height={24} width={24} />,
        doc: <FileDoc height={24} width={24} />,
        directory: <Folder height={24} width={24} />,
        image: <FileImage height={24} width={24} />,
    };
    return <span style={{ fontSize: "24px" }}>{iconMap[type] || <FileNotFound height={24} width={24} />}</span>;
};
const MediaSkeleton = ({ avatarProps }: { avatarProps: any }) => ( <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: avatarProps.width, height: avatarProps.height, backgroundColor: "#e0e0e0", borderRadius: "50%" }}></div><div style={{ flex: 1 }}><div style={{ height: "1em", backgroundColor: "#e0e0e0", marginBottom: "4px" }}></div><div style={{ height: "0.8em", width: "60%", backgroundColor: "#e0e0e0" }}></div></div></div> );
const TableRowSkeleton = ({ rows = 5, columns = 3 }) => ( <tbody>{[...Array(rows)].map((_, i) => ( <tr key={i}>{[...Array(columns)].map((_, j) => ( <td key={j} style={{ padding: "16px" }}>{j === 0 ? (<MediaSkeleton avatarProps={{ width: 30, height: 30 }} />) : (<div style={{ height: "1em", backgroundColor: "#e0e0e0" }}></div>)}</td>))}</tr>))}</tbody> );

// --- DATA TRANSFORMATION LOGIC (REVISED & IMPROVED) ---
let fileSystemData: Record<string, { list: File[]; directory: Directory[] }> = {};

const transformApiData = (apiData: any) => {
  // Reset the file system data
  fileSystemData = { "": { list: [], directory: [] } };

  // --- HELPER FUNCTIONS ---
  const getFileNameFromUrl = (url: string) => {
    try {
      // Use URL constructor for robust parsing
      return new URL(url).pathname.split('/').pop() || "file";
    } catch (e) {
      // Fallback for malformed URLs
      return url.substring(url.lastIndexOf("/") + 1);
    }
  };
  
  const getFileExtension = (fileName: string) => fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
  
  const getFileTypeFromExtension = (ext: string) => {
    if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(ext)) return "image";
    if (["pdf"].includes(ext)) return "pdf";
    if (["doc", "docx"].includes(ext)) return "doc";
    return ext;
  };
  
  const createFolder = (id: string, name: string): File => ({
    id, name, fileType: "directory", size: 0, srcUrl: "", uploadDate: Date.now() / 1000,
  });

  const createFile = (url: string, idPrefix: string): File | null => {
    if (!url || typeof url !== "string" || !url.startsWith('http')) return null;
    const name = getFileNameFromUrl(url);
    const extension = getFileExtension(name);
    return {
      id: `${idPrefix}-${name}`, name, fileType: getFileTypeFromExtension(extension),
      size: Math.floor(Math.random() * 5000000), srcUrl: url, uploadDate: Date.now() / 1000,
    };
  };

  const addEntry = (parentId: string, entry: File, breadcrumbs: Directory[]) => {
    if (!fileSystemData[parentId]) {
      fileSystemData[parentId] = { list: [], directory: [] };
    }
    // Avoid adding duplicate entries
    if (!fileSystemData[parentId].list.some(f => f.id === entry.id)) {
      fileSystemData[parentId].list.push(entry);
    }
    if (entry.fileType === "directory" && !fileSystemData[entry.id]) {
      fileSystemData[entry.id] = { list: [], directory: breadcrumbs };
    }
  };

  // --- RECURSIVE PROCESSOR ---
  const processEntry = (data: any, parentId: string, breadcrumbs: Directory[], idPrefix: string) => {
    if (!data) return;

    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        // For arrays of objects, create a sub-folder for each item
        if (typeof item === 'object' && item !== null) {
          const subFolderName = item.name || item.title || item.verified_by_name || `Item ${item.id || index + 1}`;
          const subFolderId = `${parentId}-${index}`;
          const subFolder = createFolder(subFolderId, subFolderName);
          const newBreadcrumbs = [...breadcrumbs, { id: subFolder.id, label: subFolder.name }];
          addEntry(parentId, subFolder, newBreadcrumbs);
          processEntry(item, subFolder.id, newBreadcrumbs, subFolderId);
        } else if (typeof item === 'string') {
          const file = createFile(item, parentId);
          if (file) addEntry(parentId, file, breadcrumbs);
        }
      });
    } else if (typeof data === 'object') {
      Object.entries(data).forEach(([key, value]) => {
        // Recursively process nested objects that might contain files
        if (value && typeof value === 'object') {
          // Create a sub-folder for the object key
          const folderName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const folderId = `${parentId}-${key}`;
          const subFolder = createFolder(folderId, folderName);
          const newBreadcrumbs = [...breadcrumbs, { id: subFolder.id, label: subFolder.name }];
          addEntry(parentId, subFolder, newBreadcrumbs);
          processEntry(value, folderId, newBreadcrumbs, folderId);
        } else if (typeof value === 'string') {
          // Create a file for the string value
          const file = createFile(value, parentId);
          if (file) addEntry(parentId, file, breadcrumbs);
        }
      });
    }
  };

  // --- MAIN PROCESSING LOOP ---
  Object.entries(apiData).forEach(([moduleKey, items]) => {
    if (!Array.isArray(items) || items.length === 0) return;

    // Level 1: Module Folder (e.g., "Company Documents")
    const moduleName = moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1);
    const moduleFolder = createFolder(`module-${moduleKey.replace(/\s+/g, '-')}`, moduleName);
    addEntry("", moduleFolder, [{ id: moduleFolder.id, label: moduleFolder.name }]);

    items.forEach((item: any) => {
      // Level 2: Item Folder (e.g., "MOBILE WORLD VADODARA")
      const itemName = item.company_name || item.partner_name || item.name || item.task_title || item.title || `Item ${item.id}`;
      const itemFolder = createFolder(`item-${moduleKey.replace(/\s+/g, '-')}-${item.id}`, itemName);
      const itemBreadcrumbs = [...(fileSystemData[moduleFolder.id]?.directory || []), { id: itemFolder.id, label: itemFolder.name }];
      addEntry(moduleFolder.id, itemFolder, itemBreadcrumbs);
      
      // Find all potential document containers and direct file URLs
      Object.entries(item).forEach(([key, value]) => {
        // Skip identifiers and names already used for the folder title
        if (['id', 'company_name', 'partner_name', 'name', 'task_title', 'title', 'entity_type'].includes(key)) return;
        
        // Process direct file URLs at the top level of the item
        if (typeof value === 'string' && value.startsWith('http')) {
            const file = createFile(value, itemFolder.id);
            if (file) addEntry(itemFolder.id, file, itemBreadcrumbs);
        } 
        // Recursively process nested objects or arrays that contain documents
        else if (value && (typeof value === 'object' || Array.isArray(value))) {
            const hasFiles = JSON.stringify(value).includes("http");
            if (hasFiles) {
                const subFolderName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const subFolderId = `${itemFolder.id}-${key}`;
                const subFolder = createFolder(subFolderId, subFolderName);
                const newBreadcrumbs = [...itemBreadcrumbs, { id: subFolder.id, label: subFolder.name }];
                addEntry(itemFolder.id, subFolder, newBreadcrumbs);
                processEntry(value, subFolder.id, newBreadcrumbs, subFolderId);
            }
        }
      });
    });
  });
};


// --- SUB-COMPONENTS ---
const FileType = ({ type }: { type: string }) => <>{type === 'directory' ? 'Folder' : type.toUpperCase()}</>;

const FileItemDropdown = (props: any) => {
  const { onDownload, onRename, onDelete, onOpen } = props;
  const dropdownRef = useRef<DropdownRef>(null);
  const handleDropdownClick = (e: MouseEvent) => { e.stopPropagation(); dropdownRef.current?.handleDropdownOpen(); };
  const handleDropdownItemClick = (e: SyntheticEvent, callback?: () => void) => { e.stopPropagation(); callback?.(); };
  return (
    <Dropdown ref={dropdownRef} renderTitle={<EllipsisButton onClick={handleDropdownClick} />} placement="bottom-end">
      {onOpen && <Dropdown.Item eventKey="Open" onClick={(e) => handleDropdownItemClick(e, onOpen)}><TbFolderSymlink className="text-xl" /><span>Open</span></Dropdown.Item>}
      <Dropdown.Item eventKey="download" onClick={(e) => handleDropdownItemClick(e, onDownload)}><TbCloudDownload className="text-xl" /><span>Download</span></Dropdown.Item>
      {/* <Dropdown.Item eventKey="rename" onClick={(e) => handleDropdownItemClick(e, onRename)}><TbPencil className="text-xl" /><span>Rename</span></Dropdown.Item>
      <Dropdown.Item eventKey="delete" onClick={(e) => handleDropdownItemClick(e, onDelete)}><span className="flex items-center gap-2 text-red-500"><TbTrash className="text-xl" /><span>Delete</span></span></Dropdown.Item> */}
    </Dropdown>
  );
};

const FolderRow = (props: { folder: File } & any) => {
  const { folder, onClick, onDoubleClick, ...rest } = props;
  return (
    <Table.Tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={onClick} onDoubleClick={onDoubleClick}>
      <Table.Td width="70%">
        <div className="inline-flex items-center gap-2 group" role="button">
          <div className="text-3xl"><Folder height={24} width={24} /></div>
          <div className="font-bold heading-text group-hover:text-primary-600">{folder.name}</div>
        </div>
      </Table.Td>
      <Table.Td><FileType type={folder.fileType} /></Table.Td>
      <Table.Td><div className="flex justify-end"><FileItemDropdown {...rest} onOpen={onDoubleClick} onDownload={() => rest.onDownload(folder.srcUrl, folder.name)} onDelete={() => rest.onDelete(folder.id)} onRename={() => rest.onRename(folder.id)} /></div></Table.Td>
    </Table.Tr>
  );
};

const FolderSegment = (props: { folder: File } & any) => {
  const { folder, onClick, onDoubleClick, ...rest } = props;
  return (
    <div className="bg-white rounded-2xl dark:bg-gray-800 border border-gray-200 dark:border-transparent p-4 flex flex-col justify-between gap-3 transition-all hover:shadow-lg cursor-pointer" role="button" onClick={onClick} onDoubleClick={onDoubleClick}>
        <div className="flex items-center justify-between">
            <div className="text-4xl text-amber-500"><Folder height={36} width={36} /></div>
            <FileItemDropdown {...rest} onOpen={onDoubleClick} onDownload={() => rest.onDownload(folder.srcUrl, folder.name)} onDelete={() => rest.onDelete(folder.id)} onRename={() => rest.onRename(folder.id)}/>
        </div>
        <div className="mt-2">
            <div className="font-bold heading-text truncate">{folder.name}</div>
            <div className="text-sm text-gray-500">{dayjs.unix(folder.uploadDate).format("MMM DD, YYYY")}</div>
        </div>
    </div>
  );
};

const FileSegment = (props: { file: File } & any) => {
    const { file, onPreview, ...rest } = props;

    const renderPreview = () => {
        if (isImageUrl(file.srcUrl)) {
            return (
                <img src={file.srcUrl} alt={file.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            );
        }
        if (file.fileType === 'pdf') {
            return (
                <div className="w-full h-full flex items-center justify-center p-4">
                    <TbFileTypePdf className="text-red-500/80" size={60} />
                </div>
            );
        }
        return <DocumentPlaceholder file={file} />;
    };

    return (
        <div className="bg-white rounded-2xl dark:bg-gray-800 border border-gray-200 dark:border-transparent transition-all hover:shadow-lg group">
            <div className="w-full h-32 bg-gray-100 dark:bg-gray-700/50 rounded-t-2xl flex items-center justify-center cursor-pointer" onClick={onPreview}>
                {renderPreview()}
            </div>
            <div className="p-3 flex items-start justify-between gap-2">
                <div className="flex-grow">
                    <div className="font-bold heading-text truncate">{file.name}</div>
                    <div className="text-sm text-gray-500"><FileType type={file.fileType} /></div>
                </div>
                <FileItemDropdown {...rest} onDownload={() => rest.onDownload(file.srcUrl, file.name)} onDelete={() => rest.onDelete(file.id)} onRename={() => rest.onRename(file.id)}/>
            </div>
        </div>
    )
}

const FileList = (props: any) => {
  const { fileList, layout, onClick, onOpen, onPreview, ...rest } = props;
  const folders = useMemo(() => fileList.filter((f: File) => f.fileType === "directory"), [fileList]);
  const files = useMemo(() => fileList.filter((f: File) => f.fileType !== "directory"), [fileList]);

  return (
    <>
      {folders.length > 0 && (
        <div>
          <h4>Folders</h4>
          {layout === "grid" ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mt-4 gap-4 lg:gap-6">
              {folders.map((folder) => (
                <FolderSegment key={folder.id} folder={folder} onClick={() => onClick(folder.id)} onDoubleClick={() => onOpen(folder.id)} {...rest} />
              ))}
            </div>
          ) : (
            <Table className="mt-4"><Table.THead><Table.Tr><Table.Th>Name</Table.Th><Table.Th>Type</Table.Th><Table.Th></Table.Th></Table.Tr></Table.THead>
              <Table.TBody>{folders.map((folder) => (<FolderRow key={folder.id} folder={folder} onClick={() => onClick(folder.id)} onDoubleClick={() => onOpen(folder.id)} {...rest} />))}</Table.TBody>
            </Table>
          )}
        </div>
      )}
      {files.length > 0 && (
        <div className="mt-8">
          <h4>Files</h4>
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 mt-4 gap-4 lg:gap-6">
            {files.map((file) => (
                <FileSegment key={file.id} file={file} onPreview={() => onPreview(file)} {...rest} />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const FileManagerDeleteDialog = () => { const {deleteDialog, setDeleteDialog, deleteFile} = useFileManagerStore(); const hClose = () => setDeleteDialog({id:'',open:false}); const hConfirm = () => {deleteFile(deleteDialog.id); hClose()}; return <ConfirmDialog isOpen={deleteDialog.open} type="danger" title="Delete file" onClose={hClose} onCancel={hClose} onConfirm={hConfirm}><p>Are you sure you want to delete this file? This action cannot be undone.</p></ConfirmDialog>};
const FileManagerRenameDialog = () => { const {renameDialog, setRenameDialog, renameFile} = useFileManagerStore(); const [name, setName] = useState(''); const hClose=()=>setRenameDialog({id:'',open:false}); const hSubmit=()=>{renameFile({id:renameDialog.id, fileName:name}); hClose()}; return <Dialog isOpen={renameDialog.open} onClose={hClose}><h4>Rename</h4><DebouceInput placeholder="New name" onChange={e => setName(e.target.value)} /><div className="mt-4 text-right"><Button size="sm" className="mr-2" onClick={hClose}>Cancel</Button><Button variant="solid" size="sm" disabled={!name} onClick={hSubmit}>OK</Button></div></Dialog>};

const FileManagerHeader = ({ onEntryClick, onDirectoryClick }: { onEntryClick: () => void; onDirectoryClick: (id: string) => void; }) => {
    const { directories, layout, setLayout } = useFileManagerStore();
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <div className="flex items-center gap-2 flex-wrap">
                    <h5 role="button" className="hover:text-primary-600 cursor-pointer" onClick={onEntryClick}>File Manager</h5>
                    {directories.map((dir) => (
                        <Fragment key={dir.id}>
                            <TbChevronRight className="text-lg" />
                            <h5 role="button" className="hover:text-primary-600 cursor-pointer" onClick={() => onDirectoryClick(dir.id)}>{dir.label}</h5>
                        </Fragment>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Segment value={layout} onChange={(val) => setLayout(val as Layout)}><Segment.Item value="grid" className="text-xl px-3"><TbLayoutGrid /></Segment.Item><Segment.Item value="list" className="text-xl px-3"><TbList /></Segment.Item></Segment>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
async function getFilesFromFS(_: string, { arg }: { arg: string }) {
  await sleep(200);
  return fileSystemData[arg] || { list: [], directory: [] };
}

const FileManager = () => {
  const dispatch = useAppDispatch();
  const { allDocuments, status: masterLoadingStatus } = useSelector(masterSelector);
  const { layout, fileList, setFileList, setDeleteDialog, setRenameDialog, openedDirectoryId, setOpenedDirectoryId, setDirectories, setSelectedFileId } = useFileManagerStore();

  const [viewerState, setViewerState] = useState({ isOpen: false, startIndex: 0 });

  const { trigger, isMutating } = useSWRMutation(`/api/files/${openedDirectoryId}`, getFilesFromFS, {
      onSuccess: (resp) => {
        setDirectories(resp.directory);
        setFileList(resp.list);
      },
  });

  useEffect(() => { dispatch(getAllDocumentsAction()); }, [dispatch]);
  useEffect(() => { if (allDocuments && Object.keys(allDocuments).length > 0) { transformApiData(allDocuments); trigger(""); }}, [allDocuments, trigger]);

  const handleDelete = (id: string) => setDeleteDialog({ id, open: true });
  const handleRename = (id: string) => setRenameDialog({ id, open: true });
  const handleDownload = (srcUrl: string, fileName?: string) => {
    const link = document.createElement("a");
    link.href = srcUrl;
    link.target = "_blank";
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.push(<Notification type="success" title="Download started!" />);
  };

  const handleNavigate = (id: string) => {
    setOpenedDirectoryId(id);
    setSelectedFileId("");
    trigger(id);
  };
  
  const handlePreview = (clickedFile: File) => {
    // We now treat all non-directory files as viewable items.
    const viewableFiles = fileList.filter(f => f.fileType !== 'directory');
    const startIndex = viewableFiles.findIndex(f => f.id === clickedFile.id);
    
    if (startIndex !== -1) {
        setViewerState({ open: true, startIndex });
    }
  };
  
  // This memo now includes all viewable files for the UnifiedFileViewer.
  const allViewableFiles = useMemo(() => 
    fileList.filter(f => f.fileType !== 'directory'),
    [fileList]
  );
  
  const isLoading = masterLoadingStatus === "loading" || isMutating;

  return (
    <div className="p-4">
      <FileManagerHeader onEntryClick={() => handleNavigate("")} onDirectoryClick={handleNavigate} />
      <div className="mt-6">
        {isLoading ? (
          layout === "grid" ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 mt-4 gap-4 lg:gap-6">{[...Array(8)].map((_, i) => (<div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>))}</div>
          ) : (
            <Table><Table.THead><Table.Tr><Table.Th>Name</Table.Th><Table.Th>Type</Table.Th><Table.Th></Table.Th></Table.Tr></Table.THead><TableRowSkeleton/></Table>
          )
        ) : (
          <FileList fileList={fileList} layout={layout} onDownload={handleDownload} onDelete={handleDelete} onRename={handleRename} onOpen={handleNavigate} onClick={setSelectedFileId} onPreview={handlePreview} />
        )}
      </div>
      
      {/* Renders the single, unified viewer */}
      {viewerState.open && 
        <UnifiedFileViewer 
          files={allViewableFiles} 
          startIndex={viewerState.startIndex} 
          onClose={() => setViewerState({ open: false, startIndex: 0 })} 
        />
      }

      {/* Dialogs */}
      <FileManagerDeleteDialog />
      <FileManagerRenameDialog />
    </div>
  );
};

export default FileManager;