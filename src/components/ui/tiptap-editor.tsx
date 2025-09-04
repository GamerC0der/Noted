"use client";

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect, useState, useRef } from 'react';

interface SlashCommand {
  title: string;
  description: string;
  icon: string | React.ReactNode;
  command: (editor: Editor) => void;
}

const slashCommands: SlashCommand[] = [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: 'H1',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: 'H2',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: 'H3',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'List',
    description: 'Create a bullet list',
    icon: '•',
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
];

interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
}

const TiptapEditor = ({ content = "", onChange }: TiptapEditorProps) => {
  const [mounted, setMounted] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [slashCommandIndex, setSlashCommandIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [toolbarPlacement, setToolbarPlacement] = useState({ vertical: 'top', horizontal: 'left' });
  const slashCommandRef = useRef<HTMLDivElement>(null);
  const floatingToolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {},
        orderedList: {},
        listItem: {},
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-400 underline cursor-pointer',
        },
      }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'w-full h-full focus:outline-none prose prose-invert max-w-none',
      },
      handleKeyDown: (view, event) => {
        if (event.key === '/') {
          setShowSlashCommands(true);
          setSlashCommandIndex(0);
          setSearchQuery('');
          return false;
        }
        
        if (showSlashCommands) {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSlashCommandIndex((prev) => 
              prev < slashCommands.length - 1 ? prev + 1 : 0
            );
            return true;
          }
          
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSlashCommandIndex((prev) => 
              prev > 0 ? prev - 1 : slashCommands.length - 1
            );
            return true;
          }
          
          if (event.key === 'Enter') {
            event.preventDefault();
            const selectedCommand = slashCommands[slashCommandIndex];
            if (selectedCommand && editor) {
              selectedCommand.command(editor);
              setShowSlashCommands(false);
              setSearchQuery('');
              const searchLength = searchQuery.length;
              const from = Math.max(0, editor.state.selection.from - 1 - searchLength);
              const to = editor.state.selection.from;
              if (from < to) {
                editor.commands.deleteRange({ from, to });
              }
            }
            return true;
          }
          
          if (event.key === 'Escape') {
            setShowSlashCommands(false);
            setSearchQuery('');
            return true;
          }
          
          if (event.key === 'Backspace') {
            if (searchQuery.length > 0) {
              setSearchQuery(prev => prev.slice(0, -1));
              setSlashCommandIndex(0);
              return true;
            } else {
              setShowSlashCommands(false);
              return false;
            }
          }
          
          if (event.key.length === 1 && event.key !== '/') {
            setSearchQuery(prev => prev + event.key);
            setSlashCommandIndex(0);
            return false;
          }
          
          if (event.key === ' ' || event.key === 'Tab') {
            setShowSlashCommands(false);
            setSearchQuery('');
            return false;
          }
        }
        
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const isEmpty = editor.isEmpty;
      const placeholder = document.querySelector('.tiptap-placeholder') as HTMLElement;
      if (placeholder) {
        placeholder.style.display = isEmpty ? 'block' : 'none';
      }
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getHTML();
      if (currentContent !== content) {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  useEffect(() => {
    if (editor) {
      const isEmpty = editor.isEmpty;
      const placeholder = document.querySelector('.tiptap-placeholder') as HTMLElement;
      if (placeholder) {
        placeholder.style.display = isEmpty ? 'block' : 'none';
      }
    }
  }, [editor]);

  const filteredCommands = slashCommands.filter(command =>
    command.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    command.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (slashCommandRef.current && !slashCommandRef.current.contains(event.target as Node)) {
        setShowSlashCommands(false);
        setSearchQuery('');
      }
      if (floatingToolbarRef.current && !floatingToolbarRef.current.contains(event.target as Node)) {
        setTimeout(() => {
          if (floatingToolbarRef.current && !floatingToolbarRef.current.contains(event.target as Node)) {
            setShowFloatingToolbar(false);
          }
        }, 150);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mounted || !editor) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 flex-1 text-white">
          <p className="text-neutral-500">Start writing your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 flex-1 relative">
        <EditorContent 
          editor={editor} 
          className="w-full h-full text-white"
          onMouseUp={() => {
                        if (editor && !editor.isDestroyed) {
              const { from, to } = editor.state.selection;
              if (from !== to) {
                const coords = editor.view.coordsAtPos(from);
                const containerRect = editor.view.dom.closest('.bg-neutral-900')?.getBoundingClientRect();

                const toolbarWidth = 200;
                const toolbarHeight = 40;

                let x = coords.left - (containerRect?.left || 0);
                let y = coords.top - (containerRect?.top || 0) - 40;
                let vertical = 'top';
                let horizontal = 'left';

                const containerWidth = containerRect?.width || window.innerWidth;

                if (x + toolbarWidth > containerWidth) {
                  x = x - toolbarWidth + 20; 
                  horizontal = 'right';
                }

                if (x < 0) {
                  x = 10;
                }

                if (y - toolbarHeight < 0) {
                  y = coords.top - (containerRect?.top || 0) + 20;
                  vertical = 'bottom';
                }

                setToolbarPosition({ x, y });
                setToolbarPlacement({ vertical, horizontal });
                setShowFloatingToolbar(true);
              } else {
                setShowFloatingToolbar(false);
              }
            }
          }}
        />
        <div className="tiptap-placeholder absolute top-6 left-6 text-neutral-500 pointer-events-none">
          Type &ldquo;/&rdquo; for commands...
        </div>
        
        {showSlashCommands && (
          <div
            ref={slashCommandRef}
            className="absolute top-20 left-6 bg-neutral-900 border border-neutral-800 rounded-md shadow-2xl z-50 min-w-72 backdrop-blur-sm"
          >
            <div className="p-3 border-b border-neutral-800">
              <p className="text-sm font-semibold text-white">Commands</p>
            </div>
            {searchQuery && (
              <div className="p-2 border-b border-neutral-800 bg-neutral-800/50">
                <p className="text-xs text-neutral-400 px-2">/{searchQuery}</p>
              </div>
            )}
            {filteredCommands.length > 0 ? (
              <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-neutral-800 scrollbar-thumb-neutral-600 hover:scrollbar-thumb-neutral-500">
                {filteredCommands.map((command, index) => (
                  <button
                    key={command.title}
                    onClick={() => {
                      if (editor) {
                        command.command(editor);
                        setShowSlashCommands(false);
                        setSearchQuery('');
                        const searchLength = searchQuery.length;
                        const from = Math.max(0, editor.state.selection.from - 1 - searchLength);
                        const to = editor.state.selection.from;
                        if (from < to) {
                          editor.commands.deleteRange({ from, to });
                        }
                      }
                    }}
                    className={`w-full p-3 text-left hover:bg-neutral-800/80 transition-all duration-150 flex items-center gap-3 group ${
                      index === slashCommandIndex ? 'bg-neutral-800/80 ring-1 ring-neutral-600' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 bg-neutral-800 border border-neutral-600 rounded-lg flex items-center justify-center text-sm font-medium text-neutral-300 transition-all duration-150 ${
                      index === slashCommandIndex ? 'bg-neutral-700 border-neutral-500' : 'group-hover:bg-neutral-700'
                    }`}>
                      {command.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{command.title}</div>
                      <div className="text-xs text-neutral-400 truncate">{command.description}</div>
                    </div>
                    {index === slashCommandIndex && (
                      <div className="w-1 h-1 bg-white rounded-full opacity-60"></div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-neutral-400">
                <p className="text-xs">No commands found</p>
                <p className="text-xs text-neutral-500 mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        )}
        
        {showFloatingToolbar && (
          <div
            ref={floatingToolbarRef}
            className="absolute bg-neutral-900 border border-neutral-800 rounded-md shadow-2xl z-50 flex items-center gap-1 p-1"
            style={{
              left: toolbarPosition.x,
              top: toolbarPosition.y,
              transform: toolbarPlacement.vertical === 'top' ? 'translateY(-95%)' : 'translateY(5%)',
            }}
          >
            <button
              onClick={() => {
                editor?.chain().focus().toggleBold().run();
                setShowFloatingToolbar(false);
              }}
              className={`p-2 rounded hover:bg-neutral-800 transition-colors ${
                editor?.isActive('bold') ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white'
              }`}
              title="Bold"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.6 11.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 7.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
              </svg>
            </button>
            
            <button
              onClick={() => {
                editor?.chain().focus().toggleItalic().run();
                setShowFloatingToolbar(false);
              }}
              className={`p-2 rounded hover:bg-neutral-800 transition-colors ${
                editor?.isActive('italic') ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white'
              }`}
              title="Italic"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z"/>
              </svg>
            </button>
            
            <div className="w-px h-6 bg-neutral-700"></div>

            <button
              onClick={() => {
                editor?.chain().focus().toggleHeading({ level: 1 }).run();
                setShowFloatingToolbar(false);
              }}
              className={`relative p-2 rounded hover:bg-neutral-800 transition-colors ${
                editor?.isActive('heading', { level: 1 }) ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white'
              }`}
              title="Heading 1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 4v3h5.5v12h3V7H19V4z"/>
              </svg>
              <span className="absolute -top-1 -right-1 bg-neutral-900 text-neutral-300 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center border border-neutral-700">
                1
              </span>
            </button>

            <button
              onClick={() => {
                editor?.chain().focus().toggleHeading({ level: 2 }).run();
                setShowFloatingToolbar(false);
              }}
              className={`relative p-2 rounded hover:bg-neutral-800 transition-colors ${
                editor?.isActive('heading', { level: 2 }) ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white'
              }`}
              title="Heading 2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 4v3h5.5v12h3V7H19V4z"/>
              </svg>
              <span className="absolute -top-1 -right-1 bg-neutral-900 text-neutral-300 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center border border-neutral-700">
                2
              </span>
            </button>

            <button
              onClick={() => {
                editor?.chain().focus().toggleHeading({ level: 3 }).run();
                setShowFloatingToolbar(false);
              }}
              className={`relative p-2 rounded hover:bg-neutral-800 transition-colors ${
                editor?.isActive('heading', { level: 3 }) ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white'
              }`}
              title="Heading 3"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 4v3h5.5v12h3V7H19V4z"/>
              </svg>
              <span className="absolute -top-1 -right-1 bg-neutral-900 text-neutral-300 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center border border-neutral-700">
                3
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TiptapEditor;
