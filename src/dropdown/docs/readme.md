
Dropdown is a simple directive which will toggle a dropdown menu on click or programmatically.
You can either use `is-open` to toggle or add inside a `<a dropdown-toggle>` element to toggle it when is clicked.
There is also the `on-toggle(open)` optional expression fired when dropdown changes state.

A final option is to create a directive that requires the `dropdown` controller and calls toggle(open, event).
This will allow making context menus that open at the mouse cursors position (or anywhere else specified in the event object)
