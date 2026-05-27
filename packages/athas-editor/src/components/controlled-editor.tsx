import {
  memo,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEventHandler,
  type TextareaHTMLAttributes,
} from "react";
import { EDITOR_CONSTANTS } from "@athas/editor-core";
import { calculateLineNumberWidth } from "../utils/gutter";
import { calculateLineHeight, splitLines } from "../utils/lines";

export interface ControlledEditorSelection {
  start: number;
  end: number;
  direction: "forward" | "backward" | "none";
}

export interface ControlledEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSelectionChange?: (selection: ControlledEditorSelection) => void;
  id?: string;
  name?: string;
  ariaLabel?: string;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  spellCheck?: boolean;
  showLineNumbers?: boolean;
  lineNumberStart?: number;
  tabSize?: number;
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  className?: string;
  style?: CSSProperties;
  textareaProps?: Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    | "autoFocus"
    | "className"
    | "disabled"
    | "id"
    | "name"
    | "onChange"
    | "placeholder"
    | "readOnly"
    | "spellCheck"
    | "style"
    | "value"
  >;
}

function normalizeSelectionDirection(
  direction: HTMLTextAreaElement["selectionDirection"],
): ControlledEditorSelection["direction"] {
  return direction === "forward" || direction === "backward" ? direction : "none";
}

function ControlledEditorComponent({
  value,
  onChange,
  onSelectionChange,
  id,
  name,
  ariaLabel = "Code editor",
  placeholder,
  readOnly = false,
  disabled = false,
  autoFocus = false,
  spellCheck = false,
  showLineNumbers = true,
  lineNumberStart = 1,
  tabSize = 2,
  fontSize = 13,
  fontFamily = "var(--athas-editor-font-family, ui-monospace, SFMono-Regular, Menlo, monospace)",
  lineHeight = EDITOR_CONSTANTS.LINE_HEIGHT_MULTIPLIER,
  className,
  style,
  textareaProps,
}: ControlledEditorProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const lines = useMemo(() => splitLines(value), [value]);
  const lineHeightPx = calculateLineHeight(fontSize, lineHeight);
  const gutterWidth = showLineNumbers ? calculateLineNumberWidth(lines.length) : 0;

  useLayoutEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  const emitSelectionChange = useCallback(() => {
    if (!onSelectionChange || !textareaRef.current) return;

    const textarea = textareaRef.current;
    onSelectionChange({
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
      direction: normalizeSelectionDirection(textarea.selectionDirection),
    });
  }, [onSelectionChange]);

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    textareaProps?.onKeyDown?.(event);
    if (event.defaultPrevented || readOnly || disabled) return;

    if (event.key !== "Tab") return;

    event.preventDefault();
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const indentation = " ".repeat(Math.max(1, tabSize));
    const nextValue = `${value.slice(0, start)}${indentation}${value.slice(end)}`;
    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.selectionStart = start + indentation.length;
      textarea.selectionEnd = start + indentation.length;
      emitSelectionChange();
    });
  };

  const editorStyle: CSSProperties = {
    position: "relative",
    display: "grid",
    gridTemplateColumns: showLineNumbers ? `${gutterWidth}px minmax(0, 1fr)` : "minmax(0, 1fr)",
    minHeight: 180,
    overflow: "hidden",
    border: "1px solid var(--athas-editor-border, color-mix(in srgb, CanvasText 16%, transparent))",
    borderRadius: 6,
    background: "var(--athas-editor-bg, Canvas)",
    color: "var(--athas-editor-fg, CanvasText)",
    fontFamily,
    fontSize,
    lineHeight: `${lineHeightPx}px`,
    ...style,
  };

  const gutterStyle: CSSProperties = {
    position: "relative",
    overflow: "hidden",
    minHeight: "100%",
    paddingTop: EDITOR_CONSTANTS.EDITOR_PADDING_TOP,
    paddingBottom: EDITOR_CONSTANTS.EDITOR_PADDING_BOTTOM,
    userSelect: "none",
    borderRight:
      "1px solid var(--athas-editor-gutter-border, color-mix(in srgb, CanvasText 10%, transparent))",
    color: "var(--athas-editor-gutter-fg, color-mix(in srgb, CanvasText 48%, transparent))",
    background: "var(--athas-editor-gutter-bg, color-mix(in srgb, CanvasText 3%, transparent))",
  };

  const textareaStyle: CSSProperties = {
    display: "block",
    width: "100%",
    minHeight: 180,
    height: "100%",
    resize: "none",
    border: 0,
    outline: "none",
    paddingTop: EDITOR_CONSTANTS.EDITOR_PADDING_TOP,
    paddingRight: EDITOR_CONSTANTS.EDITOR_PADDING_RIGHT,
    paddingBottom: EDITOR_CONSTANTS.EDITOR_PADDING_BOTTOM,
    paddingLeft: EDITOR_CONSTANTS.EDITOR_PADDING_LEFT,
    overflow: "auto",
    background: "transparent",
    color: "inherit",
    font: "inherit",
    lineHeight: "inherit",
    tabSize,
    whiteSpace: "pre",
  };

  return (
    <div className={className} style={editorStyle} data-athas-controlled-editor>
      {showLineNumbers && (
        <div aria-hidden="true" style={gutterStyle}>
          <div
            style={{
              transform: `translateY(${-scrollTop}px)`,
              willChange: "transform",
            }}
          >
            {lines.map((_line, index) => (
              <div
                key={index}
                style={{
                  height: lineHeightPx,
                  paddingRight: 8,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {lineNumberStart + index}
              </div>
            ))}
          </div>
        </div>
      )}
      <textarea
        {...textareaProps}
        ref={textareaRef}
        id={textareaId}
        name={name}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled}
        spellCheck={spellCheck}
        aria-label={ariaLabel}
        style={textareaStyle}
        onChange={(event) => onChange(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onSelect={emitSelectionChange}
        onClick={emitSelectionChange}
        onKeyUp={emitSelectionChange}
        onScroll={(event) => {
          textareaProps?.onScroll?.(event);
          setScrollTop(event.currentTarget.scrollTop);
        }}
      />
    </div>
  );
}

ControlledEditorComponent.displayName = "ControlledEditor";

export const ControlledEditor = memo(ControlledEditorComponent);
