import fs from 'fs';
const buf = fs.readFileSync('docs/법정동코드 전체자료.txt');
const text = new TextDecoder('euc-kr').decode(buf);
const lines = text.split('\n');
const seoulGu = [];
for (const line of lines) {
    const parts = line.trim().split('\t');
    if (parts.length < 3) continue;
    const code = parts[0];
    const name = parts[1];
    const status = parts[2];
    if (code.startsWith('11') && code.endsWith('00000') && status.includes('존재')) {
        const nameParts = name.split(' ');
        if (nameParts.length === 2 && nameParts[1].endsWith('구')) {
            seoulGu.push(`  "${nameParts[1]}": "${code.substring(0, 5)}",`);
        }
    }
}
const output = `export const SEOUL_GU_CODES = {\n${seoulGu.join('\n')}\n};\n`;
fs.writeFileSync('src/utils/regionCodes.js', output, 'utf-8');
console.log('Extracted ' + seoulGu.length + ' codes to src/utils/regionCodes.js');
