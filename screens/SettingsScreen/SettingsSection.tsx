import React from 'react';

import { BodyXSMonoSecondary, Card, Column, Divider } from '@/components';

import { SettingsOptionData } from './settingsData';
import { SettingsOption } from './SettingsOption';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

interface SettingsSectionProps {
  titleKey: string;
  options: SettingsOptionData[];
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  titleKey,
  options,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Column $gap={8} $alignItems='flex-start'>
      <BodyXSMonoSecondary style={{ paddingStart: 8 }}>
        {t(titleKey).toUpperCase()}
      </BodyXSMonoSecondary>
      <Card $padding={16} style={{ width: '100%' }}>
        <Column $gap={16}>
          {options.map((option, index) => (
            <React.Fragment key={option.id}>
              <SettingsOption
                icon={option.icon}
                label={t(option.labelKey)}
                onPress={option.onPress}
                iconColor={
                  option.iconColor
                    ? theme.colors[
                        option.iconColor as keyof typeof theme.colors
                      ]
                    : undefined
                }
                labelColor={
                  option.labelColor
                    ? theme.colors[
                        option.labelColor as keyof typeof theme.colors
                      ]
                    : undefined
                }
              />
              {index < options.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Column>
      </Card>
    </Column>
  );
};
