/*
 * Meridian Bank — database seed.
 *  Run with:  npx prisma db seed
 *
 * ────────────────────────────────────────────────────────────────────────
 *  CREATING DEFAULT USERS
 *
 *  1. Add an entry to the SEED_USERS array below (or edit an existing one).
 *  2. Re-run:  npx prisma db seed
 *
 *  NOTE: reseeding WIPEs all data (users, accounts, transactions,
 *  mandates) and rebuilds from this file. It also invalidates existing
 *  sessions, so anyone signed in must log in again.
 *
 *  The administrator (admin@meridian.com) is created separately, right
 *  below the array — it exists ONLY because this seed creates it.
 *  Registration in the app can never create an admin.
 * ────────────────────────────────────────────────────────────────────────
 */
import 'dotenv/config';
import { PrismaClient, Role, AccountType, Frequency } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/* ════════════════════════════════════════════════════════════════════════
   DEFAULT USERS — edit this block, then re-run `npx prisma db seed`
   ════════════════════════════════════════════════════════════════════════ */

export interface MandateSpec {
  merchant: string;
  amount: number;
  frequency: 'WEEKLY' | 'MONTHLY';
  /**
   * Days from "now" until the mandate runs.
   * Negative values make it OVERDUE, so it settles live the first time
   * the member opens the app (autopilot demo).
   */
  dueInDays: number;
}

export interface SeedUserSpec {
  name: string;
  email: string;
  password: string;
  /** How many days ago this member signed up. */
  ageDays: number;
  /** Accounts to open. Default: CHECKING + SAVINGS. (CREDIT = R5,000 line) */
  accounts?: AccountType[];
  /**
   * Fixed opening deposit from the admin treasury.
   * Omit to roll a realistic random one (R1,800 – R24,000).
   */
  openingDeposit?: number;
  /** Debit-order mandates to register for this member. */
  mandates?: MandateSpec[];
}

const SEED_USERS: SeedUserSpec[] = [
  {
    name: 'Amara Okafor',
    email: 'amara@demo.com',
    password: 'demo1234',
    ageDays: 22,
    accounts: ['CHECKING', 'SAVINGS', 'CREDIT'],
    openingDeposit: 4_945.0,
    mandates: [
      // Overdue by a few hours → autopilot settles it on her first login.
      { merchant: 'Netflix', amount: 199, frequency: 'MONTHLY', dueInDays: -0.1 },
      { merchant: 'Glo2 Gym', amount: 399, frequency: 'MONTHLY', dueInDays: 21 },
    ],
  },
  {
    name: 'Jonas Weber',
    email: 'jonas@demo.com',
    password: 'demo1234',
    ageDays: 31,
    accounts: ['CHECKING', 'SAVINGS'],
    mandates: [
      { merchant: 'Vodacom', amount: 350, frequency: 'MONTHLY', dueInDays: 9 },
      { merchant: 'Netflix', amount: 199, frequency: 'MONTHLY', dueInDays: 4 },
    ],
  },
  {
    name: 'Priya Sharma',
    email: 'priya@demo.com',
    password: 'demo1234',
    ageDays: 40,
    accounts: ['CHECKING', 'SAVINGS', 'CREDIT'],
    mandates: [{ merchant: 'Spotify', amount: 79, frequency: 'MONTHLY', dueInDays: 15 }],
  },
  {
    name: 'Diego Ramírez',
    email: 'diego@demo.com',
    password: 'demo1234',
    ageDays: 48,
    accounts: ['CHECKING', 'SAVINGS'],
    mandates: [{ merchant: 'Spotify', amount: 79, frequency: 'WEEKLY', dueInDays: 5 }],
  },
  {
    name: 'Grace Chen',
    email: 'grace@demo.com',
    password: 'demo1234',
    ageDays: 55,
    accounts: ['CHECKING', 'SAVINGS', 'CREDIT'],
    mandates: [{ merchant: 'Boxer Fibre', amount: 599, frequency: 'MONTHLY', dueInDays: 2 }],
  },
  {
    name: 'Tom Becker',
    email: 'tom@demo.com',
    password: 'demo1234',
    ageDays: 63,
    accounts: ['CHECKING', 'SAVINGS'],
    mandates: [{ merchant: 'MTN Airtime', amount: 250, frequency: 'WEEKLY', dueInDays: 3 }],
  },
  {
    name: 'Lena Kowalski',
    email: 'lena@demo.com',
    password: 'demo1234',
    ageDays: 71,
    accounts: ['CHECKING', 'SAVINGS', 'CREDIT'],
    mandates: [{ merchant: 'Netflix', amount: 199, frequency: 'MONTHLY', dueInDays: 11 }],
  },
  // ── Add your own default users here, e.g. ─────────────────────────────
  // {
  //   name: 'Thabo Mokoena',
  //   email: 'thabo@example.com',
  //   password: 'demo1234',
  //   ageDays: 10,
  //   accounts: ['CHECKING', 'SAVINGS'],
  //   openingDeposit: 7_500,
  //   mandates: [
  //     { merchant: 'Netflix', amount: 199, frequency: 'MONTHLY', dueInDays: 6 },
  //   ],
  // },
];

