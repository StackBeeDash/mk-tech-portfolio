/**
 * EventType 値オブジェクト
 *
 * トラッキングイベントの種別を表現する。
 * 型安全な列挙型として定義し、不正な値の混入を防ぐ。
 */
export const EventType = {
  Click: "click",
  Impression: "impression",
  Conversion: "conversion",
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

export function isValidEventType(value: string): value is EventType {
  return Object.values(EventType).includes(value as EventType);
}
