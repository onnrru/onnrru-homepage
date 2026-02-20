const xml = `<?xml version='1.0' encoding='utf-8' standalone='yes'?><response><body><items><item><aptDong>527</aptDong><aptNm>주공아파트 5단지</aptNm><excluUseAr>76.5</excluUseAr><umdNm>잠실동</umdNm><dealYear>2024</dealYear><dealMonth>1</dealMonth><dealAmount>243,800</dealAmount></item></items></body></response>`;
const rx = /<umdNm>(.*?)<\/umdNm>/g;
let m;
while ((m = rx.exec(xml)) !== null) {
    let val = m[1];
    console.log("Raw:", "'" + val + "'", "Trimmed:", "'" + val.trim() + "'", "Match:", val.trim() === '잠실동');
}
