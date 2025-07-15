UI

Big items

- app icon
- carousell on sign up screen

polishing (mismatches from designs)

- animated socials at the top of the screen
- flame for splash screen
- add commas for number strings
- linear gradient on active tab
- icons for long and short segment control
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

- Could we add haptic feedback to the slider so that every time that you go, the phone buzzes a little bit also, can we control the like intensity of the feedback the vibrant so I’m thinking you know maybe we have an increase by 10% every time it goes up or something like that
  Same with adding and subtracting funds

  - don't allow swipeback on screens - refactor home tabs/stack

- Profile screen
  - add video instead of plus button for avatar upload
