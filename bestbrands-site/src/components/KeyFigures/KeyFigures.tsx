import { useLayoutEffect, useRef, useState } from 'react';
import styles from './KeyFigures.module.css';

// Published portfolio totals and their scope are documented in
// reference-analysis/stellar-statistics/ANALYSIS.md.
const figures = [
  { value: '50,63', unit: ' MW', label: 'Toplam kurulu güç' },
  { value: '6', label: 'İlde güneş enerjisi üretimi' },
  { value: '95,4', unit: ' milyon', label: 'kWh yıllık ortalama üretim' },
  { value: '791', unit: ' bin', label: 'm² GES yerleşim alanı' },
  { value: '2018', label: 'Kuruluş yılı' },
  { value: '14', label: 'Planlanan araç muayene istasyonu', detail: 'Hedeflenen başlangıç: Ağustos 2027' },
];

export function KeyFigures() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isBlue, setIsBlue] = useState(false);

  useLayoutEffect(() => {
    let frame: number | null = null;
    const update = () => {
      frame = null;
      const section = sectionRef.current;
      if (!section) return;
      const { top, bottom } = section.getBoundingClientRect();
      // Stellar's theme trigger: start "top 25%", end "bottom top".
      setIsBlue(top <= window.innerHeight * 0.25 && bottom > 0);
    };
    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      id="rakamlarla-best-brands"
      ref={sectionRef}
      className={`${styles.section} ${isBlue ? styles.blue : ''}`}
      aria-labelledby="key-figures-title"
      data-theme={isBlue ? 'blue' : 'light'}
    >
      <div className={styles.heading}>
        <p className={styles.topic}>Rakamlarla Best Brands</p>
        <h2 id="key-figures-title" className={styles.title}>
          Geleceğe güç veren yatırımlar,<br />
          değer yaratan rakamlar
        </h2>
      </div>
      <dl className={styles.grid}>
        {figures.map(({ value, unit, label, detail }) => (
          <div className={styles.item} key={label}>
            <dt className={styles.label}>{label}</dt>
            <dd className={styles.value}>{value}{unit && <span>{unit}</span>}</dd>
            {detail && <dd className={styles.detail}>{detail}</dd>}
          </div>
        ))}
      </dl>
      <p className={styles.note}>
        GES verileri, şirketin yayımlanan <a href="https://bestbrandsenerji.com/portfolio/">portföy bilgilerine</a> dayanmaktadır.
        {' '}Üretim rakamı yıllık ortalamayı, araç muayene istasyonu sayısı planlanan yatırımı ifade eder.
      </p>
    </section>
  );
}
