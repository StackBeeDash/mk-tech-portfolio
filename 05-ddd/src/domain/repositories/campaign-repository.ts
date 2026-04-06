/**
 * CampaignRepository インターフェース
 *
 * 集約の永続化を抽象化するリポジトリパターン。
 * ドメイン層はインフラストラクチャの詳細を知らない（依存性逆転の原則）。
 */
import { CampaignAggregate } from "../aggregates/campaign-aggregate.js";
import { CampaignId } from "../value-objects/campaign-id.js";

export interface CampaignRepository {
  save(aggregate: CampaignAggregate): Promise<void>;
  findById(id: CampaignId): Promise<CampaignAggregate | null>;
  findAll(): Promise<CampaignAggregate[]>;
}
