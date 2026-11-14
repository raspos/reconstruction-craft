// Seeded Pseudo-Random Number Generator (Mulberry32)
// 시뮬레이션 재현성 및 밸런스 테스트의 일관성을 보장

export class SeededRNG {
  private state: number;

  constructor(seed: number = 20261114) {
    this.state = seed >>> 0;
  }

  // 0 이상 1 미만의 난수 반환
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // min 이상 max 이하의 정수 반환
  public range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // 확률 p (0~1) 성공 여부
  public chance(p: number): boolean {
    return this.next() < p;
  }

  // 배열에서 무작위 선택
  public choice<T>(arr: T[]): T {
    const idx = Math.floor(this.next() * arr.length);
    return arr[idx];
  }

  // 가우시안 근사 정규분포 (평균 0, 표준편차 1)
  public normal(): number {
    let u = 0;
    let v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}

export const defaultRNG = new SeededRNG(Date.now());
