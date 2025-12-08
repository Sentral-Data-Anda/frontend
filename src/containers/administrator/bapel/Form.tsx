import {
  CheckInputComponent,
  DateInputComponent,
  DropdownComponent,
  DropdownMultiComponent,
  TextInputComponent,
  TimeInputComponent,
} from "@/components";
import { FormBapel } from "@/types";
import { listDays, listRuleBapel, listWeekOfMonth } from "@/utils/general";
import { Grid } from "@mantine/core";
import { ReactNode } from "react";

interface PropTypes {
  formBapel: FormBapel;
  setFormBapel: (_value: FormBapel) => void;
  isDisable: boolean;
  onSubmit: (_value: React.FormEvent<HTMLFormElement>) => void;
  button: ReactNode | null;
}

const Form = (props: PropTypes) => {
  const { formBapel, setFormBapel, isDisable, onSubmit, button } = props;

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}>
      <Grid w={"100%"} gutter={"xs"}>
        <Grid.Col span={{ base: 12 }}>
          <TextInputComponent
            name="Nama"
            require
            value={formBapel.name}
            onChange={(e) =>
              setFormBapel({ ...formBapel, name: e.target.value })
            }
            disabled={isDisable}
            description={true}
            maxChar={25}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <CheckInputComponent
            label="Aturan Khusus"
            value={formBapel.haveRules}
            onChange={(value) =>
              setFormBapel({
                name: formBapel.name,
                haveRules: value,
              })
            }
            disabled={isDisable}
          />
        </Grid.Col>

        {formBapel && formBapel.haveRules ? (
          <Grid.Col span={{ base: 12 }}>
            <Grid w={"100%"} gutter={"xs"}>
              <Grid.Col span={{ base: 12 }}>
                <DropdownMultiComponent
                  placeholder="Tipe Aturan"
                  data={listRuleBapel()}
                  value={formBapel?.ruleType ?? []}
                  onChange={(value) => {
                    setFormBapel({
                      ...formBapel,
                      ruleType:
                        value !== null
                          ? (value as FormBapel["ruleType"])
                          : undefined,
                    });
                  }}
                  withinPortal={false}
                  withLabel
                  require
                  disabled={isDisable}
                />
              </Grid.Col>

              {formBapel.ruleType?.includes("NO_WEEK") ? (
                <Grid.Col span={{ base: 12 }}>
                  <DropdownMultiComponent
                    placeholder="Minggu"
                    data={listWeekOfMonth()}
                    value={formBapel?.weekOfMonth ?? []}
                    onChange={(value) => {
                      setFormBapel({
                        ...formBapel,
                        weekOfMonth: value !== null ? value : undefined,
                      });
                    }}
                    withinPortal={false}
                    withLabel
                    require
                    disabled={isDisable}
                  />
                </Grid.Col>
              ) : null}

              {formBapel.ruleType?.includes("NO_DAY") ? (
                <Grid.Col span={{ base: 12 }}>
                  <DropdownComponent
                    placeholder="Hari"
                    data={listDays()}
                    value={formBapel?.dayOfWeek ?? ""}
                    onChange={(value) => {
                      setFormBapel({
                        ...formBapel,
                        dayOfWeek: value !== null ? value : undefined,
                      });
                    }}
                    withinPortal={false}
                    withLabel
                    require
                    disabled={isDisable}
                  />
                </Grid.Col>
              ) : null}

              {formBapel.ruleType?.includes("NO_DATE") ? (
                <Grid.Col span={{ base: 12 }}>
                  <DateInputComponent
                    label="Tanggal"
                    value={formBapel?.date ?? null}
                    onChange={(value) => {
                      setFormBapel({
                        ...formBapel,
                        date: value,
                      });
                    }}
                    require
                    disabled={isDisable}
                  />
                </Grid.Col>
              ) : null}

              {formBapel.ruleType?.includes("NO_TIME") ? (
                <>
                  <Grid.Col span={{ base: 6 }}>
                    <TimeInputComponent
                      label="Dari Waktu"
                      value={formBapel?.startTime}
                      onChange={(value) => {
                        setFormBapel({
                          ...formBapel,
                          startTime: value,
                        });
                      }}
                      require
                      disabled={isDisable}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 6 }}>
                    <TimeInputComponent
                      label="Sampai Waktu"
                      value={formBapel?.endTime}
                      onChange={(value) => {
                        setFormBapel({
                          ...formBapel,
                          endTime: value,
                        });
                      }}
                      require
                      disabled={isDisable}
                    />
                  </Grid.Col>
                </>
              ) : null}
            </Grid>
          </Grid.Col>
        ) : null}
      </Grid>

      {button}
    </form>
  );
};

export default Form;
