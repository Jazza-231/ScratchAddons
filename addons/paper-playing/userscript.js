export default async function ({ addon, console }) {
  const paper = await addon.tab.traps.getPaper();
  console.log(await addon.tab);

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "e") {
        // Prevent browser search opening
        e.preventDefault();

        const selected = paper.project.selectedItems;
        let index = 0;
        selected.forEach((item) => {
          // Find the highest item selected
          if (item.index > index) index = item.index;
        });

        let group = new paper.Group(selected);

        group.position = new paper.Point(480, 360);
        paper.tools[0].boundingBoxTool.setSelectionBounds(); // Draw the bounding box in the new position

        group.remove(); // Remove the group so that it doesn't interfere with the layers
        group.removeChildren().forEach((item) => {
          paper.project.activeLayer.insertChild(index, item);
        });
      }
    }
  });
}
