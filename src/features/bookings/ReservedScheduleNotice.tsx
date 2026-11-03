export function ReservedScheduleNotice({ checked = false, onChange }: { checked?: boolean; onChange?: (checked: boolean) => void }) {
  return <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900" role="note">
    <p className="font-semibold">Jadwal tetap dicadangkan</p>
    <p className="mt-1">Rapat yang pernah live dapat dimulai lagi sampai akhir jadwal. Pastikan dengan penanggung jawab sebelum melakukan force booking.</p>
    {onChange && <label className="mt-3 flex cursor-pointer items-start gap-2"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" /><span>Saya sudah memastikan rapat sebelumnya tidak akan dilanjutkan dan menyetujui booking baru pada jadwal tersebut.</span></label>}
  </div>;
}
