import React, { useRef, useState } from "react";
import { FaCamera } from "react-icons/fa";
import {
  FALLBACK_AVATAR_URL,
  AVATAR_MAX_FILE_SIZE_BYTES,
  AVATAR_ALLOWED_MIME_TYPES,
} from "../../lib/avatar";

interface Props {
  avatarUrl: string | null;
  onUploaded: (newAvatarUrl: string) => void;
}

const AvatarUploader: React.FC<Props> = ({ avatarUrl, onUploaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    if (!AVATAR_ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMessage("Format neacceptat. Folosește JPG, PNG sau WEBP.");
      return;
    }

    if (file.size > AVATAR_MAX_FILE_SIZE_BYTES) {
      setErrorMessage("Fișierul depășește limita de 5MB.");
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(localPreviewUrl);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/profile/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Eroare la încărcarea imaginii.");
      }

      onUploaded(data.avatar_url);
    } catch (err) {
      console.error("Eroare upload avatar:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "A apărut o eroare necunoscută.",
      );
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(localPreviewUrl);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const displaySrc = previewUrl || avatarUrl || FALLBACK_AVATAR_URL;

  return (
    <div className="mb-6">
      <div className="relative w-32 h-32 mx-auto">
        <img
          src={displaySrc}
          alt="Avatar utilizator"
          className="h-32 w-32 rounded-full border-4 border-primary object-cover shadow-lg"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src !== FALLBACK_AVATAR_URL) {
              img.src = FALLBACK_AVATAR_URL;
            }
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          aria-label="Schimbă poza de profil"
          className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-on-primary shadow-md transition hover:bg-primary-hover disabled:opacity-50"
        >
          <FaCamera size={14} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={AVATAR_ALLOWED_MIME_TYPES.join(",")}
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>

      {isUploading && (
        <p className="mt-2 text-center text-xs text-muted">Se încarcă...</p>
      )}
      {errorMessage && (
        <p className="mt-2 text-center text-xs text-error">{errorMessage}</p>
      )}
    </div>
  );
};

export default AvatarUploader;
