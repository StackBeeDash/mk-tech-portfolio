/**
 * CampaignId 値オブジェクト
 *
 * キャンペーンを一意に識別する不変の値。
 * UUID v4 形式を採用し、外部システムとの連携時にも衝突しにくい設計。
 */
export class CampaignId {
  private constructor(private readonly value: string) {}

  static create(value: string): CampaignId {
    if (!value || value.trim().length === 0) {
      throw new Error("CampaignId cannot be empty");
    }
    return new CampaignId(value.trim());
  }

  static generate(): CampaignId {
    const id = crypto.randomUUID();
    return new CampaignId(id);
  }

  toString(): string {
    return this.value;
  }

  equals(other: CampaignId): boolean {
    return this.value === other.value;
  }
}
