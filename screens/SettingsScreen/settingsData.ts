import MaterialIcon from '@expo/vector-icons/MaterialIcons';

export interface SettingsOptionData {
  id: string;
  icon: keyof typeof MaterialIcon.glyphMap;
  labelKey: string;
  onPress: () => void;
  iconColor?: string;
  labelColor?: string;
}

export const useSettingsData = () => {
  const helpAndSupportOptions: SettingsOptionData[] = [
    {
      id: 'faq',
      icon: 'help-outline',
      labelKey: 'FAQ',
      onPress: () => console.log('FAQ pressed'),
    },
    {
      id: 'report-problem',
      icon: 'bug-report',
      labelKey: 'Report a problem',
      onPress: () => console.log('Report a problem pressed'),
    },
    {
      id: 'contact-support',
      icon: 'headset-mic',
      labelKey: 'Contact support',
      onPress: () => console.log('Contact support pressed'),
    },
    {
      id: 'privacy-policy',
      icon: 'privacy-tip',
      labelKey: 'Privacy policy',
      onPress: () => console.log('Privacy policy pressed'),
    },
    {
      id: 'terms-of-service',
      icon: 'description',
      labelKey: 'Terms of service',
      onPress: () => console.log('Terms of service pressed'),
    },
  ];

  const accountActionsOptions: SettingsOptionData[] = [
    {
      id: 'delete-account',
      icon: 'delete-forever',
      labelKey: 'Delete account',
      onPress: () => console.log('Delete account pressed'),
      iconColor: 'loss',
      labelColor: 'loss',
    },
    {
      id: 'sign-out',
      icon: 'logout',
      labelKey: 'Sign out',
      onPress: () => console.log('Sign out pressed'),
    },
  ];

  return {
    helpAndSupportOptions,
    accountActionsOptions,
  };
};
