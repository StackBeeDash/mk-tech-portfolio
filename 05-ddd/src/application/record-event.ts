/**
 * RecordEvent ユースケース
 *
 * キャンペーンにトラッキングイベントを記録するアプリケーションサービス。
 */
import { CampaignRepository } from "../domain/repositories/campaign-repository.js";
import { CampaignId } from "../domain/value-objects/campaign-id.js";
import { EventType } from "../domain/value-objects/event-type.js";

export interface RecordEventInput {
  campaignId: string;
  eventType: EventType;
  metadata?: Record<string, string>;
}

export interface RecordEventOutput {
  eventId: string;
  campaignId: string;
  eventType: string;
  timestamp: string;
}

export class RecordEventUseCase {
  constructor(private readonly repository: CampaignRepository) {}

  async execute(input: RecordEventInput): Promise<RecordEventOutput> {
    const campaignId = CampaignId.create(input.campaignId);
    const aggregate = await this.repository.findById(campaignId);

    if (!aggregate) {
      throw new Error(`Campaign not found: ${input.campaignId}`);
    }

    const event = aggregate.recordEvent(input.eventType, input.metadata);
    await this.repository.save(aggregate);

    return {
      eventId: event.id.toString(),
      campaignId: event.campaignId.toString(),
      eventType: event.eventType,
      timestamp: event.timestamp.toISOString(),
    };
  }
}
