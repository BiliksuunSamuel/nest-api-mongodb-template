export enum UserRole {
  Admin = 'Admin',
  Client = 'Client',
  User = 'User',
}

// Lifecycle of a UserAuthSession.
export enum SessionStatus {
  // Login done, OTP issued but not yet verified (token is a temporary one).
  Pending = 'Pending',
  // OTP verified; the session is valid.
  Active = 'Active',
  // Ended because a newer sign-in (another device) took over the account.
  Replaced = 'Replaced',
  // Ended by the user signing out.
  SignedOut = 'SignedOut',
  // Ended because `sessionExpiresAt` passed.
  Expired = 'Expired',
}
