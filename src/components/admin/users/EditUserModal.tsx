import React, { useState, useEffect, useRef } from "react";

import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

interface DisplayUser extends SupabaseAuthUser {
  app_role?: string;
}
interface EditUserModalProps {
  user: DisplayUser;
  onClose: () => void;
  onSave: (userId: string, newRole: string) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  onClose,
  onSave,
}) => {
  const [role, setRole] = useState(user.app_role);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lock scroll
    document.body.style.overflow = "hidden";

    // Focus modal
    setTimeout(() => {
      modalRef.current?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(user.id, role);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-background p-6 rounded-lg shadow-xl w-full max-w-md"
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-xl font-bold mb-4">
          Modifică Rol pentru {user.email}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="role"
              className="block text-sm font-medium text-text-muted mb-1"
            >
              Rol
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-surface"
            >
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-gray-light"
            >
              Anulează
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-primary text-white"
            >
              Salvează
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
