import type { ReactNode } from 'react';

export function PageBanner({ title, description, image, children }: { title: string; description: string; image: string; children?: ReactNode }) {
  return <section className="page-banner"><img src={`/images/${image}`} alt="" className="page-banner-photo" /><div className="page-banner-content"><span className="page-eyebrow">Zoom Monitor · Ruang kerja</span><h1>{title}</h1><p>{description}</p>{children}</div></section>;
}
