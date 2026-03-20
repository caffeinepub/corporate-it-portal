/**
 * useNexusActor — creates a raw ICP actor that directly calls ALL custom
 * Nexus IT Portal / EBC Booking Management methods defined in main.mo.
 *
 * This bypasses the auto-generated backend.ts wrapper which only exposes
 * authorization-component methods and does NOT expose our custom methods.
 */
import { Actor, HttpAgent } from "@icp-sdk/core/agent";
import type { IDL } from "@icp-sdk/core/candid";
import { useEffect, useRef, useState } from "react";
import { loadConfig } from "../config";

export type NexusActor = {
  // --- Admin Auth ---
  adminLogin(username: string, password: string): Promise<[] | [string]>;
  verifyAdminToken(token: string): Promise<boolean>;
  logoutAdmin(token: string): Promise<void>;

  // --- Registration ---
  submitRegistration(
    name: string,
    dateOfBirth: string,
    email: string,
    mobile: string,
    country: string,
    roleTitle: string,
    registrationPurpose: string,
    deviceInfo: string,
  ): Promise<string>;
  getRegistrationStatusByEmail(
    email: string,
  ): Promise<[] | [RegistrationRecord]>;
  getRegistrationStatusByMobile(
    mobile: string,
  ): Promise<[] | [RegistrationRecord]>;
  getRegistrationStatusById(id: string): Promise<[] | [RegistrationRecord]>;
  getAllRegistrations(token: string): Promise<RegistrationRecord[]>;
  getPendingRegistrations(token: string): Promise<RegistrationRecord[]>;
  approveRegistration(token: string, regId: string): Promise<boolean>;
  rejectRegistration(
    token: string,
    regId: string,
    reason: string,
  ): Promise<boolean>;
  logFailedRegistration(
    email: string,
    roleTitle: string,
    errorMsg: string,
    deviceInfo: string,
  ): Promise<void>;
  getFailedLogs(token: string): Promise<FailedLog[]>;
  getRegistrationStats(token: string): Promise<RegistrationStats>;

  // --- Booking ---
  submitBooking(
    roomName: string,
    roomType: string,
    bookerName: string,
    panName: string,
    dob: string,
    mobile: string,
    email: string,
    purpose: string,
    bookingDate: string,
    bookingHour: string,
    bookingMinute: string,
    bookingSecond: string,
  ): Promise<string>;
  getBookingsByEmail(email: string): Promise<BookingRecord[]>;
  getBookingsByMobile(mobile: string): Promise<BookingRecord[]>;
  getBookingById(id: string): Promise<[] | [BookingRecord]>;
  getAllBookings(token: string): Promise<BookingRecord[]>;
  getPendingBookings(token: string): Promise<BookingRecord[]>;
  approveBooking(token: string, bookingId: string): Promise<boolean>;
  rejectBooking(
    token: string,
    bookingId: string,
    reason: string,
  ): Promise<boolean>;
  getBookingStats(token: string): Promise<BookingStats>;

  // --- Service Rating ---
  submitRating(
    bookingId: string,
    roomName: string,
    bookerName: string,
    email: string,
    selectedOptions: string[],
    overallComment: string,
  ): Promise<string>;
  getRatingsByEmail(email: string): Promise<ServiceRating[]>;
  getAllRatings(token: string): Promise<ServiceRating[]>;
};

export type RegistrationRecord = {
  id: string;
  name: string;
  dateOfBirth: string;
  email: string;
  mobile: string;
  country: string;
  roleTitle: string;
  registrationPurpose: string;
  deviceInfo: string;
  timestamp: bigint;
  status: { pending: null } | { approved: null } | { rejected: null };
  rejectionReason: [] | [string];
  loginUsername: [] | [string];
  loginPassword: [] | [string];
};

export type FailedLog = {
  email: string;
  roleTitle: string;
  errorMsg: string;
  deviceInfo: string;
  timestamp: bigint;
};

export type RegistrationStats = {
  total: bigint;
  pending: bigint;
  approved: bigint;
  rejected: bigint;
  failed: bigint;
};

