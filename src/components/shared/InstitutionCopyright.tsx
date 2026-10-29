const copyrightYear = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', year: 'numeric' }).format(new Date());

export function InstitutionCopyright() {
  return <p className="institution-copyright">© {copyrightYear} Dinas Komunikasi dan Informatika Provinsi Sumatera Utara.</p>;
}
