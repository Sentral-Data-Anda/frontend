"use client";

import Link from "next/link";

import { DdlField } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { EVENT_LIST_PATH, formOptionOf, priceOf } from "../model";
import type { EventOption } from "../types";

import { EMPTY_EVENT_MESSAGE, type RegistrationForm } from "./form-options";

interface PropTypes {
  form: RegistrationForm;
  isDisabled: boolean;
  events: EventOption[] | undefined;
  isLoading: boolean;
  pickedEvent: EventOption | undefined;
}

export const EventSection = (props: PropTypes) => {
  const { form, isDisabled, events, isLoading, pickedEvent } = props;

  const { isCanView: isCanViewEvent } = useMenuAccess(MENU.EVENT);
  const isEmpty = !isLoading && events?.length === 0;

  return (
    <FormSection legend="Event" disabled={isDisabled}>
      <div>
        <ControlField
          control={form.control}
          name="eventId"
          label="Event"
          hint={
            pickedEvent?.isPaid
              ? `Event berbayar: peserta menerima tautan tagihan ${priceOf(pickedEvent.price)} sesudah didaftarkan.`
              : undefined
          }
        >
          {(field) => (
            <DdlField
              value={field.value}
              onValueChange={field.onChange}
              options={(events ?? []).map(formOptionOf)}
              isLoading={isLoading}
              disabled={isDisabled}
              placeholder="Pilih event"
              emptyMessage={EMPTY_EVENT_MESSAGE}
            />
          )}
        </ControlField>

        {isEmpty ? (
          <p className="text-muted-foreground mt-1.5 text-caption">
            {EMPTY_EVENT_MESSAGE}{" "}
            {isCanViewEvent ? (
              <Link
                href={EVENT_LIST_PATH}
                className="text-primary cursor-pointer font-medium underline-offset-4 hover:underline focus-visible:underline"
              >
                Buka Event
              </Link>
            ) : (
              "Event yang sudah terbit dan belum mulai akan muncul di sini."
            )}
          </p>
        ) : null}
      </div>
    </FormSection>
  );
};
