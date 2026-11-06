(() => {
  'use strict';
  const playerSource = String.raw`(() => {
  'use strict';
  const project = JSON.parse(document.getElementById('project-data').textContent);
  const actionEngine = __VISUAL_ENGINE__(project);
  const roomCamera = __ROOM_CAMERA__;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const controller = __TOUCH_CONTROLS__(document.getElementById('on_screen_controls'), project, canvas);
  const audio = __GAME_AUDIO__();
  const keys = new Set();
  const images = new Map();
  let room, instances, game, camera, requestId, lastTime = 0, accumulator = 0, activeCollisions = new WeakMap();
  const byId = (type, id) => (project[type] || []).find(item => item.id === id);
  const objectFor = instance => byId('objects', instance.objectId);
  const spriteFor = instance => byId('sprites', instance.spriteId) || byId('sprites', objectFor(instance)?.spriteId);
  const sizeOf = instance => { const sprite = spriteFor(instance); return {w:Math.max(8,Math.min(512,Number(sprite?.width)||32)),h:Math.max(8,Math.min(512,Number(sprite?.height)||32))}; };
  const centerOf = instance => {const sprite=spriteFor(instance),size=sizeOf(instance);return {x:Number(instance.x)+size.w/2-(Number(sprite?.originX)||0),y:Number(instance.y)+size.h/2-(Number(sprite?.originY)||0)};};
  const imageFor = data => { if (!data) return null; if (!images.has(data)) { const image = new Image(); image.src = data; images.set(data, image); } return images.get(data); };
  const keyDown = key => { const map = {left:'ArrowLeft',right:'ArrowRight',up:'ArrowUp',down:'ArrowDown',space:'Space',a:'KeyA',b:'KeyB',d:'KeyD',w:'KeyW',s:'KeyS'}; const code=map[String(key).toLowerCase()] || key;return keys.has(code)||controller.pressed(code); };
  const copy = value => JSON.parse(JSON.stringify(value));
  const newId = () => 'instance_' + Math.random().toString(36).slice(2);
  function drawInstance(instance) {
    const object = objectFor(instance), sprite = spriteFor(instance), size = sizeOf(instance), frames = sprite?.frames || [], frame = frames.length ? frames[Math.floor(game.frame / Math.max(1,60/(sprite.frameSpeed||8))) % frames.length] : null, image = imageFor(frame?.image || sprite?.image);
    ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,Number(object?.alpha??1)));
    if (image?.complete && image.naturalWidth) {
      const x=instance.x-(sprite.originX||0),y=instance.y-(sprite.originY||0);
      if(Number(instance.image_xscale)<0){ctx.translate(x+size.w,0);ctx.scale(-1,1);ctx.drawImage(image,0,y,size.w,size.h);}
      else ctx.drawImage(image,x,y,size.w,size.h);
    }
    else { ctx.fillStyle = object?.solid ? '#657482' : '#4c98d4'; ctx.fillRect(instance.x, instance.y, size.w, size.h); ctx.strokeStyle = '#274b68'; ctx.strokeRect(instance.x+.5, instance.y+.5, size.w-1, size.h-1); }
    ctx.restore();
  }
  function apiFor(self) {
    return {
      keyboard_check:keyDown,
      instance_find(name) {return instances.find(item=>item.objectName===name||item.objectId===name)||null;},
      instance_create(x,y,name) { const object = (project.objects || []).find(item => item.name === name || item.id === name); if (!object) return null; const instance = {id:newId(),objectId:object.id,objectName:object.name,x:Number(x)||0,y:Number(y)||0,image_angle:0,visible:true,startX:Number(x)||0,startY:Number(y)||0,hspeed:0,vspeed:0}; instances.push(instance); fire(instance,'create'); return instance; },
      instance_destroy(target=self) { instances = instances.filter(item => item !== target); },
      place_meeting(x,y,name) { return instances.some(item => {if(item===self)return false;const object=objectFor(item);return (!name||object?.name===name)&&actionEngine.collides(self,item,game,x,y);}); },
      draw_self() { drawInstance(self); },
      draw_text(text,x,y,color='#ffffff') {ctx.fillStyle=color;ctx.font='16px Tahoma, sans-serif';ctx.fillText(String(text),Number(x)||0,Number(y)||0);},
      draw_rectangle(x,y,w,h,color='#ffffff') {ctx.fillStyle=color;ctx.fillRect(Number(x)||0,Number(y)||0,Number(w)||0,Number(h)||0);},
      play_sound(name,volume=100,repeat=false) {if(game._audioStopped)return;const sound=(project.sounds||[]).find(item=>item.name===name||item.id===name);if(sound?.data)audio.play(sound.id,sound.data,volume,repeat);},
      stop_sound(name) {if(!name){audio.stopAll();return;}const sound=(project.sounds||[]).find(item=>item.name===name||item.id===name);if(sound)audio.stop(sound.id);},
      room_goto(name) {const next=(project.rooms||[]).find(item=>item.name===name);if(next)loadRoom(next);},
      path_start(name,speed=4,relative=true) {actionEngine.startPath(self,{pathId:name,speed,relative});},
      path_stop() {self._pathState=null;}
    };
  }
  function fire(instance,type,other=null) {
    const object=objectFor(instance);
    for(const event of object?.events||[]){
      if(event.type!==type||!event.actions?.length||!instances.includes(instance))continue;
      const fromX=instance.x,fromY=instance.y;
      try {actionEngine(event,instance,other,apiFor(instance),game);}
      catch(error){document.getElementById('error').textContent=object.name+' · '+type+': '+error.message;console.error(error);}
      finally {if(instances.includes(instance)&&actionEngine.resolveSolidMove(instance,fromX,fromY,instances,game))instance._pathState=null;}
    }
  }
  function loadRoom(next) {
    room=next;instances=(room.instances||[]).map(item=>{const object=byId('objects',item.objectId);return {...copy(item),objectName:object?.name||'',image_angle:0,visible:true,startX:item.x,startY:item.y,hspeed:0,vspeed:0};});
    activeCollisions=new WeakMap();
    game.width=room.width||640;game.height=room.height||480;game.room=room.name;
    camera=roomCamera(room,instances,centerOf);
    game.viewX=camera.x;game.viewY=camera.y;game.viewWidth=camera.width;game.viewHeight=camera.height;
    canvas.width=camera.width;canvas.height=camera.height;
    document.getElementById('room-name').textContent=room.name;
    instances.slice().forEach(item=>fire(item,'create'));
  }
  function tick() {
    if(game.paused)return;
    game.frame++;
    instances.slice().forEach(item=>{if(!instances.includes(item))return;const fromX=item.x,fromY=item.y;actionEngine.advancePath(item);if(actionEngine.resolveSolidMove(item,fromX,fromY,instances,game))item._pathState=null;fire(item,'step');if(keyDown('left')||keyDown('a'))fire(item,'keyboard_left');if(keyDown('right')||keyDown('d'))fire(item,'keyboard_right');if(keyDown('up')||keyDown('w'))fire(item,'keyboard_up');if(keyDown('down')||keyDown('s'))fire(item,'keyboard_down');if(keyDown('space'))fire(item,'keyboard_space');if(keyDown('b'))fire(item,'keyboard_b');});
    const bodies=instances.map(inst=>({inst,rect:actionEngine.bounds(inst,game),hasEvent:objectFor(inst)?.events?.some(event=>event.type==='collision')}));
    const nextCollisions=new WeakMap();
    for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
      const a=bodies[i],b=bodies[j],ar=a.rect,br=b.rect;
      if(!(a.hasEvent||b.hasEvent)||ar.x>=br.x+br.w||ar.x+ar.w<=br.x||ar.y>=br.y+br.h||ar.y+ar.h<=br.y)continue;
      if(!instances.includes(a.inst)||!instances.includes(b.inst)||!actionEngine.collides(a.inst,b.inst,game))continue;
      if(!activeCollisions.get(a.inst)?.has(b.inst)){
        fire(a.inst,'collision',b.inst);
        if(instances.includes(b.inst))fire(b.inst,'collision',a.inst);
      }
      a.rect=actionEngine.bounds(a.inst,game);b.rect=actionEngine.bounds(b.inst,game);
      if(instances.includes(a.inst)&&instances.includes(b.inst)&&actionEngine.collides(a.inst,b.inst,game)){
        if(!nextCollisions.has(a.inst))nextCollisions.set(a.inst,new WeakSet());
        nextCollisions.get(a.inst).add(b.inst);
      }
    }
    activeCollisions=nextCollisions;
  }
  function paint() {
    camera=roomCamera(room,instances,centerOf,camera);
    game.viewX=camera.x;game.viewY=camera.y;game.viewWidth=camera.width;game.viewHeight=camera.height;
    ctx.fillStyle=room.background||'#d0d0d0';ctx.fillRect(0,0,canvas.width,canvas.height);
    const background=byId('backgrounds',room.backgroundId),image=imageFor(background?.data);
    if(image?.complete&&image.naturalWidth)ctx.drawImage(image,camera.x/game.width*image.naturalWidth,camera.y/game.height*image.naturalHeight,canvas.width/game.width*image.naturalWidth,canvas.height/game.height*image.naturalHeight,0,0,canvas.width,canvas.height);
    ctx.save();ctx.translate(-camera.x,-camera.y);
    instances.slice().sort((a,b)=>(objectFor(b)?.depth||0)-(objectFor(a)?.depth||0)).forEach(item=>{const object=objectFor(item);if(!object?.visible||item.visible===false)return;if(object.events?.some(event=>event.type==='draw'))fire(item,'draw');else drawInstance(item);});
    ctx.restore();
    ctx.fillStyle='#183348';ctx.font='14px Tahoma, sans-serif';ctx.fillText('Score: '+game.score,12,20);
    if(game.message&&game.frame<(game.messageUntil||0)){ctx.fillStyle='#172333dd';ctx.fillRect(8,canvas.height-42,Math.min(canvas.width-16,420),32);ctx.fillStyle='#fff';ctx.fillText(game.message,16,canvas.height-20);}
    if((game.gameOver||game.win||game.terminated)&&!game._audioStopped){audio.stopAll();game._audioStopped=true;}
    controller.update(game.touchControls);
    if(game.controlChoice)controller.showChoice(mode=>{
      const choice=game.controlChoice;if(!choice)return;
      game.controlChoice=null;
      game.paused=false;
      const owner=instances.find(item=>item.id===choice.instanceId);
      if(owner)fire(owner,mode==='touch'?'touch_controls_selected':'keyboard_controls_selected');
      controller.hideChoice();controller.update(game.touchControls);
    });
    else controller.hideChoice();
  }
  function frame(time) {
    if(!lastTime)lastTime=time;accumulator+=Math.min(100,time-lastTime);lastTime=time;
    const step=1000/Math.max(1,Math.min(120,Number(project.options?.fps)||60));let count=0;
    while(accumulator>=step&&count<4){tick();accumulator-=step;count++;}
    paint();requestId=requestAnimationFrame(frame);
  }
  function start() {
    cancelAnimationFrame(requestId);lastTime=0;accumulator=0;
    controller.reset();
    audio.stopAll();
    game={score:0,width:0,height:0,room:'',frame:0,scripts:{},paths:{},timelines:{}};
    (project.paths||[]).forEach(path=>game.paths[path.name]=copy(path.points||[]));
    (project.timelines||[]).forEach(timeline=>game.timelines[timeline.name]=copy(timeline.steps||[]));
    (project.scripts||[]).forEach(script=>{try{const fn=new Function('return ('+script.code+')')();if(typeof fn==='function')game.scripts[script.name]=fn;}catch(error){console.warn(script.name,error);}});
    loadRoom(project.rooms[0]);document.getElementById('error').textContent='';canvas.focus();requestId=requestAnimationFrame(frame);
  }
  window.addEventListener('keydown',event=>{keys.add(event.code);if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(event.code))event.preventDefault();});
  window.addEventListener('keyup',event=>keys.delete(event.code));
  window.addEventListener('blur',()=>keys.clear());
  window.addEventListener('pagehide',()=>audio.stopAll());
  canvas.addEventListener('pointerdown',event=>{const rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)*canvas.width/rect.width+(camera?.x||0),y=(event.clientY-rect.top)*canvas.height/rect.height+(camera?.y||0);game.mouseX=x;game.mouseY=y;instances.slice().forEach(item=>{const size=sizeOf(item);if(x>=item.x&&x<item.x+size.w&&y>=item.y&&y<item.y+size.h)fire(item,'mouse_left');});canvas.focus();});
  document.getElementById('restart').addEventListener('click',start);
  start();
})();`;

  window.createGameHTML = project => {
    const safeName = String(project.name || 'Game').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const data = JSON.stringify(project).replace(/</g, '\\u003c');
    const source=playerSource.replace('__VISUAL_ENGINE__',`(${window.createVisualEngine.toString()})`).replace('__ROOM_CAMERA__',`(${window.roomCamera.toString()})`).replace('__TOUCH_CONTROLS__',`(${window.createTouchControls.toString()})`).replace('__GAME_AUDIO__',`(${window.createGameAudio.toString()})`);
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeName}</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#152331;color:#eaf2f8;font:13px Tahoma,Arial,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px}header{display:flex;align-items:center;justify-content:space-between;width:min(100%,960px);margin-bottom:8px}h1{font-size:16px;margin:0}button{background:#2d81cc;color:white;border:1px solid #7db8e9;padding:6px 12px;cursor:pointer}#game-stage{position:relative;max-width:100%;overflow:hidden}canvas{display:block;max-width:100%;max-height:calc(100vh - 100px);object-fit:contain;image-rendering:pixelated;outline:none;box-shadow:0 12px 36px #0008}footer{width:min(100%,960px);display:flex;justify-content:space-between;gap:12px;color:#a9bac9;font-size:11px;margin-top:8px}#error{color:#ff9999}#on_screen_controls{display:grid;position:absolute;z-index:2;grid-template-columns:repeat(3,88px);column-gap:12px;row-gap:0;width:max-content;transform-origin:top left;pointer-events:auto;touch-action:none}#on_screen_controls[hidden],.touch-control [hidden]{display:none!important}.touch-control{width:88px;height:100px;padding:0;border:0;background:transparent;color:#eaf2f8;opacity:.5;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;cursor:pointer;pointer-events:auto}.touch-control img{display:block;width:88px;height:100px;object-fit:contain;image-rendering:pixelated;pointer-events:none}.touch-control-fallback{display:grid;place-items:center;width:88px;height:100px;border:4px solid currentColor;border-radius:14px;font-size:46px;font-weight:bold;pointer-events:none}.control-choice{position:absolute;inset:0;z-index:4;display:flex;align-items:center;justify-content:center;background:#07101be8;font-family:'Courier New',monospace;font-weight:900;text-align:center}.control-choice[hidden]{display:none!important}.control-choice-panel{box-sizing:border-box;width:min(90%,320px);padding:16px;border:3px solid #57e9ef;background:#11162b;box-shadow:6px 6px #c6408c}.control-choice-title{margin-bottom:13px;color:#ffe581;font-size:20px;letter-spacing:2px;text-shadow:2px 2px #bd4e88}.control-choice-button{display:block;width:100%;margin-top:9px;padding:10px 5px;border:2px solid #57e9ef;background:#232b48;color:#fff1ad;font:900 17px 'Courier New',monospace;letter-spacing:1px;text-shadow:2px 2px #9a3869;touch-action:manipulation;-webkit-tap-highlight-color:transparent}.control-choice-button:hover,.control-choice-button:focus-visible{background:#4b345d;outline:2px solid #ffe581;outline-offset:2px}</style></head><body><header><h1>${safeName} <small id="room-name"></small></h1><button id="restart">↻ Restart</button></header><div id="game-stage"><canvas id="game" tabindex="0"></canvas><div id="on_screen_controls" aria-label="Touchscreen controls" hidden></div></div><footer><span>Arrow keys / WASD · Click the game to focus</span><span id="error"></span></footer><script id="project-data" type="application/json">${data}</script><script>${source}</script></body></html>`;
  };
})();
