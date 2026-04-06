/**
 * InMemoryCampaignRepository
 *
 * テスト・デモ用のインメモリリポジトリ実装。
 * 本番環境では DB を使う実装に差し替える（依存性逆転の原則）。
 */
import { CampaignAggregate } from "../domain/aggregates/campaign-aggregate.js";
import { CampaignId } from "../domain/value-objects/campaign-id.js";
import { CampaignRepository } from "../domain/repositories/campaign-repository.js";

export class InMemoryCampaignRepository implements CampaignRepository {
  private store = new Map<string, CampaignAggregate>();

  async save(aggregate: CampaignAggregate): Promise<void> {
    this.store.set(aggregate.id.toString(), aggregate);
  }

  async findById(id: CampaignId): Promise<CampaignAggregate | null> {
    return this.store.get(id.toString()) ?? null;
  }

  async findAll(): Promise<CampaignAggregate[]> {
    return Array.from(this.store.values());
  }

  /** テスト用: ストアをクリアする */
  clear(): void {
    this.store.clear();
  }
}
