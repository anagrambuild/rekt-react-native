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

  - graphs are jacked up
  - new app icon
  - drift protocols

after hackathon

- check biometric
- update profile
