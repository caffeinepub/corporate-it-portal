import Text "mo:core/Text";
import Map "mo:core/Map";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Nat32 "mo:core/Nat32";
import Char "mo:core/Char";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";

actor {
  // ─── Migration: absorb old stable variables from previous version
  // These match the types in the old actor so upgrade does not discard them.
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
  // Absorb old userProfiles map (values discarded, not used)
  var userProfiles = Map.empty<Principal, OldUserProfile>();
  // Absorb old accessControlState
  let accessControlState = AccessControl.initState();

  // ─── New Types
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

  // ─── New State
  let registrations = Map.empty<Text, RegistrationRecord>();
  let adminSessions = Map.empty<Text, Text>();
  let failedLogs = Map.empty<Text, FailedLog>();
  var regCounter : Nat = 0;
  var logCounter : Nat = 0;

  let ADMIN1_USER = "nexus_admin";
  let ADMIN1_PASS = "Nexus@Admin2024";
  let ADMIN2_USER = "nexus_admin2";
  let ADMIN2_PASS = "Nexus@Backup2024";

  // ─── Helpers
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

  func firstChars(s : Text, n : Nat) : Text {
    var result = "";
    var count = 0;
    for (c in s.chars()) {
      if (count < n) {
        result := result # Text.fromChar(c);
        count += 1;
      };
    };
    result;
  };

  func splitAtChar(s : Text, sep : Char) : Text {
    var result = "";
    for (c in s.chars()) {
      if (c == sep) { return result };
      result := result # Text.fromChar(c);
    };
    result;
  };

  func generateLoginCreds(email : Text, roleTitle : Text, id : Text) : (Text, Text) {
    let emailPrefix = splitAtChar(email, '@');
    let roleCode = firstChars(roleTitle, 3);
    let username = emailPrefix # "_" # roleCode;
    let h = simpleHash(id # email # roleTitle);
    let charPool = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let charsArr = charPool.chars().toArray();
    let len = charsArr.size();
    var pwd = "";
    var seed = h;
    var i = 0;
    while (i < 8) {
      let idx = seed % len;
      pwd := pwd # Text.fromChar(charsArr[idx]);
      seed := (seed * 1103515245 + 12345) % 1_000_000_007;
      i += 1;
    };
    (username, pwd);
  };

  func isValidToken(token : Text) : Bool {
    switch (adminSessions.get(token)) {
      case (?_) { true };
      case null { false };
    };
  };

  // ─── Admin Auth
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

  // ─── Open Registration
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

  public query func getRegistrationStatusById(id : Text) : async ?RegistrationRecord {
    registrations.get(id);
  };

  // ─── Admin Management
  public query func getAllRegistrations(token : Text) : async [RegistrationRecord] {
    if (not isValidToken(token)) { return [] };
    let arr = registrations.values().toArray();
    arr.sort(func(a : RegistrationRecord, b : RegistrationRecord) : { #less; #equal; #greater } {
      if (a.timestamp > b.timestamp) { #less }
      else if (a.timestamp < b.timestamp) { #greater }
      else { #equal };
    });
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
        let (uname, pwd) = generateLoginCreds(rec.email, rec.roleTitle, rec.id);
        let updated : RegistrationRecord = {
          rec with
          status = #approved;
          rejectionReason = null;
          loginUsername = ?uname;
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

  // ─── Error Logging
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

  // ─── Stats
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
};
