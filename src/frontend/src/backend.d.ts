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

export interface BookingRecord {
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
    approvedBookingId: string | null;
    approvedAt: bigint | null;
    rejectedAt: bigint | null;
    rejectionReason: string | null;
}

export interface BookingStats {
    total: bigint;
    pending: bigint;
    approved: bigint;
    rejected: bigint;
}

export interface ServiceRating {
    id: string;
    bookingId: string;
    roomName: string;
    bookerName: string;
    email: string;
    selectedOptions: string[];
    overallComment: string;
    timestamp: bigint;
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
    getRegistrationStatusByMobile(mobile: string): Promise<RegistrationRecord | null>;
    getRegistrationStatusById(id: string): Promise<RegistrationRecord | null>;
    getAllRegistrations(token: string): Promise<RegistrationRecord[]>;
    getPendingRegistrations(token: string): Promise<RegistrationRecord[]>;
    approveRegistration(token: string, regId: string): Promise<boolean>;
    rejectRegistration(token: string, regId: string, reason: string): Promise<boolean>;
    logFailedRegistration(email: string, roleTitle: string, errorMsg: string, deviceInfo: string): Promise<void>;
    getFailedLogs(token: string): Promise<FailedLog[]>;
    getRegistrationStats(token: string): Promise<RegistrationStats>;
    // Booking
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
        bookingSecond: string
    ): Promise<string>;
    getBookingsByEmail(email: string): Promise<BookingRecord[]>;
    getBookingsByMobile(mobile: string): Promise<BookingRecord[]>;
    getBookingById(id: string): Promise<BookingRecord | null>;
    getAllBookings(token: string): Promise<BookingRecord[]>;
    getPendingBookings(token: string): Promise<BookingRecord[]>;
    approveBooking(token: string, bookingId: string): Promise<boolean>;
    rejectBooking(token: string, bookingId: string, reason: string): Promise<boolean>;
    getBookingStats(token: string): Promise<BookingStats>;
    // Service Rating
    submitRating(
        bookingId: string,
        roomName: string,
        bookerName: string,
        email: string,
        selectedOptions: string[],
        overallComment: string
    ): Promise<string>;
    getRatingsByEmail(email: string): Promise<ServiceRating[]>;
    getAllRatings(token: string): Promise<ServiceRating[]>;
}
