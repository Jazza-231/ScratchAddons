export default async function ({ addon, console }) {
  window.addon = addon;
  window.paper = await addon.tab.traps.getPaper();
}
