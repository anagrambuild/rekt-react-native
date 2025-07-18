import { Share } from 'react-native';

import BtcUnselected from '@/assets/images/app-svgs/btc-unselected.svg';
import EthUnselected from '@/assets/images/app-svgs/eth-unselected.svg';
import SolUnselected from '@/assets/images/app-svgs/sol-unselected.svg';
import UsdcIcon from '@/assets/images/app-svgs/usdc.svg';
import { Modal } from '@/components';
import {
  PrimaryButton,
  SecondaryButton,
} from '@/components/common/buttons/main-buttons';
import { Card } from '@/components/common/Card';
import { Column, Row } from '@/components/common/containers';
import {
  Body1,
  BodyM,
  BodyS,
  BodyXSMono,
  BodyXSMonoSecondary,
} from '@/components/common/texts';
import { useHomeContext, useProfileContext } from '@/contexts';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { TradeActivityChart } from './TradeActivityChart';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

// Mock trade data for the chart
const createMockTrade = (selectedTrade: any) => ({
  side: selectedTrade.type,
  entryPrice: selectedTrade.entryPrice,
  amount: selectedTrade.amount,
  leverage: selectedTrade.leverage,
  status: 'closed' as const,
  timestamp: Date.now(),
});

export const TradeActivityModal = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const {
    isTradeActivityModalVisible,
    setIsTradeActivityModalVisible,
    selectedTrade,
  } = useProfileContext();
  const { setSelectedToken, setSolTrade, setEthTrade, setBtcTrade } =
    useHomeContext();

  const handleClose = () => {
    setIsTradeActivityModalVisible(false);
  };

  const handleTradeAgain = () => {
    if (!selectedTrade) return;

    // Map DetailedTradeData to HomeContext Trade format
    const newTrade = {
      side: selectedTrade.type, // 'long' | 'short'
      entryPrice: selectedTrade.entryPrice,
      amount: selectedTrade.amount,
      leverage: selectedTrade.leverage,
      status: 'open' as const,
      timestamp: Date.now(),
    };

    // Set the selected token in HomeContext
    setSelectedToken(selectedTrade.symbol);

    // Set the trade for the appropriate token
    switch (selectedTrade.symbol) {
      case 'sol':
        setSolTrade(newTrade);
        break;
      case 'eth':
        setEthTrade(newTrade);
        break;
      case 'btc':
        setBtcTrade(newTrade);
        break;
    }

    // Close the modal
    handleClose();

    // Navigate to home page
    router.push('/');
  };

  const handleShare = async () => {
    if (!selectedTrade) return;

    try {
      const profitText = selectedTrade.isProfit ? 'profit' : 'loss';
      const profitAmount = selectedTrade.isProfit ? '+' : '';
      const symbol = selectedTrade.symbol.toUpperCase();
      const tradeType = selectedTrade.type === 'long' ? 'Long' : 'Short';

      const shareMessage = `🚀 Just ${
        selectedTrade.isProfit ? 'made' : 'took'
      } a ${profitText} on my ${tradeType} ${symbol} trade!

💰 ${profitAmount}$${selectedTrade.profitAmount.toFixed(2)}
📊 Entry: $${selectedTrade.entryPrice.toFixed(2)}
📈 Exit: $${selectedTrade.exitPrice.toFixed(2)}
💵 Amount: $${selectedTrade.amount}
⚡ Leverage: ${selectedTrade.leverage}x
⏱️ Duration: ${selectedTrade.duration}

#Trading #${symbol} #${selectedTrade.isProfit ? 'Profit' : 'REKT'}`;

      const result = await Share.share({
        message: shareMessage,
        title: `${tradeType} ${symbol} Trade ${
          selectedTrade.isProfit ? 'Profit' : 'Loss'
        }`,
      });

      if (result.action === Share.sharedAction) {
        console.log('Trade shared successfully');
      }
    } catch (error) {
      console.error('Error sharing trade:', error);
    }
  };

  if (!selectedTrade) return null;

  const mockTrade = createMockTrade(selectedTrade);

  return (
    <Modal visible={isTradeActivityModalVisible} onRequestClose={handleClose}>
      <Column $gap={24} $alignItems='flex-start' $padding={8}>
        {/* Header Section */}
        <Row $justifyContent='space-between' $alignItems='flex-start'>
          <Row $width='auto' $gap={12} $alignItems='center'>
            <SymbolContainer>
              <Icon symbol={selectedTrade.symbol} />
              <ArrowContainer>
                <MaterialCommunityIcons
                  name={
                    selectedTrade.isProfit
                      ? 'arrow-top-right'
                      : 'arrow-bottom-right'
                  }
                  size={11}
                  color={theme.colors.textPrimary}
                />
              </ArrowContainer>
            </SymbolContainer>
            <Column $width='auto' $alignItems='flex-start'>
              <BodyM>
                {t(selectedTrade.type === 'long' ? 'Long' : 'Short')}
              </BodyM>
            </Column>
          </Row>
          <Column $width='auto' $alignItems='flex-end'>
            <ProfitPill isProfit={selectedTrade.isProfit}>
              <BodyS>{t('Profit')}</BodyS>
            </ProfitPill>
            <ProfitAmount isProfit={selectedTrade.isProfit}>
              {selectedTrade.isProfit ? '+' : ''}$
              {selectedTrade.profitAmount.toFixed(2)}
            </ProfitAmount>
          </Column>
        </Row>

        {/* Data Cards Section */}
        <Column $gap={4}>
          <Row $width='auto' $gap={4}>
            <DataCard>
              <BodyXSMonoSecondary>
                {t('Invested').toUpperCase()}
              </BodyXSMonoSecondary>
              <Row $width='auto' $gap={4} $alignItems='center'>
                <Body1>{selectedTrade.amount}</Body1>
                <UsdcIcon width={20} height={20} />
              </Row>
            </DataCard>
            <DataCard>
              <BodyXSMonoSecondary>
                {t('Leverage').toUpperCase()}
              </BodyXSMonoSecondary>
              <Body1>{selectedTrade.leverage}x</Body1>
            </DataCard>
          </Row>
          <Row $width='auto' $gap={4}>
            <DataCard>
              <BodyXSMonoSecondary>
                {t('Entry').toUpperCase()}
              </BodyXSMonoSecondary>
              <Body1>${selectedTrade.entryPrice.toFixed(2)}</Body1>
            </DataCard>
            <DataCard>
              <BodyXSMonoSecondary>
                {t('Exit').toUpperCase()}
              </BodyXSMonoSecondary>
              <Body1>${selectedTrade.exitPrice.toFixed(2)}</Body1>
            </DataCard>
          </Row>

          {/* Chart Section */}
          <Card $padding={16}>
            <Column $gap={12}>
              <Row
                $width='auto'
                $justifyContent='space-between'
                $alignItems='center'
              >
                <BodyXSMonoSecondary>
                  {selectedTrade.entryTime} - {selectedTrade.exitTime}
                </BodyXSMonoSecondary>
              </Row>
              <TradeActivityChart
                trade={mockTrade}
                symbol={selectedTrade.symbol}
              />
              <Row $width='auto' $gap={4} $alignItems='center'>
                <MaterialIcons
                  name='access-time'
                  size={14}
                  color={theme.colors.textSecondary}
                />
                <BodyXSMono>{selectedTrade.duration}</BodyXSMono>
              </Row>
            </Column>
          </Card>
        </Column>

        {/* Action Buttons */}
        <Column $gap={8} $width='100%'>
          <PrimaryButton
            onPress={handleTradeAgain}
            icon={
              <MaterialIcons
                name='refresh'
                size={18}
                color={theme.colors.background}
              />
            }
          >
            {t('Trade again')}
          </PrimaryButton>
          <SecondaryButton
            onPress={handleShare}
            icon={
              <MaterialIcons
                name='share'
                size={18}
                color={theme.colors.textPrimary}
              />
            }
          >
            {t('Share')}
          </SecondaryButton>
        </Column>
      </Column>
    </Modal>
  );
};

