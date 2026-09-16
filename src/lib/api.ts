import { NextResponse } from "next/server";
import type {
  AccountType,
  PublicAccount,
  PublicUser,
  TxDirection,
  TxView,
} from "@/lib/types";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export const ACCOUNT_TYPES: AccountType[] = ["CHECKING", "SAVINGS", "CREDIT"];

export function publicUser(u: {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}): PublicUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as PublicUser["role"],
    createdAt: u.createdAt.toISOString(),
  };
}

export function publicAccount(a: {
  id: string;
  number: string;
  type: string;
  balance: { toString(): string } | number;
  creditLimit: { toString(): string } | number;
  createdAt: Date;
}): PublicAccount {
  const balance = typeof a.balance === "number" ? a.balance : Number(a.balance);
  const creditLimit =
    typeof a.creditLimit === "number" ? a.creditLimit : Number(a.creditLimit);
  return {
    id: a.id,
    number: a.number,
    type: a.type as AccountType,
    balance,
    creditLimit,
    available: balance + creditLimit,
    createdAt: a.createdAt.toISOString(),
  };
}

export type TxWithRelations = {
  id: string;
  reference: string;
  kind: string;
  amount: { toString(): string } | number;
  note: string | null;
  counterparty: string | null;
  createdAt: Date;
  senderId: string | null;
  receiverId: string | null;
  fromAccountId: string | null;
  toAccountId: string | null;
  sender: { name: string; email: string } | null;
  receiver: { name: string; email: string } | null;
  fromAccount: { type: AccountType } | null;
  toAccount: { type: AccountType } | null;
};

export function toTxView(t: TxWithRelations, meId: string): TxView {
  let direction: TxDirection;
  let party: { name: string; email: string | null } | null = null;
  let partyAccountId: string | null = null;

  if (t.kind === "TRANSFER") {
    if (t.senderId === meId) {
      direction = "sent";
      party = t.receiver
        ? { name: t.receiver.name, email: t.receiver.email }
        : null;
      partyAccountId = t.toAccountId;
    } else {
      direction = "received";
      party = t.sender ? { name: t.sender.name, email: t.sender.email } : null;
      partyAccountId = t.fromAccountId;
    }
  } else if (t.kind === "CREDIT") {
    direction = "credit";
    party = t.counterparty
      ? { name: t.counterparty, email: null }
      : { name: "Meridian Bank", email: null };
  } else {
    // PURCHASE / BILL / DEBIT_ORDER money out to a merchant or biller
    direction = "out";
    party = t.counterparty ? { name: t.counterparty, email: null } : null;
    partyAccountId = t.fromAccountId;
  }

  return {
    id: t.id,
    reference: t.reference,
    kind: t.kind as TxView["kind"],
    amount: typeof t.amount === "number" ? t.amount : Number(t.amount),
    note: t.note,
    createdAt: t.createdAt.toISOString(),
    direction,
    counterparty: party,
    counterpartyAccountId: partyAccountId,
    fromAccountType: t.fromAccount?.type ?? null,
    toAccountType: t.toAccount?.type ?? null,
  };
}
