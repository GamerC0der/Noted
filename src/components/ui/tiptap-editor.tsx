"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState } from 'react';

const TiptapEditor = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'w-full h-full focus:outline-none',
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const isEmpty = editor.isEmpty;
      const placeholder = document.querySelector('.tiptap-placeholder');
      if (placeholder) {
        placeholder.style.display = isEmpty ? 'block' : 'none';
      }
    },
  });

  useEffect(() => {
    if (editor) {
      const isEmpty = editor.isEmpty;
      const placeholder = document.querySelector('.tiptap-placeholder');
      if (placeholder) {
        placeholder.style.display = isEmpty ? 'block' : 'none';
      }
    }
  }, [editor]);

  if (!mounted || !editor) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="bg-neutral-800 border border-neutral-700 rounded-t-lg p-3 flex gap-2 flex-shrink-0 mt-16">
          <div className="px-3 py-1 rounded text-sm font-medium text-white">B</div>
          <div className="px-3 py-1 rounded text-sm font-medium text-white">I</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-700 rounded-b-lg p-6 flex-1 text-white">
          <p className="text-neutral-500">Start writing your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-neutral-800 border border-neutral-700 rounded-t-lg p-3 flex gap-2 flex-shrink-0 mt-16">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            editor.isActive('bold')
              ? 'bg-white text-black'
              : 'text-white hover:bg-neutral-700'
          }`}
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            editor.isActive('italic')
              ? 'bg-white text-black'
              : 'text-white hover:bg-neutral-700'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z"/>
          </svg>
        </button>
      </div>
      <div className="bg-neutral-900 border border-neutral-700 rounded-b-lg p-6 flex-1 relative">
        <EditorContent editor={editor} className="w-full h-full text-white" />
        <div className="tiptap-placeholder absolute top-6 left-6 text-neutral-500 pointer-events-none">
          Start writing your notes...
        </div>
      </div>
    </div>
  );
};

export default TiptapEditor;
