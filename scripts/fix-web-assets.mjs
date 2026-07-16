/**
 * 웹 배포용 에셋 경로 보정.
 *
 * 문제: Expo는 패키지(node_modules) 안의 에셋을 dist/assets/node_modules/... 로 출력하는데,
 *       wrangler(Cloudflare Pages)는 업로드 시 "node_modules" 경로를 하드코딩으로 제외한다.
 *       → Ionicons·expo-router 아이콘이 통째로 누락되고, SPA 폴백이
 *         대신 index.html을 내려줘 "폰트가 text/html"인 상태가 된다.
 *
 * 해결: dist/assets/node_modules → dist/assets/vendor 로 옮기고,
 *       번들·소스맵의 참조 문자열도 함께 치환한다.
 *
 * 실행: npm run build:web 이 자동으로 호출 (package.json 참고)
 */
import { existsSync } from 'node:fs';
import { readdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = 'dist';
const FROM_DIR = join(DIST, 'assets', 'node_modules');
const TO_DIR = join(DIST, 'assets', 'vendor');
const FROM_URL = 'assets/node_modules/';
const TO_URL = 'assets/vendor/';

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

async function main() {
  if (!existsSync(FROM_DIR)) {
    console.log('[fix-web-assets] assets/node_modules 없음 — 건너뜀');
    return;
  }

  await rename(FROM_DIR, TO_DIR);

  // 번들/HTML에 남은 참조 문자열 치환
  const files = (await walk(DIST)).filter((f) =>
    /\.(js|html|json|map|css)$/.test(f),
  );

  let patched = 0;
  for (const file of files) {
    const src = await readFile(file, 'utf8');
    if (!src.includes(FROM_URL)) continue;
    await writeFile(file, src.split(FROM_URL).join(TO_URL));
    patched++;
  }

  console.log(
    `[fix-web-assets] assets/node_modules → assets/vendor (참조 ${patched}개 파일 치환)`,
  );
}

main().catch((e) => {
  console.error('[fix-web-assets] 실패', e);
  process.exit(1);
});
