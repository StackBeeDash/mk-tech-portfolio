/**
 * Money 値オブジェクト
 *
 * 金額と通貨の組み合わせを表現する不変の値。
 * 浮動小数点の誤差を避けるため、内部では整数（最小通貨単位）で保持する。
 */
export type Currency = "JPY" | "USD" | "EUR";

const DECIMAL_PLACES: Record<Currency, number> = {
  JPY: 0,
  USD: 2,
  EUR: 2,
};

export class Money {
  private constructor(
    private readonly amountInMinorUnit: number,
    private readonly currency: Currency
  ) {}

  static create(amount: number, currency: Currency): Money {
    if (amount < 0) {
      throw new Error("Money amount cannot be negative");
    }
    const decimals = DECIMAL_PLACES[currency];
    const minorUnit = Math.round(amount * Math.pow(10, decimals));
    return new Money(minorUnit, currency);
  }

  getAmount(): number {
    const decimals = DECIMAL_PLACES[this.currency];
    return this.amountInMinorUnit / Math.pow(10, decimals);
  }

  getCurrency(): Currency {
    return this.currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot add different currencies: ${this.currency} and ${other.currency}`
      );
    }
    const newAmount =
      (this.amountInMinorUnit + other.amountInMinorUnit) /
      Math.pow(10, DECIMAL_PLACES[this.currency]);
    return Money.create(newAmount, this.currency);
  }

  isGreaterThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error("Cannot compare different currencies");
    }
    return this.amountInMinorUnit > other.amountInMinorUnit;
  }

  equals(other: Money): boolean {
    return (
      this.amountInMinorUnit === other.amountInMinorUnit &&
      this.currency === other.currency
    );
  }

  toString(): string {
    return `${this.getAmount()} ${this.currency}`;
  }
}
