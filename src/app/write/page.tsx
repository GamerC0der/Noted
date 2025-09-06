"use client";

import { Navigation } from "@/components/ui/navigation";
import NotionEditor from "@/components/ui/notion-editor";
import { NotionToolbar } from "@/components/ui/notion-toolbar";
import { Edit, Trash2, Plus, Folder, FolderOpen, ChevronRight, ChevronDown, FileText, GripVertical } from "lucide-react";
import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NOTES_DB = 'notesDB';
const NOTES_STORE = 'notes';
const FOLDERS_STORE = 'folders';

interface Note {
  id: number;
  name: string;
  content: string;
  isEditing: boolean;
  editValue: string;
  icon?: string;
  folderId?: number;
  order: number;
}

interface Folder {
  id: number;
  name: string;
  isEditing: boolean;
  editValue: string;
  isExpanded: boolean;
  order: number;
}

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NOTES_DB, 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as IDBDatabase);
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest)?.result;
      if (db && !db.objectStoreNames.contains(NOTES_STORE)) {
        db.createObjectStore(NOTES_STORE, { keyPath: 'id' });
      }
      if (db && !db.objectStoreNames.contains(FOLDERS_STORE)) {
        db.createObjectStore(FOLDERS_STORE, { keyPath: 'id' });
      }
    };
  });
};

const saveNotesToDB = async (notes: Note[]) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([NOTES_STORE], 'readwrite');
    const store = transaction.objectStore(NOTES_STORE);
    await new Promise<void>((resolve) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
    });
    for (const note of notes) {
      await new Promise<void>((resolve) => {
        const request = store.put(note);
        request.onsuccess = () => resolve();
      });
    }
  } catch (error) {
    console.error('Error saving notes:', error);
  }
};

const loadNotesFromDB = async (): Promise<Note[]> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([NOTES_STORE], 'readonly');
    const store = transaction.objectStore(NOTES_STORE);
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Note[]);
    });
  } catch (error) {
    console.error('Error loading notes:', error);
    return [];
  }
};

const saveFoldersToDB = async (folders: Folder[]) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([FOLDERS_STORE], 'readwrite');
    const store = transaction.objectStore(FOLDERS_STORE);
    await new Promise<void>((resolve) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
    });
    for (const folder of folders) {
      await new Promise<void>((resolve) => {
        const request = store.put(folder);
        request.onsuccess = () => resolve();
      });
    }
  } catch (error) {
    console.error('Error saving folders:', error);
  }
};

const loadFoldersFromDB = async (): Promise<Folder[]> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([FOLDERS_STORE], 'readonly');
    const store = transaction.objectStore(FOLDERS_STORE);
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Folder[]);
    });
  } catch (error) {
    console.error('Error loading folders:', error);
    return [];
  }
};

interface SortableNoteProps {
  note: Note;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onEditStart: (id: number) => void;
  onEditSave: (id: number) => void;
  onEditCancel: (id: number) => void;
  onDelete: (id: number) => void;
  onMoveToFolder: (id: number, folderId: number | undefined) => void;
  onEditValueChange: (id: number, value: string) => void;
  folders: Folder[];
  isInFolder?: boolean;
}

const SortableNote = ({ 
  note, 
  isSelected, 
  onSelect, 
  onEditStart, 
  onEditSave, 
  onEditCancel, 
  onDelete, 
  onMoveToFolder,
  onEditValueChange,
  folders,
  isInFolder = false
}: SortableNoteProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (note.isEditing) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2">
        <input
          type="text"
          value={note.editValue}
          onChange={(e) => {
            const newValue = e.target.value;
            onEditValueChange(note.id, newValue);
          }}
          className="flex-1 bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-neutral-500"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEditSave(note.id);
            if (e.key === 'Escape') onEditCancel(note.id);
          }}
        />
        <button
          onClick={() => onEditSave(note.id)}
          className="p-1 rounded hover:bg-neutral-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={() => onEditCancel(note.id)}
          className="p-1 rounded hover:bg-neutral-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <DropdownMenu>
        <div
          className={`flex items-center justify-between text-neutral-300 text-sm px-3 py-2 rounded-md transition-colors group cursor-pointer ${
            isSelected
              ? 'bg-neutral-700 text-white'
              : 'hover:bg-neutral-800'
          }`}
          onClick={() => onSelect(note.id)}
        >
          <div className="flex items-center space-x-2 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:cursor-grabbing p-1 rounded hover:bg-neutral-600 transition-colors"
            >
              <GripVertical className="h-3 w-3 text-neutral-500" />
            </div>
            <FileText className="h-4 w-4 text-blue-400" />
            <span>{note.name}</span>
          </div>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 hover:bg-neutral-600 p-1 rounded transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="5" r="2" fill="currentColor"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
                <circle cx="12" cy="19" r="2" fill="currentColor"/>
              </svg>
            </button>
          </DropdownMenuTrigger>
        </div>

        <DropdownMenuContent align="end" className="w-40 bg-neutral-800 border-neutral-700">
          <DropdownMenuItem
            className="text-neutral-300 hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onEditStart(note.id);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          {isInFolder && (
            <DropdownMenuItem
              className="text-neutral-300 hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onMoveToFolder(note.id, undefined);
              }}
            >
              Move to Root
            </DropdownMenuItem>
          )}
          {!isInFolder && folders.length > 0 && (
            <DropdownMenuItem
              className="text-neutral-300 hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onMoveToFolder(note.id, folders[0].id);
              }}
            >
              Move to Folder
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-neutral-300 hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4 text-red-500" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

