export default async function ({ addon, console, msg }) {
// Remake this with an object you populate before even trying to make code

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
    control_if: `
    if <%i> then

    %i

    end
    `,
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

  function copyBlock(block) {
    console.log(block);
    const type = block.type;
    let inputs = [];

    block.inputList.forEach((input) => {
      if (input.type !== 5) {
        console.log(input);
        inputs.push(input.connection.targetConnection?.sourceBlock_);
      }
    });

    inputs = inputs.map((input) => (input === undefined ? "" : input));
    console.log(inputs);

    let regex = /%\i/;
    let code;
    let length = inputs.length;

    if (codes[type]) {
      code = codes[type];

      for (let i = 0; i < length; i++) {
        code = code.replace(regex, inputs[i]); // Replace %i with corresponding input
      }
    }

    setClipboardText(`
    [scratchblocks]
    ${code}
    [/scratchblocks]`);
  }
}