const Icon = ({ symbol }: { symbol: 'btc' | 'eth' | 'sol' }) => {
  switch (symbol) {
    case 'btc':
      return <BtcUnselected />;
    case 'eth':
      return <EthUnselected />;
    case 'sol':
      return <SolUnselected />;
  }
};

const SymbolContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  position: relative;
`;

const ArrowContainer = styled.View`
  position: absolute;
  right: -12px;
  bottom: -4px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.secondaryTapped};
  border-radius: 100px;
  padding: 4px;
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.card};
  border-width: 1px;
`;

const ProfitPill = styled.View<{ isProfit: boolean }>`
  background-color: ${({
    theme,
    isProfit,
  }: {
    theme: DefaultTheme;
    isProfit: boolean;
  }) => (isProfit ? theme.colors.profit + '20' : theme.colors.loss + '20')};
  padding: 4px 8px;
  border-radius: 100px;
  border-width: 1px;
  border-color: ${({
    theme,
    isProfit,
  }: {
    theme: DefaultTheme;
    isProfit: boolean;
  }) => (isProfit ? theme.colors.profit : theme.colors.loss)};
`;

const ProfitAmount = styled.Text<{ isProfit: boolean }>`
  font-family: 'Geist';
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme, isProfit }: { theme: DefaultTheme; isProfit: boolean }) =>
    isProfit ? theme.colors.profit : theme.colors.loss};
  margin-top: 4px;
`;

const DataCard = styled(Card)`
  flex: 1;
  padding: 12px;
  align-items: flex-start;
  gap: 8px;
`;
