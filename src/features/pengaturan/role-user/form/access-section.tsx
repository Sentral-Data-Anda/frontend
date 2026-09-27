"use client";

import { useWatch, type FieldError } from "react-hook-form";

import { Button } from "@/components/common/control";
import { FormAlert, FormSection, FormWide } from "@/components/common/form";
import { useIsTableWidth } from "@/hooks/use-media";
import type { MenuNode } from "@/types/menu";

import type { Access } from "../model";
import type { MenuOption } from "../types";

import { AccessGroup } from "./access-group";
import type { RoleUserForm } from "./form-options";

interface PropTypes {
  form: RoleUserForm;
  groups: MenuOption[] | undefined;
  held: MenuNode[] | null;
  optionsError: Error | null;
  isDisabled: boolean;
  onRetryOptions: () => void;
}

export const AccessSection = (props: PropTypes) => {
  const { form, groups, held, optionsError, isDisabled, onRetryOptions } =
    props;

  const isTable = useIsTableWidth() === true;
  const isAdmin = useWatch({ control: form.control, name: "isAdmin" });
  const access = useWatch({ control: form.control, name: "access" });
  const error = (form.formState.errors.access as FieldError | undefined)
    ?.message;

  const onChange = (next: Access) =>
    form.setValue("access", next, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });

  return (
    <FormSection
      legend="Hak akses"
      note={
        held && isAdmin === "false"
          ? "Centang aksi yang boleh dilakukan role ini. Aksi yang tidak Anda pegang tidak bisa diberikan."
          : "Centang aksi yang boleh dilakukan role ini. Tambah, Ubah, Hapus, dan Reset ikut mencentang Lihat."
      }
      disabled={isDisabled}
    >
      <FormWide>
        {isAdmin === "true" ? (
          <p className="text-muted-foreground text-body">
            Role ini memegang semua izin di semua menu.
          </p>
        ) : null}

        {isAdmin === "false" && optionsError ? (
          <div className="flex flex-col items-start gap-3">
            <FormAlert
              title="Daftar menu belum termuat."
              message={optionsError.message}
            />
            <Button type="button" variant="outline" onClick={onRetryOptions}>
              Coba lagi
            </Button>
          </div>
        ) : null}

        {isAdmin === "false" && groups ? (
          <>
            {error ? (
              <p
                id="access"
                tabIndex={-1}
                aria-invalid
                className="text-destructive focus-visible:ring-ring mb-3 rounded-control text-body outline-none focus-visible:ring-2"
              >
                {error}
              </p>
            ) : null}

            {groups.map((group) => (
              <AccessGroup
                key={group.slug}
                group={group}
                access={access}
                held={held}
                isTable={isTable}
                onChange={onChange}
              />
            ))}
          </>
        ) : null}
      </FormWide>
    </FormSection>
  );
};
