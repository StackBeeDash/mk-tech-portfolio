/**
 * Campaign エンティティ
 *
 * マーケティングキャンペーンのライフサイクルを管理する。
 * 状態遷移のビジネスルールをエンティティ内に閉じ込める。
 */
import { CampaignId } from "../value-objects/campaign-id.js";
import { Money } from "../value-objects/money.js";
import { DateRange } from "../value-objects/date-range.js";

export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export interface CampaignProps {
  id: CampaignId;
  name: string;
  budget: Money;
  dateRange: DateRange;
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Campaign {
  private props: CampaignProps;

  constructor(props: CampaignProps) {
    this.props = { ...props };
  }

  static create(params: {
    name: string;
    budget: Money;
    dateRange: DateRange;
  }): Campaign {
    if (!params.name || params.name.trim().length === 0) {
      throw new Error("Campaign name cannot be empty");
    }
    const now = new Date();
    return new Campaign({
      id: CampaignId.generate(),
      name: params.name.trim(),
      budget: params.budget,
      dateRange: params.dateRange,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
  }

  get id(): CampaignId {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get budget(): Money {
    return this.props.budget;
  }

  get dateRange(): DateRange {
    return this.props.dateRange;
  }

  get status(): CampaignStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * キャンペーンを有効化する
   * Draft → Active のみ許可
   */
  activate(): void {
    if (this.props.status !== "draft") {
      throw new Error(
        `Cannot activate campaign in ${this.props.status} status. Only draft campaigns can be activated.`
      );
    }
    this.props.status = "active";
    this.props.updatedAt = new Date();
  }

  /**
   * キャンペーンを一時停止する
   * Active → Paused のみ許可
   */
  pause(): void {
    if (this.props.status !== "active") {
      throw new Error(
        `Cannot pause campaign in ${this.props.status} status. Only active campaigns can be paused.`
      );
    }
    this.props.status = "paused";
    this.props.updatedAt = new Date();
  }

  /**
   * 一時停止したキャンペーンを再開する
   * Paused → Active のみ許可
   */
  resume(): void {
    if (this.props.status !== "paused") {
      throw new Error(
        `Cannot resume campaign in ${this.props.status} status. Only paused campaigns can be resumed.`
      );
    }
    this.props.status = "active";
    this.props.updatedAt = new Date();
  }

  /**
   * キャンペーンを完了する
   * Active or Paused → Completed のみ許可
   */
  complete(): void {
    if (this.props.status !== "active" && this.props.status !== "paused") {
      throw new Error(
        `Cannot complete campaign in ${this.props.status} status. Only active or paused campaigns can be completed.`
      );
    }
    this.props.status = "completed";
    this.props.updatedAt = new Date();
  }
}
