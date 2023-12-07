export default async function ({ addon, console }) {
  const paper = await addon.tab.traps.getPaper();
  console.log(paper);
  const fixGuideSizes = () => {
    return new paper.Path.Circle({
      center: new paper.Point(0, 0),
      radius: 5.5 / paper.view.zoom,
      fillColor: "black",
      visible: true,
    });
  };
  console.log(fixGuideSizes().position);
}
