"use client";

import { FileText, ImagePlus, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import { MediaThumb } from "@/components/common/display";
import { useBoolean } from "@/hooks/use-boolean";
import { acceptOf, isPdf, rejectionOf } from "@/lib/attachment";
import { cn } from "@/lib/utils";
import type { AttachmentAccept, AttachmentValue } from "@/types/attachment";

import { Button } from "./button";

interface PropTypes {
  id: string;
  label: string;
  isLabelVisible?: boolean;
  value: readonly AttachmentValue[];
  onValueChange: (value: AttachmentValue[]) => void;
  max: number;
  accept: AttachmentAccept;
  isWebsiteToggle?: boolean;
  addLabel?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

const FORMAT_LABEL: Record<AttachmentAccept, string> = {
  image: "JPG atau PNG, maks. 10 MB",
  "image-pdf": "JPG, PNG, atau PDF, maks. 10 MB",
};

export const AttachmentField = (props: PropTypes) => {
  const {
    id,
    label,
    isLabelVisible = true,
    value,
    onValueChange,
    max,
    accept,
    isWebsiteToggle = false,
    addLabel = max === 1 ? "Pilih foto" : "Tambah berkas",
    hint,
    error,
    disabled = false,
  } = props;

  const inputRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const objectUrls = useRef(new Set<string>());
  const dragDepth = useRef(0);
  const [rejection, setRejection] = useState<string | null>(null);
  const isDragging = useBoolean();

  const isSingle = max === 1;
  const isFull = !isSingle && value.length >= max;
  const message = error ?? rejection ?? hint;
  const isAlert = Boolean(error ?? rejection);
  const messageId = message ? `${id}-${isAlert ? "error" : "hint"}` : undefined;

  const toValue = (file: File): AttachmentValue => {
    const url = URL.createObjectURL(file);
    objectUrls.current.add(url);

    return {
      key: crypto.randomUUID(),
      name: file.name,
      mimeType: file.type,
      url,
      showOnWebsite: false,
      file,
    };
  };

  const release = (item: AttachmentValue) => {
    if (!objectUrls.current.has(item.url)) return;
    URL.revokeObjectURL(item.url);
    objectUrls.current.delete(item.url);
  };

  const onAddFiles = (files: File[]) => {
    const room = isSingle ? 1 : max - value.length;
    const added: AttachmentValue[] = [];
    let firstRejection: string | null = null;

    for (const file of files) {
      const reason =
        rejectionOf(file, accept) ??
        (added.length >= room ? `Maksimal ${max} berkas` : null);

      if (reason) firstRejection ??= reason;
      else added.push(toValue(file));
    }

    setRejection(firstRejection);
    if (added.length === 0) return;

    if (isSingle) value.forEach(release);
    onValueChange(isSingle ? added : [...value, ...added]);
  };

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    event.target.value = "";
    onAddFiles(files);
  };

  const isFileDrag = (event: DragEvent) =>
    !disabled && event.dataTransfer.types.includes("Files");

  const onDragEnter = (event: DragEvent) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    dragDepth.current += 1;
    isDragging.onTrue();
  };

  const onDragOver = (event: DragEvent) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = isFull ? "none" : "copy";
  };

  const onDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) isDragging.onFalse();
  };

  const onDrop = (event: DragEvent) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    dragDepth.current = 0;
    isDragging.onFalse();
    if (isFull) {
      setRejection(`Maksimal ${max} berkas`);
      return;
    }
    onAddFiles(Array.from(event.dataTransfer.files));
  };

  const onRemove = (item: AttachmentValue) => {
    release(item);
    setRejection(null);
    onValueChange(value.filter((entry) => entry.key !== item.key));
    addRef.current?.focus();
  };

  const onToggleWebsite = (item: AttachmentValue) =>
    onValueChange(
      value.map((entry) =>
        entry.key === item.key
          ? { ...entry, showOnWebsite: !entry.showOnWebsite }
          : entry,
      ),
    );

  useEffect(() => {
    const urls = objectUrls.current;

    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  return (
    <div
      className="@container"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <fieldset aria-describedby={messageId} disabled={disabled}>
        <legend
          className={cn(
            "mb-1.5 text-body font-medium",
            !isLabelVisible && "sr-only",
          )}
        >
          {label}
        </legend>

        <input
          ref={inputRef}
          type="file"
          hidden
          tabIndex={-1}
          accept={acceptOf(accept)}
          multiple={!isSingle}
          onChange={onPick}
        />

        {isSingle && value[0] ? (
          <div
            className={cn(
              "flex max-w-96 flex-col gap-2 rounded-control",
              isDragging.value && "ring-primary ring-2 ring-offset-2",
            )}
          >
            <MediaThumb
              src={value[0].url}
              alt={value[0].name}
              size="fill"
              ratio="video"
              fit="contain"
            />
            <Button
              ref={addRef}
              id={id}
              type="button"
              variant="outline"
              className="w-fit cursor-pointer disabled:cursor-not-allowed"
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus aria-hidden />
              Ganti foto
            </Button>
          </div>
        ) : (
          <ul
            className={cn(
              "grid gap-2",
              isSingle
                ? "max-w-96 grid-cols-1"
                : "grid-cols-2 @min-[26rem]:grid-cols-3 @min-[34rem]:grid-cols-4 @min-[44rem]:grid-cols-5",
            )}
          >
            {value.map((item, index) => (
              <li key={item.key} className="flex min-w-0 flex-col gap-1">
                <div className="relative">
                  {isPdf(item.mimeType) ? (
                    <span className="border-border bg-card text-muted-foreground flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-control border">
                      <FileText aria-hidden className="size-6" />
                      <span className="text-caption font-medium">PDF</span>
                    </span>
                  ) : (
                    <MediaThumb src={item.url} alt={item.name} size="fill" />
                  )}
                  <Button
                    id={isFull && index === 0 ? id : undefined}
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`Hapus ${item.name}`}
                    className="bg-card/90 hover:bg-destructive/10 hover:text-destructive absolute top-1 right-1 cursor-pointer disabled:cursor-not-allowed"
                    onClick={() => onRemove(item)}
                  >
                    <X aria-hidden />
                  </Button>
                </div>
                <p className="truncate text-caption" title={item.name}>
                  {item.name}
                </p>
                {isWebsiteToggle ? (
                  <label className={TOGGLE}>
                    <input
                      type="checkbox"
                      checked={item.showOnWebsite}
                      onChange={() => onToggleWebsite(item)}
                      className="accent-primary size-4 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="truncate">
                      Tampil di website
                      <span className="sr-only">: {item.name}</span>
                    </span>
                  </label>
                ) : null}
              </li>
            ))}

            {isFull ? null : (
              <li>
                <button
                  ref={addRef}
                  id={id}
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    ADD,
                    isSingle ? "aspect-video" : "aspect-square",
                    isAlert && "border-destructive",
                    isDragging.value &&
                      "border-primary bg-primary/5 text-primary",
                  )}
                >
                  <ImagePlus aria-hidden className="size-5" />
                  <span className="text-body font-medium text-foreground">
                    {addLabel}
                  </span>
                  <span className="text-caption">{FORMAT_LABEL[accept]}</span>
                  <span className="text-caption">
                    {isDragging.value
                      ? "Lepaskan untuk menambah"
                      : "atau seret ke sini"}
                  </span>
                </button>
              </li>
            )}
          </ul>
        )}
      </fieldset>

      {isWebsiteToggle ? (
        <p className="text-muted-foreground mt-1.5 text-caption">
          Berkas bersifat privat sampai &ldquo;Tampil di website&rdquo;
          dicentang. Pastikan ada izin dari orang di foto, terutama anak-anak
          (UU PDP).
        </p>
      ) : null}

      {message ? (
        <p
          id={messageId}
          role={rejection && !error ? "alert" : undefined}
          className={cn(
            "mt-1.5 text-caption",
            isAlert ? "text-destructive text-body" : "text-muted-foreground",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
};

const ADD =
  "border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-control border border-dashed bg-card/60 p-2 text-center outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50";

const TOGGLE =
  "has-focus-visible:ring-ring flex min-h-9 cursor-pointer items-center gap-2 rounded-control text-body select-none has-focus-visible:ring-2 has-disabled:cursor-not-allowed has-disabled:opacity-50";
