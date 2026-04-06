/**
 * CampaignAggregate 集約
 *
 * Campaign エンティティを集約ルートとし、関連する TrackingEvent を管理する。
 * 集約の境界内でトランザクション整合性を保証する。
 *
 * Why 集約を使うのか:
 * - Campaign と TrackingEvent の整合性を1つの単位で保つ
 * - 外部からは集約ルート（Campaign）経由でのみ操作を許可する
 * - 集約の外側とはイベント（結果整合性）で連携する
 */
import { Campaign } from "../entities/campaign.js";
import { TrackingEvent } from "../entities/tracking-event.js";
import { CampaignId } from "../value-objects/campaign-id.js";
import { EventType } from "../value-objects/event-type.js";
import { Money } from "../value-objects/money.js";
import { DateRange } from "../value-objects/date-range.js";

export interface DomainEvent {
  type: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export class CampaignAggregate {
  private events: TrackingEvent[] = [];
  private domainEvents: DomainEvent[] = [];

  constructor(private readonly campaign: Campaign) {}

  static create(params: {
    name: string;
    budget: Money;
    dateRange: DateRange;
  }): CampaignAggregate {
    const campaign = Campaign.create(params);
    const aggregate = new CampaignAggregate(campaign);
    aggregate.addDomainEvent({
      type: "CampaignCreated",
      payload: {
        campaignId: campaign.id.toString(),
        name: campaign.name,
      },
      occurredAt: new Date(),
    });
    return aggregate;
  }

  get id(): CampaignId {
    return this.campaign.id;
  }

  getCampaign(): Campaign {
    return this.campaign;
  }

  getEvents(): ReadonlyArray<TrackingEvent> {
    return [...this.events];
  }

  getDomainEvents(): ReadonlyArray<DomainEvent> {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  /**
   * キャンペーンを有効化し、ドメインイベントを発行する
   */
  activate(): void {
    this.campaign.activate();
    this.addDomainEvent({
      type: "CampaignActivated",
      payload: { campaignId: this.campaign.id.toString() },
      occurredAt: new Date(),
    });
  }

  /**
   * キャンペーンを完了し、ドメインイベントを発行する
   */
  complete(): void {
    this.campaign.complete();
    this.addDomainEvent({
      type: "CampaignCompleted",
      payload: {
        campaignId: this.campaign.id.toString(),
        totalEvents: this.events.length,
      },
      occurredAt: new Date(),
    });
  }

  /**
   * トラッキングイベントを記録する
   * キャンペーンが Active 状態のときのみ許可
   */
  recordEvent(eventType: EventType, metadata?: Record<string, string>): TrackingEvent {
    if (this.campaign.status !== "active") {
      throw new Error(
        `Cannot record events for campaign in ${this.campaign.status} status. Campaign must be active.`
      );
    }

    const event = TrackingEvent.create({
      campaignId: this.campaign.id,
      eventType,
      metadata,
    });
    this.events.push(event);

    this.addDomainEvent({
      type: "EventRecorded",
      payload: {
        eventId: event.id.toString(),
        campaignId: this.campaign.id.toString(),
        eventType,
      },
      occurredAt: new Date(),
    });

    return event;
  }

  /**
   * 特定種別のイベント数を取得する
   */
  countEvents(eventType?: EventType): number {
    if (!eventType) return this.events.length;
    return this.events.filter((e) => e.eventType === eventType).length;
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }
}
