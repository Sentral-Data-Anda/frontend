/**
 * Tiruan `/api/v1/pendaftaran-event` (be-sada cabang `kegiatan-gaps`, bagian
 * Pendaftaran Event 03-api-contract). Mengubah hanya `REGISTRATION`; `EVENT`
 * dan `JEMAAT_PHONE` dibaca.
 *
 *   MOCK_EMPTY=1                          → daftar kosong (404)
 *   MOCK_500=1                            → daftar menjawab 500
 *   MOCK_PENDAFTARAN_SAVE_ERROR=500       → POST/DELETE/POST invoice menjawab 500
 *   MOCK_PENDAFTARAN_FULL=1               → POST selalu 409 penuh (balapan kursi terakhir)
 *   MOCK_PENDAFTARAN_GATEWAY_OFF=1        → event berbayar 503 sebelum menulis
 *   MOCK_PENDAFTARAN_GATEWAY_DOWN=1       → event berbayar 201 dengan invoiceUrl null
 *   MOCK_PENDAFTARAN_INVOICE_502=1        → POST /:code/invoice 502 (gateway gagal)
 */
import { MENU } from "../../../src/config/menu";
import {
  EVENT,
  JEMAAT_PHONE,
  REGISTRATION,
  TODAY,
  isLive,
  jemaatOf,
  paymentCodeOf,
  registrationCodeOf,
  type EventRow,
  type RegistrationRow,
  type RegistrationStatus,
} from "../kegiatan-store";
import {
  denied,
  json,
  list,
  readBody,
  type MockAction,
  type MockHandler,
} from "../kit";

type Issue = { path: string; message: string };

type Body = {
  eventId?: unknown;
  jemaatId?: unknown;
  participantName?: unknown;
  participantPhone?: unknown;
  participantEmail?: unknown;
};

const STATUSES: RegistrationStatus[] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "EXPIRED",
  "CANCELLED",
];

const INVOICE_TTL_MS = 60 * 60 * 1000;
const GRACE_MS = 5 * 60 * 1000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GATEWAY_DOWN =
  "Peserta Terdaftar, Tetapi Tagihan Pembayaran Gagal Dibuat. Kursinya Kembali Otomatis Setelah Batas Pembayaran Lewat";

const failure = (status: number, error: string, path?: string) =>
  json(
    path
      ? { status, error, issues: [{ path, message: error }] }
      : { status, error },
    status,
  );

const notFound = () => failure(404, "Pendaftaran Tidak Ditemukan");

const eventOf = (id: number) => EVENT.find((row) => row.id === id);

const isLapsed = (row: RegistrationRow, now = Date.now()) =>
  row.status === "PENDING_PAYMENT" &&
  row.payment?.status === "PENDING" &&
  new Date(row.payment.expiredAt ?? 0).getTime() + GRACE_MS < now;

const statusOf = (row: RegistrationRow): RegistrationStatus =>
  isLapsed(row) ? "EXPIRED" : row.status;

const holders = (eventId: number) =>
  REGISTRATION.filter(
    (row) =>
      row.eventId === eventId &&
      (row.status === "CONFIRMED" ||
        (row.status === "PENDING_PAYMENT" &&
          row.payment?.status === "PENDING" &&
          !isLapsed(row))),
  ).length;

export const maskPhone = (phone: string) =>
  phone.length <= 8
    ? `****${phone.slice(-2)}`
    : `${phone.slice(0, 4)}****${phone.slice(-4)}`;

const eventView = (event: EventRow) => ({
  id: event.id,
  code: event.code,
  name: event.name,
  startDate: `${event.startDate}T00:00:00.000Z`,
  endDate: `${event.endDate}T00:00:00.000Z`,
  startTime: event.startTime,
  endTime: event.endTime,
  isPaid: event.isPaid,
  price: event.price,
});

const jemaatView = (id: number | null) => {
  const jemaat = id === null ? undefined : jemaatOf(id);

  return jemaat
    ? {
        publicId: `00000000-0000-4000-d000-${String(jemaat.id).padStart(12, "0")}`,
        code: jemaat.code,
        name: jemaat.name,
      }
    : null;
};

