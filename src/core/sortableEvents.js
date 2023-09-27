const manageAndEmit = ["Start", "Add", "Remove", "Update", "End"];
const emit = [
  "Choose",
  "Unchoose",
  "Sort",
  "Filter",
  "Clone",
  "Select",
  "Deselect"
];
const manage = ["Move"];
const eventHandlerNames = [manage, manageAndEmit, emit]
  .flatMap(events => events)
  .map(evt => `on${evt}`);

const events = {
  manage,
  manageAndEmit,
  emit
};

function isReadOnly(eventName) {
  return eventHandlerNames.indexOf(eventName) !== -1;
}

export { events, isReadOnly };
