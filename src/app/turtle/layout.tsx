import { PencatatKunjungan } from "@/components/pencatat-kunjungan";

/** Penghitung kunjungan situs ini; lihat `pencatat-kunjungan.tsx`. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PencatatKunjungan situs="turtle" />
    </>
  );
}