const detailView = (row: RegistrationRow) => {
  const isExpired = isLapsed(row);
  const event = eventOf(row.eventId) as EventRow;

  return {
    publicId: row.publicId,
    code: row.code,
    participantName: row.participantName,
    participantPhone: row.participantPhone,
    participantEmail: row.participantEmail,
    status: statusOf(row),
    createdAt: row.createdAt,
    event: eventView(event),
    jemaat: jemaatView(row.jemaatId),
    payment: row.payment
      ? {
          ...row.payment,
          status: isExpired ? "EXPIRED" : row.payment.status,
        }
      : null,
  };
};

const listView = (row: RegistrationRow) => {
  const { participantEmail: _email, payment, ...rest } = detailView(row);

  return {
    ...rest,
    participantPhone: maskPhone(row.participantPhone),
    payment: payment
      ? {
          status: payment.status,
          amount: payment.amount,
          expiredAt: payment.expiredAt,
        }
      : null,
  };
};

const findRow = (key: string) => {
  const lower = key.toLowerCase();

  return REGISTRATION.find(
    (row) => row.code.toLowerCase() === lower || row.publicId === key,
  );
};

const listRows = (url: URL) => {
  const params = url.searchParams;
  const filter = (params.get("filter") ?? "").toLowerCase();
  const eventId = Number(params.get("eventId")) || null;
  const jemaatId = Number(params.get("jemaatId")) || null;
  const status = params.get("status");

  return REGISTRATION.filter(
    (row) => eventId === null || row.eventId === eventId,
  )
    .filter((row) => jemaatId === null || row.jemaatId === jemaatId)
    .filter((row) => !status || statusOf(row) === status)
    .filter(
      (row) =>
        !filter ||
        row.participantName.toLowerCase().includes(filter) ||
        row.participantPhone.includes(filter) ||
        row.code.toLowerCase().includes(filter),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
    .map(listView);
};

const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const isPositiveInt = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const validate = (body: Body): Issue[] => {
  const issues: Issue[] = [];
  const name = text(body.participantName);
  const phone = text(body.participantPhone);
  const email = text(body.participantEmail);

  if (body.eventId === undefined || body.eventId === null) {
    issues.push({ path: "eventId", message: "Mohon Lengkapi Event" });
  } else if (!isPositiveInt(body.eventId)) {
    issues.push({ path: "eventId", message: "Event tidak valid" });
  }
  if (
    body.jemaatId !== undefined &&
    body.jemaatId !== null &&
    !isPositiveInt(body.jemaatId)
  ) {
    issues.push({ path: "jemaatId", message: "Jemaat tidak valid" });
  }
  if (name && name.length < 3) {
    issues.push({
      path: "participantName",
      message: "Nama Peserta harus memiliki setidaknya 3 karakter",
    });
  }
  if (name.length > 150) {
    issues.push({
      path: "participantName",
      message: "Nama Peserta tidak boleh lebih dari 150 karakter",
    });
  }
  if (phone && phone.length < 6) {
    issues.push({
      path: "participantPhone",
      message: "Nomor Telepon tidak valid",
    });
  }
  if (phone.length > 15) {
    issues.push({
      path: "participantPhone",
      message: "Nomor Telepon tidak boleh lebih dari 15 karakter",
    });
  }
  if (email.length > 150) {
    issues.push({
      path: "participantEmail",
      message: "Email Peserta tidak boleh lebih dari 150 karakter",
    });
  } else if (email && !EMAIL.test(email)) {
    issues.push({
      path: "participantEmail",
      message: "Email Peserta tidak valid",
    });
  }

  const isGuest = body.jemaatId === undefined || body.jemaatId === null;

  if (issues.length === 0 && isGuest && !name) {
    issues.push({
      path: "participantName",
      message: "Mohon Lengkapi Nama Peserta",
    });
  }
  if (issues.length === 0 && isGuest && !phone) {
    issues.push({
      path: "participantPhone",
      message: "Mohon Lengkapi Nomor Telepon Peserta",
    });
  }

  return issues;
};

const newPayment = (id: number, amount: string, isIssued: boolean) => ({
  code: paymentCodeOf(id),
  status: "PENDING" as const,
  amount,
  invoiceUrl: isIssued
    ? `https://checkout-staging.xendit.co/web/mock-${id}`
    : null,
  expiredAt: new Date(Date.now() + INVOICE_TTL_MS).toISOString(),
});

const onCreate = async (request: Request) => {
  const body = await readBody<Body>(request);
  const issues = validate(body);

  if (issues.length > 0) {
    return json({ status: 400, error: issues[0].message, issues }, 400);
  }

  const event = eventOf(body.eventId as number);

  if (!event || !isLive(event)) return failure(404, "Event Tidak Ditemukan");
  if (!event.isPublish) return failure(400, "Event Ini Belum Dipublikasikan");
  if (event.startDate < TODAY) {
    return failure(400, "Event Ini Sudah Berlangsung");
  }
  if (event.isPaid && !event.price) {
    return failure(
      400,
      "Event Ini Berbayar Tetapi Belum Memiliki Harga. Lengkapi Data Event Terlebih Dahulu",
    );
  }
  if (event.isPaid && process.env.MOCK_PENDAFTARAN_GATEWAY_OFF) {
    return failure(
      503,
      "Payment Gateway Belum Dikonfigurasi. Hubungi Administrator",
    );
  }

  const jemaatId = (body.jemaatId as number | null | undefined) ?? null;
  const jemaat = jemaatId === null ? undefined : jemaatOf(jemaatId);

  if (jemaatId !== null && !jemaat) {
    return failure(404, "Jemaat Tidak Ditemukan");
  }

  const phone =
    text(body.participantPhone) ||
    (jemaat ? (JEMAAT_PHONE[jemaat.id] ?? "") : "");

  if (jemaat && !phone) {
    return failure(
      400,
      "Nomor Telepon Jemaat Belum Tercatat, Mohon Isi Nomor Telepon",
      "participantPhone",
    );
  }
  if (
    process.env.MOCK_PENDAFTARAN_FULL ||
    holders(event.id) >= event.capacity
  ) {
    return failure(
      409,
      `Kuota Event Ini Sudah Penuh (${event.capacity} peserta)`,
    );
  }
  if (
    jemaat &&
    REGISTRATION.some(
      (row) =>
        row.eventId === event.id &&
        row.jemaatId === jemaat.id &&
        (row.status === "CONFIRMED" ||
          (row.status === "PENDING_PAYMENT" && !isLapsed(row))),
    )
  ) {
    return failure(409, "Jemaat ini sudah terdaftar pada event tersebut");
  }

  for (const row of REGISTRATION) {
    if (row.eventId === event.id && isLapsed(row)) {
      row.status = "EXPIRED";
      if (row.payment) row.payment.status = "EXPIRED";
    }
  }

  const id = Math.max(0, ...REGISTRATION.map((item) => item.id)) + 1;
  const isGatewayDown = Boolean(process.env.MOCK_PENDAFTARAN_GATEWAY_DOWN);
  const row: RegistrationRow = {
    id,
    publicId: `00000000-0000-4000-r000-${String(id).padStart(12, "0")}`,
    code: registrationCodeOf(id),
    eventId: event.id,
    jemaatId: jemaat?.id ?? null,
    participantName: text(body.participantName) || (jemaat?.name ?? ""),
    participantPhone: phone,
    participantEmail: text(body.participantEmail) || null,
    status: event.isPaid ? "PENDING_PAYMENT" : "CONFIRMED",
    payment: event.isPaid
      ? newPayment(id, event.price as string, !isGatewayDown)
      : null,
    createdAt: new Date().toISOString(),
  };

  REGISTRATION.push(row);

  return json(
    {
      status: 201,
      message:
        event.isPaid && isGatewayDown
          ? GATEWAY_DOWN
          : "Berhasil Mendaftarkan Peserta",
      data: detailView(row),
    },
    201,
  );
};

const onCancel = (row: RegistrationRow) => {
  const status = statusOf(row);

  if (status === "PENDING_PAYMENT") {
    return failure(
      400,
      "Pendaftaran Ini Masih Menunggu Pembayaran. Tunggu Sampai Tagihannya Kedaluwarsa, Lalu Kursinya Kembali Sendiri",
    );
  }
  if (status !== "CONFIRMED") {
    return failure(400, "Pendaftaran Ini Sudah Tidak Aktif");
  }
  if (row.payment) {
    return failure(
      400,
      "Pendaftaran Berbayar Yang Sudah Lunas Tidak Dibatalkan Lewat Aplikasi. Pengembalian Dana Diurus Di Luar Sistem",
    );
  }

  row.status = "CANCELLED";

  return json({
    status: 200,
    message: "Berhasil Membatalkan Pendaftaran",
    data: detailView(row),
  });
};

const onReissue = (row: RegistrationRow) => {
  const event = eventOf(row.eventId) as EventRow;
  const status = statusOf(row);

  if (!event.isPaid || !row.payment) {
    return failure(
      400,
      "Event Ini Gratis, Pendaftarannya Tidak Memiliki Tagihan",
    );
  }
  if (row.payment.status === "PAID") {
    return failure(400, "Pendaftaran Ini Sudah Lunas");
  }
  if (status === "CANCELLED") {
    return failure(400, "Pendaftaran Ini Sudah Dibatalkan");
  }
  if (status === "EXPIRED") {
    return failure(
      400,
      "Tagihan Pendaftaran Ini Sudah Kedaluwarsa. Daftarkan Ulang Pesertanya",
    );
  }
  if (row.payment.invoiceUrl) {
    return failure(400, "Pendaftaran Ini Sudah Memiliki Tagihan");
  }
  if (process.env.MOCK_PENDAFTARAN_GATEWAY_OFF) {
    return failure(
      503,
      "Payment Gateway Belum Dikonfigurasi. Hubungi Administrator",
    );
  }
  if (process.env.MOCK_PENDAFTARAN_INVOICE_502) {
    return failure(502, "Tagihan Pembayaran Gagal Dibuat. Coba Lagi");
  }

  row.payment = newPayment(row.id, row.payment.amount, true);

  return json({
    status: 200,
    message: "Berhasil Membuat Ulang Tagihan Pembayaran",
    data: detailView(row),
  });
};

const saveError = () =>
  process.env.MOCK_PENDAFTARAN_SAVE_ERROR === "500"
    ? failure(500, "Kesalahan server.")
    : null;

export const pendaftaranEventMock: MockHandler = async (ctx) => {
  const match = /^\/pendaftaran-event(?:\/([^/]+))?(\/invoice)?$/.exec(
    ctx.path,
  );

  if (!match) return null;

  const [, key, invoice] = match;
  const guard = (action: MockAction) =>
    ctx.can(MENU.PENDAFTARAN_EVENT, action) ? null : denied();

  if (!key) {
    if (ctx.method === "GET") {
      const status = ctx.url.searchParams.get("status");
      const isStatusKnown =
        !status || STATUSES.includes(status as RegistrationStatus);

      return (
        guard("VIEW") ??
        (!isStatusKnown
          ? failure(400, "Status Pendaftaran Tidak Dikenali", "status")
          : process.env.MOCK_500
            ? failure(500, "Kesalahan server.")
            : list(
                listRows(ctx.url),
                ctx.url,
                "Pendaftaran Event",
                "Pendaftaran Event",
                "Berhasil Mendapatkan Pendaftaran Event",
              ))
      );
    }
    if (ctx.method === "POST") {
      return guard("CREATE") ?? saveError() ?? onCreate(ctx.request);
    }

    return null;
  }

  const row = findRow(decodeURIComponent(key));

  if (invoice) {
    if (ctx.method !== "POST") return null;

    return (
      guard("CREATE") ?? saveError() ?? (row ? onReissue(row) : notFound())
    );
  }
  if (ctx.method === "GET") {
    return (
      guard("VIEW") ??
      (row
        ? json({
            status: 200,
            message: "Berhasil Mendapatkan Pendaftaran Event",
            data: detailView(row),
          })
        : failure(404, "Pendaftaran Event Tidak Ditemukan"))
    );
  }
  if (ctx.method === "DELETE") {
    return guard("DELETE") ?? saveError() ?? (row ? onCancel(row) : notFound());
  }

  return null;
};
