(() => {
  'use strict';

  const field = (key, label, kind, value, extra = {}) => ({key, label, kind, default:value, ...extra});
  const defs = [
    {type:'move_fixed',group:'Move',icon:'➜',label:'Move in direction',color:'#e15b43',fields:[field('direction','Direction','direction','right'),field('speed','Speed','number',4)]},
    {type:'move_grid',group:'Move',icon:'▦',label:'Move one grid cell',color:'#e15b43',fields:[field('direction','Direction','direction','right'),field('grid','Grid size','number',32),field('speed','Average speed','number',4),field('blockObject','Block object','objects','')]},
    {type:'move_toward',group:'Move',icon:'↗',label:'Move toward point',color:'#e15b43',fields:[field('x','X','number',320),field('y','Y','number',240),field('speed','Speed','number',4)]},
    {type:'follow_path',group:'Move',icon:'⌁',label:'Follow path',color:'#e15b43',fields:[field('pathId','Path','paths',''),field('speed','Speed','number',4),field('relative','Relative to instance','boolean',true)]},
    {type:'stop_path',group:'Move',icon:'⊣',label:'End path',color:'#e15b43',fields:[]},
    {type:'set_horizontal',group:'Move',icon:'↔',label:'Set horizontal speed',color:'#e15b43',fields:[field('speed','Speed','number',4)]},
    {type:'set_vertical',group:'Move',icon:'↕',label:'Set vertical speed',color:'#e15b43',fields:[field('speed','Speed','number',4)]},
    {type:'stop_moving',group:'Move',icon:'■',label:'Stop moving',color:'#e15b43',fields:[]},
    {type:'reverse_horizontal',group:'Move',icon:'⇆',label:'Reverse horizontal',color:'#e15b43',fields:[]},
    {type:'reverse_vertical',group:'Move',icon:'⇅',label:'Reverse vertical',color:'#e15b43',fields:[]},
    {type:'jump_to',group:'Jump',icon:'✦',label:'Jump to position',color:'#bd8a32',fields:[field('x','X','number',0),field('y','Y','number',0)]},
    {type:'jump_relative',group:'Jump',icon:'↷',label:'Jump relative',color:'#bd8a32',fields:[field('x','Change X','number',32),field('y','Change Y','number',0)]},
    {type:'jump_random',group:'Jump',icon:'⚄',label:'Jump to random place',color:'#bd8a32',fields:[]},
    {type:'jump_start',group:'Jump',icon:'⌂',label:'Jump to start',color:'#bd8a32',fields:[]},
    {type:'snap_grid',group:'Jump',icon:'▦',label:'Snap to grid',color:'#bd8a32',fields:[field('grid','Grid size','number',32)]},
    {type:'bounce',group:'React',icon:'⤴',label:'Bounce on collision',color:'#c85062',fields:[]},
    {type:'destroy_self',group:'React',icon:'✕',label:'Destroy instance',color:'#c85062',fields:[]},
    {type:'destroy_other',group:'React',icon:'⌧',label:'Destroy other',color:'#c85062',fields:[]},
    {type:'create_instance',group:'React',icon:'✚',label:'Create instance',color:'#c85062',fields:[field('objectId','Object','objects',''),field('x','X','number',0),field('y','Y','number',0),field('relative','Relative','boolean',false)]},
    {type:'change_sprite',group:'React',icon:'▧',label:'Change sprite',color:'#c85062',fields:[field('spriteId','Sprite','sprites','')]},
    {type:'face_horizontal_movement',group:'React',icon:'⇆',label:'Face horizontal movement',color:'#c85062',fields:[]},
    {type:'directional_grid_sprites',group:'React',icon:'◧',label:'Directional grid sprites',color:'#c85062',fields:[field('upWalkSpriteId','Up walking sprite','sprites',''),field('upStopSpriteId','Up stopped sprite','sprites',''),field('downWalkSpriteId','Down walking sprite','sprites',''),field('downStopSpriteId','Down stopped sprite','sprites',''),field('leftWalkSpriteId','Left walking sprite','sprites',''),field('leftStopSpriteId','Left stopped sprite','sprites',''),field('rightWalkSpriteId','Right walking sprite','sprites',''),field('rightStopSpriteId','Right stopped sprite','sprites','')]},
    {type:'play_sound',group:'Main 1',icon:'♫',label:'Play sound',color:'#5492b2',fields:[field('soundId','Sound','sounds',''),field('collisionObjectId','Only if colliding with','objects','',{optional:true,emptyLabel:'(any object)'}),field('volume','Volume','volume',100)]},
    {type:'play_sound_repeat',group:'Main 1',icon:'↻',label:'Play on repeat',color:'#5492b2',fields:[field('soundId','Sound','sounds',''),field('collisionObjectId','Only if colliding with','objects','',{optional:true,emptyLabel:'(any object)'}),field('volume','Volume','volume',100)]},
    {type:'stop_sound',group:'Main 1',icon:'■',label:'Stop sound',color:'#5492b2',fields:[field('soundId','Sound','sounds','',{allowAll:true})]},
    {type:'go_to_room',group:'Main 1',icon:'▦',label:'Go to room',color:'#5492b2',fields:[field('roomId','Room','rooms','')]},
    {type:'choose_controls',group:'Main 1',icon:'⌨',label:'Choose controls',color:'#5492b2',fields:[]},
    {type:'display_touch_controls',group:'Main 1',icon:'◫',label:'Display touchscreen controls',color:'#5492b2',fields:[field('x','X','number',0),field('y','Y','number',0),field('aSpriteId','A sprite','sprites',''),field('upSpriteId','Up sprite','sprites',''),field('bSpriteId','B sprite','sprites',''),field('leftSpriteId','Left sprite','sprites',''),field('downSpriteId','Down sprite','sprites',''),field('rightSpriteId','Right sprite','sprites','')]},
    {type:'set_variable',group:'Main 1',icon:'x=',label:'Set variable',color:'#5492b2',fields:[field('target','On','choice','self',{options:[['self','This instance'],['game','Game']]}),field('variable','Variable','text','value'),field('value','Value','text','0'),field('relative','Add to current','boolean',false)]},
    {type:'set_score',group:'Score',icon:'★',label:'Set score',color:'#8b6bb3',fields:[field('value','Score','number',0)]},
    {type:'add_score',group:'Score',icon:'＋',label:'Add score',color:'#8b6bb3',fields:[field('value','Points','number',1)]},
    {type:'show_message',group:'Score',icon:'▣',label:'Show message',color:'#8b6bb3',fields:[field('message','Message','text','Hello!')]},
    {type:'draw_self',group:'Draw',icon:'▧',label:'Draw sprite',color:'#5b8e6d',fields:[]},
    {type:'draw_text',group:'Draw',icon:'T',label:'Draw text',color:'#5b8e6d',fields:[field('text','Text','text','Hello!'),field('x','X','number',16),field('y','Y','number',24),field('color','Color','color','#ffffff')]},
    {type:'draw_rectangle',group:'Draw',icon:'▰',label:'Draw rectangle',color:'#5b8e6d',fields:[field('x','X','number',0),field('y','Y','number',0),field('width','Width','number',32),field('height','Height','number',32),field('color','Color','color','#ffffff')]},
    {type:'run_script',group:'Script',icon:'{ }',label:'Run script',color:'#647dba',fields:[field('scriptId','Script','scripts','')]}
  ];

  window.VisualActionDefs = defs;
  window.createVisualAction = type => {
    const def = defs.find(item => item.type === type);
    if (!def) return null;
    return {id:'action_'+Math.random().toString(36).slice(2),type,...Object.fromEntries(def.fields.map(item => [item.key,item.default]))};
  };

  // This function is deliberately self-contained so the standalone HTML export
  // can include the same action behavior as the editor preview.
  window.createVisualEngine = function createVisualEngine(project) {
    const resource = (kind, id) => id == null || id === '' ? null : (project[kind] || []).find(item => item.id === id || item.name === id);
    const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
    const directions = {right:[1,0],down_right:[1,1],down:[0,1],down_left:[-1,1],left:[-1,0],up_left:[-1,-1],up:[0,-1],up_right:[1,-1]};
    const masks = new Map();
    const objectFor = instance => resource('objects',instance.objectId);
    const spriteFor = instance => resource('sprites',instance.spriteId)||resource('sprites',objectFor(instance)?.spriteId);
    function collisionRect(instance, game, x=instance.x, y=instance.y) {
      const sprite=spriteFor(instance),frames=sprite?.frames||[];
      const index=frames.length?Math.floor(number(game?.frame)/Math.max(1,60/(sprite.frameSpeed||8)))%frames.length:0;
      const source=frames[index]?.image||sprite?.image||null;
      const w=Math.max(8,Math.min(512,number(sprite?.width,32)||32));
      const h=Math.max(8,Math.min(512,number(sprite?.height,32)||32));
      return {x:x-(source?number(sprite.originX):0),y:y-(source?number(sprite.originY):0),w,h,source};
    }
    function boxesOverlap(a,b) { return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y; }
    function alphaMask(rect) {
      if(!rect.source)return null;
      const key=rect.w+'x'+rect.h+':'+rect.source;
      let entry=masks.get(key);
      if(!entry){const image=new Image();image.src=rect.source;entry={image,alpha:null,failed:false};masks.set(key,entry);}
      if(entry.alpha||entry.failed)return entry.alpha;
      if(!entry.image.complete||!entry.image.naturalWidth)return null;
      try {
        const canvas=document.createElement('canvas');canvas.width=rect.w;canvas.height=rect.h;
        const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(entry.image,0,0,rect.w,rect.h);
        const pixels=ctx.getImageData(0,0,rect.w,rect.h).data;
        entry.alpha=new Uint8Array(rect.w*rect.h);
        for(let i=0;i<entry.alpha.length;i++)entry.alpha[i]=pixels[i*4+3]>0?1:0;
      } catch {entry.failed=true;}
      return entry.alpha;
    }
    function collides(a,b,game,ax=a.x,ay=a.y,bx=b.x,by=b.y) {
      const ar=collisionRect(a,game,ax,ay),br=collisionRect(b,game,bx,by);
      if(!boxesOverlap(ar,br))return false;
      const objectA=objectFor(a),objectB=objectFor(b);
      if(!(objectA?.solid&&objectB?.solid&&objectA.collisionMode==='pixel'&&objectB.collisionMode==='pixel'))return true;
      const am=alphaMask(ar),bm=alphaMask(br);
      if(!am||!bm)return true;
      const ax0=Math.floor(ar.x),ay0=Math.floor(ar.y),bx0=Math.floor(br.x),by0=Math.floor(br.y);
      const left=Math.max(ax0,bx0),top=Math.max(ay0,by0),right=Math.min(ax0+ar.w,bx0+br.w),bottom=Math.min(ay0+ar.h,by0+br.h);
      for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
        if(am[(y-ay0)*ar.w+x-ax0]&&bm[(y-by0)*br.w+x-bx0])return true;
      }
      return false;
    }
    function pathSamples(path) {
      const points=path.points||[];
      if(path.connection!=='smooth'||points.length<3)return points.map(point=>({x:number(point.x),y:number(point.y),speed:number(point.speed,100)}));
      const samples=[];
      const curve=(a,b,c,d,t)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
      for(let index=0;index<points.length-1;index++){
        const p0=points[Math.max(0,index-1)],p1=points[index],p2=points[index+1],p3=points[Math.min(points.length-1,index+2)];
        for(let step=0;step<16;step++){
          const t=step/16;
          samples.push({x:curve(number(p0.x),number(p1.x),number(p2.x),number(p3.x),t),y:curve(number(p0.y),number(p1.y),number(p2.y),number(p3.y),t),speed:number(p1.speed,100)+(number(p2.speed,100)-number(p1.speed,100))*t});
        }
      }
      const last=points[points.length-1];samples.push({x:number(last.x),y:number(last.y),speed:number(last.speed,100)});
      return samples;
    }
    function startPath(self,action) {
      const path=resource('paths',action.pathId),samples=path&&pathSamples(path);
      if(!samples?.length)return;
      let distance=0;
      for(let i=1;i<samples.length;i++){distance+=Math.hypot(samples[i].x-samples[i-1].x,samples[i].y-samples[i-1].y);samples[i].distance=distance;}
      samples[0].distance=0;
      self._pathState={samples,distance:0,total:distance,direction:1,speed:Math.max(0,number(action.speed,4)),originX:action.relative?self.x:0,originY:action.relative?self.y:0,endAction:path.endAction||'stop'};
      self.x=self._pathState.originX+samples[0].x;self.y=self._pathState.originY+samples[0].y;
    }
    function pointAt(samples,distance) {
      for(let i=1;i<samples.length;i++){
        if(distance<=samples[i].distance){const a=samples[i-1],b=samples[i],length=b.distance-a.distance||1,t=(distance-a.distance)/length;return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,speed:a.speed+(b.speed-a.speed)*t};}
      }
      return samples[samples.length-1];
    }
    function advancePath(self) {
      const state=self._pathState;if(!state||state.total<=0)return;
      const current=pointAt(state.samples,state.distance),step=state.speed*Math.max(0,number(current.speed,100))/100;
      state.distance+=step*state.direction;
      if(state.distance>=state.total||state.distance<0){
        const end=state.endAction;
        if(end==='reverse'){state.distance=state.direction>0?state.total:0;state.direction*=-1;}
        else if(end==='jump'){state.distance=0;}
        else if(end==='continue'){
          const first=state.samples[0],last=state.samples[state.samples.length-1];
          state.originX+=last.x-first.x;state.originY+=last.y-first.y;state.distance=0;
        }
        else if(end==='start'){state.distance=0;self._pathState=null;}
        else {state.distance=state.direction>0?state.total:0;self._pathState=null;self.hspeed=0;self.vspeed=0;}
      }
      const position=pointAt(state.samples,state.distance);
      self.x=state.originX+position.x;self.y=state.originY+position.y;
    }
    function resolveSolidMove(self, fromX, fromY, instances, game) {
      const targetX=self.x,targetY=self.y;
      if(!objectFor(self)?.solid||(targetX===fromX&&targetY===fromY))return false;
      self.x=fromX;self.y=fromY;
      const solids=instances.filter(other=>other!==self&&objectFor(other)?.solid);
      function moveAxis(axis,target) {
        const start=self[axis],distance=Math.abs(target-start);
        if(!distance)return;
        const sign=Math.sign(target-start),whole=Math.floor(distance);
        self[axis]=target;
        const end=collisionRect(self,game);
        self[axis]=start;
        const beginning=collisionRect(self,game);
        const swept={x:Math.min(beginning.x,end.x),y:Math.min(beginning.y,end.y),w:Math.max(beginning.x+beginning.w,end.x+end.w)-Math.min(beginning.x,end.x),h:Math.max(beginning.y+beginning.h,end.y+end.h)-Math.min(beginning.y,end.y)};
        const candidates=solids.filter(other=>boxesOverlap(swept,collisionRect(other,game))&&!collides(self,other,game));
        if(!candidates.length){self[axis]=target;return;}
        for(let i=1;i<=whole;i++){
          self[axis]=start+sign*i;
          if(candidates.some(other=>collides(self,other,game))){self[axis]=start+sign*(i-1);return;}
        }
        if(distance>whole){self[axis]=target;if(candidates.some(other=>collides(self,other,game)))self[axis]=start+sign*whole;}
      }
      moveAxis('x',targetX);moveAxis('y',targetY);
      return self.x!==targetX||self.y!==targetY;
    }
    function jumpRandom(self, game) {
      const object=resource('objects',self.objectId);
      const sprite=resource('sprites',self.spriteId)||resource('sprites',object?.spriteId);
      const width=Math.max(8,number(sprite?.width,32)||32),height=Math.max(8,number(sprite?.height,32)||32);
      const hasImage=!!(sprite?.image||sprite?.frames?.some(frame=>frame.image));
      const originX=hasImage?number(sprite.originX):0,originY=hasImage?number(sprite.originY):0;
      const roomWidth=number(game.width),roomHeight=number(game.height);
      if(width>roomWidth||height>roomHeight)return;
      const maxX=Math.floor(roomWidth-width),maxY=Math.floor(roomHeight-height);
      self.x=originX+Math.floor(Math.random()*(maxX+1));
      self.y=originY+Math.floor(Math.random()*(maxY+1));
    }
    function runVisualActions(event, self, other, api, game) {
      for (const action of event.actions || []) {
        switch (action.type) {
          case 'move_fixed': {
            const [dx,dy] = directions[action.direction] || directions.right;
            const magnitude = Math.hypot(dx,dy) || 1;
            self.hspeed = dx/magnitude*number(action.speed);
            self.vspeed = dy/magnitude*number(action.speed);
            self.x += self.hspeed; self.y += self.vspeed;
            self._lastDx = self.hspeed; self._lastDy = self.vspeed;
            break;
          }
          case 'move_grid': {
            const [dx,dy] = directions[action.direction] || directions.right;
            const grid = Math.max(1,number(action.grid,32)||32);
            const speed = number(action.speed,4);
            if(speed<=0)break;
            const frame = number(game.frame);
            if(self._gridLastMoveFrame===frame)break;
            const changed=self._gridLastDirection!==action.direction;
            if(!changed&&frame<(self._gridNextMoveFrame||0))break;
            const x=self.x+dx*grid,y=self.y+dy*grid;
            const rect=collisionRect(self,game,x,y);
            if(rect.x<0||rect.y<0||rect.x+rect.w>game.width||rect.y+rect.h>game.height)break;
            const blocker=resource('objects',action.blockObject);
            if(blocker&&(api.place_meeting(x,y,blocker.name)||
              (dx&&dy&&(api.place_meeting(self.x+dx*grid,self.y,blocker.name)||api.place_meeting(self.x,self.y+dy*grid,blocker.name)))))break;
            self.x=x;self.y=y;
            self.hspeed=dx*grid;self.vspeed=dy*grid;
            self._lastDx=self.hspeed;self._lastDy=self.vspeed;
            const interval=grid*Math.hypot(dx,dy)/speed;
            const due=self._gridNextMoveFrame;
            const base=!changed&&Number.isFinite(due)&&due>frame-interval?due:frame;
            self._gridNextMoveFrame=Math.max(frame+1,base+interval);
            self._gridLastMoveFrame=frame;
            self._gridLastDirection=action.direction;
            break;
          }
          case 'move_toward': {
            const dx = number(action.x)-self.x,dy=number(action.y)-self.y,distance=Math.hypot(dx,dy)||1;
            self.hspeed=dx/distance*number(action.speed);self.vspeed=dy/distance*number(action.speed);
            self.x+=self.hspeed;self.y+=self.vspeed;self._lastDx=self.hspeed;self._lastDy=self.vspeed;
            break;
          }
          case 'follow_path': startPath(self,action);break;
          case 'stop_path': self._pathState=null;break;
          case 'set_horizontal': self.hspeed=number(action.speed);self.x+=self.hspeed;self._lastDx=self.hspeed;break;
          case 'set_vertical': self.vspeed=number(action.speed);self.y+=self.vspeed;self._lastDy=self.vspeed;break;
          case 'stop_moving': self.hspeed=0;self.vspeed=0;break;
          case 'reverse_horizontal': self.hspeed=-(self.hspeed||0);self.x+=self.hspeed;break;
          case 'reverse_vertical': self.vspeed=-(self.vspeed||0);self.y+=self.vspeed;break;
          case 'jump_to': self.x=number(action.x);self.y=number(action.y);break;
          case 'jump_relative': self.x+=number(action.x);self.y+=number(action.y);break;
          case 'jump_random': jumpRandom(self,game);break;
          case 'jump_start': self.x=self.startX??self.x;self.y=self.startY??self.y;break;
          case 'snap_grid': {const grid=Math.max(1,number(action.grid,32));self.x=Math.round(self.x/grid)*grid;self.y=Math.round(self.y/grid)*grid;break;}
          case 'bounce': self.x-=self._lastDx||0;self.y-=self._lastDy||0;self.hspeed=-(self.hspeed||0);self.vspeed=-(self.vspeed||0);break;
          case 'destroy_self': api.instance_destroy(self);break;
          case 'destroy_other': if(other)api.instance_destroy(other);break;
          case 'create_instance': {const object=resource('objects',action.objectId);if(object)api.instance_create(number(action.x)+(action.relative?self.x:0),number(action.y)+(action.relative?self.y:0),object.name);break;}
          case 'change_sprite': {const sprite=resource('sprites',action.spriteId);if(sprite)self.spriteId=sprite.id;break;}
          case 'face_horizontal_movement': {
            const direction=self._moveDirection;
            if(direction==='left')self.image_xscale=-1;
            else if(direction==='right')self.image_xscale=1;
            else if(!['up','down','stop'].includes(direction)&&Number.isFinite(self._facePreviousX)){
              if(self.x<self._facePreviousX)self.image_xscale=-1;
              else if(self.x>self._facePreviousX)self.image_xscale=1;
            }
            self._facePreviousX=self.x;
            break;
          }
          case 'directional_grid_sprites': {
            const lastDirection=self._gridLastDirection;
            if(['up','down','left','right'].includes(lastDirection))self._spriteFacing=lastDirection;
            const facing=self._spriteFacing||'right';
            const held=api.keyboard_check(facing)||api.keyboard_check({up:'w',down:'s',left:'a',right:'d'}[facing]);
            const frame=number(game.frame);
            const moving=held&&lastDirection===facing&&
              (self._gridLastMoveFrame===frame||frame<number(self._gridNextMoveFrame,-1));
            const key=facing+(moving?'Walk':'Stop')+'SpriteId';
            const sprite=resource('sprites',action[key]);
            if(sprite)self.spriteId=sprite.id;
            break;
          }
          case 'play_sound': {if(action.collisionObjectId&&other?.objectId!==resource('objects',action.collisionObjectId)?.id)break;const sound=resource('sounds',action.soundId);if(sound)api.play_sound(sound.name,number(action.volume,100));break;}
          case 'play_sound_repeat': {if(action.collisionObjectId&&other?.objectId!==resource('objects',action.collisionObjectId)?.id)break;const sound=resource('sounds',action.soundId);if(sound)api.play_sound(sound.name,number(action.volume,100),true);break;}
          case 'stop_sound': {if(!action.soundId)api.stop_sound();else{const sound=resource('sounds',action.soundId);if(sound)api.stop_sound(sound.name);}break;}
          case 'go_to_room': {const room=resource('rooms',action.roomId);if(room)api.room_goto(room.name);break;}
          case 'choose_controls': game.controlChoice={instanceId:self.id};game.paused=true;break;
          case 'display_touch_controls': game.touchControls={x:number(action.x),y:number(action.y),aSpriteId:action.aSpriteId,upSpriteId:action.upSpriteId,bSpriteId:action.bSpriteId,leftSpriteId:action.leftSpriteId,downSpriteId:action.downSpriteId,rightSpriteId:action.rightSpriteId};break;
          case 'set_variable': {
            const target=action.target==='game'?game:self;
            const key=String(action.variable||'value').replace(/[^A-Za-z0-9_$]/g,'_');
            const raw=String(action.value??'0');const value=raw.trim()!==''&&Number.isFinite(Number(raw))?Number(raw):raw;
            target[key]=action.relative?number(target[key])+number(value):value;break;
          }
          case 'set_score': game.score=number(action.value);break;
          case 'add_score': game.score=number(game.score)+number(action.value,1);break;
          case 'show_message': game.message=String(action.message||'');game.messageUntil=game.frame+180;break;
          case 'draw_self': api.draw_self();break;
          case 'draw_text': api.draw_text(action.text??'',number(action.x),number(action.y),action.color||'#ffffff');break;
          case 'draw_rectangle': api.draw_rectangle(number(action.x),number(action.y),number(action.width,32),number(action.height,32),action.color||'#ffffff');break;
          case 'run_script': {const script=resource('scripts',action.scriptId);const fn=script&&game.scripts[script.name];if(typeof fn==='function')fn(self,api,game,other);break;}
        }
      }
    }
    runVisualActions.startPath=startPath;
    runVisualActions.advancePath=advancePath;
    runVisualActions.resolveSolidMove=resolveSolidMove;
    runVisualActions.collides=collides;
    runVisualActions.bounds=collisionRect;
    return runVisualActions;
  };
})();
