// app/components/api-runner/CollectionDrawerComponent.tsx
"use client";

import { useState, useRef, ChangeEvent, useMemo, useEffect } from "react";
import { ApiCollection, CollectionFolder, HttpMethod, SavedRequest } from "./types";

interface CollectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  collection: ApiCollection;
  activeId: string;
  onSelectRequest: (id: string) => void;
  onAddRequest: (folderId?: string | null) => void;
  onAddFolder: (parentId?: string | null) => void;
  onDuplicateRequest: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onRenameRequest: (id: string, newName: string) => void;
  onRenameFolder: (id: string, newName: string) => void;
  onDeleteFolder: (id: string) => void;
  onImportCollection: (imported: ApiCollection) => void;
}

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-success",
  POST: "text-primary font-bold",
  PUT: "text-warning",
  PATCH: "text-info",
  DELETE: "text-error",
  HEAD: "text-secondary",
  OPTIONS: "text-base-content/60",
};

export default function CollectionDrawerComponent({
  isOpen,
  onClose,
  collection,
  activeId,
  onSelectRequest,
  onAddRequest,
  onAddFolder,
  onDuplicateRequest,
  onDeleteRequest,
  onRenameRequest,
  onRenameFolder,
  onDeleteFolder,
  onImportCollection,
}: CollectionDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    return new Set(collection.folders.map((f) => f.id));
  });

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape & handle body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedFolders(new Set(collection.folders.map((f) => f.id)));
  };

  const handleCollapseAll = () => {
    setExpandedFolders(new Set());
  };

  const startRename = (id: string, currentName: string) => {
    setEditingItemId(id);
    setTempName(currentName);
  };

  const saveRename = (id: string, isFolder: boolean) => {
    if (tempName.trim()) {
      if (isFolder) {
        onRenameFolder(id, tempName.trim());
      } else {
        onRenameRequest(id, tempName.trim());
      }
    }
    setEditingItemId(null);
  };

  const handleExportJson = () => {
    const exportable: ApiCollection = {
      ...collection,
      updatedAt: new Date().toISOString(),
      requests: collection.requests.map((r) => ({
        ...r,
        formDataList: r.formDataList.map((f) => ({ ...f, file: null })),
      })),
    };

    const dataStr = JSON.stringify(exportable, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${collection.name.toLowerCase().replace(/\s+/g, "-")}-collection.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.requests)) {
          onImportCollection({
            version: "2.0",
            name: parsed.name || "Imported Collection",
            updatedAt: new Date().toISOString(),
            folders: Array.isArray(parsed.folders) ? parsed.folders : [],
            requests: parsed.requests.map((r: SavedRequest) => ({
              ...r,
              folderId: r.folderId || null,
            })),
          });
        }
      } catch (err: unknown) {
        console.error("Failed to parse collection JSON:", err);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return null;
    const term = searchTerm.toLowerCase();

    const matchingReqIds = new Set<string>();
    const matchingFolderIds = new Set<string>();

    collection.requests.forEach((r) => {
      if (r.name.toLowerCase().includes(term) || r.url.toLowerCase().includes(term)) {
        matchingReqIds.add(r.id);
        let currentFolderId = r.folderId;
        while (currentFolderId) {
          matchingFolderIds.add(currentFolderId);
          const parent = collection.folders.find((f) => f.id === currentFolderId);
          currentFolderId = parent?.parentId || null;
        }
      }
    });

    collection.folders.forEach((f) => {
      if (f.name.toLowerCase().includes(term)) {
        matchingFolderIds.add(f.id);
      }
    });

    return { reqIds: matchingReqIds, folderIds: matchingFolderIds };
  }, [searchTerm, collection]);

  const handleSelectAndClose = (id: string) => {
    onSelectRequest(id);
    onClose();
  };

  const renderTreeLevel = (parentId: string | null = null, depth: number = 0) => {
    const childFolders = collection.folders.filter((f) => f.parentId === parentId);
    const childRequests = collection.requests.filter((r) => r.folderId === parentId);

    if (childFolders.length === 0 && childRequests.length === 0 && parentId !== null) {
      return (
        <div
          style={{ paddingLeft: `${(depth + 1) * 12}px` }}
          className="text-[11px] text-base-content/40 italic py-1"
        >
          Empty group
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-0.5">
        {/* Render Folders */}
        {childFolders.map((folder) => {
          if (searchResults && !searchResults.folderIds.has(folder.id)) {
            return null;
          }

          const isExpanded = searchResults ? true : expandedFolders.has(folder.id);
          const isEditing = editingItemId === folder.id;

          return (
            <div key={folder.id} className="flex flex-col">
              <div
                style={{ paddingLeft: `${depth * 12 + 4}px` }}
                onClick={() => toggleFolder(folder.id)}
                className="group flex items-center justify-between p-1.5 rounded-lg cursor-pointer hover:bg-base-200/60 transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                  <span
                    className={`icon-[lucide--chevron-right] size-3.5 transition-transform shrink-0 text-base-content/50 ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  ></span>
                  <span
                    className={`size-3.5 shrink-0 ${
                      isExpanded
                        ? "icon-[lucide--folder-open] text-primary"
                        : "icon-[lucide--folder] text-base-content/70"
                    }`}
                  ></span>

                  {isEditing ? (
                    <input
                      type="text"
                      value={tempName}
                      autoFocus
                      onChange={(e) => setTempName(e.target.value)}
                      onBlur={() => saveRename(folder.id, true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(folder.id, true);
                        if (e.key === "Escape") setEditingItemId(null);
                      }}
                      className="input input-xs input-bordered py-0 h-5 text-xs flex-1 font-semibold"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-xs font-semibold text-base-content/90 truncate">
                      {folder.name}
                    </span>
                  )}
                </div>

                <div
                  className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onAddRequest(folder.id);
                      setExpandedFolders((prev) => new Set([...prev, folder.id]));
                    }}
                    className="btn btn-ghost btn-square btn-xs size-5"
                    title="Add Request in Folder"
                  >
                    <span className="icon-[lucide--file-plus] size-3 text-primary"></span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onAddFolder(folder.id);
                      setExpandedFolders((prev) => new Set([...prev, folder.id]));
                    }}
                    className="btn btn-ghost btn-square btn-xs size-5"
                    title="Add Subfolder"
                  >
                    <span className="icon-[lucide--folder-plus] size-3 text-base-content/70"></span>
                  </button>
                  <button
                    type="button"
                    onClick={() => startRename(folder.id, folder.name)}
                    className="btn btn-ghost btn-square btn-xs size-5"
                    title="Rename"
                  >
                    <span className="icon-[lucide--pencil] size-3 text-base-content/60"></span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteFolder(folder.id)}
                    className="btn btn-ghost btn-square btn-xs size-5 text-error hover:bg-error/10"
                    title="Delete Folder"
                  >
                    <span className="icon-[lucide--trash-2] size-3"></span>
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-l border-base-content/10 ml-3.5 my-0.5">
                  {renderTreeLevel(folder.id, depth + 1)}
                </div>
              )}
            </div>
          );
        })}

        {/* Render Requests */}
        {childRequests.map((req) => {
          if (searchResults && !searchResults.reqIds.has(req.id)) {
            return null;
          }

          const isActive = req.id === activeId;
          const isEditing = editingItemId === req.id;

          return (
            <div
              key={req.id}
              style={{ paddingLeft: `${depth * 12 + 6}px` }}
              onClick={() => handleSelectAndClose(req.id)}
              className={`group flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-all border ${
                isActive
                  ? "bg-primary/10 border-primary/30 text-base-content font-medium shadow-xs"
                  : "border-transparent hover:bg-base-200/60 text-base-content/80"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                <span
                  className={`font-mono text-[9px] font-bold shrink-0 w-8 ${
                    METHOD_COLORS[req.method] || "text-base-content"
                  }`}
                >
                  {req.method}
                </span>

                {isEditing ? (
                  <input
                    type="text"
                    value={tempName}
                    autoFocus
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={() => saveRename(req.id, false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRename(req.id, false);
                      if (e.key === "Escape") setEditingItemId(null);
                    }}
                    className="input input-xs input-bordered py-0 h-5 text-xs flex-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-xs truncate leading-tight">
                    {req.name}
                  </span>
                )}
              </div>

              <div
                className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => startRename(req.id, req.name)}
                  className="btn btn-ghost btn-square btn-xs size-5"
                  title="Rename"
                >
                  <span className="icon-[lucide--pencil] size-3 text-base-content/60"></span>
                </button>
                <button
                  type="button"
                  onClick={() => onDuplicateRequest(req.id)}
                  className="btn btn-ghost btn-square btn-xs size-5"
                  title="Duplicate"
                >
                  <span className="icon-[lucide--copy] size-3 text-base-content/60"></span>
                </button>
                {collection.requests.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDeleteRequest(req.id)}
                    className="btn btn-ghost btn-square btn-xs size-5 text-error hover:bg-error/10"
                    title="Delete"
                  >
                    <span className="icon-[lucide--trash-2] size-3"></span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* FlyonUI Overlay Backdrop */}
      <div
        className={`overlay-backdrop fixed inset-0 z-40 bg-base-content/50 backdrop-blur-sm transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* FlyonUI Drawer Component (Left-aligned) */}
      <aside
        id="collection-drawer"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        className={`overlay overlay-open:translate-x-0 drawer drawer-start fixed top-0 start-0 z-50 h-full w-full max-w-sm sm:max-w-md border-e border-base-content/10 bg-base-100 shadow-2xl transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="drawer-header border-b border-base-content/10 flex items-center justify-between p-4 bg-base-200/40">
          <div className="flex items-center gap-2">
            <span className="icon-[lucide--folder-tree] size-5 text-primary"></span>
            <div>
              <h3 className="drawer-title text-sm font-bold leading-tight">
                {collection.name}
              </h3>
              <p className="text-[11px] text-base-content/50 font-mono">
                {collection.folders.length} Groups • {collection.requests.length} Requests
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-text btn-circle btn-sm"
            aria-label="Close"
            onClick={onClose}
          >
            <span className="icon-[lucide--x] size-4"></span>
          </button>
        </div>

        {/* Drawer Toolbar & Search */}
        <div className="p-3 border-b border-base-content/10 flex flex-col gap-2.5 bg-base-100">
          <div className="flex items-center justify-between gap-2">
            {/* Quick Add Menu */}
            <div className="dropdown">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-primary btn-xs gap-1"
              >
                <span className="icon-[lucide--plus] size-3"></span>
                <span>New Item</span>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-20 w-44 p-1 shadow-lg border border-base-content/10 text-xs mt-1"
              >
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onAddRequest(null);
                      if (document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur();
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <span className="icon-[lucide--file-plus] size-3.5 text-primary"></span>
                    <span>New Request</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onAddFolder(null);
                      if (document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur();
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <span className="icon-[lucide--folder-plus] size-3.5 text-warning"></span>
                    <span>New Group</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Import / Export & View Toggles */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleExportJson}
                className="btn btn-ghost btn-square btn-xs"
                title="Export Collection JSON"
              >
                <span className="icon-[lucide--download] size-3.5"></span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-ghost btn-square btn-xs"
                title="Import Collection JSON"
              >
                <span className="icon-[lucide--upload] size-3.5"></span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />

              <div className="divider divider-horizontal mx-0 my-1"></div>

              <button
                type="button"
                onClick={handleExpandAll}
                className="btn btn-ghost btn-square btn-xs"
                title="Expand All"
              >
                <span className="icon-[lucide--chevrons-up-down] size-3.5"></span>
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="btn btn-ghost btn-square btn-xs"
                title="Collapse All"
              >
                <span className="icon-[lucide--minimize-2] size-3"></span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <span className="icon-[lucide--search] size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/40"></span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter requests & groups..."
              className="input input-xs w-full pl-8 font-mono text-[11px] focus:outline-primary bg-base-200/40"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Drawer Body: Recursive Tree */}
        <div className="drawer-body flex-1 overflow-y-auto p-2">
          {renderTreeLevel(null, 0)}
        </div>

        {/* Drawer Footer */}
        <div className="drawer-footer border-t border-base-content/10 p-3 flex items-center justify-between text-[11px] text-base-content/50 bg-base-200/30">
          <span className="italic">100% saved in browser storage</span>
          <button type="button" onClick={onClose} className="btn btn-xs btn-ghost">
            Close
          </button>
        </div>
      </aside>
    </>
  );
}
