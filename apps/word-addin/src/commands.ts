// Office ribbon command handlers (function commands)
declare const Office: typeof import('@microsoft/office-js');

Office.onReady(() => {
  // Register global functions called from manifest function commands
  (globalThis as any).openTaskpane = openTaskpane;
});

function openTaskpane(event: Office.AddinCommands.Event) {
  event.completed();
}
