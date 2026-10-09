interface PropTypes {
  children: React.ReactNode;
}

/**
 * Akar layar Beranda. Di desktop tingginya dikunci setinggi viewport supaya
 * dashboard pas satu layar tanpa menyisakan ruang kosong di bawah; di mobile
 * mengalir seperti halaman biasa.
 */
export const DashboardPage = (props: PropTypes) => (
  <div className="pb-6 lg:flex lg:h-dvh lg:flex-col lg:pb-4">
    {props.children}
  </div>
);

/**
 * Badan dashboard: mengambil sisa tinggi di bawah header. `min-h-0` membuatnya
 * boleh lebih pendek daripada isinya, sehingga kartu yang panjang menggulir di
 * dalam dirinya alih-alih memanjangkan halaman.
 */
export const DashboardBody = (props: PropTypes) => (
  <div className="mt-5 px-gutter lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
    {props.children}
  </div>
);
