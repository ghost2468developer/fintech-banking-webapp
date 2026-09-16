export type Role = "ADMIN" | "CUSTOMER";
export type AccountType = "CHECKING" | "SAVINGS" | "CREDIT";
export type TxKind = "TRANSFER" | "CREDIT" | "PURCHASE" | "BILL" | "DEBIT_ORDER";
export type TxDirection = "sent" | "received" | "credit" | "out";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string | Date;
}

export interface PublicAccount {
  id: string;
  number: string;
  type: AccountType;
  balance: number;
  creditLimit: number;
  /** balance + available credit */
  available: number;
  createdAt: string | Date;
}

export interface SearchHit {
  id: string;
  name: string;
  email: string;
  accounts: {
    id: string;
    type: AccountType;
    number: string;
    balance: number;
  }[];
}

export interface TxView {
  id: string;
  reference: string;
  kind: TxKind;
  amount: number;
  note: string | null;
  createdAt: string | Date;
  direction: TxDirection;
  counterparty: { name: string; email: string | null } | null;
  counterpartyAccountId: string | null;
  fromAccountType: AccountType | null;
  toAccountType: AccountType | null;
}

export interface DebitOrderView {
  id: string;
  merchant: string;
  amount: number;
  frequency: "WEEKLY" | "MONTHLY";
  nextRun: string | Date;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  fromAccount: {
    id: string;
    type: AccountType;
    number: string;
    balance: number;
  };
  createdAt: string | Date;
}

export interface SettledDebitOrder {
  merchant: string;
  amount: number;
  reference: string;
  nextRun: string | Date;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string | Date;
  lastActivity: string | Date | null;
  accounts: {
    id: string;
    type: AccountType;
    number: string;
  }[];
}

export interface AdminStats {
  totalUsers: number;
  totalAccounts: number;
  newUsers7d: number;
  ledgerEntries: number;
  activeMandates: number;
}

export interface AdminDetail {
  user: AdminUserRow;
  ledgerEntries: number;
}
