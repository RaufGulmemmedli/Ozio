/**
 * Public surface of the profile package (profile · settings · help · history).
 * Other modules import ONLY from here.
 *
 * `useProfile` is depended on by name: home, the card screen and the register gate all read the
 * same `GET v1/profile/me` cache entry through it.
 */

/* ---------------------------------------------------------------------------------- hooks */
export { useProfile, useInvalidateProfile, EMPTY_PROFILE } from './hooks/use-profile';
export { useUpdateProfile } from './hooks/use-update-profile';
export { useDeleteAccount } from './hooks/use-delete-account';
export { usePrivacyPolicies } from './hooks/use-privacy-policies';
export { useAddressCount, useProfileStats, useUnreadCount } from './hooks/use-profile-counts';
export { useSignOut } from './hooks/use-sign-out';
export { useLocaleSwitch } from './hooks/use-locale-switch';
export {
  useNotificationPrefs,
  rehydrateNotificationPrefs,
  readBrowserPermission,
  requestBrowserPermission,
  useBrowserPermission,
  NOTIFY_PREFS_KEY,
  type BrowserPermission,
  type NotificationChannel,
  type NotificationPrefsState,
} from './hooks/use-notification-prefs';

/* ----------------------------------------------------------------------------- components */
export { ProfileAvatar, type ProfileAvatarProps, type ProfileAvatarSize } from './components/profile-avatar';
export {
  SettingsRow,
  SettingsRowGroup,
  type SettingsRowProps,
  type SettingsRowTone,
} from './components/settings-row';
export { SettingsCard, SettingsSection } from './components/settings-section';
export { LanguagePicker } from './components/language-picker';
export { ThemePicker } from './components/theme-picker';
export { PolicyProse } from './components/policy-prose';
export { StatTile, type StatTileProps } from './components/stat-tile';

/* ---------------------------------------------------------------------------------- views */
export { ProfileView } from './view/ProfileView';
export { ProfileEditView } from './view/ProfileEditView';
export { SettingsView } from './view/SettingsView';
export { SettingsOverlay } from './view/SettingsOverlay';
export { SettingsContent } from './view/SettingsContent';
export { LanguageView } from './view/LanguageView';
export { AppearanceView } from './view/AppearanceView';
export { NotificationSettingsView } from './view/NotificationSettingsView';
export { HelpView } from './view/HelpView';
export { AccountDeleteView } from './view/AccountDeleteView';
export { HistoryView } from './view/HistoryView';

/* ------------------------------------------------------------------------- keys and models */
export { profileKeys, type HistoryTab } from './profile.query-keys';
export { profileRoutes, type ModuleRoute } from './profile.routes';
export {
  formatPhone,
  joinName,
  maskPhone,
  parseProfile,
  primaryCard,
  profileInitial,
  splitName,
  type BonusCard,
  type Gender,
  type Profile,
} from './data/models/profile';
export {
  buildProfileUpdateBody,
  birthDateToWire,
  genderToWire,
  mapFieldErrorPath,
  type ProfileEditValues,
} from './data/models/profile-update';
export {
  parsePolicies,
  parsePolicy,
  pickPolicy,
  sanitizePolicyHtml,
  type PrivacyPolicy,
} from './data/models/policy';
export { EMPTY_STATS, type ProfileStats } from './data/models/profile-stats';
export { profileRepository } from './data/profile.repository';
