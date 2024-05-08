import { linkifyTextNode as linkifyNode, linkifyTag as _linkifyTag } from "../../libraries/common/cs/fast-linkify.js";

export default async function ({ addon, console }) {
  while (true) {
    const listItem = await addon.tab.waitForElement("[class*=monitor_list-monitor_] [class*=monitor_value-inner]", {
      markAsSeen: true,
    });

    linkifyNode(listItem);

    if (listItem.querySelector("a")) listItem.querySelector("a").style.color = "white";
  }
}
