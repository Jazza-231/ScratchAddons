/*
TODO (maybe):
Center on hotkey
Smooth button
Rounded corners on rectangles
x, y, width, height of costume items
Polygons
Costume editor arrow key modifiers
Blending modes for shapes?
Look into shiftable anchor point

NOTES:
Center on hotkey
1. Fix things being grouped together no longer being grouped
2. Check if layers are preserved?

Smooth button
1. Find out what the strings after the _ mean and how to make them
2. Where will these new things go? All the "tools" require mouse input
   And none of these require mouse input, there are more akin to the
   outline width, etc
3. Make sure to check the item type of the selected items, only smooth paths, not text etc
4. Setting for smoothing amount?

Rounded corners on rectangles
1. UI from inkscape I think would be best
2. Can you modify the rounding of the rectangle after its made?
   With rectangle.radius or something? If not,
   use math to move the points around the corners to change rounding amount

x, y, width, height
1. Where should UI go?

Polygons
1. New tool, select the number of points like the brush size
2. Click and drag to set the size of the polygon...
   How do I do that?

Costume editor arrow key modifiers
1. Steal addon.json code from editor number arrow keys
2. Prevent default behaviour, update image and bounds
*/

export default async function ({ addon, console }) {
  const paper = await addon.tab.traps.getPaper();
  console.log(paper);

  function drawBounds() {
    paper.tools[0].boundingBoxTool.setSelectionBounds();
  }

  function updateImage() {
    paper.tool.onUpdateImage();
  }

  function selectedItems() {
    return paper.project.selectedItems;
  }

  async function centerOnKey() {
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "e") {
          // Prevent browser search opening
          e.preventDefault();

          const selected = selectedItems();
          if (selected) {
            let index = 0;
            selected.forEach((item) => {
              // Find the highest index of all the selected items
              if (item.index > index) index = item.index;
            });

            let group = new paper.Group(selected);

            group.position = new paper.Point(480, 360);
            drawBounds();

            group.remove(); // Remove the group so that it doesn't interfere with the layers
            group.removeChildren().forEach((item) => {
              paper.project.activeLayer.insertChild(index, item);
            });
            updateImage();
          }
        }
      }
    });
  }

  centerOnKey();
}
