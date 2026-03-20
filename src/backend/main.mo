import Text "mo:core/Text";
import Map "mo:core/Map";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Nat32 "mo:core/Nat32";
import Char "mo:core/Char";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";

actor {
  // --- Migration compatibility
  type OldUserStatus = { #pending; #approved; #rejected };
  type OldUserProfile = {
    principal : Principal;
    name : Text;
    dateOfBirth : Text;
    email : Text;
    mobile : Text;
    country : Text;
    roleTitle : Text;
    registrationPurpose : Text;
    rejectionReason : ?Text;
    status : OldUserStatus;
  };
  var userProfiles = Map.empty<Principal, OldUserProfile>();
  let accessControlState = AccessControl.initState();

  // --- Registration Types
  public type RegistrationStatus = { #pending; #approved; #rejected };

  public type RegistrationRecord = {
    id : Text;
    name : Text;
    dateOfBirth : Text;
    email : Text;
    mobile : Text;
    country : Text;
    roleTitle : Text;
    registrationPurpose : Text;
    deviceInfo : Text;
    timestamp : Int;
    status : RegistrationStatus;
    rejectionReason : ?Text;
    loginUsername : ?Text;
    loginPassword : ?Text;
  };

  public type FailedLog = {
    email : Text;
    roleTitle : Text;
    errorMsg : Text;
    deviceInfo : Text;
    timestamp : Int;
  };

  public type RegistrationStats = {
    total : Nat;
    pending : Nat;
    approved : Nat;
    rejected : Nat;
    failed : Nat;
  };

  // --- Booking Types
  public type BookingStatus = { #pending; #approved; #rejected };

  public type BookingRecord = {
    id : Text;
    roomName : Text;
    roomType : Text;
    bookerName : Text;
    panName : Text;
    dob : Text;
    mobile : Text;
    email : Text;
    purpose : Text;
    bookingDate : Text;
    bookingHour : Text;
    bookingMinute : Text;
    bookingSecond : Text;
    timestamp : Int;
    status : BookingStatus;
    approvedBookingId : ?Text;
    approvedAt : ?Int;
    rejectedAt : ?Int;
    rejectionReason : ?Text;
  };

  public type BookingStats = {
    total : Nat;
    pending : Nat;
    approved : Nat;
    rejected : Nat;
  };

  // --- Service Rating Types
  public type ServiceRating = {
    id : Text;
    bookingId : Text;
    roomName : Text;
    bookerName : Text;
    email : Text;
    selectedOptions : [Text];
    overallComment : Text;
    timestamp : Int;
  };

  // --- State
  let registrations = Map.empty<Text, RegistrationRecord>();
  let adminSessions = Map.empty<Text, Text>();
  let failedLogs = Map.empty<Text, FailedLog>();
  var regCounter : Nat = 0;
  var logCounter : Nat = 0;

  let bookings = Map.empty<Text, BookingRecord>();
  var bookingCounter : Nat = 0;

  let ratings = Map.empty<Text, ServiceRating>();
  var ratingCounter : Nat = 0;

  let ADMIN1_USER = "nexus_admin";
  let ADMIN1_PASS = "Nexus@Admin2024";
  let ADMIN2_USER = "nexus_admin2";
  let ADMIN2_PASS = "Nexus@Backup2024";

  // --- Helpers
  func generateId(prefix : Text, counter : Nat, ts : Int) : Text {
    prefix # "_" # counter.toText() # "_" # ts.toText();
  };

  func simpleHash(s : Text) : Nat {
    var h : Nat = 5381;
    for (c in s.chars()) {
      h := (h * 33 + c.toNat32().toNat()) % 1_000_000_007;
    };
    h;
  };

  func generateToken(username : Text, ts : Int) : Text {
    "tok_" # username # "_" # ts.toText();
  };

  func generateLoginCreds(regId : Text, counter : Nat) : (Text, Text) {
    let num = counter + 1000;
    let userId = "CSM" # num.toText();
    let h = simpleHash(regId # counter.toText());
    let charPool = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let charsArr = charPool.chars().toArray();
    let len = charsArr.size();
    var suffix = "";
    var seed = h;
    var i = 0;
    while (i < 4) {
      let idx = seed % len;
      suffix := suffix # Text.fromChar(charsArr[idx]);
      seed := (seed * 1103515245 + 12345) % 1_000_000_007;
      i += 1;
    };
    let password = "Corp@" # suffix # "2026#";
    (userId, password);
  };

  func isValidToken(token : Text) : Bool {
    switch (adminSessions.get(token)) {
      case (?_) { true };
      case null { false };
    };
  };

  // --- Admin Auth
  public func adminLogin(username : Text, password : Text) : async ?Text {
    let ok = (username == ADMIN1_USER and password == ADMIN1_PASS)
           or (username == ADMIN2_USER and password == ADMIN2_PASS);
    if (ok) {
      let ts = Time.now();
      let token = generateToken(username, ts);
      adminSessions.add(token, username);
      ?token;
    } else {
      null;
    };
  };

  public query func verifyAdminToken(token : Text) : async Bool {
    isValidToken(token);
  };

  public func logoutAdmin(token : Text) : async () {
    adminSessions.remove(token);
  };

  // --- Registration
  public func submitRegistration(
    name : Text,
    dateOfBirth : Text,
    email : Text,
    mobile : Text,
    country : Text,
    roleTitle : Text,
    registrationPurpose : Text,
    deviceInfo : Text,
  ) : async Text {
    let ts = Time.now();
    regCounter += 1;
    let id = generateId("REG", regCounter, ts);
    let record : RegistrationRecord = {
      id = id;
      name = name;
      dateOfBirth = dateOfBirth;
      email = email;
      mobile = mobile;
      country = country;
      roleTitle = roleTitle;
      registrationPurpose = registrationPurpose;
      deviceInfo = deviceInfo;
      timestamp = ts;
      status = #pending;
      rejectionReason = null;
      loginUsername = null;
      loginPassword = null;
    };
    registrations.add(id, record);
    id;
  };

  public query func getRegistrationStatusByEmail(email : Text) : async ?RegistrationRecord {
    var found : ?RegistrationRecord = null;
    var latestTs : Int = 0;
    for (rec in registrations.values()) {
      if (rec.email == email and rec.timestamp > latestTs) {
        latestTs := rec.timestamp;
        found := ?rec;
      };
    };
    found;
  };

  public query func getRegistrationStatusByMobile(mobile : Text) : async ?RegistrationRecord {
    var found : ?RegistrationRecord = null;
    var latestTs : Int = 0;
    for (rec in registrations.values()) {
      if (rec.mobile == mobile and rec.timestamp > latestTs) {
        latestTs := rec.timestamp;
        found := ?rec;
      };
    };
    found;
  };

  public query func getRegistrationStatusById(id : Text) : async ?RegistrationRecord {
    registrations.get(id);
  };

  public query func getAllRegistrations(token : Text) : async [RegistrationRecord] {
    if (not isValidToken(token)) { return [] };
    registrations.values().toArray();
  };

  public query func getPendingRegistrations(token : Text) : async [RegistrationRecord] {
    if (not isValidToken(token)) { return [] };
    registrations.values().filter(func(r : RegistrationRecord) : Bool { r.status == #pending }).toArray();
  };

  public func approveRegistration(token : Text, regId : Text) : async Bool {
    if (not isValidToken(token)) { return false };
    switch (registrations.get(regId)) {
      case null { false };
      case (?rec) {
        let (userId, pwd) = generateLoginCreds(rec.id, regCounter);
        let updated : RegistrationRecord = {
          rec with
          status = #approved;
          rejectionReason = null;
          loginUsername = ?userId;
          loginPassword = ?pwd;
        };
        registrations.add(regId, updated);
        true;
      };
    };
  };

  public func rejectRegistration(token : Text, regId : Text, reason : Text) : async Bool {
    if (not isValidToken(token)) { return false };
    switch (registrations.get(regId)) {
      case null { false };
      case (?rec) {
        let updated : RegistrationRecord = {
          rec with
          status = #rejected;
          rejectionReason = ?reason;
        };
        registrations.add(regId, updated);
        true;
      };
    };
  };

  public func logFailedRegistration(
    email : Text,
    roleTitle : Text,
    errorMsg : Text,
    deviceInfo : Text,
  ) : async () {
    let ts = Time.now();
    logCounter += 1;
    let id = generateId("LOG", logCounter, ts);
    let entry : FailedLog = {
      email = email;
      roleTitle = roleTitle;
      errorMsg = errorMsg;
      deviceInfo = deviceInfo;
      timestamp = ts;
    };
    failedLogs.add(id, entry);
  };

  public query func getFailedLogs(token : Text) : async [FailedLog] {
    if (not isValidToken(token)) { return [] };
    failedLogs.values().toArray();
  };

  public query func getRegistrationStats(token : Text) : async RegistrationStats {
    if (not isValidToken(token)) {
      return { total = 0; pending = 0; approved = 0; rejected = 0; failed = 0 };
    };
    var total = 0;
    var pending = 0;
    var approved = 0;
    var rejected = 0;
    for (rec in registrations.values()) {
      total += 1;
      switch (rec.status) {
        case (#pending) { pending += 1 };
        case (#approved) { approved += 1 };
        case (#rejected) { rejected += 1 };
      };
    };
    let failed = failedLogs.size();
    { total; pending; approved; rejected; failed };
  };

  // --- Booking System
  public func submitBooking(
    roomName : Text,
    roomType : Text,
    bookerName : Text,
    panName : Text,
    dob : Text,
    mobile : Text,
    email : Text,
    purpose : Text,
    bookingDate : Text,
    bookingHour : Text,
    bookingMinute : Text,
    bookingSecond : Text,
  ) : async Text {
    for (b in bookings.values()) {
      if (b.roomName == roomName and b.bookingDate == bookingDate and b.bookingHour == bookingHour and b.status != #rejected) {
        return "CONFLICT: This room is already booked for that date and hour. Please choose a different time.";
      };
    };
    let ts = Time.now();
    bookingCounter += 1;
    let id = generateId("BKG", bookingCounter, ts);
    let record : BookingRecord = {
      id = id;
      roomName = roomName;
      roomType = roomType;
      bookerName = bookerName;
      panName = panName;
      dob = dob;
      mobile = mobile;
      email = email;
      purpose = purpose;
      bookingDate = bookingDate;
      bookingHour = bookingHour;
      bookingMinute = bookingMinute;
      bookingSecond = bookingSecond;
      timestamp = ts;
      status = #pending;
      approvedBookingId = null;
      approvedAt = null;
      rejectedAt = null;
      rejectionReason = null;
    };
    bookings.add(id, record);
    id;
  };

  public query func getBookingsByEmail(email : Text) : async [BookingRecord] {
    bookings.values().filter(func(b : BookingRecord) : Bool { b.email == email }).toArray();
  };

  public query func getBookingsByMobile(mobile : Text) : async [BookingRecord] {
    bookings.values().filter(func(b : BookingRecord) : Bool { b.mobile == mobile }).toArray();
  };

  public query func getBookingById(id : Text) : async ?BookingRecord {
    bookings.get(id);
  };

  public query func getAllBookings(token : Text) : async [BookingRecord] {
    if (not isValidToken(token)) { return [] };
    bookings.values().toArray();
  };

  public query func getPendingBookings(token : Text) : async [BookingRecord] {
    if (not isValidToken(token)) { return [] };
    bookings.values().filter(func(b : BookingRecord) : Bool { b.status == #pending }).toArray();
  };

  public func approveBooking(token : Text, bookingId : Text) : async Bool {
    if (not isValidToken(token)) { return false };
    switch (bookings.get(bookingId)) {
      case null { false };
      case (?rec) {
        let num = bookingCounter + 1000;
        let approvedId = "EBC" # num.toText();
        let ts = Time.now();
        let updated : BookingRecord = {
          rec with
          status = #approved;
          approvedBookingId = ?approvedId;
          approvedAt = ?ts;
          rejectionReason = null;
        };
        bookings.add(bookingId, updated);
        true;
      };
    };
  };

  public func rejectBooking(token : Text, bookingId : Text, reason : Text) : async Bool {
    if (not isValidToken(token)) { return false };
    switch (bookings.get(bookingId)) {
      case null { false };
      case (?rec) {
        let ts = Time.now();
        let updated : BookingRecord = {
          rec with
          status = #rejected;
          rejectedAt = ?ts;
          rejectionReason = ?reason;
        };
        bookings.add(bookingId, updated);
        true;
      };
    };
  };

  public query func getBookingStats(token : Text) : async BookingStats {
    if (not isValidToken(token)) {
      return { total = 0; pending = 0; approved = 0; rejected = 0 };
    };
    var total = 0;
    var pending = 0;
    var approved = 0;
    var rejected = 0;
    for (b in bookings.values()) {
      total += 1;
      switch (b.status) {
        case (#pending) { pending += 1 };
        case (#approved) { approved += 1 };
        case (#rejected) { rejected += 1 };
      };
    };
    { total; pending; approved; rejected };
  };

  // --- Service Rating System
  public func submitRating(
    bookingId : Text,
    roomName : Text,
    bookerName : Text,
    email : Text,
    selectedOptions : [Text],
    overallComment : Text,
  ) : async Text {
    let ts = Time.now();
    ratingCounter += 1;
    let id = generateId("RTG", ratingCounter, ts);
    let entry : ServiceRating = {
      id = id;
      bookingId = bookingId;
      roomName = roomName;
      bookerName = bookerName;
      email = email;
      selectedOptions = selectedOptions;
      overallComment = overallComment;
      timestamp = ts;
    };
    ratings.add(id, entry);
    id;
  };

  public query func getRatingsByEmail(email : Text) : async [ServiceRating] {
    ratings.values().filter(func(r : ServiceRating) : Bool { r.email == email }).toArray();
  };

  public query func getAllRatings(token : Text) : async [ServiceRating] {
    if (not isValidToken(token)) { return [] };
    ratings.values().toArray();
  };
};
