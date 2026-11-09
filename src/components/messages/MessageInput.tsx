"use client"

import * as React from "react"
import Image from "next/image"
import { Send, Image as ImageIcon, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type MessageInputProps = {
  onSendMessage: (content: string, photoFile: File | null) => Promise<boolean>
  dict: Dictionary
}

export function MessageInput({ onSendMessage, dict }: MessageInputProps) {
  const [content, setContent] = React.useState("")
  const [selectedPhoto, setSelectedPhoto] = React.useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null)
  const [isSending, setIsSending] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedPhoto(file)
      const previewUrl = URL.createObjectURL(file)
      setPhotoPreview(previewUrl)
    }
  }

  const handleRemovePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
    }
    setSelectedPhoto(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if ((!content.trim() && !selectedPhoto) || isSending) return

    setIsSending(true)
    const success = await onSendMessage(content.trim(), selectedPhoto)
    if (success) {
      setContent("")
      handleRemovePhoto()
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
    setIsSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    // Auto-resize textarea to fit text up to max height
    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border bg-card p-3 space-y-2"
    >
      {/* Selected photo preview strip before sending */}
      {photoPreview && (
        <div className="relative inline-flex items-center gap-2 p-1.5 rounded-xl border border-border bg-muted/60">
          <div className="relative size-14 rounded-lg overflow-hidden bg-background">
            <Image
              src={photoPreview}
              alt="Attachment preview"
              fill
              className="object-cover"
            />
          </div>
          <div className="text-xs text-muted-foreground pr-2 min-w-0 max-w-40">
            <p className="truncate font-medium text-foreground">
              {selectedPhoto?.name}
            </p>
            <p className="text-xs opacity-75">
              {selectedPhoto ? `${(selectedPhoto.size / 1024).toFixed(0)} KB` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemovePhoto}
            className="flex size-6 items-center justify-center rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/30 text-foreground transition-colors"
            title={dict.messages?.removePhoto ?? "Remove photo"}
            aria-label={dict.messages?.removePhoto ?? "Remove photo"}
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handlePhotoSelect}
          className="hidden"
          id="chat-photo-input"
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="size-10 rounded-xl border-border text-muted-foreground hover:text-foreground shrink-0 p-0"
          title={dict.messages?.attachPhoto ?? "Attach photo"}
          aria-label={dict.messages?.attachPhoto ?? "Attach photo"}
        >
          <ImageIcon className="size-5" />
        </Button>

        <div className="flex-1 relative rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={dict.messages?.typeMessage ?? "Type a message..."}
            className="w-full resize-none bg-transparent px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden min-h-10 max-h-30 leading-snug"
          />
        </div>

        <Button
          type="submit"
          disabled={(!content.trim() && !selectedPhoto) || isSending}
          className="size-10 rounded-xl bg-primary text-primary-foreground font-semibold shrink-0 p-0 shadow-xs"
          title={dict.messages?.send ?? "Send"}
          aria-label={dict.messages?.send ?? "Send"}
        >
          {isSending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </form>
  )
}
