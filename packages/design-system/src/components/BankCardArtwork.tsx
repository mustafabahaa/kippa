/** Monochrome low-poly artwork shared by every bank card. */
export function BankCardArtwork() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      <g fill="currentColor">
        <path d="M0 0h430L258 250 0 160z" opacity=".035" />
        <path d="M0 160l258 90-88 300L0 470z" opacity=".06" />
        <path d="M258 250 430 0l178 280-438 60z" opacity=".075" />
        <path d="m258 250 350 30-188 300-250 60z" opacity=".045" />
        <path d="M430 0h390L608 280z" opacity=".045" />
        <path d="m608 280 212-280 210 240-422 120z" opacity=".065" />
        <path d="m608 280 422-40-170 370-440-30z" opacity=".035" />
        <path d="m860 610 170-370 260 260-180 290z" opacity=".055" />
        <path d="m1030 240 410-240-150 500z" opacity=".04" />
        <path d="m1290 500 150-500h160v370z" opacity=".06" />
        <path d="m1110 790 180-290 310-130v360l-238 270z" opacity=".035" />
        <path d="m0 610 170 30 120 360H0z" opacity=".045" />
        <path d="m170 640 250-60 198 420H290z" opacity=".03" />
        <path d="m420 580 440 30 250 390H618z" opacity=".04" />
        <path d="m860 610 250 180 252 210h-442z" opacity=".025" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="2" opacity=".055">
        <path d="m0 160 258 90L430 0m-172 250 350 30L820 0m-212 280 422-40 260 260m-680 90 250 20 180-290m-680 0-88 300 250-60m268 360 250-180 180-290" />
        <path d="m0 610 170 30 250-60 188 360m252-330 250 180 180-290 310-130" />
      </g>
    </svg>
  );
}
