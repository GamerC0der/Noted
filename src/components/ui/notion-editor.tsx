"use client";

import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { createAIExtension, AIMenuController, AIToolbarButton } from "@blocknote/xl-ai";
import { FormattingToolbarController, FormattingToolbar, BlockTypeSelect, BasicTextStyleButton, TextAlignButton, ColorStyleButton, NestBlockButton, UnnestBlockButton, CreateLinkButton } from "@blocknote/react";
import { en } from "@blocknote/core/locales";
import { en as aiEn } from "@blocknote/xl-ai/locales";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import "@blocknote/core/style.css";
import "@blocknote/mantine/style.css";
import "@blocknote/xl-ai/style.css";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

const provider = createOpenAICompatible({
  name: "hackclub-ai",
  baseURL: "https://ai.hackclub.com/chat/completions",
});

const model = provider("meta-llama/llama-4-maverick");

const customStyles = `
  .bn-container {
    background-color: black !important;
  }
  .bn-editor {
    background-color: black !important;
  }
  .bn-content {
    background-color: black !important;
  }
  
  .bn-slash-menu {
    scrollbar-width: thin !important;
    scrollbar-color: #4a4a4a #1a1a1a !important;
  }
  
  .bn-slash-menu::-webkit-scrollbar {
    width: 10px !important;
  }
  
  .bn-slash-menu::-webkit-scrollbar-track {
    background: #1a1a1a !important;
    border-radius: 6px !important;
    margin: 4px 0 !important;
  }
  
  .bn-slash-menu::-webkit-scrollbar-thumb {
    background: #4a4a4a !important;
    border-radius: 6px !important;
    border: 1px solid #2a2a2a !important;
  }
  
  .bn-slash-menu::-webkit-scrollbar-thumb:hover {
    background: #5a5a5a !important;
    border-color: #3a3a3a !important;
  }
  
  .bn-menu {
    scrollbar-width: thin !important;
    scrollbar-color: #4a4a4a #1a1a1a !important;
  }
  
  .bn-menu::-webkit-scrollbar {
    width: 10px !important;
  }
  
  .bn-menu::-webkit-scrollbar-track {
    background: #1a1a1a !important;
    border-radius: 6px !important;
    margin: 4px 0 !important;
  }
  
  .bn-menu::-webkit-scrollbar-thumb {
    background: #4a4a4a !important;
    border-radius: 6px !important;
    border: 1px solid #2a2a2a !important;
  }
  
  .bn-menu::-webkit-scrollbar-thumb:hover {
    background: #5a5a5a !important;
    border-color: #3a3a3a !important;
  }
  
  .bn-slash-menu-item {
    transition: all 0.2s ease !important;
  }
  
  .bn-slash-menu-item:hover {
    background-color: #2a2a2a !important;
  }
`;

interface NotionEditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
}

const NotionEditor = ({ onChange, initialContent, editable = true }: NotionEditorProps) => {
  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: initialContent
      ? (() => {
          try {
            return JSON.parse(initialContent) as PartialBlock[];
          } catch {
            return [
              {
                type: "paragraph",
                content: initialContent.replace(/<[^>]*>/g, ''),
              },
            ];
          }
        })()
      : undefined,
  });

  const handleEditorChange = () => {
    onChange(JSON.stringify(editor.document, null, 2));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="notion-editor bg-black">
            <BlockNoteView
              editable={editable}
              editor={editor}
              theme="dark"
              onChange={handleEditorChange}
              formattingToolbar={false}
            >
              <FormattingToolbarController
                formattingToolbar={() => (
                  <FormattingToolbar>
                    <BlockTypeSelect />
                    <BasicTextStyleButton basicTextStyle="bold" />
                    <BasicTextStyleButton basicTextStyle="italic" />
                    <BasicTextStyleButton basicTextStyle="underline" />
                    <BasicTextStyleButton basicTextStyle="strike" />
                    <BasicTextStyleButton basicTextStyle="code" />
                    <TextAlignButton textAlignment="left" />
                    <TextAlignButton textAlignment="center" />
                    <TextAlignButton textAlignment="right" />
                    <ColorStyleButton />
                    <NestBlockButton />
                    <UnnestBlockButton />
                    <CreateLinkButton />
                  </FormattingToolbar>
                )}
              />
            </BlockNoteView>
          </div>
        </ContextMenuTrigger>
        
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => editor.toggleStyles({ bold: true })}>
            <span className="font-bold">B</span>
            <span className="ml-2">Bold</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => editor.toggleStyles({ italic: true })}>
            <span className="italic">I</span>
            <span className="ml-2">Italic</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => editor.toggleStyles({ underline: true })}>
            <span className="underline">U</span>
            <span className="ml-2">Underline</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => editor.toggleStyles({ strike: true })}>
            <span className="line-through">S</span>
            <span className="ml-2">Strikethrough</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => editor.toggleStyles({ code: true })}>
            <span className="font-mono text-sm">&lt;/&gt;</span>
            <span className="ml-2">Code</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => editor.insertBlocks([{ type: "heading", props: { level: 1 } }], editor.getTextCursorPosition().block, "after")}>
            <span className="text-lg font-bold">H1</span>
            <span className="ml-2">Heading 1</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => editor.insertBlocks([{ type: "heading", props: { level: 2 } }], editor.getTextCursorPosition().block, "after")}>
            <span className="text-base font-bold">H2</span>
            <span className="ml-2">Heading 2</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => editor.insertBlocks([{ type: "heading", props: { level: 3 } }], editor.getTextCursorPosition().block, "after")}>
            <span className="text-sm font-bold">H3</span>
            <span className="ml-2">Heading 3</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
};

export default NotionEditor;
