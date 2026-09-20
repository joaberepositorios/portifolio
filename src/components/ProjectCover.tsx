/**
 * Capa desenhada, usada enquanto o projeto não tem `image`.
 * Sempre um painel escuro (nos dois temas), com um traço técnico discreto.
 * Quatro composições se alternam para que projetos vizinhos não fiquem iguais.
 * Os traços contínuos têm pathLength=1: o CSS os desenha conforme a rolagem.
 */
export function ProjectCover({ index }: { index: number }) {
  const variant = index % 4
  const line = 'rgb(255 255 255 / 0.34)'
  const faint = 'rgb(255 255 255 / 0.12)'
  const hi = '#8fb8e8'

  return (
    <svg viewBox="0 0 800 560" preserveAspectRatio="xMidYMid slice" className="cover" aria-hidden="true">
      <rect width="800" height="560" fill="var(--cover)" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
        {/* 0 — séries e barras: dados */}
        {variant === 0 && (
          <>
            {[150, 230, 310, 390].map((y) => (
              <path key={y} d={`M110 ${y}H690`} stroke={faint} pathLength={1} />
            ))}
            <path d="M110 360C170 350 190 300 250 305S330 250 390 262 470 190 530 205 620 150 690 160" stroke={hi} strokeWidth="2" pathLength={1} />
            <path d="M110 390C180 385 200 352 260 356S340 320 400 330 480 292 540 300 630 270 690 276" stroke={line} pathLength={1} />
            {Array.from({ length: 12 }, (_, i) => (
              <path key={i} d={`M${130 + i * 48} 450V${450 - 14 - ((i * 37) % 46)}`} stroke={line} strokeWidth="10" strokeLinecap="butt" pathLength={1} />
            ))}
          </>
        )}

        {/* 1 — malha de controle: automação */}
        {variant === 1 && (
          <>
            <circle cx="190" cy="250" r="22" stroke={line} pathLength={1} />
            <path d="M179 250h22M190 239v22" stroke={line} pathLength={1} />
            <rect x="290" y="212" width="130" height="76" rx="6" stroke={line} pathLength={1} />
            <rect x="500" y="212" width="130" height="76" rx="6" stroke={hi} strokeWidth="2" pathLength={1} />
            <path d="M90 250h78M212 250h78M420 250h80M630 250h90" stroke={line} pathLength={1} />
            <path d="M680 250v130H190V272" stroke={line} strokeDasharray="5 7" />
            <path d="M280 244l10 6-10 6M490 244l10 6-10 6M710 244l10 6-10 6" stroke={line} pathLength={1} />
            <path d="M320 262c14-34 26-34 38 0s26 26 36-10" stroke={line} pathLength={1} />
            <path d="M530 270h70M530 250h46M530 230h58" stroke={hi} pathLength={1} />
          </>
        )}

        {/* 2 — diagrama unifilar: engenharia */}
        {variant === 2 && (
          <>
            <path d="M120 170H680" stroke={line} strokeWidth="3" pathLength={1} />
            <path d="M120 400H680" stroke={line} strokeWidth="3" pathLength={1} />
            {[200, 330, 470, 600].map((x, i) => (
              <g key={x}>
                <path d={`M${x} 170V400`} stroke={i === 1 ? hi : line} strokeWidth={i === 1 ? 2 : 1.5} pathLength={1} />
                <rect x={x - 11} y="250" width="22" height="22" fill="var(--cover)" stroke={i === 1 ? hi : line} pathLength={1} />
              </g>
            ))}
            <circle cx="400" cy="120" r="22" stroke={line} pathLength={1} />
            <path d="M400 142V170M388 120c4-12 8-12 12 0s8 12 12 0" stroke={line} pathLength={1} />
            <path d="M265 400v50l-14 24h28l-14-24M535 400v50l-14 24h28l-14-24" stroke={line} pathLength={1} />
          </>
        )}

        {/* 3 — janela de aplicação: web */}
        {variant === 3 && (
          <>
            <rect x="130" y="110" width="540" height="340" rx="10" stroke={line} pathLength={1} />
            <path d="M130 156H670" stroke={line} pathLength={1} />
            <circle cx="158" cy="133" r="4" stroke={line} pathLength={1} />
            <circle cx="176" cy="133" r="4" stroke={line} pathLength={1} />
            <circle cx="194" cy="133" r="4" stroke={line} pathLength={1} />
            <path d="M166 200h110M166 232h80M166 264h96M166 296h64" stroke={faint} strokeWidth="6" pathLength={1} />
            <rect x="320" y="196" width="314" height="120" rx="6" stroke={hi} strokeWidth="2" pathLength={1} />
            <path d="M340 290l50-40 40 22 60-52 60 30 64-24" stroke={hi} pathLength={1} />
            <rect x="320" y="340" width="146" height="78" rx="6" stroke={line} pathLength={1} />
            <rect x="488" y="340" width="146" height="78" rx="6" stroke={line} pathLength={1} />
          </>
        )}
      </g>
    </svg>
  )
}
