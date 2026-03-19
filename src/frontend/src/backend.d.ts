export interface RegistrationRecord {
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
    rejectionReason: string | null;
    loginUsername: string | null;
    loginPassword: string | null;
}

export interface FailedLog {
    email: string;
    roleTitle: string;
    errorMsg: string;
    deviceInfo: string;
    timestamp: bigint;
}

export interface RegistrationStats {
    total: bigint;
    pending: bigint;
    approved: bigint;
    rejected: bigint;
    failed: bigint;
}

export interface backendInterface {
    adminLogin(username: string, password: string): Promise<string | null>;
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
        deviceInfo: string
    ): Promise<string>;
    getRegistrationStatusByEmail(email: string): Promise<RegistrationRecord | null>;
    getRegistrationStatusById(id: string): Promise<RegistrationRecord | null>;
    getAllRegistrations(token: string): Promise<RegistrationRecord[]>;
    getPendingRegistrations(token: string): Promise<RegistrationRecord[]>;
    approveRegistration(token: string, regId: string): Promise<boolean>;
    rejectRegistration(token: string, regId: string, reason: string): Promise<boolean>;
    logFailedRegistration(email: string, roleTitle: string, errorMsg: string, deviceInfo: string): Promise<void>;
    getFailedLogs(token: string): Promise<FailedLog[]>;
    getRegistrationStats(token: string): Promise<RegistrationStats>;
}
