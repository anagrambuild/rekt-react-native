import diamond from '@/assets/images/app-pngs/diamond.png';
import usdc from '@/assets/images/app-pngs/usdc.png';
import RektLogo from '@/assets/images/rekt-logo.svg';
import { Row, ScreenContainer, Title1, TokenChip } from '@/components';

// mock data for tokens at top of screen
const tokens = [
  { id: 0, imgSrc: diamond, value: '58K' },
  { id: 1, imgSrc: usdc, value: '69000' },
];

export const HomeScreen = () => {
  return (
    <ScreenContainer>
      <Row>
        <RektLogo width={60} height={60} />
        <Row $justifyContent='flex-end' $gap={16} width='auto'>
          {tokens.map((token) => (
            <TokenChip
              key={token.id}
              imgSrc={token.imgSrc}
              value={token.value}
            />
          ))}
        </Row>
      </Row>
      <Title1>Home</Title1>
    </ScreenContainer>
  );
};
