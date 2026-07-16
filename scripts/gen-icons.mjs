/**
 * Gym-Buddy 아이콘/로고 생성
 *
 * 실행: npm run icon
 * 요구: rsvg-convert, magick  (brew install librsvg imagemagick)
 *
 * ⚠️ 워드마크를 SVG <text>로 만들지 않는 이유:
 *    macOS의 rsvg는 텍스트 렌더에 fontconfig가 아니라 CoreText를 쓴다.
 *    → assets/fonts의 Outfit을 인식하지 못하고 Helvetica로 조용히 폴백된다.
 *    (fc-list에는 잡히지만 실제 렌더에는 반영 안 됨 — 확인 완료)
 *    그래서 워드마크는 magick에 ttf 경로를 직접 지정해 렌더한 뒤 합성한다.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const ICON_SRC = 'assets/icon-source.svg';
const MARK_SRC = 'assets/logo-mark.svg';
const FONT = 'assets/fonts/Outfit_700Bold.ttf';

const BRAND = 'Gym-Buddy';
const LIME = '#BAFA20';
const DARK = '#0A0B08';

function need(bin) {
  try {
    execFileSync(bin, ['--version'], { stdio: 'ignore' });
  } catch {
    console.error(`❌ ${bin} 없음 → brew install librsvg imagemagick`);
    process.exit(1);
  }
}
need('rsvg-convert');
need('magick');

for (const f of [ICON_SRC, MARK_SRC, FONT]) {
  if (!existsSync(f)) {
    console.error(`❌ ${f} 가 없습니다.`);
    process.exit(1);
  }
}

const svg = (src, out, w, h) =>
  execFileSync('rsvg-convert', ['-w', String(w), '-h', String(h), src, '-o', out]);

// ── 1. 아이콘 (텍스트 없음 → 48px에서도 식별 가능) ──
const ICONS = [
  ['assets/images/icon.png', 1024],
  ['assets/images/favicon.png', 48],
  ['assets/images/splash-icon.png', 512],
  ['assets/images/android-icon-foreground.png', 1024],
  ['assets/images/kakao-icon.png', 512], // 카카오 디벨로퍼스 등록용
];
for (const [out, size] of ICONS) {
  svg(ICON_SRC, out, size, size);
  console.log(`✅ ${out} (${size}x${size})`);
}

// ── 2. 로고 = 바벨 마크 + Outfit 워드마크 합성 ──
const tmp = mkdtempSync(join(tmpdir(), 'gb-logo-'));
try {
  for (const [name, textColor, out] of [
    ['dark', '#FFFFFF', 'assets/images/logo.png'], // 다크 배경용 (앱)
    ['light', DARK, 'assets/images/logo-light.png'], // 라이트 배경용 (문서/README)
  ]) {
    const mark = join(tmp, `mark-${name}.png`);
    const word = join(tmp, `word-${name}.png`);
    // 마크를 워드마크 시각 높이에 맞춰 키운다
    svg(MARK_SRC, mark, 560, 480);

    // "Gym" + 라임 하이픈 + "Buddy" — 하이픈만 포인트 컬러
    // ttf 경로를 직접 지정 → 폰트 폴백 없음 (파일 상단 주석 참고)
    //
    // ⚠️ 조각마다 -trim 하지 말 것.
    //    trim은 글리프 잉크 영역만 남겨 베이스라인 기준을 잃는다.
    //    (하이픈이 바닥으로 내려가 "Gym_Buddy"처럼 보이는 버그가 생김)
    //    같은 font/pointsize의 label:은 높이·베이스라인이 동일하므로
    //    trim 없이 이어 붙인 뒤, 마지막에 한 번만 trim한다.
    const part = (text, color, file) =>
      execFileSync('magick', [
        '-background', 'none',
        '-fill', color,
        '-font', resolve(FONT),
        '-pointsize', '190',
        `label:${text}`,
        file,
      ]);
    const p1 = join(tmp, `p1-${name}.png`);
    const p2 = join(tmp, `p2-${name}.png`);
    const p3 = join(tmp, `p3-${name}.png`);
    part('Gym', textColor, p1);
    part('-', LIME, p2);
    part('Buddy', textColor, p3);

    execFileSync('magick', [
      p1, p2, p3,
      '-background', 'none',
      '+append',
      '-trim', '+repage',
      word,
    ]);

    // 마크 + 워드마크를 가로로 이어 붙이고 세로 중앙 정렬
    // +repage: append가 남기는 잘못된 캔버스(page) 정보를 제거한다.
    //          안 하면 page가 실제 크기와 달라 일부 뷰어/도구에서 로고가 잘린다.
    execFileSync('magick', [
      mark, word,
      '-background', 'none',
      '-gravity', 'center',
      '+append',
      '-bordercolor', 'none',
      '-border', '40x40',
      '+repage',
      out,
    ]);
    console.log(`✅ ${out}`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
