export default async function ({ addon, console, msg }) {
  const codes = {
    motion_movesteps: `move (%i) steps`,
    motion_turnright: `turn cw (%i) degrees`,
    motion_turnleft: `turn ccw (%i) degrees`,
    motion_goto: `go to [%i v]`,

    operator_random: `(pick random (%i) to (%i))`,
    control_wait: `wait (%i) secs`,
    control_if_else: `
    if <%i> then 

    %i

    else

    %i
    
    end
    `,
    operator_equals: `<[%i] = [%i]>`,
  };

  addon.tab.createBlockContextMenu(
    (items, block) => {
      items.push({
        enabled: true,
        text: "Copy as forum code",
        callback: () => {
          copyBlock(block);
        },
        separator: true,
      });
      return items;
    },
    { blocks: true }
  );

  async function setClipboardText(text) {
    try {
      await navigator.clipboard.writeText(text);
      console.log("Text successfully copied to clipboard:", text);
    } catch (err) {
      console.error("Failed to copy text to clipboard:", err);
    }
  }

  function copyBlock(block, loop) {
    console.log(block);
    console.log(block.type);

    const type = block.type;
    let inputs = [];

    for (let child of block.childBlocks_) {
      if (child.childBlocks_.length > 0) {
        inputs.push(copyBlock(child, true));
      } else {
        inputs.push(child.inputList[0].fieldRow[0].text_);
      }
    }

    let regex = /%\i/;
    let code;
    let length = inputs.length;
    console.log(inputs);

    if (codes[type]) {
      code = codes[type];

      for (let i = 0; i < length; i++) {
        code = code.replace(regex, inputs[i]); // Replace %i with corresponding input
      }
    }
    if (loop) return code;

    setClipboardText(`
    [scratchblocks]
    ${code}
    [/scratchblocks]`);
  }
}
