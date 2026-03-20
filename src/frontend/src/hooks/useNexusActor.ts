/**
 * useNexusActor — creates a raw ICP actor that directly calls ALL custom
 * Nexus IT Portal / EBC Booking Management methods defined in main.mo.
 */
import { Actor, HttpAgent } from "@icp-sdk/core/agent";
import type { IDL } from "@icp-sdk/core/candid";
import { useEffect, useRef, useState } from "react";
import { loadConfig } from "../config";

export type NexusActor = {
  adminLogin(username: string, password: string): Promise<[] | [string]>;
  ping(): Promise<boolean>;
  verifyAdminToken(token: string): Promise<boolean>;
  logoutAdmin(token: string): Promise<void>;
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
  I.Record({ total: I.Nat, pending: I.Nat, approved: I.Nat, rejected: I.Nat });

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
    adminLogin: I.Func([I.Text, I.Text], [I.Opt(I.Text)], []),
    ping: I.Func([], [I.Bool], []),
    verifyAdminToken: I.Func([I.Text], [I.Bool], ["query"]),
    logoutAdmin: I.Func([I.Text], [], []),
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
    submitRating: I.Func(
      [I.Text, I.Text, I.Text, I.Text, I.Vec(I.Text), I.Text],
      [I.Text],
      [],
    ),
    getRatingsByEmail: I.Func([I.Text], [I.Vec(Rtg)], ["query"]),
    getAllRatings: I.Func([I.Text], [I.Vec(Rtg)], ["query"]),
  });
}

let _actor: NexusActor | null = null;
let _actorPromise: Promise<NexusActor> | null = null;
let _canisterReady = false;
const _readyListeners: Array<(ready: boolean) => void> = [];

function notifyReadyListeners(ready: boolean) {
  _canisterReady = ready;
  for (const cb of _readyListeners) cb(ready);
}

export function onCanisterReady(cb: (ready: boolean) => void) {
  _readyListeners.push(cb);
  cb(_canisterReady);
  return () => {
    const idx = _readyListeners.indexOf(cb);
    if (idx >= 0) _readyListeners.splice(idx, 1);
  };
}

async function buildFreshActor(): Promise<NexusActor> {
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

export function resetNexusActor() {
  _actor = null;
  _actorPromise = null;
}

export async function warmUpCanister(
  maxAttempts = 25,
  delayMs = 3000,
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      if (!_actor) {
        if (!_actorPromise) {
          _actorPromise = buildFreshActor().catch((e) => {
            _actorPromise = null;
            throw e;
          });
        }
        _actor = await _actorPromise;
      }
      await _actor.ping();
      notifyReadyListeners(true);
      return true;
    } catch {
      resetNexusActor();
      notifyReadyListeners(false);
      if (i < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  return false;
}

export function useNexusActor() {
  const [actor, setActor] = useState<NexusActor | null>(_actor);
  const [isFetching, setIsFetching] = useState<boolean>(!_canisterReady);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (_canisterReady && _actor) {
      setActor(_actor);
      setIsFetching(false);
      return;
    }

    const unsub = onCanisterReady((ready) => {
      if (!mountedRef.current) return;
      if (ready && _actor) {
        setActor(_actor);
        setIsFetching(false);
      } else {
        setIsFetching(!ready);
      }
    });

    if (!_actorPromise) {
      _actorPromise = buildFreshActor().catch((e) => {
        _actorPromise = null;
        throw e;
      });
    }
    _actorPromise
      .then((a) => {
        _actor = a;
        if (mountedRef.current) setActor(a);
      })
      .catch(() => {
        if (mountedRef.current) setIsFetching(false);
      });

    return () => {
      mountedRef.current = false;
      unsub();
    };
  }, []);

  return { actor, isFetching };
}

/**
 * robustCall — retries with uniform 3s delays for up to ~60 seconds.
 * onRetry receives: (attempt, totalAttempts, secondsElapsed)
 */
export async function robustCall<T>(
  fn: (actor: NexusActor) => Promise<T>,
  maxRetries = 20,
  onRetry?: (
    attempt: number,
    totalAttempts: number,
    secondsElapsed: number,
  ) => void,
): Promise<T> {
  const DELAY = 3000;
  const startTs = Date.now();
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (!_actor) {
      _actorPromise = buildFreshActor().catch((e) => {
        _actorPromise = null;
        throw e;
      });
      try {
        _actor = await _actorPromise;
      } catch (e) {
        lastError = e;
        if (attempt < maxRetries) {
          const elapsed = Math.floor((Date.now() - startTs) / 1000);
          onRetry?.(attempt + 1, maxRetries + 1, elapsed);
          await new Promise((r) => setTimeout(r, DELAY));
        }
        continue;
      }
    }
    try {
      const result = await fn(_actor);
      notifyReadyListeners(true);
      return result;
    } catch (err) {
      lastError = err;
      resetNexusActor();
      notifyReadyListeners(false);
      if (attempt < maxRetries) {
        const elapsed = Math.floor((Date.now() - startTs) / 1000);
        onRetry?.(attempt + 1, maxRetries + 1, elapsed);
        await new Promise((r) => setTimeout(r, DELAY));
      }
    }
  }
  throw lastError;
}

export function unwrapOpt<T>(opt: [] | [T] | null | undefined): T | null {
  if (!opt) return null;
  if (Array.isArray(opt)) return opt.length > 0 ? (opt[0] as T) : null;
  return null;
}
