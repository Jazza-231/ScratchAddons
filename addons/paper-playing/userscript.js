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
1. Where will these new things go? All the "tools" require mouse input
   And none of these require mouse input, there are more akin to the
   outline width, etc
2. Make sure to check the item type of the selected items, only smooth paths, not text etc
3. Setting for smoothing type

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
    if (toolCanSelect()) {
      paper.tool.boundingBoxTool.setSelectionBounds();
    }
  }

  function updateImage() {
    if (toolCanSelect()) {
      paper.tool.onUpdateImage();
    }
  }

  const selectedItems = () => {
    if (toolCanSelect()) {
      return paper.project.selectedItems;
    }
  };

  const toolCanSelect = () => {
    return paper.tool.onUpdateImage ? true : false;
  };

  const paperExists = () => {
    return paper.view ? true : false;
  };

  const zoom = () => {
    return paper.view.zoom;
  };

  // Random: If you undo an action, the entire project gets selected
  // You can check if it is by looking at the last array item and seeing if it has a parent or if its null

  function centerOnKey() {
    document.addEventListener("keydown", (e) => {
      if (paperExists()) {
        if (e.ctrlKey || e.metaKey) {
          if (e.key === "e") {
            const selected = selectedItems();
            if (selected.length > 0) {
              // Prevent browser search opening
              e.preventDefault();

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
      }
    });
  }

  function arrowKeys() {
    const acceptedKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    const settings = {
      default: 1,
      shift: 15,
      alt: 0.1,
    };

    function undoDefault(e) {
      if (e.ctrlKey || e.metaKey) return;

      let amount;
      if (e.shiftKey) {
        amount = 15;
      } else amount = 1;
      amount /= zoom();

      selectedItems().forEach((item) => {
        if (e.key === "ArrowLeft") {
          item.position.x += amount;
        } else if (e.key === "ArrowRight") {
          item.position.x -= amount;
        } else if (e.key === "ArrowUp") {
          item.position.y += amount;
        } else item.position.y -= amount;
      });
    }

    function addonMove(e) {
      let amount;
      if (e.shiftKey) {
        amount = settings.shift;
      } else if (e.altKey) {
        amount = settings.alt;
      } else amount = settings.default;
      amount /= zoom();

      selectedItems().forEach((item) => {
        if (e.key === "ArrowLeft") {
          item.position.x -= amount;
        } else if (e.key === "ArrowRight") {
          item.position.x += amount;
        } else if (e.key === "ArrowUp") {
          item.position.y -= amount;
        } else item.position.y += amount;
      });
    }

    document.body.addEventListener("keydown", (e) => {
      if (paperExists() && selectedItems().length > 0) {
        if (acceptedKeys.includes(e.key)) {
          undoDefault(e);
          addonMove(e);
          updateImage();
          drawBounds();
        }
      }
    });
  }

  centerOnKey();
  arrowKeys();
}
