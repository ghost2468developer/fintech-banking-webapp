export interface Merchant {
  name: string;
  category: string;
  code: string;
}

/** Partner merchants you can buy from directly. */
export const MERCHANTS: Merchant[] = [
  { name: "Makro", category: "Groceries", code: "MKT" },
  { name: "Checkers", category: "Groceries", code: "CKR" },
  { name: "Woolworths", category: "Supermarket", code: "WOW" },
  { name: "Pep", category: "Groceries", code: "PEP" },
  { name: "Takealot", category: "Online", code: "TKL" },
  { name: "Mr Price", category: "Fashion", code: "MRP" },
  { name: "Cape Union Mart", category: "Fashion", code: "CUM" },
  { name: "Dis-Chem", category: "Pharmacy", code: "DCH" },
  { name: "Clicks", category: "Health", code: "CLK" },
  { name: "Game", category: "Electronics", code: "GME" },
  { name: "Vodacom Airtime", category: "Airtime & Data", code: "VOD" },
  { name: "MTN Airtime", category: "Airtime & Data", code: "MTN" },
];

export interface Biller {
  name: string;
  billerCode: string;
  amount: number;
  /** days from "now" until this bill is due */
  dueInDays: number;
}

/** Registered billers with their current outstanding amounts. */
export const BILLERS: Biller[] = [
  { name: "Eskom", billerCode: "8444", amount: 1284.52, dueInDays: 4 },
  { name: "Netflix", billerCode: "3998", amount: 199.0, dueInDays: 2 },
  { name: "Spotify", billerCode: "4033", amount: 79.0, dueInDays: 1 },
  { name: "Boxer Fibre", billerCode: "3741", amount: 599.0, dueInDays: 6 },
  { name: "City of Cape Town", billerCode: "3410", amount: 968.3, dueInDays: 7 },
  { name: "Vodacom Prepaid", billerCode: "2752", amount: 150.0, dueInDays: 9 },
  { name: "FNB Home Loan", billerCode: "2780", amount: 8432.17, dueInDays: 12 },
];

export function billerDueDate(b: Biller): Date {
  return new Date(Date.now() + b.dueInDays * 86_400_000);
}

/** Advance a run date by one billing cycle. */
export function addInterval(date: Date, frequency: "WEEKLY" | "MONTHLY"): Date {
  const d = new Date(date);
  if (frequency === "MONTHLY") {
    d.setMonth(d.getMonth() + 1);
  } else {
    d.setDate(d.getDate() + 7);
  }
  return d;
}
