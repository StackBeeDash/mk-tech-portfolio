/**
 * DateRange 値オブジェクト
 *
 * 開始日と終了日のペアを表現する不変の値。
 * 開始日 <= 終了日の不変条件を保証する。
 */
export class DateRange {
  private constructor(
    private readonly startDate: Date,
    private readonly endDate: Date
  ) {}

  static create(startDate: Date, endDate: Date): DateRange {
    if (startDate > endDate) {
      throw new Error("Start date must be before or equal to end date");
    }
    return new DateRange(new Date(startDate), new Date(endDate));
  }

  getStartDate(): Date {
    return new Date(this.startDate);
  }

  getEndDate(): Date {
    return new Date(this.endDate);
  }

  contains(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate;
  }

  getDurationInDays(): number {
    const diff = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  overlaps(other: DateRange): boolean {
    return this.startDate <= other.endDate && this.endDate >= other.startDate;
  }

  equals(other: DateRange): boolean {
    return (
      this.startDate.getTime() === other.startDate.getTime() &&
      this.endDate.getTime() === other.endDate.getTime()
    );
  }

  toString(): string {
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    return `${fmt(this.startDate)} ~ ${fmt(this.endDate)}`;
  }
}
