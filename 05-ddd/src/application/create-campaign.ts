/**
 * CreateCampaign ユースケース
 *
 * 新しいキャンペーンを作成するアプリケーションサービス。
 * ドメインロジックは集約に委譲し、ここではワークフローの調整のみ行う。
 */
import { CampaignAggregate } from "../domain/aggregates/campaign-aggregate.js";
import { CampaignRepository } from "../domain/repositories/campaign-repository.js";
import { Money, type Currency } from "../domain/value-objects/money.js";
import { DateRange } from "../domain/value-objects/date-range.js";

export interface CreateCampaignInput {
  name: string;
  budgetAmount: number;
  budgetCurrency: Currency;
  startDate: Date;
  endDate: Date;
}

export interface CreateCampaignOutput {
  campaignId: string;
  name: string;
  status: string;
}

export class CreateCampaignUseCase {
  constructor(private readonly repository: CampaignRepository) {}

  async execute(input: CreateCampaignInput): Promise<CreateCampaignOutput> {
    const budget = Money.create(input.budgetAmount, input.budgetCurrency);
    const dateRange = DateRange.create(input.startDate, input.endDate);

    const aggregate = CampaignAggregate.create({
      name: input.name,
      budget,
      dateRange,
    });

    await this.repository.save(aggregate);

    const campaign = aggregate.getCampaign();
    return {
      campaignId: campaign.id.toString(),
      name: campaign.name,
      status: campaign.status,
    };
  }
}
