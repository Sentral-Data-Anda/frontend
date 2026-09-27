export type IbadahPlaceType = "GEREJA" | "RUMAH_JEMAAT" | "LAINNYA";

export const IBADAH_PLACE_LABEL: Record<IbadahPlaceType, string> = {
  GEREJA: "Gereja",
  RUMAH_JEMAAT: "Rumah jemaat",
  LAINNYA: "Lainnya",
};

type Named = { name: string } | null;

export type IbadahPlace = {
  placeType: IbadahPlaceType;
  room: Named;
  hostKeluarga: Named;
  placeName: string | null;
};

export function placeLabelOf(place: IbadahPlace): string {
  if (place.placeType === "RUMAH_JEMAAT") {
    return place.hostKeluarga
      ? `Rumah ${place.hostKeluarga.name}`
      : IBADAH_PLACE_LABEL.RUMAH_JEMAAT;
  }
  if (place.placeType === "LAINNYA") {
    return place.placeName || IBADAH_PLACE_LABEL.LAINNYA;
  }

  return place.room?.name ?? IBADAH_PLACE_LABEL.GEREJA;
}
