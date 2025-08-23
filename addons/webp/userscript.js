export default async function ({ addon }) {
  while (true) {
    const spriteSelector = '[class*="sprite-selector_sprite-selector_"] [class*="action-menu_more-buttons_"] input';
    const stageSelector = '[class*="stage-selector_stage-selector_"] [class*="action-menu_more-buttons_"] input';
    const costumeSelector = '[data-tabs] > :nth-child(3) [class*="action-menu_more-buttons_"] input';
    let menuInput = await addon.tab.waitForElement(`${spriteSelector}, ${stageSelector}, ${costumeSelector}`, {
      markAsSeen: true,
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
      reduxEvents: [
        "scratch-gui/mode/SET_PLAYER",
        "fontsLoaded/SET_FONTS_LOADED",
        "scratch-gui/locales/SELECT_LOCALE",
        "scratch-gui/navigation/ACTIVATE_TAB",
      ],
    });

    const acceptsStr = menuInput.accept.trim();
    // Set to dedupe
    const accepts = new Set(acceptsStr.split(",").map((s) => s.trim()));
    accepts.add(".webp");

    menuInput.accept = Array.from(accepts).join(", ");

    // Let HD uploads handle it
    if (menuInput.className.includes("sa-better-img-uploads-input")) continue;

    menuInput.addEventListener("change", async (e) => {
      if (e.detail === "converted") return;

      const input = e.target;
      const files = input.files;

      if (files.length === 0) return;

      for (const file of files) {
        console.log(file);

        const isWebP = file.name.endsWith(".webp") || file.type === "image/webp";
        if (!isWebP) return;

        // Hide it from scratch hehe
        e.stopImmediatePropagation();
        e.preventDefault();

        try {
          const buffer = await file.arrayBuffer();
          const blob = new Blob([buffer], { type: "image/webp" });
          const imageURL = URL.createObjectURL(blob);

          const image = new Image();

          await new Promise((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject("Failed to load WebP image");
            image.src = imageURL;
          });

          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext("2d");

          ctx.drawImage(image, 0, 0);
          URL.revokeObjectURL(imageURL);

          // Convert to chosen format
          let format = addon.settings.get("format");

          console.log(addon.settings.get("format"), addon.settings.get("quality"));

          const newBlob = await new Promise((resolve, reject) => {
            canvas.toBlob(
              (b) => (b ? resolve(b) : reject(new Error("Encode failed"))),
              `image/${format}`,
              addon.settings.get("quality") / 100
            );
          });

          // Create a new file
          const newName = file.name.replace(".webp", `.${format}`);
          const newFile = new File([newBlob], newName, { type: `image/${format}` });

          console.log(newFile);

          const dt = new DataTransfer();
          dt.items.add(newFile);
          input.files = dt.files;

          // Send it through back to scratch :D
          const evt = new CustomEvent("change", { bubbles: true, detail: "converted" });
          input.dispatchEvent(evt);
        } catch (error) {
          console.error(error);

          // Default, just send it through for scratch to reject if smth messed up
          const evt = new Event("change", { bubbles: true });
          input.dispatchEvent(evt);
        }
      }
    });
  }
}
