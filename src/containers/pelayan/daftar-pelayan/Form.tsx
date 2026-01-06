import {
  DropdownBapel,
  DropdownComponent,
  DropdownJemaat,
  DropdownMultiComponent,
  DropdownTypePelayan,
  PhoneInputComponent,
  RadioInputComponent,
  TextInputComponent,
} from "@/components";
import { useZustandStore } from "@/hooks";
import { FormDaftarPelayan } from "@/types";
import { Grid, Group, Radio } from "@mantine/core";
import { ReactNode, useEffect } from "react";

interface PropTypes {
  formDaftarPelayan: FormDaftarPelayan;
  setFormDaftarPelayan: (_value: FormDaftarPelayan) => void;
  isDisable: boolean;
  onSubmit: (_value: React.FormEvent<HTMLFormElement>) => void;
  button: ReactNode | null;
  isEditing: boolean;
}

const Form = (props: PropTypes) => {
  const {
    formDaftarPelayan,
    setFormDaftarPelayan,
    isDisable,
    onSubmit,
    button,
    isEditing,
  } = props;

  const {
    selectRolePelayan,
    selectSkillMusic,
    fetchDropdownSkillMusic,
    selectJemaat,
    fetchDropdownJemaat,
  } = useZustandStore();

  const valuePemusik = selectRolePelayan?.find(
    (item) => item.label === "Pemusik",
  )?.value;

  useEffect(() => {
    if (formDaftarPelayan?.isPemusik && selectSkillMusic.length === 0) {
      fetchDropdownSkillMusic?.();
    }
  }, [formDaftarPelayan.isPemusik]);

  useEffect(() => {
    if (
      formDaftarPelayan?.typePelayan === "GROUP" &&
      selectJemaat.length === 0
    ) {
      fetchDropdownJemaat?.();
    }
  }, [formDaftarPelayan.typePelayan]);

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        minHeight: 350,
      }}>
      <Grid w={"100%"} gutter={"xs"}>
        <Grid.Col span={{ base: 12 }}>
          <DropdownBapel
            value={formDaftarPelayan?.bapelId}
            onChange={(value) => {
              setFormDaftarPelayan({
                ...formDaftarPelayan,
                bapelId: value ?? null,
              });
            }}
            withinPortal={false}
            withLabel
            require
            disabled={isEditing ? true : isDisable}
          />
        </Grid.Col>

        {formDaftarPelayan.bapelId !== null ? (
          <Grid.Col span={{ base: 12 }}>
            <DropdownTypePelayan
              pick={formDaftarPelayan?.typePelayan}
              setPick={(value) => {
                setFormDaftarPelayan({
                  ...formDaftarPelayan,
                  typePelayan: value,
                  rolePelayan:
                    value === "GROUP" ? [valuePemusik ?? ""] : undefined,
                  isPemusik: value === "GROUP" ? true : false,
                });
              }}
              withinPortal={false}
              withLabel
              require
              disabled={isEditing ? true : isDisable}
            />
          </Grid.Col>
        ) : null}

        {formDaftarPelayan.typePelayan !== null &&
        formDaftarPelayan.typePelayan !== "" ? (
          <>
            {formDaftarPelayan?.typePelayan === "INDIVIDUAL" ? (
              <Grid.Col span={{ base: 12 }}>
                <DropdownJemaat
                  withLabel
                  withinPortal={false}
                  require
                  value={formDaftarPelayan.jemaatId ?? null}
                  onChange={(value) => {
                    setFormDaftarPelayan({
                      ...formDaftarPelayan,
                      jemaatId: value,
                    });
                  }}
                  disabled={isEditing ? true : isDisable}
                  type={["ANGGOTA", "ANAK"]}
                  status="AKTIF"
                />
              </Grid.Col>
            ) : (
              <>
                <Grid.Col span={{ base: 12 }}>
                  <TextInputComponent
                    name="Name"
                    value={formDaftarPelayan?.name}
                    onChange={(e) =>
                      setFormDaftarPelayan({
                        ...formDaftarPelayan,
                        name: e.target.value,
                      })
                    }
                    require
                    description={true}
                    maxChar={50}
                    disabled={isDisable}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12 }}>
                  <PhoneInputComponent
                    name={"Phone"}
                    value={String(formDaftarPelayan?.phone)}
                    onChange={(value) => {
                      setFormDaftarPelayan({
                        ...formDaftarPelayan,
                        phone: value ?? "",
                      });
                    }}
                    require
                    disabled={isDisable}
                  />
                </Grid.Col>
              </>
            )}

            {formDaftarPelayan?.typePelayan === "GROUP" ? (
              <Grid.Col span={{ base: 12 }}>
                <DropdownMultiComponent
                  placeholder="Anggota"
                  data={selectJemaat}
                  value={formDaftarPelayan?.members ?? []}
                  onChange={(value) => {
                    setFormDaftarPelayan({
                      ...formDaftarPelayan,
                      members: value !== null ? value : undefined,
                    });
                  }}
                  withinPortal={false}
                  withLabel
                  require
                  disabled={isDisable}
                />
              </Grid.Col>
            ) : null}

            {formDaftarPelayan?.typePelayan === "GROUP" ? (
              <Grid.Col span={{ base: 12 }}>
                <DropdownComponent
                  placeholder="Role Pelayan"
                  data={selectRolePelayan}
                  withLabel
                  withinPortal={false}
                  require
                  value={
                    formDaftarPelayan?.rolePelayan
                      ? formDaftarPelayan.rolePelayan[0]
                      : null
                  }
                  onChange={(value) => {
                    setFormDaftarPelayan({
                      ...formDaftarPelayan,
                      rolePelayan: value !== null ? [value] : undefined,
                      isPemusik: valuePemusik
                        ? value && value.length > 0
                          ? value.includes(valuePemusik)
                          : false
                        : false,
                      musikSkill: [],
                    });
                  }}
                  disabled={
                    formDaftarPelayan.typePelayan === "GROUP" ? true : isDisable
                  }
                />
              </Grid.Col>
            ) : (
              <Grid.Col span={{ base: 12 }}>
                <DropdownMultiComponent
                  placeholder="Role Pelayan"
                  data={selectRolePelayan}
                  value={formDaftarPelayan?.rolePelayan ?? []}
                  onChange={(value) => {
                    setFormDaftarPelayan({
                      ...formDaftarPelayan,
                      rolePelayan: value !== null ? value : undefined,
                      isPemusik: valuePemusik
                        ? value && value.length > 0
                          ? value.includes(valuePemusik)
                          : false
                        : false,
                    });
                  }}
                  withinPortal={false}
                  withLabel
                  require
                  disabled={isDisable}
                />
              </Grid.Col>
            )}

            {formDaftarPelayan?.isPemusik ? (
              <Grid.Col span={{ base: 12 }}>
                <DropdownMultiComponent
                  placeholder="Skill Pemusik"
                  data={selectSkillMusic}
                  value={formDaftarPelayan?.musikSkill ?? []}
                  onChange={(value) => {
                    setFormDaftarPelayan({
                      ...formDaftarPelayan,
                      musikSkill: value !== null ? value : undefined,
                    });
                  }}
                  withinPortal={false}
                  withLabel
                  require
                  disabled={isDisable}
                />
              </Grid.Col>
            ) : null}

            <Grid.Col span={{ base: 12 }} my={5}>
              <Radio.Group
                label="Status Pelayan"
                withAsterisk
                value={formDaftarPelayan?.status}
                onChange={(value) => {
                  setFormDaftarPelayan({
                    ...formDaftarPelayan,
                    status: value,
                  });
                }}
                styles={{
                  label: {
                    fontSize: 12,
                  },
                }}>
                <Group mt="xs">
                  <RadioInputComponent
                    name="Aktif"
                    value={"1"}
                    disabled={isDisable}
                  />
                  <RadioInputComponent
                    name="Tidak Aktif"
                    value={"0"}
                    disabled={isDisable}
                  />
                </Group>
              </Radio.Group>
            </Grid.Col>
          </>
        ) : null}
      </Grid>

      {button}
    </form>
  );
};

export default Form;
