UI

- add avatar on account creation

High Priority

- web3 auth working on front end/ password with username if web3 auth doesn't work

Implementing backend:

- create account
- check balance
- should not allow a trade with no usdc
- open trade
- close trade
- get current trade status
- wire up trade again button to really work
- withdraw
- withdraw before delete account - remove mock balance
- test delete account

Notes for backend

- no username update endpoint

Tighten ups

- check MWA on Android calling connection twice

Low Priority

- FAQs
- look into passkeys
- biometrics
- don't allow swipeback on screens - refactor home tabs/stack

polishing (mismatches from designs)

- linear gradient on active tab
- make an ArcSlider
- HORIZONTAL SLIDER
  - ios has a bug - going beyond 100 leverage and then switching tokens and coming back the handle is in the wrong position - i made a hacky fix to reset it but that trips out android and makes it worse - so i only implement for ios - but it flashes like a glitch on ios
  - gradient colors dont exactly match the designs
  - android slider is buggy when you move and let off quickly
- AmountModal.tsx - there is a flicker in the UI when the user tries to add a 3rd digit in the decimal column
- PRICE CHART - overflow:hidden causes problems - cuts off the top of labels and dotted lines go beyond the chart to the right
