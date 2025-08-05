UI

Big items

- app icon
- carousell on sign up screen

polishing (mismatches from designs)

- add commas for number strings
- linear gradient on active tab
- make an ArcSlider
- HORIZONTAL SLIDER
  - ios has a bug - going beyond 100 leverage and then switching tokens and coming back the handle is in the wrong position - i made a hacky fix to reset it but that trips out android and makes it worse - so i only implement for ios - but it flashes like a glitch on ios
  - gradient colors dont exactly match the designs
  - android slider is buggy when you move and let off quickly
- AmountModal.tsx - there is a flicker in the UI when the user tries to add a 3rd digit in the decimal column
- PRICE CHART - overflow:hidden causes problems - cuts off the top of labels and dotted lines go beyond the chart to the right

WIRING UP REAL DATA

- fetch real wallet balance for usdc on HomeContext

Liam's feedback:

- add haptic on decreasing leverage?
- don't allow swipeback on screens - refactor home tabs/stack

- Profile screen

  - profile modal - add a fling gesture to close it

  before hackathon end:

  - get real trades working on chain
  - get balance of usdc of swig wallet, not authority wallet
    (note - getting it from solana/web3.js because drift gives an error)
  - usdc token amount did not show until restart ✅
  - profile not found error on trade after account creation ✅
  - CREATE USDC token ATA on account creation ✅
  - fix fake wallet address in profile ✅
  - show trade history from db in profile 🚫
  - use biometrics on app join ✅
  - ios app icon ✅

  - UI does not update when receiving USDC
  - get real historical data for token prices
  - load chart data faster?

after hackathon

- update profile
- fetch usdc balance from backend
- should not allow a trade with no usdc
- wire up trade again button to really work
- check biometric on android
- get real price data for individual trade history and regular price charts
