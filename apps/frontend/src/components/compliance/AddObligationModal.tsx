"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import type { AddObligationPayload } from "@/lib/compliance/api";

const CATEGORIES = ["Fiscal", "Juridique", "Social", "Autre"] as const;

const addObligationSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (AAAA-MM-JJ)"),
  category: z.enum(CATEGORIES),
});

type AddObligationForm = z.infer<typeof addObligationSchema>;

interface AddObligationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: AddObligationPayload) => Promise<void>;
}

export function AddObligationModal({ open, onClose, onSubmit }: AddObligationModalProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddObligationForm>({
    resolver: zodResolver(addObligationSchema),
    defaultValues: {
      title: "",
      description: "",
      due_date: "",
      category: "Fiscal",
    },
  });

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  const handleClose = () => {
    reset();
    setSubmitError(null);
    onClose();
  };

  const onFormSubmit = async (values: AddObligationForm) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: values.title,
        description: values.description || undefined,
        due_date: values.due_date,
        category: values.category,
      });
      reset();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur lors de l'ajout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="w-full max-w-lg rounded-xl border p-0 shadow-[var(--shadow-card)] backdrop:bg-black/40"
      style={{
        borderColor: "var(--surface-mist)",
        background: "var(--surface-page)",
      }}
      aria-labelledby="add-obligation-title"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <h2
            id="add-obligation-title"
            className="text-xl"
            style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
          >
            Nouvelle obligation
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 transition-colors hover:bg-[var(--surface-mist)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="obligation-title" className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
              Titre <span aria-hidden="true">*</span>
            </label>
            <input
              id="obligation-title"
              type="text"
              {...register("title")}
              className="w-full rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
              style={{ borderColor: "var(--surface-mist-strong)", background: "white" }}
            />
            {errors.title && (
              <p className="mt-1 text-xs" style={{ color: "var(--status-red)" }} role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="obligation-description" className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
              Description
            </label>
            <textarea
              id="obligation-description"
              rows={3}
              {...register("description")}
              className="w-full rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
              style={{ borderColor: "var(--surface-mist-strong)", background: "white" }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="obligation-due-date" className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Échéance <span aria-hidden="true">*</span>
              </label>
              <input
                id="obligation-due-date"
                type="date"
                {...register("due_date")}
                className="w-full rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                style={{ borderColor: "var(--surface-mist-strong)", background: "white" }}
              />
              {errors.due_date && (
                <p className="mt-1 text-xs" style={{ color: "var(--status-red)" }} role="alert">
                  {errors.due_date.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="obligation-category" className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Catégorie
              </label>
              <select
                id="obligation-category"
                {...register("category")}
                className="w-full rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                style={{ borderColor: "var(--surface-mist-strong)", background: "white" }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {submitError && (
          <p className="mt-4 text-sm rounded-lg px-3 py-2" style={{ background: "var(--status-red-bg)", color: "var(--status-red)" }} role="alert">
            {submitError}
          </p>
        )}

        <div className="mt-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
            style={{ borderColor: "var(--surface-mist-strong)", color: "var(--text-secondary)" }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-60"
            style={{ background: "var(--brand-primary)", color: "var(--surface-page)" }}
          >
            {isSubmitting ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
