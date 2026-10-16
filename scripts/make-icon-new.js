// 새로 받은 아이콘(크림색 둥근 사각형 + 달력과 새싹)을 적응형 아이콘 레이어로 만든다.
// 원본은 둥근 사각형 바깥이 거의 흰색이고 가장자리에 그림자가 있어서, 그대로 쓰면 경계가 보인다.
// 그래서 그림이 있는 안쪽 영역만 둥근 사각형(초타원) 모양으로 오려 가장자리를 부드럽게 풀어
// 크림색 배경 위에 얹는다 — 바깥 경계·그림자가 아예 들어오지 않고, 이음매도 남지 않는다.
// 사용: node scripts/make-icon-new.js <원본 이미지 경로>
const path = require('path');
const sharp = require('sharp');

const SRC = process.argv[2];
const ASSETS = path.join(__dirname, '..', 'assets');
const BG = [254, 250, 244]; // #FEFAF4, 원본 크림색 안쪽 평균
const SIZE = 1024;

// 원본(1254x1254)에서 그림 중심. 가로 335~920, 세로 230~995 에 그림이 있다.
const CX = 627;
const CY = 615;
const HALF = 440; // 잘라낼 정사각형 반변
const RA = 440; // 오림 모양 반폭
const RB = 425; // 오림 모양 반높이
const FEATHER = 0.2; // 가장자리에서 안쪽으로 풀어지는 비율

async function loadArt() {
  const side = HALF * 2;
  const { data } = await sharp(SRC)
    .extract({ left: CX - HALF, top: CY - HALF, width: side, height: side })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = Buffer.alloc(side * side * 4);
  const mono = Buffer.alloc(side * side * 4);
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const dx = (x - HALF) / RA;
      const dy = (y - HALF) / RB;
      const d = Math.pow(Math.pow(Math.abs(dx), 4) + Math.pow(Math.abs(dy), 4), 0.25);
      let m = Math.max(0, Math.min(1, (1 - d) / FEATHER));
      m = m * m * (3 - 2 * m);

      const i = (y * side + x) * 3;
      const o = (y * side + x) * 4;
      rgba[o] = data[i];
      rgba[o + 1] = data[i + 1];
      rgba[o + 2] = data[i + 2];
      rgba[o + 3] = Math.round(m * 255);

      // 단색 아이콘용: 배경과 얼마나 다른지로 윤곽을 뽑는다(초록 잎·머리띠는 진하게, 크림 몸통은 옅게).
      let diff = 0;
      for (let c = 0; c < 3; c++) diff = Math.max(diff, BG[c] - data[i + c]);
      const a = Math.max(0, Math.min(1, (diff - 14) / 70)) * m;
      mono[o] = mono[o + 1] = mono[o + 2] = 255;
      mono[o + 3] = Math.round(a * 255);
    }
  }
  return { rgba, mono, side };
}

async function place(buf, side, scale, background) {
  const s = Math.round(side * scale);
  const art = await sharp(buf, { raw: { width: side, height: side, channels: 4 } })
    .resize(s, s, { kernel: 'lanczos3' })
    .png()
    .toBuffer();
  const off = Math.round((SIZE - s) / 2);
  return sharp({ create: { width: SIZE, height: SIZE, channels: 4, background } })
    .composite([{ input: art, left: off, top: off }])
    .png();
}

(async () => {
  const { rgba, mono, side } = await loadArt();
  const clear = { r: 0, g: 0, b: 0, alpha: 0 };
  const solid = { r: BG[0], g: BG[1], b: BG[2], alpha: 1 };

  // 적응형 아이콘: 그림에서 가장 먼 점(중심에서 약 459px)이 안전영역(반지름 313) 안에 들어오게
  const sAdaptive = 0.66;
  (await place(rgba, side, sAdaptive, clear)).toFile(path.join(ASSETS, 'android-icon-foreground.png'));
  (await place(mono, side, sAdaptive, clear)).toFile(path.join(ASSETS, 'android-icon-monochrome.png'));
  await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: solid } })
    .png()
    .toFile(path.join(ASSETS, 'android-icon-background.png'));

  // 일반 아이콘: 크림 바탕 꽉 찬 사각형 위에 그림
  const full = await place(rgba, side, 0.95, solid);
  await full.toFile(path.join(ASSETS, 'icon.png'));
  await sharp(path.join(ASSETS, 'icon.png')).resize(196).png().toFile(path.join(ASSETS, 'favicon.png'));

  // 스플래시: 배경색 위에 그림만
  (await place(rgba, side, 0.8, clear)).toFile(path.join(ASSETS, 'splash-icon.png'));

  // 확인용 미리보기(런처가 원형으로 자르는 경우)
  const fg = await (await place(rgba, side, sAdaptive, solid)).toBuffer();
  const mask = Buffer.from(`<svg width="${SIZE}" height="${SIZE}"><circle cx="512" cy="512" r="341" fill="white"/></svg>`);
  await sharp(fg)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toFile(path.join(ASSETS, '_preview-circle.png'));

  console.log('완료 — 배경색 #FEFAF4');
})();
