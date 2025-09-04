"use client";

import { Navigation } from "@/components/ui/navigation";
import TiptapEditor from "@/components/ui/tiptap-editor";
import { Edit, Trash2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NOTES_DB = 'notesDB';
const NOTES_STORE = 'notes';

interface Note {
  id: number;
  name: string;
  content: string;
  isEditing: boolean;
  editValue: string;
}

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NOTES_DB, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as IDBDatabase);
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest)?.result;
      if (db && !db.objectStoreNames.contains(NOTES_STORE)) {
        db.createObjectStore(NOTES_STORE, { keyPath: 'id' });
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

export default function WritePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [nextId, setNextId] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNotes = async () => {
      const savedNotes = await loadNotesFromDB();
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
          editValue: "Note"
        };
        setNotes([defaultNote]);
        setSelectedNoteId(1);
        setNextId(2);
      }
      setIsLoading(false);
    };
    loadNotes();
  }, []);

  useEffect(() => {
    if (!isLoading && notes.length > 0) {
      saveNotesToDB(notes);
    }
  }, [notes, isLoading]);

  const handleAddNote = () => {
    const newNote = {
      id: nextId,
      name: `Note ${nextId}`,
      content: "",
      isEditing: false,
      editValue: `Note ${nextId}`
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
          editValue: "Note"
        };
        setNotes([newNote]);
        setSelectedNoteId(newNote.id);
        setNextId(nextId + 1);
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
            <button
              onClick={handleAddNote}
              className="p-2 rounded-md hover:bg-neutral-800 transition-colors"
            >
              <Plus className="h-5 w-5 text-neutral-400 hover:text-white hover:rotate-[360deg] transition-transform duration-500 ease-out" />
            </button>
          </div>

          <div className="px-4 pb-4">
            <h2 className="text-neutral-400 text-sm font-medium mb-3 uppercase tracking-wide">Notes</h2>
            <div className="space-y-1">
              {notes.map((note) => (
                <div key={note.id} className="relative">
                  {note.isEditing ? (
                    <div className="flex items-center space-x-2 px-3 py-2">
                      <input
                        type="text"
                        value={note.editValue}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setNotes(notes.map(n =>
                            n.id === note.id ? { ...n, editValue: newValue } : n
                          ));
                        }}
                        className="flex-1 bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-neutral-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave(note.id);
                          if (e.key === 'Escape') handleEditCancel(note.id);
                        }}
                      />
                      <button
                        onClick={() => handleEditSave(note.id)}
                        className="p-1 rounded hover:bg-neutral-700 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditCancel(note.id)}
                        className="p-1 rounded hover:bg-neutral-700 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <DropdownMenu>
                      <div
                        className={`flex items-center justify-between text-neutral-300 text-sm px-3 py-2 rounded-md transition-colors group cursor-pointer ${
                          selectedNoteId === note.id
                            ? 'bg-neutral-700 text-white'
                            : 'hover:bg-neutral-800'
                        }`}
                        onClick={() => handleSelectNote(note.id)}
                      >
                        <span>{note.name}</span>
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
                            handleEditStart(note.id);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-neutral-300 hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 pt-3 px-8 pb-8">
          {selectedNoteId && (
            <TiptapEditor
              content={notes.find(note => note.id === selectedNoteId)?.content || ""}
              onChange={(content) => handleUpdateNoteContent(selectedNoteId, content)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
