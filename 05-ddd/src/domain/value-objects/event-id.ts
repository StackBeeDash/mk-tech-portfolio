/**
 * EventId 値オブジェクト
 *
 * トラッキングイベントを一意に識別する不変の値。
 */
export class EventId {
  private constructor(private readonly value: string) {}

  static create(value: string): EventId {
    if (!value || value.trim().length === 0) {
      throw new Error("EventId cannot be empty");
    }
    return new EventId(value.trim());
  }

  static generate(): EventId {
    return new EventId(crypto.randomUUID());
  }

  toString(): string {
    return this.value;
  }

  equals(other: EventId): boolean {
    return this.value === other.value;
  }
}
