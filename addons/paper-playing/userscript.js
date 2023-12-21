/*
TODO (maybe):
Center on hotkey
Smooth button
Rounded corners on rectangles
x, y, width, height of costume items
Polygons
Costume editor arrow key modifiers
Blending modes for shapes?
Shiftable anchor point
Copy selection into new costume

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

Shiftable anchor point
1. Override paper.tool.boundingBoxTool._modeMap.ROTATE.onMouseDrag
   See line 309 of updateSelectTool.js
2. Make guide points to show where it will rotate around
3. Where will I store the pivot data? Pivot, data, and basically every property is wiped...comment? Local storage?
   Comments could take up project.json space, local storage will not persist on other devices
4. How does scratch get the bounds of the selection? Do they make a group with the clones?

paper.tool.boundingBoxTool._modeMap.ROTATE.onMouseDown = ((event) => {
        let selectionBounds = paper.project.selectedItems[0]
    paper.project.selectedItems.forEach((item) => {
        selectionBounds = selectionBounds.unite(item.clone(false))
        selectionBounds.remove()
    })
    let bounds = selectionBounds.bounds
    let pivot = bounds.center
    this.pivot = pivot.add(50)
})

paper.tool.boundingBoxTool._modeMap.ROTATE.onMouseDrag = ((event) => {
    paper.project.selectedItems.forEach((item) => {
        item.rotate(1, pivot)
    })
})

Copy selection to new costume
1. How to make new blank costumes properly?
2. How do I convert to bitmap properly?
3. Do I need to center it manually?
4. Alternatively, I could make a new asset with the required data, add it, update the workspace, 
   and never have to deal with paper or have to switch costumes, allowing you to stay on the costume you're on right now

Below is example code to copy bitmap to bitmap
const sel = paper.project.selectedItems[0]
const json = paper.Base.importJSON(sel)
const newCostume = {
    name: "name",
    md5: 'cd21514d0531fdffb22204e0ec5ed84a.svg',
    rotationCenterX: 0,
    rotationCenterY: 0,
    bitmapResolution: 1,
    skinId: null
}
vm.editingTarget.addCostume(newCostume)
vm.editingTarget.setCostume(vm.editingTarget.currentCostume + 1)
vm.emitTargetsUpdate()

(click convert to bitmap)

paper.project.getActiveLayer().addChild(json)
paper.project.activeLayer.children[0].selected = true
paper.tool.onUpdateImage()
*/