export type BookingRecord = {
  id: string;
  roomName: string;
  roomType: string;
  bookerName: string;
  panName: string;
  dob: string;
  mobile: string;
  email: string;
  purpose: string;
  bookingDate: string;
  bookingHour: string;
  bookingMinute: string;
  bookingSecond: string;
  timestamp: bigint;
  status: { pending: null } | { approved: null } | { rejected: null };
  approvedBookingId: [] | [string];
  approvedAt: [] | [bigint];
  rejectedAt: [] | [bigint];
  rejectionReason: [] | [string];
};

export type BookingStats = {
  total: bigint;
  pending: bigint;
  approved: bigint;
  rejected: bigint;
};

export type ServiceRating = {
  id: string;
  bookingId: string;
  roomName: string;
  bookerName: string;
  email: string;
  selectedOptions: string[];
  overallComment: string;
  timestamp: bigint;
};

const RegistrationStatusIDL = (I: typeof IDL) =>
  I.Variant({ pending: I.Null, approved: I.Null, rejected: I.Null });

const RegistrationRecordIDL = (I: typeof IDL) =>
  I.Record({
    id: I.Text,
    name: I.Text,
    dateOfBirth: I.Text,
    email: I.Text,
    mobile: I.Text,
    country: I.Text,
    roleTitle: I.Text,
    registrationPurpose: I.Text,
    deviceInfo: I.Text,
    timestamp: I.Int,
    status: RegistrationStatusIDL(I),
    rejectionReason: I.Opt(I.Text),
    loginUsername: I.Opt(I.Text),
    loginPassword: I.Opt(I.Text),
  });

const FailedLogIDL = (I: typeof IDL) =>
  I.Record({
    email: I.Text,
    roleTitle: I.Text,
    errorMsg: I.Text,
    deviceInfo: I.Text,
    timestamp: I.Int,
  });

const RegistrationStatsIDL = (I: typeof IDL) =>
  I.Record({
    total: I.Nat,
    pending: I.Nat,
    approved: I.Nat,
    rejected: I.Nat,
    failed: I.Nat,
  });

const BookingStatusIDL = (I: typeof IDL) =>
  I.Variant({ pending: I.Null, approved: I.Null, rejected: I.Null });

const BookingRecordIDL = (I: typeof IDL) =>
  I.Record({
    id: I.Text,
    roomName: I.Text,
    roomType: I.Text,
    bookerName: I.Text,
    panName: I.Text,
    dob: I.Text,
    mobile: I.Text,
    email: I.Text,
    purpose: I.Text,
    bookingDate: I.Text,
    bookingHour: I.Text,
    bookingMinute: I.Text,
    bookingSecond: I.Text,
    timestamp: I.Int,
    status: BookingStatusIDL(I),
    approvedBookingId: I.Opt(I.Text),
    approvedAt: I.Opt(I.Int),
    rejectedAt: I.Opt(I.Int),
    rejectionReason: I.Opt(I.Text),
  });

const BookingStatsIDL = (I: typeof IDL) =>
  I.Record({
    total: I.Nat,
    pending: I.Nat,
    approved: I.Nat,
    rejected: I.Nat,
  });

const ServiceRatingIDL = (I: typeof IDL) =>
  I.Record({
    id: I.Text,
    bookingId: I.Text,
    roomName: I.Text,
    bookerName: I.Text,
    email: I.Text,
    selectedOptions: I.Vec(I.Text),
    overallComment: I.Text,
    timestamp: I.Int,
  });

