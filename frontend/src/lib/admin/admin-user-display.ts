type AdminUserRecord = Record<string, unknown>;

export const resolveAdminDisplayName = (user: AdminUserRecord | null | undefined): string => {
  if (!user) return 'Admin';

  const name = String(user.name ?? '').trim();
  if (name) return name;

  const firstName = String(user.first_name ?? user.firstName ?? '').trim();
  const lastName = String(user.last_name ?? user.lastName ?? '').trim();
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) return fullName;
  if (firstName) return firstName;

  const email = String(user.email ?? user.userEmail ?? '').trim();
  if (email) {
    const local = email.split('@')[0];
    return local || email;
  }

  return 'Admin';
};

export const resolveAdminEmail = (user: AdminUserRecord | null | undefined): string => {
  if (!user) return '';
  return String(user.email ?? user.userEmail ?? '').trim();
};

export const resolveAdminAvatarLabel = (user: AdminUserRecord | null | undefined): string => {
  const name = resolveAdminDisplayName(user);
  if (name === 'Admin') return 'A';
  return name.charAt(0).toUpperCase();
};