export default async function ({ addon, console }) {
  window.addon = addon;

  const paper = await addon.tab.traps.getPaper();

  function drawBounds() {
    if (toolCanSelect()) paper.tool.boundingBoxTool.setSelectionBounds();
  }

  function updateImage() {
    if (toolCanSelect()) paper.tool.onUpdateImage();
  }

  const selectedItems = () => {
    if (toolCanSelect()) return paper.project.selectedItems;
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

  // This should remove the activeLayer (item with no parent) from the selected items array
  // This wont actually deselect it tho. The activeLayer gets added to selectedItems on undo
  function deselectActiveLayer(items) {
    if (items[items.length - 1].parent === null) {
      items.pop();
    }
    return items;
  }

  function centerOnKey() {
    document.addEventListener("keydown", (e) => {
      if (paperExists()) {
        if (e.ctrlKey || e.metaKey) {
          if (e.key === "e") {
            console.log(paper.project.selectedItems);
            const selected = deselectActiveLayer(selectedItems());
            // Traverse project.activeLayer for selected items to add support for groups OR check selected items for groups and items with parents that are groups
            console.log(selected);
            if (selected.length > 0) {
              // Prevent browser search opening
              e.preventDefault();

              let index = Infinity;
              selected.forEach((item) => {
                if (item.index < index) index = item.index;
              });

              let group = new paper.Group(selected);

              group.position = new paper.Point(480, 360);
              drawBounds();

              group.remove(); // Remove the group so that it doesn't interfere with the layers
              group
                .removeChildren()
                .reverse()
                .forEach((item) => {
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
      if (e.shiftKey) amount = 15;
      else amount = 1;
      amount /= zoom();

      selectedItems().forEach((item) => {
        if (e.key === "ArrowLeft") item.position.x += amount;
        else if (e.key === "ArrowRight") item.position.x -= amount;
        else if (e.key === "ArrowUp") item.position.y += amount;
        else item.position.y -= amount;
      });
    }

    function addonMove(e) {
      let amount;
      if (e.shiftKey) amount = settings.shift;
      else if (e.altKey) amount = settings.alt;
      else if (e.ctrlKey) amount = 0;
      else amount = settings.default;
      amount /= zoom();

      selectedItems().forEach((item) => {
        if (e.key === "ArrowLeft") item.position.x -= amount;
        else if (e.key === "ArrowRight") item.position.x += amount;
        else if (e.key === "ArrowUp") item.position.y -= amount;
        else item.position.y += amount;
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

  async function smoothButton() {
    const type = "simplify";

    const container = await addon.tab.waitForElement("[class*=paint-editor_editor-container-top_]");
    const row2 = container.lastChild;
    const toolsGroup = row2.lastChild.firstChild;

    const outerDiv = document.createElement("div");
    outerDiv.classList.add(addon.tab.scratchClass("mode-tools_mod-labeled-icon-height"));
    outerDiv.classList.add(addon.tab.scratchClass("input-group_input-group"));
    outerDiv.style.cursor = "pointer";

    const outerSpan = document.createElement("span");
    outerSpan.classList.add(addon.tab.scratchClass("button_button"));
    outerSpan.classList.add(addon.tab.scratchClass("labeled-icon-button_mod-edit-field"));

    const img = document.createElement("img");
    img.classList.add(addon.tab.scratchClass("labeled-icon-button_edit-field-icon"));
    img.src = `${addon.self.dir}\\smooth.svg`;

    const innerSpan = document.createElement("span");
    innerSpan.classList.add(addon.tab.scratchClass("labeled-icon-button_edit-field-title"));
    innerSpan.textContent = "Smooth";

    outerSpan.appendChild(img);
    outerSpan.appendChild(innerSpan);
    outerDiv.appendChild(outerSpan);

    outerDiv.addEventListener("click", () => {
      selectedItems().forEach((item) => {
        if (type === "simplify") item.simplify();
        else item.smooth();
      });
      updateImage();
      drawBounds();
    });

    function updateTools() {
      toolsGroup.appendChild(outerDiv);
      outerDiv.classList.remove(addon.tab.scratchClass("mode-tools_mod-dashed-border"));
      toolsGroup.childNodes[2].classList.add(addon.tab.scratchClass("mode-tools_mod-dashed-border"));
    }

    updateTools();

    function checkTools(e) {
      if (e.target.state.scratchPaint.mode === "SELECT") {
        setTimeout(() => {
          if (toolsGroup.lastChild !== outerDiv) {
            updateTools();
          }
        }, 100);
      } else {
        if (toolsGroup.lastChild === outerDiv) {
          toolsGroup.removeChild(outerDiv);
        }
      }
    }
    addon.tab.redux.initialize();
    addon.tab.redux.addEventListener("statechanged", checkTools);
  }

  function shiftableAnchorPoint() {
    /**
     * Selection must be a single item or a group
     * When you have something selected, a custom pivot point will show, and when you drag it,
     * that is the point on the canvas which it rotates around (you can not rotate relative to the
     * item, because its center changes on rotation).
     * When you move the item/group, the pivot point is moved too, so that it's not rotating on the same canvas point, but
     * acts like it is relative to the item.
     * Make sure to keep all original scratch features (shift to snap to 45 degrees), and think about compat with new addon idea
     * customising the value that it snaps to when you hold shift.
     * Add an option to lock it the canvas - hexagonal
     */
    const rotateTool = paper.tool.boundingBoxTool._modeMap.ROTATE;

    rotateTool.constructor.prototype.onMouseDown = function () {
      let selected = deselectActiveLayer(selectedItems());
      let selectionBounds = selected[0].bounds;
      selected.forEach((item) => {
        selectionBounds = selectionBounds.unite(item.clone(false).bounds);
        selectionBounds.remove();
      });
      let bounds = selectionBounds.bounds;
      this.pivot = bounds.center;
    };

    rotateTool.constructor.prototype.onMouseDrag = function () {
      paper.project.selectedItems.forEach((item) => {
        item.rotate(1, this.pivot.add(50));
      });
    };
  }

  centerOnKey();
  arrowKeys();
  smoothButton();
  shiftableAnchorPoint();
}
