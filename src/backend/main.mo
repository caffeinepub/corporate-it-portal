import Text "mo:core/Text";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


actor {
  public type UserStatus = {
    #pending;
    #approved;
    #rejected;
  };

  public type UserProfile = {
    principal : Principal;
    name : Text;
    dateOfBirth : Text;
    email : Text;
    mobile : Text;
    country : Text;
    roleTitle : Text;
    registrationPurpose : Text;
    rejectionReason : ?Text;
    status : UserStatus;
  };

  // Internal state
  let userProfiles = Map.empty<Principal, UserProfile>();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Get caller's own profile
  public query ({ caller }) func getCallerUserProfile() : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access this endpoint");
    };
    switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("No user profile found for this principal");
      };
      case (?profile) { profile };
    };
  };

  // Get any user's profile
  public query ({ caller }) func getUserProfile(user : Principal) : async UserProfile {
    if (caller != user and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (userProfiles.get(user)) {
      case (null) {
        Runtime.trap("No user profile found for this principal");
      };
      case (?profile) { profile };
    };
  };

  // Save caller's profile
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Register a new user
  public shared ({ caller }) func registerUser(
    name : Text,
    dateOfBirth : Text,
    email : Text,
    mobile : Text,
    country : Text,
    roleTitle : Text,
    registrationPurpose : Text
  ) : async () {
    switch (userProfiles.get(caller)) {
      case (?existing) {
        Runtime.trap("User already registered");
      };
      case (null) {
        let newProfile : UserProfile = {
          principal = caller;
          name = name;
          dateOfBirth = dateOfBirth;
          email = email;
          mobile = mobile;
          country = country;
          roleTitle = roleTitle;
          registrationPurpose = registrationPurpose;
          rejectionReason = null;
          status = #pending;
        };
        userProfiles.add(caller, newProfile);
      };
    };
  };

  // Get registration status
  public query ({ caller }) func getMyRegistrationStatus() : async ?UserProfile {
    userProfiles.get(caller);
  };

  // Get all registrations - admin only
  public query ({ caller }) func getAllRegistrations() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access this endpoint");
    };
    userProfiles.values().toArray();
  };

  // Get pending registrations - admin only
  public query ({ caller }) func getPendingRegistrations() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access this endpoint");
    };

    let iter = userProfiles.values().filter(
      func(profile) {
        profile.status == #pending;
      }
    );
    iter.toArray();
  };

  // Approve user - admin only
  public shared ({ caller }) func approveUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access this endpoint");
    };

    switch (userProfiles.get(user)) {
      case (null) {
        Runtime.trap("No user profile found for this principal");
      };
      case (?profile) {
        let updatedProfile = {
          profile with
          status = #approved;
          rejectionReason = null;
        };
        userProfiles.add(user, updatedProfile);

        // Assign user role
        AccessControl.assignRole(accessControlState, caller, user, #user);
      };
    };
  };

  // Reject user - admin only
  public shared ({ caller }) func rejectUser(user : Principal, reason : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access this endpoint");
    };

    let profile = switch (userProfiles.get(user)) {
      case (null) {
        Runtime.trap("No user profile found for this principal");
      };
      case (?profile) { profile };
    };

    let updatedProfile = {
      profile with
      status = #rejected;
      rejectionReason = ?reason;
    };

    userProfiles.add(user, updatedProfile);
  };
};
