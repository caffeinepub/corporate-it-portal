import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    registrationPurpose: string;
    status: UserStatus;
    principal: Principal;
    country: string;
    dateOfBirth: string;
    name: string;
    roleTitle: string;
    rejectionReason?: string;
    email: string;
    mobile: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum UserStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export interface backendInterface {
    approveUser(user: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllRegistrations(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile>;
    getCallerUserRole(): Promise<UserRole>;
    getMyRegistrationStatus(): Promise<UserProfile | null>;
    getPendingRegistrations(): Promise<Array<UserProfile>>;
    getUserProfile(user: Principal): Promise<UserProfile>;
    isCallerAdmin(): Promise<boolean>;
    registerUser(name: string, dateOfBirth: string, email: string, mobile: string, country: string, roleTitle: string, registrationPurpose: string): Promise<void>;
    rejectUser(user: Principal, reason: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
