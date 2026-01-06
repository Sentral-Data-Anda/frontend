import {
  ButtonComponent,
  DateInputComponent,
  DropdownAutoComplete,
  DropdownBloodType,
  DropdownComponent,
  DropdownDistricts,
  DropdownEducation,
  DropdownEtnicGroup,
  DropdownGender,
  DropdownProfession,
  DropdownProvinces,
  DropdownRegencies,
  DropdownStatusMartial,
  DropdownVillages,
  DropdownZoneChurch,
  PhoneInputComponent,
  TextAreaInputComponent,
  TextInputComponent,
} from "@/components";
import { useBoolean, useZustandStore } from "@/hooks";
import { jemaatService } from "@/services";
import { FormAdditional, FormDaftarJemaat } from "@/types";
import { customNotification, extractErrorMessage } from "@/utils";
import {
  Accordion,
  ActionIcon,
  Flex,
  Grid,
  LoadingOverlay,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { Fragment, ReactNode } from "react";

interface PropTypes {
  formDaftarJemaat: FormDaftarJemaat;
  setFormDaftarJemaat: (_value: FormDaftarJemaat) => void;
  isDisable: boolean;
  onSubmit: (_value: React.FormEvent<HTMLFormElement>) => void;
  button: ReactNode | null;
  formName: string;
}

const Form = (props: PropTypes) => {
  const {
    formDaftarJemaat,
    setFormDaftarJemaat,
    isDisable,
    onSubmit,
    button,
    formName,
  } = props;

  const { selectJemaat } = useZustandStore();

  const isLoadingDetail = useBoolean();

  const listTypeAdditonal = [
    "BAPTIS",
    "SIDI",
    "ATESTASI MASUK",
    "ATESTASI KELUAR",
    "MENINGGAL/WAFAT",
  ];

  const updateAdditional = (
    index: number,
    key: keyof FormAdditional,
    value: string | null,
  ) => {
    const newAdditional = [...formDaftarJemaat.additional];
    newAdditional[index] = {
      ...newAdditional[index],
      [key]: value,
    };

    setFormDaftarJemaat({
      ...formDaftarJemaat,
      additional: newAdditional,
    });
  };

  async function handleGetDetail(code: string) {
    isLoadingDetail.onTrue();

    try {
      const response = await jemaatService.getOne(code);
      setFormDaftarJemaat({
        ...response.data,
        professionId:
          response.data.professionId !== null
            ? String(response.data.professionId)
            : null,
        etnicGroupId:
          response.data.etnicGroupId !== null
            ? String(response.data.etnicGroupId)
            : null,
        zoneChurchId:
          response.data.zoneChurchId !== null
            ? String(response.data.zoneChurchId)
            : null,
      });
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: extractErrorMessage(error),
      });
    } finally {
      isLoadingDetail.onFalse();
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}>
      <LoadingOverlay
        visible={isLoadingDetail.value}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
      />

      <Accordion
        variant="separated"
        defaultValue="Pribadi"
        styles={{
          label: {
            paddingTop: 7,
            paddingBottom: 7,
            fontSize: 14,
          },
        }}>
        <Accordion.Item value={"Pribadi"}>
          <Accordion.Control>Pribadi</Accordion.Control>
          <Accordion.Panel>
            <Grid w={"100%"} gutter={"xs"}>
              <Grid.Col span={{ base: 12 }}>
                {formName === "ANGGOTA" ? (
                  <DropdownAutoComplete
                    name="Name"
                    value={formDaftarJemaat.name}
                    onChange={(value) => {
                      const isSelect = selectJemaat.find(
                        (item) => item.label === value,
                      );

                      if (isSelect) {
                        handleGetDetail(isSelect.value);
                      } else {
                        setFormDaftarJemaat({
                          ...formDaftarJemaat,
                          name: value,
                        });
                      }
                    }}
                    require
                    description={true}
                    maxChar={100}
                    disabled={isDisable}
                    type={["SIMPATISAN", "ANAK"]}
                  />
                ) : (
                  <TextInputComponent
                    name="Name"
                    value={formDaftarJemaat.name ?? ""}
                    onChange={(e) =>
                      setFormDaftarJemaat({
                        ...formDaftarJemaat,
                        name: e.target.value,
                      })
                    }
                    require
                    description={true}
                    maxChar={100}
                    disabled={isDisable}
                  />
                )}
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <DropdownGender
                  pick={formDaftarJemaat.gender}
                  setPick={(value) => {
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      gender: value !== null ? value : null,
                    });
                  }}
                  withinPortal={false}
                  withLabel
                  require
                  disabled={isDisable}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <TextInputComponent
                  name="Tempat Lahir"
                  value={formDaftarJemaat.birthPlace}
                  onChange={(e) =>
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      birthPlace: e.target.value,
                    })
                  }
                  require
                  disabled={isDisable}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <DateInputComponent
                  label="Tanggal Lahir"
                  value={formDaftarJemaat.birthDate}
                  onChange={(value) => {
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      birthDate: value,
                    });
                  }}
                  disabled={isDisable}
                  require
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <TextInputComponent
                  name="Email"
                  value={formDaftarJemaat?.email ?? ""}
                  onChange={(e) =>
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      email: e.target.value,
                    })
                  }
                  disabled={isDisable}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <PhoneInputComponent
                  name="Phone"
                  value={formDaftarJemaat?.phone ?? ""}
                  onChange={(value) =>
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      phone: String(value),
                    })
                  }
                  disabled={isDisable}
                  require
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <DropdownBloodType
                  pick={formDaftarJemaat.bloodType}
                  setPick={(value) => {
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      bloodType: value !== null ? value : null,
                    });
                  }}
                  withinPortal={false}
                  withLabel
                  disabled={isDisable}
                  require={formName === "ANGGOTA"}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <DropdownEducation
                  pick={formDaftarJemaat.lastEducation}
                  setPick={(value) => {
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      lastEducation: value !== null ? value : null,
                    });
                  }}
                  withinPortal={false}
                  withLabel
                  disabled={isDisable}
                  require={formName === "ANGGOTA"}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <DropdownProfession
                  value={formDaftarJemaat.professionId}
                  onChange={(value) => {
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      professionId: value !== null ? value : null,
                    });
                  }}
                  withinPortal={false}
                  withLabel
                  disabled={isDisable}
                  require={formName === "ANGGOTA"}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <DropdownEtnicGroup
                  value={formDaftarJemaat.etnicGroupId}
                  onChange={(value) => {
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      etnicGroupId: value !== null ? value : null,
                    });
                  }}
                  withinPortal={false}
                  withLabel
                  disabled={isDisable}
                  require={formName === "ANGGOTA"}
                />
              </Grid.Col>
            </Grid>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value={"Alamat"}>
          <Accordion.Control>Alamat</Accordion.Control>
          <Accordion.Panel>
            <Grid w={"100%"} gutter={"xs"}>
              <Grid.Col span={{ base: 12 }}>
                <DropdownProvinces
                  value={formDaftarJemaat.provincesCode}
                  onChange={(value) => {
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      provincesCode: value !== null ? value : null,
                      regenciesCode: null,
                      districtsCode: null,
                      villagesCode: null,
                    });
                  }}
                  withinPortal={false}
                  withLabel
                  disabled={isDisable}
                  require
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <DropdownRegencies
                  provincesCode={formDaftarJemaat.provincesCode}
                  value={formDaftarJemaat.regenciesCode}
                  onChange={(value) => {
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      regenciesCode: value !== null ? value : null,
                      districtsCode: null,
                      villagesCode: null,
                    });
                  }}
                  withinPortal={false}
                  withLabel
                  disabled={isDisable || !formDaftarJemaat.provincesCode}
                  require
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <DropdownDistricts
                  regenciesCode={formDaftarJemaat.regenciesCode}
                  value={formDaftarJemaat.districtsCode}
                  onChange={(value) => {
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      districtsCode: value !== null ? value : null,
                      villagesCode: null,
                    });
                  }}
                  withinPortal={false}
                  withLabel
                  disabled={isDisable || !formDaftarJemaat.regenciesCode}
                  require
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <DropdownVillages
                  districtsCode={formDaftarJemaat.districtsCode}
                  value={formDaftarJemaat.villagesCode}
                  onChange={(value) => {
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      villagesCode: value !== null ? value : null,
                    });
                  }}
                  withinPortal={false}
                  withLabel
                  disabled={isDisable || !formDaftarJemaat.districtsCode}
                  require
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <TextAreaInputComponent
                  name="Alamat"
                  require
                  value={formDaftarJemaat?.address}
                  onChange={(e) =>
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      address: e.target.value,
                    })
                  }
                  disabled={isDisable || !formDaftarJemaat.villagesCode}
                  resize="vertical"
                  description={true}
                  maxChar={250}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <DropdownZoneChurch
                  value={formDaftarJemaat.zoneChurchId}
                  onChange={(value) => {
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      zoneChurchId: value !== null ? value : null,
                    });
                  }}
                  withinPortal={false}
                  withLabel
                  disabled={isDisable || formName !== "ANGGOTA"}
                  require={formName === "ANGGOTA"}
                />
              </Grid.Col>
            </Grid>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value={"Pernikahan"}>
          <Accordion.Control disabled={formName !== "ANGGOTA"}>
            Pernikahan
          </Accordion.Control>
          <Accordion.Panel>
            <Grid w={"100%"} gutter={"xs"}>
              <Grid.Col span={{ base: 12 }}>
                <DropdownStatusMartial
                  pick={formDaftarJemaat.statusMartial}
                  setPick={(value) => {
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      statusMartial: value !== null ? value : null,
                    });
                  }}
                  withinPortal={false}
                  withLabel
                  disabled={isDisable}
                  require
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <TextInputComponent
                  name="Nama Pasangan"
                  value={formDaftarJemaat?.spouseName ?? ""}
                  onChange={(e) =>
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      spouseName: e.target.value,
                    })
                  }
                  disabled={
                    isDisable || formDaftarJemaat.statusMartial !== "SM"
                  }
                  require={formDaftarJemaat.statusMartial === "SM"}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <TextInputComponent
                  name="Tempat Menikah"
                  value={formDaftarJemaat?.martialPlace ?? ""}
                  onChange={(e) =>
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      martialPlace: e.target.value,
                    })
                  }
                  disabled={
                    isDisable || formDaftarJemaat.statusMartial !== "SM"
                  }
                  require={formDaftarJemaat.statusMartial === "SM"}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <DateInputComponent
                  label="Tanggal Menikah"
                  value={formDaftarJemaat.martialDate}
                  onChange={(value) => {
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      martialDate: value,
                    });
                  }}
                  disabled={
                    isDisable || formDaftarJemaat.statusMartial !== "SM"
                  }
                  require={formDaftarJemaat.statusMartial === "SM"}
                />
              </Grid.Col>
            </Grid>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value={"Pelengkap"}>
          <Accordion.Control disabled={formName !== "ANGGOTA"}>
            Pelengkap
          </Accordion.Control>
          <Accordion.Panel>
            <Grid w={"100%"} gutter={"xs"}>
              <Grid.Col span={{ base: 12 }}>
                <TextInputComponent
                  name="Kode Induk Jemaat"
                  value={formDaftarJemaat?.codeInduk ?? ""}
                  onChange={(e) =>
                    setFormDaftarJemaat({
                      ...formDaftarJemaat,
                      codeInduk: e.target.value,
                    })
                  }
                  disabled={isDisable}
                  require={formName === "ANGGOTA"}
                />
              </Grid.Col>

              {formDaftarJemaat.additional?.length > 0 &&
                formDaftarJemaat.additional.map((item, index) => (
                  <Fragment key={index}>
                    <Grid.Col span={{ base: 12 }}>
                      <Flex
                        w={"100%"}
                        align={"center"}
                        justify={"space-between"}
                        gap="xs">
                        <Flex w={"100%"} direction={"column"} gap={"xs"}>
                          <DropdownComponent
                            placeholder={`Tipe Pelengkap ${index + 1}`}
                            data={listTypeAdditonal.map((type) => ({
                              value: type,
                              label: type,
                              disabled: formDaftarJemaat.additional.some(
                                (a, i) => i !== index && a.type === type,
                              ),
                            }))}
                            withLabel
                            value={item.type}
                            onChange={(value) =>
                              updateAdditional(index, "type", value)
                            }
                            disabled={isDisable}
                          />

                          {item.type !== null &&
                          item.type !== "MENINGGAL/WAFAT" ? (
                            <TextInputComponent
                              name={
                                item.type === "ATESTASI MASUK"
                                  ? "Asal Gereja"
                                  : item.type === "ATESTASI KELUAR"
                                  ? "Tujuan Gereja"
                                  : "Tempat"
                              }
                              value={item.place ?? ""}
                              onChange={(e) =>
                                updateAdditional(index, "place", e.target.value)
                              }
                              disabled={isDisable}
                              require
                            />
                          ) : null}

                          {item.type !== null ? (
                            <DateInputComponent
                              label="Tanggal"
                              value={item.date}
                              onChange={(value) =>
                                updateAdditional(index, "date", value)
                              }
                              disabled={isDisable}
                              require
                            />
                          ) : null}
                        </Flex>

                        {!isDisable ? (
                          <ActionIcon
                            variant="light"
                            color="red"
                            aria-label="Erase"
                            mt={22}
                            onClick={() => {
                              setFormDaftarJemaat({
                                ...formDaftarJemaat,
                                additional: formDaftarJemaat.additional.filter(
                                  (_, i) => i !== index,
                                ),
                              });
                            }}>
                            <IconTrash
                              style={{ width: "70%", height: "70%" }}
                              stroke={1.5}
                            />
                          </ActionIcon>
                        ) : null}
                      </Flex>
                    </Grid.Col>
                  </Fragment>
                ))}

              <Grid.Col span={{ base: 12 }}>
                {formDaftarJemaat.additional.length < 5 && !isDisable ? (
                  <ButtonComponent
                    variant="outline"
                    name="Pelengkap"
                    icon={
                      <IconPlus
                        style={{ width: "70%", height: "70%" }}
                        stroke={1.5}
                      />
                    }
                    onClick={() => {
                      setFormDaftarJemaat({
                        ...formDaftarJemaat,
                        additional: [
                          ...formDaftarJemaat.additional,
                          { type: null, place: "", date: null },
                        ],
                      });
                    }}
                  />
                ) : null}
              </Grid.Col>
            </Grid>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      {button}
    </form>
  );
};

export default Form;
