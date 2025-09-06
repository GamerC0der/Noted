"use client";

import { ElementRef, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

interface NotionToolbarProps {
  title: string;
  onTitleChange: (title: string) => void;
  icon?: string;
  onIconChange?: (icon: string) => void;
  onIconRemove?: () => void;
  preview?: boolean;
}

export const NotionToolbar = ({ 
  title, 
  onTitleChange, 
  icon, 
  onIconChange, 
  onIconRemove,
  preview = false 
}: NotionToolbarProps) => {
  const inputRef = useRef<ElementRef<"textarea">>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);

  const enableInput = () => {
    if (preview) return;
    setIsEditing(true);
    setTimeout(() => {
      setValue(title);
      inputRef.current?.focus();
    }, 0);
  };

  const disableInput = () => setIsEditing(false);

  const onInput = (value: string) => {
    setValue(value);
    onTitleChange(value || "Untitled");
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      disableInput();
    }
  };

  return (
    <div className="group relative pl-12">
      <div className="pt-16">
      </div>
      {isEditing && !preview ? (
        <TextareaAutosize
          ref={inputRef}
          spellCheck="false"
          onBlur={disableInput}
          onKeyDown={onKeyDown}
          value={value}
          onChange={(e) => onInput(e.target.value)}
          className="resize-none break-words bg-transparent text-5xl font-bold text-[#3F3F3F] outline-none dark:text-[#CFCFCF]"
        />
      ) : (
        <div
          onClick={enableInput}
          className="break-words pb-[.7188rem] text-5xl font-bold text-[#3F3F3F] outline-none dark:text-[#CFCFCF] cursor-pointer"
        >
          {title}
        </div>
      )}
    </div>
  );
};
