/**
 * TrackingEvent エンティティ
 *
 * ユーザーの行動を記録する1件のイベントデータ。
 * 一度作成されたら変更不可（イミュータブル）。
 * 計測データの信頼性を担保するため、作成後の変更を許さない設計。
 */
import { EventId } from "../value-objects/event-id.js";
import { EventType } from "../value-objects/event-type.js";
import { CampaignId } from "../value-objects/campaign-id.js";

export interface TrackingEventProps {
  id: EventId;
  campaignId: CampaignId;
  eventType: EventType;
  timestamp: Date;
  metadata: Record<string, string>;
}

export class TrackingEvent {
  private readonly props: TrackingEventProps;

  private constructor(props: TrackingEventProps) {
    this.props = Object.freeze({ ...props });
  }

  static create(params: {
    campaignId: CampaignId;
    eventType: EventType;
    metadata?: Record<string, string>;
  }): TrackingEvent {
    return new TrackingEvent({
      id: EventId.generate(),
      campaignId: params.campaignId,
      eventType: params.eventType,
      timestamp: new Date(),
      metadata: params.metadata ?? {},
    });
  }

  static reconstruct(props: TrackingEventProps): TrackingEvent {
    return new TrackingEvent(props);
  }

  get id(): EventId {
    return this.props.id;
  }

  get campaignId(): CampaignId {
    return this.props.campaignId;
  }

  get eventType(): EventType {
    return this.props.eventType;
  }

  get timestamp(): Date {
    return new Date(this.props.timestamp);
  }

  get metadata(): Record<string, string> {
    return { ...this.props.metadata };
  }
}
