import { setup, setVolume, getVolume } from "../vol-slider/module.js";

export default async ({ addon }) => {
  while (true) {
    const soundEditorContainer = await addon.tab.waitForElement('[class*="sound-editor_editor-container_"]', {
      markAsSeen: true,
    });

    const vm = addon.tab.traps.vm;

    console.log(vm);

    setup(vm);

    let currentVolume = getVolume();
    let ducking = false;

    let fiber = soundEditorContainer[addon.tab.traps.getInternalKey(soundEditorContainer)];
    while (fiber && !(fiber.stateNode && (fiber.stateNode.handlePlay || fiber.stateNode.handleEffect))) {
      fiber = fiber.return;
    }
    if (!fiber || !fiber.stateNode) continue;

    const instance = fiber.stateNode;

    console.log(instance);

    const oldHandlePlay = instance.handlePlay;
    instance.handlePlay = function () {
      const result = oldHandlePlay.apply(this);

      if (!ducking) currentVolume = getVolume();
      setVolume(addon.settings.get("volume") / 100);

      ducking = true;

      return result;
    };

    const oldHandleStoppedPlaying = instance.handleStoppedPlaying;
    instance.handleStoppedPlaying = function () {
      const result = oldHandleStoppedPlaying.apply(this);

      setVolume(currentVolume);
      ducking = false;

      return result;
    };
  }
};
