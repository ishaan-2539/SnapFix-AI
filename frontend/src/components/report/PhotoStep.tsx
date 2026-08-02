import { useCallback, useRef, useState } from "react";
import { Upload, Camera, RotateCw, X, ImageIcon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

const MAX_SIZE_MB = 10;
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

interface PhotoStepProps {
  file: File | null;
  previewUrl: string | null;
  onFileSelected: (file: File, previewUrl: string) => void;
  onClear: () => void;
  onRotate: () => void;
  error: string | null;
}

export function PhotoStep({ file, previewUrl, onFileSelected, onClear, onRotate, error }: PhotoStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = useCallback(
    (f: File) => {
      setLocalError(null);
      if (!ACCEPTED.includes(f.type)) {
        setLocalError("Invalid image format. Only JPEG, PNG, and WEBP images are accepted.");
        return;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        setLocalError(`File size exceeds the ${MAX_SIZE_MB}MB limit. Please upload a smaller photo.`);
        return;
      }
      const url = URL.createObjectURL(f);
      onFileSelected(f, url);
    },
    [onFileSelected]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSet(f);
  };

  const displayError = error || localError;

  if (previewUrl) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-2xl overflow-hidden bg-ink-100 border border-ink-200">
          <img src={previewUrl} alt="Issue preview" className="w-full max-h-[420px] object-contain bg-ink-900/5" />
          <button
            onClick={onClear}
            aria-label="Remove photo"
            className="absolute top-3 right-3 w-9 h-9 bg-white/95 rounded-full shadow-elevated flex items-center justify-center text-ink-700 hover:bg-white"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={onRotate}
            aria-label="Rotate photo"
            className="absolute top-3 left-3 w-9 h-9 bg-white/95 rounded-full shadow-elevated flex items-center justify-center text-ink-700 hover:bg-white"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-start gap-2.5 bg-brand-50 border border-brand-100 rounded-xl p-3.5">
          <AlertTriangle className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <p className="text-xs text-brand-800 leading-relaxed">
            Make sure the issue is clearly visible, in focus, and well-lit. Blurry photos
            are harder for AI analysis to categorize accurately.
          </p>
        </div>
        {file && (
          <p className="text-xs text-ink-400 text-center">
            {file.name} · {(file.size / (1024 * 1024)).toFixed(1)}MB
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`hidden sm:flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl py-16 px-6 transition-colors cursor-pointer ${
          dragActive ? "border-brand-500 bg-brand-50" : "border-ink-300 bg-ink-50 hover:bg-ink-100"
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <div className="w-14 h-14 rounded-2xl bg-white shadow-card flex items-center justify-center">
          <Upload className="w-6 h-6 text-brand-600" />
        </div>
        <p className="font-semibold text-ink-800">Drag & drop a photo here</p>
        <p className="text-sm text-ink-500">or click to browse your files</p>
      </div>

      {/* Mobile: camera + gallery buttons */}
      <div className="sm:hidden grid grid-cols-2 gap-3">
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex flex-col items-center gap-2.5 border-2 border-dashed border-ink-300 bg-ink-50 rounded-2xl py-8"
        >
          <Camera className="w-6 h-6 text-brand-600" />
          <span className="text-sm font-semibold text-ink-800">Camera</span>
        </button>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-2.5 border-2 border-dashed border-ink-300 bg-ink-50 rounded-2xl py-8"
        >
          <ImageIcon className="w-6 h-6 text-brand-600" />
          <span className="text-sm font-semibold text-ink-800">Gallery</span>
        </button>
      </div>

      <div className="hidden sm:flex justify-center">
        <Button variant="outline" onClick={() => inputRef.current?.click()}>
          <Upload className="w-4 h-4" />
          Choose a photo
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) validateAndSet(f);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) validateAndSet(f);
          e.target.value = "";
        }}
      />

      {displayError && (
        <div className="flex items-start gap-2.5 bg-danger-50 border border-danger-100 rounded-xl p-3.5">
          <AlertTriangle className="w-4 h-4 text-danger-600 shrink-0 mt-0.5" />
          <p className="text-xs text-danger-700 leading-relaxed">{displayError}</p>
        </div>
      )}

      <p className="text-xs text-ink-400 text-center">
        Supported formats: JPEG, PNG, WEBP · Maximum file size: {MAX_SIZE_MB}MB
      </p>
    </div>
  );
}
