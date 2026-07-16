/**
 * 배포 전 안전장치.
 * Supabase 환경변수가 번들에 실제로 주입됐는지 검사한다.
 *
 * 왜 필요한가: Metro/Babel 캐시가 .env 생성 이전 상태로 굳으면
 * process.env.EXPO_PUBLIC_*가 void 0으로 컴파일되고,
 * 앱이 조용히 "목데이터 모드"로 배포된다 (에러가 안 나서 알아채기 어렵다).
 *
 * 이 스크립트는 별도 프로세스라 expo가 로드한 env를 물려받지 못하므로 .env를 직접 읽는다.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function loadEnv(file = '.env') {
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = { ...loadEnv(), ...process.env };
const url = env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    '❌ EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY 가 없습니다.',
  );
  console.error('   → cp .env.example .env 후 값을 채우세요.');
  process.exit(1);
}

const dir = 'dist/_expo/static/js/web';
const bundle = readdirSync(dir).find(
  (f) => f.startsWith('entry-') && f.endsWith('.js'),
);
if (!bundle) {
  console.error('❌ 번들을 찾을 수 없습니다 — 빌드 실패 여부를 확인하세요.');
  process.exit(1);
}
const src = readFileSync(join(dir, bundle), 'utf8');

const host = new URL(url).host;
const problems = [];
if (!src.includes(host)) problems.push(`Supabase URL(${host})이 번들에 없음`);
if (!src.includes(key)) problems.push('Supabase KEY가 번들에 없음');
if (src.includes('localhost:54321')) problems.push('폴백 URL 잔존 → env 미주입');
if (src.includes('assets/node_modules/'))
  problems.push('assets/node_modules 경로 잔존 → wrangler가 업로드에서 제외함');

if (problems.length) {
  console.error('❌ 빌드 검증 실패 — 배포하지 마세요');
  problems.forEach((p) => console.error('   · ' + p));
  console.error(
    '   → npx expo export --platform web --clear 로 캐시를 지우고 다시 빌드하세요.',
  );
  process.exit(1);
}
console.log(`✅ 빌드 검증 통과 — Supabase(${host}) 주입 확인, 에셋 경로 정상`);
