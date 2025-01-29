function getConsole() {
  if (typeof window !== "undefined" && window.console) return window.console;
  if (global && global.console) return global.console;
  return { log: function () { }, warn: function () { }, error: function () { }, info: function () { } }
}

const console = getConsole();

export { console };