/* ════════════════════════════════════════════════════════════════════════ */

/* ---------------- deterministic RNG so the ledger always adds up -------- */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260214);
const between = (min: number, max: number) => min + rand() * (max - min);
const pick = <T,>(arr: readonly T[]): T =>
  arr[Math.floor(rand() * arr.length)];
const cents = (n: number) => Math.round(n * 100) / 100;

function accountNumber(): string {
  let s = '';
  for (let i = 0; i < 16; i++) s += Math.floor(rand() * 10);
  return s.replace(/(\d{4})(?=\d)/g, '$1 ');
}

const REF_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function ref(): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += REF_CHARS[Math.floor(rand() * REF_CHARS.length)];
  let t = '';
  for (let i = 0; i < 2; i++) t += REF_CHARS[Math.floor(rand() * REF_CHARS.length)];
  return `MDB-${s}-${t}`;
}

/* ---------------- helpers that keep the ledger consistent --------------- */
const bal: Record<string, number> = {};

async function makeUser(
  name: string,
  email: string,
  password: string,
  role: Role,
  created: Date
) {
  return prisma.user.create({
    data: {
      name,
      email,
      role,
      createdAt: created,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
}

async function makeAccount(userId: string, type: AccountType, created: Date) {
  const acc = await prisma.account.create({
    data: {
      userId,
      type,
      number: accountNumber(),
      creditLimit: type === 'CREDIT' ? 5000 : 0,
      balance: 0,
      createdAt: created,
    },
  });
  bal[acc.id] = 0;
  return acc;
}

async function credit(
  accountId: string,
  receiverId: string | null,
  amount: number,
  note: string,
  when: Date
) {
  await prisma.transaction.create({
    data: {
      reference: ref(),
      kind: 'CREDIT',
      amount: cents(amount),
      note,
      toAccountId: accountId,
      receiverId,
      createdAt: when,
    },
  });
  await prisma.account.update({
    where: { id: accountId },
    data: { balance: { increment: amount } },
  });
  bal[accountId] = cents((bal[accountId] ?? 0) + amount);
}

async function transfer(
  senderId: string,
  fromAccountId: string,
  receiverId: string,
  toAccountId: string,
  amount: number,
  note: string,
  when: Date
) {
  const amt = cents(amount);
  if ((bal[fromAccountId] ?? 0) < amt) return false; // skip if it would overdraft
  await prisma.transaction.create({
    data: {
      reference: ref(),
      kind: 'TRANSFER',
      amount: amt,
      note,
      fromAccountId,
      toAccountId,
      senderId,
      receiverId,
      createdAt: when,
    },
  });
  await prisma.account.update({
    where: { id: fromAccountId },
    data: { balance: { decrement: amt } },
  });
  await prisma.account.update({
    where: { id: toAccountId },
    data: { balance: { increment: amt } },
  });
  bal[fromAccountId] = cents((bal[fromAccountId] ?? 0) - amt);
  bal[toAccountId] = cents((bal[toAccountId] ?? 0) + amt);
  return true;
}

/* --------------------------------- main --------------------------------- */
const NOTES = [
  'Lunch split',
  'Concert tickets',
  'Groceries run',
  'Rent share',
  'Birthday gift',
  'Flight deposit',
  'Dinner last night',
  'Coffee & pastries',
  'Gym membership',
  'House fund',
  'Book club payout',
  'Taxi home',
  'Weekend cabin',
  'Movie night',
  'Phone bill split',
  'Yard work',
  'Team outing',
  'Holiday card',
  'Rideshare split',
  'Board game night',
];

const WELCOME_CREDIT = 250;

async function main() {
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const now = Date.now();
  const daysAgo = (d: number, h = 0) => new Date(now - d * 86400000 - h * 3600000);

  /* ----- admin (created ONLY by this seed — never by the app) ----- */
  const admin = await makeUser('Avery Sterling', 'admin@meridian.com', 'admin1234', Role.ADMIN, daysAgo(120));
  const adminChecking = await makeAccount(admin.id, AccountType.CHECKING, daysAgo(120));
  const adminSavings = await makeAccount(admin.id, AccountType.SAVINGS, daysAgo(119));
  await credit(adminChecking.id, admin.id, 1_250_000, 'Treasury funding', daysAgo(120, 2));
  await credit(adminSavings.id, admin.id, 750_000, 'Treasury funding', daysAgo(119, 2));

  /* ----- default users (from SEED_USERS) ----- */
  interface Seeded {
    userId: string;
    checkingId: string | null;
    savingsId: string | null;
    firstId: string;
  }
  const seeded: Seeded[] = [];

  for (const spec of SEED_USERS) {
    const types = spec.accounts ?? ['CHECKING', 'SAVINGS'];
    const u = await makeUser(spec.name, spec.email, spec.password, Role.CUSTOMER, daysAgo(spec.ageDays));

    let checkingId: string | null = null;
    let savingsId: string | null = null;
    let firstId = '';
    for (let i = 0; i < types.length; i++) {
      const acc = await makeAccount(u.id, types[i], daysAgo(spec.ageDays, i + 1));
      if (!firstId) firstId = acc.id;
      if (types[i] === 'CHECKING') checkingId = acc.id;
      if (types[i] === 'SAVINGS') savingsId = acc.id;
    }

    await credit(firstId, u.id, WELCOME_CREDIT, 'Welcome credit', daysAgo(spec.ageDays, 2));

    const deposit = cents(spec.openingDeposit ?? between(1_800, 24_000));
    const depositTarget = checkingId ?? firstId;
    await transfer(admin.id, adminChecking.id, u.id, depositTarget, deposit, 'Opening deposit', daysAgo(spec.ageDays - 1));

    // mandates — deduct from checking when available, else the first account
    for (const m of spec.mandates ?? []) {
      const fromAccountId = checkingId ?? firstId;
      await prisma.debitOrder.create({
        data: {
          userId: u.id,
          merchant: m.merchant,
          amount: m.amount,
          frequency: m.frequency === 'WEEKLY' ? Frequency.WEEKLY : Frequency.MONTHLY,
          nextRun: daysAgo(-m.dueInDays),
          status: 'ACTIVE',
          fromAccountId,
        },
      });
    }

    seeded.push({ userId: u.id, checkingId, savingsId, firstId });
  }

  /* ----- 30 days of inter-user transfers (between users who have checking) ----- */
  const checkers = seeded.filter((s) => s.checkingId);
  if (checkers.length >= 2) {
    let done = 0;
    let guard = 0;
    while (done < 38 && guard++ < 200) {
      const a = pick(checkers);
      const b = pick(checkers);
      if (a.userId === b.userId) continue;
      const amount = cents(pick([between(9, 240), between(150, 1400)]));
      const ok = await transfer(
        a.userId, a.checkingId!, b.userId, b.checkingId!,
        amount, pick(NOTES), daysAgo(between(0.2, 29), between(0, 20))
      );
      if (ok) done++;
    }
  }

  /* ----- moves to savings ----- */
  for (const s of seeded) {
    if (!s.checkingId || !s.savingsId) continue;
    const amount = cents(between(400, 5200));
    await transfer(s.userId, s.checkingId, s.userId, s.savingsId, amount, 'Moved to savings', daysAgo(between(1, 24), 5));
  }

  const [users, accounts, txns, dos] = await Promise.all([
    prisma.user.count(),
    prisma.account.count(),
    prisma.transaction.count(),
    prisma.debitOrder.count(),
  ]);

  console.log('');
  console.log('✓ Meridian Bank seeded');
  console.log(
    `  ${users} users · ${accounts} accounts · ${txns} ledger entries · ${dos} debit orders`
  );
  console.log('');
  console.log('  Administrator (seed-only):');
  console.log('    admin@meridian.com  /  admin1234');
  console.log('');
  console.log('  Default users:');
  for (const s of SEED_USERS) {
    console.log(`    ${s.email.padEnd(24)} /  ${s.password}`);
  }
  console.log('');
  console.log('  Tip: edit SEED_USERS at the top of prisma/seed.ts to add');
  console.log('  your own default users, then re-run `npx prisma db seed`.');
  console.log('');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
