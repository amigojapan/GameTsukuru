(() => {
  'use strict';

  // World coordinates stay in room space; only the visible canvas area moves.
  function roomCamera(room, instances, centerOf, previous) {
    const roomWidth = Math.max(64, Math.min(4096, Number(room.width) || 640));
    const roomHeight = Math.max(64, Math.min(4096, Number(room.height) || 480));
    const settings = room.view;
    if (!settings?.enabled) return {x:0, y:0, width:roomWidth, height:roomHeight};

    const width = Math.max(64, Math.min(roomWidth, Number(settings.width) || Math.min(640, roomWidth)));
    const height = Math.max(64, Math.min(roomHeight, Number(settings.height) || Math.min(480, roomHeight)));
    const target = instances.find(instance => instance.objectId === settings.followObjectId);
    const center = target ? centerOf(target) : null;
    const x = center ? center.x - width / 2 : previous?.x || 0;
    const y = center ? center.y - height / 2 : previous?.y || 0;
    return {
      x: Math.round(Math.max(0, Math.min(roomWidth - width, x))),
      y: Math.round(Math.max(0, Math.min(roomHeight - height, y))),
      width,
      height
    };
  }

  window.roomCamera = roomCamera;
})();