interface SortableFolderProps {
  folder: Folder;
  onEditStart: (id: number) => void;
  onEditSave: (id: number) => void;
  onEditCancel: (id: number) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
  onEditValueChange: (id: number, value: string) => void;
  notes: Note[];
  selectedNoteId: number | null;
  onSelectNote: (id: number) => void;
  onEditStartNote: (id: number) => void;
  onEditSaveNote: (id: number) => void;
  onEditCancelNote: (id: number) => void;
  onDeleteNote: (id: number) => void;
  onMoveNoteToFolder: (id: number, folderId: number | undefined) => void;
  onEditValueChangeNote: (id: number, value: string) => void;
  folders: Folder[];
}

const SortableFolder = ({
  folder,
  onEditStart,
  onEditSave,
  onEditCancel,
  onDelete,
  onToggle,
  onEditValueChange,
  notes,
  selectedNoteId,
  onSelectNote,
  onEditStartNote,
  onEditSaveNote,
  onEditCancelNote,
  onDeleteNote,
  onMoveNoteToFolder,
  onEditValueChangeNote,
  folders
}: SortableFolderProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `folder-${folder.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (folder.isEditing) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2">
        <input
          type="text"
          value={folder.editValue}
          onChange={(e) => {
            const newValue = e.target.value;
            onEditValueChange(folder.id, newValue);
          }}
          className="flex-1 bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-neutral-500"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEditSave(folder.id);
            if (e.key === 'Escape') onEditCancel(folder.id);
          }}
        />
        <button
          onClick={() => onEditSave(folder.id)}
          className="p-1 rounded hover:bg-neutral-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={() => onEditCancel(folder.id)}
          className="p-1 rounded hover:bg-neutral-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <DropdownMenu>
        <div className="flex items-center justify-between text-neutral-300 text-sm px-3 py-2 rounded-md transition-colors group cursor-pointer hover:bg-neutral-800">
          <div className="flex items-center space-x-2 flex-1" onClick={() => onToggle(folder.id)}>
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:cursor-grabbing p-1 rounded hover:bg-neutral-600 transition-colors"
            >
              <GripVertical className="h-3 w-3 text-neutral-500" />
            </div>
            {folder.isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {folder.isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-400" />
            ) : (
              <Folder className="h-4 w-4 text-blue-400" />
            )}
            <span>{folder.name}</span>
          </div>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 hover:bg-neutral-600 p-1 rounded transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="5" r="2" fill="currentColor"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
                <circle cx="12" cy="19" r="2" fill="currentColor"/>
              </svg>
            </button>
          </DropdownMenuTrigger>
        </div>

        <DropdownMenuContent align="end" className="w-40 bg-neutral-800 border-neutral-700">
          <DropdownMenuItem
            className="text-neutral-300 hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onEditStart(folder.id);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-neutral-300 hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(folder.id);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4 text-red-500" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {folder.isExpanded && (
        <div className="ml-6 space-y-1 mt-1">
          <SortableContext
            items={notes.filter(note => note.folderId === folder.id).sort((a, b) => a.order - b.order).map(note => note.id)}
            strategy={verticalListSortingStrategy}
          >
            {notes.filter(note => note.folderId === folder.id).sort((a, b) => a.order - b.order).map((note) => (
              <SortableNote
                key={note.id}
                note={note}
                isSelected={selectedNoteId === note.id}
                onSelect={onSelectNote}
                onEditStart={onEditStartNote}
                onEditSave={onEditSaveNote}
                onEditCancel={onEditCancelNote}
                onDelete={onDeleteNote}
                onMoveToFolder={onMoveNoteToFolder}
                onEditValueChange={onEditValueChangeNote}
                folders={folders}
                isInFolder={true}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
};

export default function WritePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [nextId, setNextId] = useState(1);
  const [nextFolderId, setNextFolderId] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const loadData = async () => {
      const [savedNotes, savedFolders] = await Promise.all([
        loadNotesFromDB(),
        loadFoldersFromDB()
      ]);
      
      if (savedNotes.length > 0) {
        setNotes(savedNotes);
        setSelectedNoteId(savedNotes[0].id);
        setNextId(Math.max(...savedNotes.map((note: Note) => note.id)) + 1);
      } else {
        const defaultNote = {
          id: 1,
          name: "Note",
          content: "",
          isEditing: false,
          editValue: "Note",
          icon: "📝",
          order: 0
        };
        setNotes([defaultNote]);
        setSelectedNoteId(1);
        setNextId(2);
      }
      
      if (savedFolders.length > 0) {
        setFolders(savedFolders);
        setNextFolderId(Math.max(...savedFolders.map((folder: Folder) => folder.id)) + 1);
      } else {
        setNextFolderId(1);
      }
      
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (notes.length > 0) {
        saveNotesToDB(notes);
      }
      if (folders.length > 0) {
        saveFoldersToDB(folders);
      }
    }
  }, [notes, folders, isLoading]);

  const handleAddNote = () => {
    const maxOrder = Math.max(...notes.map(note => note.order), -1);
    const newNote = {
      id: nextId,
      name: `Note ${nextId}`,
      content: "",
      isEditing: false,
      editValue: `Note ${nextId}`,
      icon: "📝",
      order: maxOrder + 1
    };
    setNotes([...notes, newNote]);
    setSelectedNoteId(newNote.id);
    setNextId(nextId + 1);
  };

  const handleSelectNote = (noteId: number) => {
    setSelectedNoteId(noteId);
  };

  const handleUpdateNoteContent = (noteId: number, content: string) => {
    setNotes(notes.map(note =>
      note.id === noteId
        ? { ...note, content }
        : note
    ));
  };

  const handleEditStart = (noteId: number) => {
    setNotes(notes.map(note =>
      note.id === noteId
        ? { ...note, isEditing: true, editValue: note.name }
        : note
    ));
  };

  const handleEditSave = (noteId: number) => {
    setNotes(notes.map(note =>
      note.id === noteId
        ? { ...note, name: note.editValue, isEditing: false }
        : note
    ));
  };

  const handleEditCancel = (noteId: number) => {
    setNotes(notes.map(note =>
      note.id === noteId
        ? { ...note, isEditing: false, editValue: note.name }
        : note
    ));
  };

  const handleDeleteNote = (noteId: number) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);
    if (selectedNoteId === noteId) {
      if (updatedNotes.length > 0) {
        setSelectedNoteId(updatedNotes[0].id);
      } else {
        const newNote = {
          id: nextId,
          name: "Note",
          content: "",
          isEditing: false,
          editValue: "Note",
          icon: "📝",
          order: 0
        };
        setNotes([newNote]);
        setSelectedNoteId(newNote.id);
        setNextId(nextId + 1);
      }
    }
  };

  const handleIconChange = (noteId: number, icon: string) => {
    setNotes(notes.map(note =>
      note.id === noteId
        ? { ...note, icon }
        : note
    ));
  };

  const handleIconRemove = (noteId: number) => {
    setNotes(notes.map(note =>
      note.id === noteId
        ? { ...note, icon: undefined }
        : note
    ));
  };

  const handleTitleChange = (noteId: number, title: string) => {
    setNotes(notes.map(note =>
      note.id === noteId
        ? { ...note, name: title }
        : note
    ));
  };

  const handleAddFolder = () => {
    const maxOrder = Math.max(...folders.map(folder => folder.order), -1);
    const newFolder = {
      id: nextFolderId,
      name: `Folder ${nextFolderId}`,
      isEditing: false,
      editValue: `Folder ${nextFolderId}`,
      isExpanded: true,
      order: maxOrder + 1
    };
    setFolders([...folders, newFolder]);
    setNextFolderId(nextFolderId + 1);
  };

  const handleFolderEditStart = (folderId: number) => {
    setFolders(folders.map(folder =>
      folder.id === folderId
        ? { ...folder, isEditing: true, editValue: folder.name }
        : folder
    ));
  };

  const handleFolderEditSave = (folderId: number) => {
    setFolders(folders.map(folder =>
      folder.id === folderId
        ? { ...folder, name: folder.editValue, isEditing: false }
        : folder
    ));
  };

  const handleFolderEditCancel = (folderId: number) => {
    setFolders(folders.map(folder =>
      folder.id === folderId
        ? { ...folder, isEditing: false, editValue: folder.name }
        : folder
    ));
  };

  const handleDeleteFolder = (folderId: number) => {
    setNotes(notes.map(note =>
      note.folderId === folderId
        ? { ...note, folderId: undefined }
        : note
    ));
    setFolders(folders.filter(folder => folder.id !== folderId));
  };

  const handleToggleFolder = (folderId: number) => {
    setFolders(folders.map(folder =>
      folder.id === folderId
        ? { ...folder, isExpanded: !folder.isExpanded }
        : folder
    ));
  };

  const handleMoveNoteToFolder = (noteId: number, folderId: number | undefined) => {
    setNotes(notes.map(note =>
      note.id === noteId
        ? { ...note, folderId }
        : note
    ));
  };

  const handleEditValueChange = (noteId: number, value: string) => {
    setNotes(notes.map(note =>
      note.id === noteId
        ? { ...note, editValue: value }
        : note
    ));
  };

  const handleFolderEditValueChange = (folderId: number, value: string) => {
    setFolders(folders.map(folder =>
      folder.id === folderId
        ? { ...folder, editValue: value }
        : folder
    ));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeId = active.id.toString();
      const overId = over.id.toString();

      if (activeId.startsWith('folder-') && overId.startsWith('folder-')) {
        const activeFolderId = parseInt(activeId.replace('folder-', ''));
        const overFolderId = parseInt(overId.replace('folder-', ''));
        
        const activeFolder = folders.find(folder => folder.id === activeFolderId);
        const overFolder = folders.find(folder => folder.id === overFolderId);

        if (activeFolder && overFolder) {
          const sortedFolders = folders.sort((a, b) => a.order - b.order);
          const oldIndex = sortedFolders.findIndex(folder => folder.id === activeFolderId);
          const newIndex = sortedFolders.findIndex(folder => folder.id === overFolderId);

          const reorderedFolders = arrayMove(sortedFolders, oldIndex, newIndex);
          
          const updatedFolders = folders.map(folder => {
            const newOrder = reorderedFolders.findIndex(f => f.id === folder.id);
            return { ...folder, order: newOrder };
          });

          setFolders(updatedFolders);
        }
      } else if (!activeId.startsWith('folder-') && !overId.startsWith('folder-')) {
        const activeNote = notes.find(note => note.id === parseInt(activeId));
        const overNote = notes.find(note => note.id === parseInt(overId));

        if (activeNote && overNote) {
          if (activeNote.folderId === overNote.folderId) {
            const folderId = activeNote.folderId;
            const folderNotes = notes.filter(note => note.folderId === folderId);
            const sortedNotes = folderNotes.sort((a, b) => a.order - b.order);
            const oldIndex = sortedNotes.findIndex(note => note.id === activeNote.id);
            const newIndex = sortedNotes.findIndex(note => note.id === overNote.id);

            const reorderedNotes = arrayMove(sortedNotes, oldIndex, newIndex);
            
            const updatedNotes = notes.map(note => {
              if (note.folderId === folderId) {
                const newOrder = reorderedNotes.findIndex(n => n.id === note.id);
                return { ...note, order: newOrder };
              }
              return note;
            });

            setNotes(updatedNotes);
          } else {
            const maxOrderInTargetFolder = Math.max(
              ...notes.filter(note => note.folderId === overNote.folderId).map(note => note.order),
              -1
            );
            
            setNotes(notes.map(note => {
              if (note.id === activeNote.id) {
                return { 
                  ...note, 
                  folderId: overNote.folderId,
                  order: maxOrderInTargetFolder + 1
                };
              }
              return note;
            }));
          }
        }
      } else if (!activeId.startsWith('folder-') && overId.startsWith('folder-')) {
        const activeNote = notes.find(note => note.id === parseInt(activeId));
        const overFolderId = parseInt(overId.replace('folder-', ''));

        if (activeNote) {
          const maxOrderInTargetFolder = Math.max(
            ...notes.filter(note => note.folderId === overFolderId).map(note => note.order),
            -1
          );
          
          setNotes(notes.map(note => {
            if (note.id === activeNote.id) {
              return { 
                ...note, 
                folderId: overFolderId,
                order: maxOrderInTargetFolder + 1
              };
            }
            return note;
          }));
        }
      }
    }
  };
  return (
    <div className="w-full h-screen bg-black">
      <Navigation />
      <div className="flex h-full">
        <div className="w-64 bg-neutral-900 border-r border-neutral-800">
          <div className="p-4 flex items-center justify-between">
            <h1 className="text-white text-xl font-semibold">Noted</h1>
            <div className="flex space-x-1">
              <button
                onClick={handleAddFolder}
                className="p-2 rounded-md hover:bg-neutral-800 transition-colors"
                title="Add Folder"
              >
                <Folder className="h-5 w-5 text-neutral-400 hover:text-white transition-colors" />
              </button>
              <button
                onClick={handleAddNote}
                className="p-2 rounded-md hover:bg-neutral-800 transition-colors"
                title="Add Note"
              >
                <Plus className="h-5 w-5 text-neutral-400 hover:text-white hover:rotate-[360deg] transition-transform duration-500 ease-out" />
              </button>
            </div>
          </div>

          <div className="px-4 pb-4 overflow-y-auto max-h-[calc(100vh-120px)]">
            <h2 className="text-neutral-400 text-sm font-medium mb-3 uppercase tracking-wide">Notes</h2>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={folders.sort((a, b) => a.order - b.order).map(folder => `folder-${folder.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {folders.sort((a, b) => a.order - b.order).map((folder) => (
                  <SortableFolder
                    key={folder.id}
                    folder={folder}
                    onEditStart={handleFolderEditStart}
                    onEditSave={handleFolderEditSave}
                    onEditCancel={handleFolderEditCancel}
                    onDelete={handleDeleteFolder}
                    onToggle={handleToggleFolder}
                    onEditValueChange={handleFolderEditValueChange}
                    notes={notes}
                    selectedNoteId={selectedNoteId}
                    onSelectNote={handleSelectNote}
                    onEditStartNote={handleEditStart}
                    onEditSaveNote={handleEditSave}
                    onEditCancelNote={handleEditCancel}
                    onDeleteNote={handleDeleteNote}
                    onMoveNoteToFolder={handleMoveNoteToFolder}
                    onEditValueChangeNote={handleEditValueChange}
                    folders={folders}
                  />
                ))}
              </SortableContext>

              <SortableContext
                items={notes.filter(note => !note.folderId).sort((a, b) => a.order - b.order).map(note => note.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {notes.filter(note => !note.folderId).sort((a, b) => a.order - b.order).map((note) => (
                    <SortableNote
                      key={note.id}
                      note={note}
                      isSelected={selectedNoteId === note.id}
                      onSelect={handleSelectNote}
                      onEditStart={handleEditStart}
                      onEditSave={handleEditSave}
                      onEditCancel={handleEditCancel}
                      onDelete={handleDeleteNote}
                      onMoveToFolder={handleMoveNoteToFolder}
                      onEditValueChange={handleEditValueChange}
                      folders={folders}
                      isInFolder={false}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
        <div className="flex-1 pb-40">
          {selectedNoteId && (
            <div className="mx-auto md:max-w-3xl lg:max-w-4xl">
              <NotionToolbar
                title={notes.find(note => note.id === selectedNoteId)?.name || "Untitled"}
                onTitleChange={(title) => handleTitleChange(selectedNoteId, title)}
                icon={notes.find(note => note.id === selectedNoteId)?.icon}
                onIconChange={(icon) => handleIconChange(selectedNoteId, icon)}
                onIconRemove={() => handleIconRemove(selectedNoteId)}
              />
              <NotionEditor
                initialContent={notes.find(note => note.id === selectedNoteId)?.content || ""}
                onChange={(content) => handleUpdateNoteContent(selectedNoteId, content)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
