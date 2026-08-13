import type { PillColors } from "@/lib/pills";

export function Pill({
  colors,
  children,
}: {
  colors: PillColors;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full px-[11px] py-[5px] text-[11.5px] font-medium"
      style={{ background: colors.bg, color: colors.fg }}
    >
      {children}
    </span>
  );
}
