// 한글 통화 및 수치 포맷터

// 억원 단위를 조/억원으로 가독성 높게 변환 (예: 23500 -> "2조 3,500억원", 400 -> "400억원")
export function formatKRW(amountIn100M: number): string {
  if (amountIn100M === 0) return '0원';

  const isNegative = amountIn100M < 0;
  const abs = Math.abs(amountIn100M);

  const jo = Math.floor(abs / 10000);
  const eok = abs % 10000;

  let result = '';
  if (jo > 0) {
    result += `${jo}조 `;
    if (eok > 0) {
      result += `${eok.toLocaleString()}억원`;
    } else {
      result += '원';
    }
  } else {
    result += `${eok.toLocaleString()}억원`;
  }

  return isNegative ? `-${result}` : result;
}

// 콤마 포맷터 (예: 5123 -> "5,123")
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// 백분율 포맷터 (예: 4.82 -> "4.8%")
export function formatPercent(num: number, decimals: number = 1): string {
  return `${num.toFixed(decimals)}%`;
}
