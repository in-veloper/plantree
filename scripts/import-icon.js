// 사용자가 준 나무 아이콘 이미지(스퀴클 배경이 이미 그려진 완성 이미지)를
// 안드로이드 적응형 아이콘 레이어(배경/전경)로 만든다. 알파 채널이 없는
// 평평한 이미지라, 진짜 투명 전경을 뽑는 대신: 이미지 안의 크림색을 그대로
// 배경색으로 쓰고, 전경은 같은 크림색 캔버스 위에 원본을 safe zone 안쪽
// 크기로 축소해 중앙에 앉힌다 — 마스크가 가장자리를 잘라내도 배경과 색이
// 같아서 이어붙인 듯 자연스럽다.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.join(__dirname, '..', 'assets');
const SRC = path.join(OUT, 'ChatGPT Image 2026년 9월 23일 오후 02_34_19.png');

// 원본 1254x1254 캔버스 안에서 흰 여백을 뺀 실제 스퀴클 아이콘 영역(직접 픽셀 스캔으로 확인).
// 경계에 약간의 안티앨리어싱(살짝 밝은 테두리)이 남아 있어서, 리사이즈 후
// 배경과 이어붙일 때 희미한 사각 테두리가 보였다 — 더 안쪽으로 잘라낸다.
const CROP = { left: 118, top: 118, width: 1018, height: 1018 };

async function main() {
  const clean = sharp(SRC).extract(CROP);
  const cleanBuf = await clean.resize(1024, 1024).png().toBuffer();

  // icon.png — 그대로 완성 아이콘.
  fs.writeFileSync(path.join(OUT, 'icon.png'), cleanBuf);

  // 적응형 아이콘 전경 — 처음엔 원본을 꽉 채운 그대로 썼는데, 실제
  // 기기(원형이 아닌 마스크를 쓰는 런처)에서 우측 위 체크 잎 끝이 잘려
  // 보였다. 자로 재보니 그 잎 끝이 중심에서 반지름의 약 94%(1024 기준
  // 약 482px) 떨어져 있어, 안드로이드가 보장하는 safe zone(반지름 33%,
  // 약 338px)에 한참 못 미쳤다 — 0.86 배 축소로는 부족해서 0.62 로 더
  // 줄인다(잎 끝이 약 299px 로 들어와 여유 있게 안전권).
  const bgColor = { r: 253, g: 244, b: 230 }; // #FDF4E6, 원본 속 크림색과 동일.
  const inner = Math.round(1024 * 0.62);
  const offset = Math.round((1024 - inner) / 2);
  const innerResized = await sharp(cleanBuf).resize(inner, inner).toBuffer();

  // 이 정도로 줄이면 그림 자체는 이미 안쪽 94% 안에 다 들어오니, 아주
  // 바깥쪽 가장자리만 살짝 페이드시켜 이음매를 지운다(그림 내용은 전혀
  // 안 건드림).
  const fadeMask = Buffer.from(`
    <svg width="${inner}" height="${inner}">
      <defs>
        <radialGradient id="g" cx="50%" cy="50%" r="50%">
          <stop offset="90%" stop-color="white" stop-opacity="1" />
          <stop offset="100%" stop-color="white" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="${inner}" height="${inner}" fill="url(#g)" />
    </svg>
  `);
  const fadedInner = await sharp(innerResized)
    .composite([{ input: fadeMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const fgCanvas = await sharp({
    create: { width: 1024, height: 1024, channels: 3, background: bgColor },
  })
    .composite([{ input: fadedInner, left: offset, top: offset }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(OUT, 'android-icon-foreground.png'), fgCanvas);
  fs.writeFileSync(
    path.join(OUT, 'android-icon-background.png'),
    await sharp({ create: { width: 1024, height: 1024, channels: 3, background: bgColor } })
      .png()
      .toBuffer()
  );

  // 모노크롬 — 알파가 없는 원본이라 완벽한 실루엣은 못 뽑지만, 축소된
  // 전경을 그대로 재사용해 최소한 낡은 체크리스트 아이콘과 안 어긋나게 맞춘다.
  fs.writeFileSync(path.join(OUT, 'android-icon-monochrome.png'), fgCanvas);

  // 스플래시 — 살짝 작게, 투명 없이 크림 배경째로.
  const splash = await sharp(cleanBuf).resize(640, 640).png().toBuffer();
  fs.writeFileSync(path.join(OUT, 'splash-icon.png'), splash);

  // 파비콘
  const favicon = await sharp(cleanBuf).resize(196, 196).png().toBuffer();
  fs.writeFileSync(path.join(OUT, 'favicon.png'), favicon);

  console.log('아이콘 교체 완료 — 배경색 #FDF4E6');
}

main();
