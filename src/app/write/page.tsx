"use client";

import { Navigation } from "@/components/ui/navigation";
import NotionEditor from "@/components/ui/notion-editor";
import { NotionToolbar } from "@/components/ui/notion-toolbar";
import { BlockNoteViewRaw } from "@blocknote/react";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/react/style.css";
import { Edit, Trash2, Plus, Folder, FolderOpen, ChevronRight, ChevronDown, FileText, GripVertical, Home, Search } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

const NOTES_DB = 'notesDB';
const NOTES_STORE = 'notes';
const FOLDERS_STORE = 'folders';

const FOLDER_COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6B7280',
];

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
  color?: string;
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
      <ContextMenu>
        <ContextMenuTrigger asChild>
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
            <FileText 
              className="h-4 w-4" 
              style={{ 
                color: note.folderId 
                  ? folders.find(f => f.id === note.folderId)?.color || '#3B82F6'
                  : '#3B82F6'
              }} 
            />
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
        </ContextMenuTrigger>
        
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => onSelect(note.id)}>
            <FileText className="mr-2 h-4 w-4" />
            Open Note
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onEditStart(note.id)}>
            <Edit className="mr-2 h-4 w-4" />
            Rename
          </ContextMenuItem>
          {isInFolder && (
            <ContextMenuItem onClick={() => onMoveToFolder(note.id, undefined)}>
              Move to Root
            </ContextMenuItem>
          )}
          {!isInFolder && folders.length > 0 && (
            <ContextMenuItem onClick={() => onMoveToFolder(note.id, folders[0].id)}>
              Move to Folder
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem 
            onClick={() => onDelete(note.id)}
            className="text-red-400 focus:text-red-300"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
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
  onColorChange: (id: number, color: string) => void;
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
  onColorChange,
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
      <ContextMenu>
        <ContextMenuTrigger asChild>
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
                  <FolderOpen className="h-4 w-4" style={{ color: folder.color || '#3B82F6' }} />
                ) : (
                  <Folder className="h-4 w-4" style={{ color: folder.color || '#3B82F6' }} />
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
        </ContextMenuTrigger>
        
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => onToggle(folder.id)}>
            {folder.isExpanded ? (
              <ChevronDown className="mr-2 h-4 w-4" />
            ) : (
              <ChevronRight className="mr-2 h-4 w-4" />
            )}
            {folder.isExpanded ? 'Collapse' : 'Expand'}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onEditStart(folder.id)}>
            <Edit className="mr-2 h-4 w-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuSeparator />
          <div className="px-2 py-1">
            <div className="text-xs text-neutral-400 mb-2">Color:</div>
            <div className="flex flex-wrap gap-1">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onColorChange(folder.id, color)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    folder.color === color ? 'border-white scale-110' : 'border-neutral-600 hover:border-neutral-400'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <ContextMenuSeparator />
          <ContextMenuItem 
            onClick={() => onDelete(folder.id)}
            className="text-red-400 focus:text-red-300"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      
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
  const [currentView, setCurrentView] = useState<'note' | 'home' | 'search'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchSortBy, setSearchSortBy] = useState<'name' | 'date' | 'content'>('name');
  const [username, setUsername] = useState('User');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameEditValue, setUsernameEditValue] = useState('User');

  const getNoteIcon = (note: Note) => {
    if (note.icon && !note.icon.startsWith('📝')) {
      return note.icon;
    }
    const folderColor = note.folderId 
      ? folders.find(f => f.id === note.folderId)?.color || '#3B82F6'
      : '#3B82F6';
    return <FileText className="h-5 w-5" style={{ color: folderColor }} />;
  };

  const NotePreview = ({ content }: { content: string }) => {
    const editor = useCreateBlockNote();
    
    useEffect(() => {
      try {
        const parsedContent = JSON.parse(content);
        editor.replaceBlocks(editor.document, parsedContent);
      } catch {
      }
    }, [content, editor]);

    return (
      <BlockNoteViewRaw 
        editor={editor} 
        editable={false}
        className="prose prose-invert max-w-none"
      />
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(sidebarSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [sidebarSearchQuery]);

  const filteredNotes = useMemo(() => {
    const activeQuery = currentView === 'search' ? debouncedSearchQuery : searchQuery;
    if (!activeQuery) return notes;
    const query = activeQuery.toLowerCase().trim();
    if (!query) return notes;
    
    return notes.filter(note => {
      const nameMatch = note.name.toLowerCase().includes(query);
      const contentMatch = note.content.toLowerCase().includes(query);
      return nameMatch || contentMatch;
    }).sort((a, b) => {
      if (currentView === 'search') {
        if (query) {
          const aNameMatch = a.name.toLowerCase().includes(query);
          const bNameMatch = b.name.toLowerCase().includes(query);
          
          if (aNameMatch && !bNameMatch) return -1;
          if (!aNameMatch && bNameMatch) return 1;
        }
        
        switch (searchSortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'date':
            return b.id - a.id;
          case 'content':
            return b.content.length - a.content.length;
          default:
            return 0;
        }
      }
      return 0;
    });
  }, [notes, currentView, debouncedSearchQuery, searchQuery, searchSortBy]);

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
      
      const savedUsername = localStorage.getItem('noted-username');
      if (savedUsername) {
        setUsername(savedUsername);
        setUsernameEditValue(savedUsername);
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
    setCurrentView('note');
  };

  const handleUsernameEditStart = () => {
    setIsEditingUsername(true);
    setUsernameEditValue(username);
  };

  const handleUsernameEditSave = () => {
    if (usernameEditValue.trim()) {
      setUsername(usernameEditValue.trim());
      localStorage.setItem('noted-username', usernameEditValue.trim());
    }
    setIsEditingUsername(false);
  };

  const handleUsernameEditCancel = () => {
    setUsernameEditValue(username);
    setIsEditingUsername(false);
  };

  const handleUsernameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUsernameEditSave();
    } else if (e.key === 'Escape') {
      handleUsernameEditCancel();
    }
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
    const colorIndex = folders.length % FOLDER_COLORS.length;
    const newFolder = {
      id: nextFolderId,
      name: `Folder ${nextFolderId}`,
      isEditing: false,
      editValue: `Folder ${nextFolderId}`,
      isExpanded: true,
      order: maxOrder + 1,
      color: FOLDER_COLORS[colorIndex]
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

  const handleFolderColorChange = (folderId: number, color: string) => {
    setFolders(folders.map(folder =>
      folder.id === folderId
        ? { ...folder, color }
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

          <ContextMenu>
            <ContextMenuTrigger asChild>
          <div className="px-4 pb-4 overflow-y-auto max-h-[calc(100vh-120px)]">
                <div className="mb-4 space-y-1">
              <button 
                onClick={() => setCurrentView('home')}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center space-x-2 ${
                  currentView === 'home' 
                    ? 'text-white bg-neutral-800' 
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </button>
                  <button 
                    onClick={() => setCurrentView('search')}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center space-x-2 ${
                      currentView === 'search' 
                        ? 'text-white bg-neutral-800' 
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    <Search className="h-4 w-4" />
                    <span>Search</span>
              </button>
            </div>
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
                    onColorChange={handleFolderColorChange}
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
            </ContextMenuTrigger>
            
            <ContextMenuContent className="w-48">
              <ContextMenuItem onClick={handleAddNote}>
                <Plus className="mr-2 h-4 w-4" />
                New Note
              </ContextMenuItem>
              <ContextMenuItem onClick={handleAddFolder}>
                <Folder className="mr-2 h-4 w-4" />
                New Folder
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
        <ContextMenu>
          <ContextMenuTrigger asChild>
        <div className="flex-1 pb-40">
              {currentView === 'search' ? (
                <div className="mx-auto md:max-w-3xl lg:max-w-4xl p-8 mt-[10vh]">
                  <h1 className="text-3xl font-bold text-white mb-6">Search Documents</h1>
                  <div className="mb-8">
                    <input
                      type="text"
                      placeholder="Search through all your notes..."
                      value={sidebarSearchQuery}
                      onChange={(e) => setSidebarSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-600 focus:border-transparent"
                    />
                    {sidebarSearchQuery && (
                      <div className="mt-4 flex items-center space-x-4">
                        <span className="text-sm text-neutral-400">Sort by:</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSearchSortBy('name')}
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                              searchSortBy === 'name'
                                ? 'bg-neutral-700 text-white'
                                : 'bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            Name
                          </button>
                          <button
                            onClick={() => setSearchSortBy('date')}
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                              searchSortBy === 'date'
                                ? 'bg-neutral-700 text-white'
                                : 'bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            Date
                          </button>
                          <button
                            onClick={() => setSearchSortBy('content')}
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                              searchSortBy === 'content'
                                ? 'bg-neutral-700 text-white'
                                : 'bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            Content Length
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {sidebarSearchQuery && filteredNotes.length > 0 ? (
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-neutral-400 text-sm">
                          Found {filteredNotes.length} result{filteredNotes.length !== 1 ? 's' : ''} for "{sidebarSearchQuery}"
                        </p>
                        <button
                          onClick={() => {
                            setSidebarSearchQuery('');
                            setDebouncedSearchQuery('');
                          }}
                          className="text-xs text-neutral-500 hover:text-neutral-300 underline flex items-center space-x-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Clear</span>
                        </button>
                      </div>
                    ) : null}
                    
                    {sidebarSearchQuery && filteredNotes.length > 0 ? (
                      filteredNotes.map((note) => (
                        <ContextMenu key={note.id}>
                          <ContextMenuTrigger asChild>
                            <div 
                              className="p-4 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors cursor-pointer"
                              onClick={() => {
                                setCurrentView('note');
                                setSelectedNoteId(note.id);
                              }}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  {getNoteIcon(note)}
                                  <h3 className="font-medium text-white text-lg">{note.name}</h3>
                                {note.folderId && (
                                  <span 
                                    className="text-xs text-white px-2 py-1 rounded"
                                    style={{ 
                                      backgroundColor: folders.find(f => f.id === note.folderId)?.color || '#3B82F6'
                                    }}
                                  >
                                    In Folder
                                  </span>
                                )}
                                </div>
                                <span className="text-xs text-neutral-500">
                                  {note.content.length} chars
                                </span>
                              </div>
                              <div className="text-sm text-neutral-300 max-h-32 overflow-hidden">
                                <NotePreview content={note.content} />
                              </div>
                            </div>
                          </ContextMenuTrigger>
                          
                          <ContextMenuContent className="w-48">
                            <ContextMenuItem onClick={() => {
                              setCurrentView('note');
                              setSelectedNoteId(note.id);
                            }}>
                              <FileText className="mr-2 h-4 w-4" />
                              Open Note
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem onClick={() => handleEditStart(note.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Rename
                            </ContextMenuItem>
                            {note.folderId && (
                              <ContextMenuItem onClick={() => handleMoveNoteToFolder(note.id, undefined)}>
                                Move to Root
                              </ContextMenuItem>
                            )}
                            {!note.folderId && folders.length > 0 && (
                              <ContextMenuItem onClick={() => handleMoveNoteToFolder(note.id, folders[0].id)}>
                                Move to Folder
                              </ContextMenuItem>
                            )}
                            <ContextMenuSeparator />
                            <ContextMenuItem 
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-red-400 focus:text-red-300"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      ))
                    ) : sidebarSearchQuery ? (
                      <div className="text-center py-12">
                        <p className="text-neutral-400 text-lg">
                          No notes found matching "{sidebarSearchQuery}"
                        </p>
                        <button
                          onClick={() => {
                            setSidebarSearchQuery('');
                            setDebouncedSearchQuery('');
                          }}
                          className="mt-4 text-neutral-300 hover:text-white underline flex items-center space-x-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Clear search</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Search className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
                        <p className="text-neutral-400 text-lg mb-2">
                          Search through all your documents
                        </p>
                        <p className="text-neutral-500 text-sm">
                          Type in the search box above to find notes by name or content
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : currentView === 'home' ? (
            <div className="mx-auto md:max-w-3xl lg:max-w-4xl p-8 mt-[10vh]">
              <h1 className="text-3xl font-bold text-white mb-6">
                Hello, {isEditingUsername ? (
                  <input
                    type="text"
                    value={usernameEditValue}
                    onChange={(e) => setUsernameEditValue(e.target.value)}
                    onBlur={handleUsernameEditSave}
                    onKeyDown={handleUsernameKeyPress}
                    className="bg-transparent border-b border-white outline-none"
                    autoFocus
                  />
                ) : (
                  <span 
                    onDoubleClick={handleUsernameEditStart}
                    className="cursor-pointer hover:text-neutral-300 transition-colors"
                    title="Double-click to edit"
                  >
                    {username}
                  </span>
                )}
              </h1>
              <p className="text-neutral-400 mb-8">Here are your notes:</p>
              
              <div className="mb-8">
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-600 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 mb-8">
                <button
                  onClick={() => {
                    handleAddNote();
                    setCurrentView('note');
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-white transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Note</span>
                </button>
                <button
                  onClick={handleAddFolder}
                  className="flex items-center space-x-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-white transition-colors"
                >
                  <Folder className="h-4 w-4" />
                  <span>New Folder</span>
                </button>
              </div>

              <div className="space-y-4">
                {filteredNotes.length > 0 ? (
                  filteredNotes.map((note) => (
                  <ContextMenu key={note.id}>
                    <ContextMenuTrigger asChild>
                  <div 
                    className="p-4 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors cursor-pointer"
                    onClick={() => {
                      setCurrentView('note');
                      setSelectedNoteId(note.id);
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getNoteIcon(note)}
                        <h3 className="font-medium text-white text-lg">{note.name}</h3>
                        {note.folderId && (
                          <span 
                            className="text-xs text-white px-2 py-1 rounded"
                            style={{ 
                              backgroundColor: folders.find(f => f.id === note.folderId)?.color || '#3B82F6'
                            }}
                          >
                            In Folder
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-neutral-300 max-h-32 overflow-hidden">
                      <NotePreview content={note.content} />
                    </div>
                  </div>
                    </ContextMenuTrigger>
                    
                    <ContextMenuContent className="w-48">
                      <ContextMenuItem onClick={() => {
                        setCurrentView('note');
                        setSelectedNoteId(note.id);
                      }}>
                        <FileText className="mr-2 h-4 w-4" />
                        Open Note
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => handleEditStart(note.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Rename
                      </ContextMenuItem>
                      {note.folderId && (
                        <ContextMenuItem onClick={() => handleMoveNoteToFolder(note.id, undefined)}>
                          Move to Root
                        </ContextMenuItem>
                      )}
                      {!note.folderId && folders.length > 0 && (
                        <ContextMenuItem onClick={() => handleMoveNoteToFolder(note.id, folders[0].id)}>
                          Move to Folder
                        </ContextMenuItem>
                      )}
                      <ContextMenuSeparator />
                      <ContextMenuItem 
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-400 focus:text-red-300"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-neutral-400 text-lg">
                      {searchQuery ? 'No notes found matching your search.' : 'No notes yet.'}
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-4 text-neutral-300 hover:text-white underline"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : selectedNoteId ? (
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
          ) : null}
        </div>
          </ContextMenuTrigger>
          
          <ContextMenuContent className="w-48">
            <ContextMenuItem onClick={() => setCurrentView('home')}>
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </ContextMenuItem>
            <ContextMenuItem onClick={() => setCurrentView('search')}>
              <Search className="mr-2 h-4 w-4" />
              Go to Search
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={handleAddNote}>
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </ContextMenuItem>
            <ContextMenuItem onClick={handleAddFolder}>
              <Folder className="mr-2 h-4 w-4" />
              New Folder
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => {
              setSearchQuery('');
              setSidebarSearchQuery('');
              setDebouncedSearchQuery('');
            }}>
              <Search className="mr-2 h-4 w-4" />
              Clear Search
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </div>
  );
}