function nexusIdlFactory({ IDL: I }: { IDL: typeof IDL }): IDL.ServiceClass {
  const Reg = RegistrationRecordIDL(I);
  const Log = FailedLogIDL(I);
  const Stats = RegistrationStatsIDL(I);
  const Bkg = BookingRecordIDL(I);
  const BkgStats = BookingStatsIDL(I);
  const Rtg = ServiceRatingIDL(I);

  return I.Service({
    // Admin auth
    adminLogin: I.Func([I.Text, I.Text], [I.Opt(I.Text)], []),
    verifyAdminToken: I.Func([I.Text], [I.Bool], ["query"]),
    logoutAdmin: I.Func([I.Text], [], []),

    // Registration
    submitRegistration: I.Func(
      [I.Text, I.Text, I.Text, I.Text, I.Text, I.Text, I.Text, I.Text],
      [I.Text],
      [],
    ),
    getRegistrationStatusByEmail: I.Func([I.Text], [I.Opt(Reg)], ["query"]),
    getRegistrationStatusByMobile: I.Func([I.Text], [I.Opt(Reg)], ["query"]),
    getRegistrationStatusById: I.Func([I.Text], [I.Opt(Reg)], ["query"]),
    getAllRegistrations: I.Func([I.Text], [I.Vec(Reg)], ["query"]),
    getPendingRegistrations: I.Func([I.Text], [I.Vec(Reg)], ["query"]),
    approveRegistration: I.Func([I.Text, I.Text], [I.Bool], []),
    rejectRegistration: I.Func([I.Text, I.Text, I.Text], [I.Bool], []),
    logFailedRegistration: I.Func([I.Text, I.Text, I.Text, I.Text], [], []),
    getFailedLogs: I.Func([I.Text], [I.Vec(Log)], ["query"]),
    getRegistrationStats: I.Func([I.Text], [Stats], ["query"]),

    // Booking
    submitBooking: I.Func(
      [
        I.Text,
        I.Text,
        I.Text,
        I.Text,
        I.Text,
        I.Text,
        I.Text,
        I.Text,
        I.Text,
        I.Text,
        I.Text,
        I.Text,
      ],
      [I.Text],
      [],
    ),
    getBookingsByEmail: I.Func([I.Text], [I.Vec(Bkg)], ["query"]),
    getBookingsByMobile: I.Func([I.Text], [I.Vec(Bkg)], ["query"]),
    getBookingById: I.Func([I.Text], [I.Opt(Bkg)], ["query"]),
    getAllBookings: I.Func([I.Text], [I.Vec(Bkg)], ["query"]),
    getPendingBookings: I.Func([I.Text], [I.Vec(Bkg)], ["query"]),
    approveBooking: I.Func([I.Text, I.Text], [I.Bool], []),
    rejectBooking: I.Func([I.Text, I.Text, I.Text], [I.Bool], []),
    getBookingStats: I.Func([I.Text], [BkgStats], ["query"]),

    // Rating
    submitRating: I.Func(
      [I.Text, I.Text, I.Text, I.Text, I.Vec(I.Text), I.Text],
      [I.Text],
      [],
    ),
    getRatingsByEmail: I.Func([I.Text], [I.Vec(Rtg)], ["query"]),
    getAllRatings: I.Func([I.Text], [I.Vec(Rtg)], ["query"]),
  });
}

// Module-level singleton so actor is created once and reused
let _actor: NexusActor | null = null;
let _actorPromise: Promise<NexusActor> | null = null;

async function initNexusActor(): Promise<NexusActor> {
  const config = await loadConfig();
  const agent = new HttpAgent({ host: config.backend_host });
  if (config.backend_host?.includes("localhost")) {
    await agent.fetchRootKey().catch(() => {});
  }
  return Actor.createActor(nexusIdlFactory as IDL.InterfaceFactory, {
    agent,
    canisterId: config.backend_canister_id,
  }) as unknown as NexusActor;
}

/** Returns a singleton raw actor for ALL Nexus custom methods. */
export function useNexusActor() {
  const [actor, setActor] = useState<NexusActor | null>(_actor);
  const [isFetching, setIsFetching] = useState<boolean>(!_actor);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (_actor) {
      setActor(_actor);
      setIsFetching(false);
      return;
    }
    if (!_actorPromise) {
      _actorPromise = initNexusActor().catch((e) => {
        _actorPromise = null;
        throw e;
      });
    }
    _actorPromise
      .then((a) => {
        _actor = a;
        if (mountedRef.current) {
          setActor(a);
          setIsFetching(false);
        }
      })
      .catch(() => {
        if (mountedRef.current) setIsFetching(false);
      });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { actor, isFetching };
}

/** Helper: unwrap Candid optional [T] | [] => T | null */
export function unwrapOpt<T>(opt: [] | [T] | null | undefined): T | null {
  if (!opt) return null;
  if (Array.isArray(opt)) return opt.length > 0 ? (opt[0] as T) : null;
  return null;
}
