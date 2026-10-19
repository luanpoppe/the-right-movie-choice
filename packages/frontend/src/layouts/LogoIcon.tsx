// Logo da marca em SVG inline, para herdar a cor do tema.
// - Frames laterais: `currentColor` (segue a cor do texto do container).
// - Frame central e checks: `fill/stroke-primary` (ambar no tema escuro,
//   marrom no claro).
// Geometria identica ao icone do pacote de marca (viewBox recortado na faixa
// dos tres frames, 902x452, aspecto 2:1).
export function LogoIcon() {
  return (
    <svg
      viewBox="61 288 902 452"
      width={80}
      height={40}
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className="h-8 w-auto sm:h-10"
    >
      <defs>
        <mask
          id="trmc-left-frame"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="1024"
          height="1024"
        >
          <rect width="1024" height="1024" fill="#000" />
          <rect x="61" y="371" width="291" height="288" rx="50" fill="#fff" />
          <rect x="143" y="423" width="127" height="190" rx="26" fill="#000" />
          <rect x="88" y="426" width="26" height="33" rx="8" fill="#000" />
          <rect x="88" y="502" width="26" height="33" rx="8" fill="#000" />
          <rect x="88" y="576" width="26" height="33" rx="8" fill="#000" />
          <rect x="299" y="426" width="26" height="33" rx="8" fill="#000" />
          <rect x="299" y="502" width="26" height="33" rx="8" fill="#000" />
          <rect x="299" y="576" width="26" height="33" rx="8" fill="#000" />
        </mask>

        <mask
          id="trmc-right-frame"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="1024"
          height="1024"
        >
          <rect width="1024" height="1024" fill="#000" />
          <rect x="672" y="371" width="291" height="288" rx="50" fill="#fff" />
          <rect x="754" y="423" width="127" height="190" rx="26" fill="#000" />
          <rect x="910" y="426" width="26" height="33" rx="8" fill="#000" />
          <rect x="910" y="502" width="26" height="33" rx="8" fill="#000" />
          <rect x="910" y="576" width="26" height="33" rx="8" fill="#000" />
          <rect x="699" y="426" width="26" height="33" rx="8" fill="#000" />
          <rect x="699" y="502" width="26" height="33" rx="8" fill="#000" />
          <rect x="699" y="576" width="26" height="33" rx="8" fill="#000" />
        </mask>

        <mask
          id="trmc-center-frame"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="1024"
          height="1024"
        >
          <rect width="1024" height="1024" fill="#000" />
          <rect x="332" y="335" width="360" height="358" rx="56" fill="#fff" />
          <rect x="437" y="406" width="150" height="223" rx="30" fill="#000" />
          <rect x="371" y="416" width="26" height="34" rx="8" fill="#000" />
          <rect x="371" y="501" width="26" height="34" rx="8" fill="#000" />
          <rect x="371" y="587" width="26" height="34" rx="8" fill="#000" />
          <rect x="627" y="416" width="26" height="34" rx="8" fill="#000" />
          <rect x="627" y="501" width="26" height="34" rx="8" fill="#000" />
          <rect x="627" y="587" width="26" height="34" rx="8" fill="#000" />
        </mask>
      </defs>

      <g fill="currentColor">
        <rect width="1024" height="1024" mask="url(#trmc-left-frame)" />
        <rect width="1024" height="1024" mask="url(#trmc-right-frame)" />
      </g>

      <g
        className="stroke-primary"
        fill="none"
        strokeWidth={20}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M171 515 L192 536 L244 492" />
        <path d="M781 515 L802 536 L854 492" />
      </g>

      <rect
        className="fill-primary"
        width="1024"
        height="1024"
        mask="url(#trmc-center-frame)"
      />

      <path
        className="fill-primary"
        d="M472 478 C472 468 481 465 492 473 L550 513 C562 521 562 532 550 540 L492 576 C481 584 472 580 472 570 Z"
      />
    </svg>
  );
}
