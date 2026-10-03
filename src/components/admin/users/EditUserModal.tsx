import React, { useState, useEffect, useRef } from "react";

import type { ManagedUser, UserRole } from "../../../lib/types";

interface EditUserModalProps {
  user: ManagedUser;
  onClose: () => void;
  onSave: (userId: string, newRole: UserRole) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  onClose,
  onSave,
}) => {
  const [role, setRole] = useState<UserRole>(user.app_role);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl"
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="mb-4 text-xl font-bold text-primary">
          Modifică Rol pentru {user.email}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="role"
              className="mb-1 block text-sm font-medium text-muted"
            >
              Rol
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="input-shell w-full p-2"
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
              className="rounded-md bg-[var(--color-surface-muted)] px-4 py-2 text-text transition hover:bg-[var(--color-border)]"
            >
              Anulează
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-on-primary transition hover:bg-primary-hover"
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
