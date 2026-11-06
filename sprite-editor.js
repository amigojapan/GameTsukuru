(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const palette = ['#000000','#ffffff','#777777','#aaaaaa','#880000','#ff0000','#ff8800','#ffff00','#008800','#00bb00','#00bbbb','#0088ff','#000088','#8800ff','#ff00ff','#ff8888','#633800','#cc8844','#88cc44','#006666','#004488','#4455aa','#8844aa','#ffbb88'];
  let state = null;

  function ensureFrames(sprite) {
    if (!Array.isArray(sprite.frames)) sprite.frames = sprite.image ? [{image:sprite.image,width:sprite.width||32,height:sprite.height||32}] : [];
    sprite.frames = sprite.frames.filter(frame => frame && typeof frame === 'object');
    sprite.frameSpeed = clamp(Number(sprite.frameSpeed)||8,1,60);
  }
  function syncSprite() {
    const sprite=state.sprite,first=sprite.frames[0];
    sprite.image=first?.image||null;
    sprite.width=first?.width||sprite.width||32;
    sprite.height=first?.height||sprite.height||32;
    state.onChange();
  }
  function close() {
    if(!state)return;
    clearInterval(state.previewTimer);
    state.root.remove();
    state=null;
  }
  function open(sprite,onChange) {
    close();ensureFrames(sprite);
    const root=document.createElement('div');root.className='asset-editor-overlay';document.body.appendChild(root);
    state={sprite,onChange,root,selected:0,preview:false,previewFrame:0,previewTimer:null,mode:'sprite',tool:'pencil',primary:'#000000',secondary:'#ffffff',activeColorTarget:'primary',zoom:10,brush:1,showGrid:false,history:[],future:[],drawing:false,frameSnapshot:null};
    root.addEventListener('click',onClick);
    root.addEventListener('change',onChangeEvent);
    root.addEventListener('dblclick',event=>{if(event.target.closest('[data-frame-index]'))openImage();});
    root.addEventListener('contextmenu',event=>{if(event.target.closest('.color-swatch, #paintCanvas'))event.preventDefault();});
    root.addEventListener('pointerdown',event=>{const swatch=event.target.closest('.color-swatch');if(swatch&&event.button===2){event.preventDefault();state.secondary=swatch.dataset.color;renderImage();}});
    renderSprite();
  }
  function shell(title,menu,toolbar,content,status,wide=false) {
    state.root.innerHTML=`<div class="asset-editor-window ${wide?'image-editor-window':''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="asset-title"><span>${esc(title)}</span><button data-editor="close" title="Close">×</button></div><div class="asset-menu">${menu.map(([label,items])=>`<div class="asset-menu-wrap"><button data-editor-menu="${esc(label)}">${esc(label)}</button><div class="asset-menu-popup">${items.map(([action,text])=>`<button data-editor="${action}">${esc(text)}</button>`).join('')}</div></div>`).join('')}</div><div class="asset-toolbar">${toolbar.map(item=>item==='|'?'<span class="asset-separator"></span>':`<button data-editor="${item[0]}" title="${esc(item[2]||item[1])}">${item[1]}</button>`).join('')}</div>${content}<div class="asset-status">${status}</div></div>`;
  }
  function frameImage(frame) {return frame?.image?`<img src="${esc(frame.image)}" alt="">`:'<span class="empty-frame-icon">▧</span>';}
  function renderSprite() {
    if(!state)return;state.mode='sprite';const sprite=state.sprite,frames=sprite.frames;
    const menu=[['File',[['sprite-done','Done'],['sprite-new','New blank frame'],['sprite-load','Load images…']]],['Edit',[['sprite-duplicate','Duplicate frame'],['sprite-delete','Delete frame'],['sprite-left','Move left'],['sprite-right','Move right']]],['Transform',[['sprite-flipH','Flip horizontally'],['sprite-flipV','Flip vertically'],['sprite-rotate','Rotate 90°']]],['Images',[['sprite-edit','Edit image'],['sprite-new','Add blank image'],['sprite-load','Load images…']]],['Animation',[['sprite-play','Play or stop preview']]]];
    const toolbar=[['sprite-done','✔','Done'],['sprite-new','▤','New blank image'],['sprite-load','📂','Load image files'],['sprite-duplicate','▣','Duplicate frame'],['sprite-delete','✕','Delete frame'],'|',['sprite-left','◀','Move frame left'],['sprite-right','▶','Move frame right'],'|',['sprite-edit','✎','Edit image'],['sprite-play',state.preview?'■':'▷','Preview animation']];
    const thumbnails=frames.map((frame,index)=>`<button class="sprite-frame ${index===state.selected?'selected':''}" data-frame-index="${index}" title="Double-click to edit"><span class="sprite-frame-picture">${frameImage(frame)}</span><span>image ${index}</span></button>`).join('');
    const preview=state.preview?`<div class="sprite-live-preview"><div class="preview-checker">${frameImage(frames[state.previewFrame%frames.length])}</div><span>Animation preview</span></div>`:'';
    const content=`<div class="sprite-editor-content"><aside class="sprite-editor-side"><label><input type="checkbox" data-editor-field="preview" ${state.preview?'checked':''}> Show Preview</label>${preview}<div class="sprite-speed"><label>Speed <input type="number" min="1" max="60" data-editor-field="frameSpeed" value="${sprite.frameSpeed}"> frames/s</label></div></aside><div class="sprite-frame-area">${thumbnails||'<div class="sprite-editor-empty">No images yet. Use the folder button to load images, or create a blank frame.</div>'}</div></div>`;
    shell(`Sprite Editor — ${sprite.name}`,menu,toolbar,content,`<span>Frames: ${frames.length}</span><span>Size: ${sprite.width||32} × ${sprite.height||32}</span><span>${sprite.transparent?'Transparent':'Opaque'}</span>`);
  }
  function selectedFrame() {return state.sprite.frames[state.selected];}
  function addBlank() {
    const width=clamp(Number(selectedFrame()?.width||state.sprite.width||32),1,512),height=clamp(Number(selectedFrame()?.height||state.sprite.height||32),1,512);
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    state.sprite.frames.push({image:canvas.toDataURL('image/png'),width,height});state.selected=state.sprite.frames.length-1;syncSprite();renderSprite();
  }
  function duplicateFrame() {
    const frame=selectedFrame();if(!frame)return;
    state.sprite.frames.splice(state.selected+1,0,{...frame});state.selected++;syncSprite();renderSprite();
  }
  function deleteFrame() {
    if(!selectedFrame())return;
    state.sprite.frames.splice(state.selected,1);state.selected=clamp(state.selected,0,Math.max(0,state.sprite.frames.length-1));syncSprite();renderSprite();
  }
  function moveFrame(direction) {
    const to=state.selected+direction,frames=state.sprite.frames;if(to<0||to>=frames.length)return;
    [frames[state.selected],frames[to]]=[frames[to],frames[state.selected]];state.selected=to;syncSprite();renderSprite();
  }
  function loadFrames() {
    const input=document.createElement('input');input.type='file';input.accept='image/*';input.multiple=true;
    input.onchange=async()=>{
      for(const file of input.files){
        const data=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(file);});
        const image=await new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=data;});
        if(image){state.sprite.frames.push({image:data,width:image.naturalWidth,height:image.naturalHeight});state.selected=state.sprite.frames.length-1;}
      }
      syncSprite();renderSprite();
    };input.click();
  }
  function transformFrame(kind) {
    const frame=selectedFrame();if(!frame)return;
    const image=new Image();image.onload=()=>{
      const canvas=document.createElement('canvas');canvas.width=kind==='rotate'?frame.height:frame.width;canvas.height=kind==='rotate'?frame.width:frame.height;
      const ctx=canvas.getContext('2d');
      if(kind==='flipH'){ctx.translate(canvas.width,0);ctx.scale(-1,1);}if(kind==='flipV'){ctx.translate(0,canvas.height);ctx.scale(1,-1);}if(kind==='rotate'){ctx.translate(canvas.width,0);ctx.rotate(Math.PI/2);}
      ctx.drawImage(image,0,0);frame.image=canvas.toDataURL('image/png');frame.width=canvas.width;frame.height=canvas.height;syncSprite();renderSprite();
    };image.src=frame.image;
  }
  function togglePreview() {
    state.preview=!state.preview;clearInterval(state.previewTimer);
    if(state.preview)state.previewTimer=setInterval(()=>{if(!state||!state.preview)return;state.previewFrame++;const box=state.root.querySelector('.preview-checker');if(box)box.innerHTML=frameImage(state.sprite.frames[state.previewFrame%state.sprite.frames.length]);},1000/state.sprite.frameSpeed);
    renderSprite();
  }

  async function openImage() {
    if(!selectedFrame())addBlank();
    const frame=selectedFrame();state.mode='image';state.zoom=clamp(Math.floor(320/Math.max(frame.width,frame.height)),2,16);state.history=[];state.future=[];
    state.canvas=document.createElement('canvas');state.canvas.width=frame.width;state.canvas.height=frame.height;
    const image=new Image();image.onload=()=>{if(!state||state.mode!=='image')return;state.canvas.getContext('2d').drawImage(image,0,0);renderImage();};image.onerror=()=>renderImage();image.src=frame.image;
  }
  function renderImage() {
    if(!state||state.mode!=='image')return;
    const canvas=state.canvas,zoom=state.zoom;
    const tools=[['zoom','⌕','Zoom'],['picker','◉','Pick color'],['pencil','✎','Pencil'],['eraser','◇','Eraser'],['bucket','▣','Fill'],['line','╱','Line'],['rect','□','Rectangle'],['filled_rect','■','Filled rectangle'],['ellipse','○','Ellipse'],['filled_ellipse','●','Filled ellipse'],['text','T','Text']];
    const toolMarkup=tools.map(([key,icon,title])=>`<button class="pixel-tool ${state.tool===key?'selected':''}" data-tool="${key}" title="${title}">${icon}</button>`).join('');
    const swatches=palette.map(color=>`<button class="color-swatch" data-color="${color}" style="background:${color}" title="${color}"></button>`).join('');
    const menu=[['File',[['image-save','Save image'],['image-cancel','Cancel edits'],['image-resize','Resize…']]],['Edit',[['image-undo','Undo'],['image-redo','Redo'],['image-clear','Clear image']]],['Text',[['image-text','Text tool']]],['Transform',[['image-flipH','Flip horizontally'],['image-flipV','Flip vertically'],['image-rotate','Rotate 90°']]],['Image',[['image-grid','Show or hide grid'],['image-resize','Resize…']]]];
    const toolbar=[['image-save','✔','Save image and return'],['image-cancel','✕','Cancel image changes'],'|',['image-undo','↶','Undo'],['image-redo','↷','Redo'],'|',['image-flipH','↔','Flip horizontally'],['image-flipV','↕','Flip vertically'],['image-rotate','⟳','Rotate 90°'],['image-resize','▣','Resize image'],'|',['image-grid','▦','Toggle pixel grid']];
    const content=`<div class="image-editor-content"><aside class="pixel-tools"><div class="pixel-tool-grid">${toolMarkup}</div><div class="brush-sizes"><span>Brush size</span>${[1,2,4,8].map(n=>`<button data-brush="${n}" class="${state.brush===n?'selected':''}" title="${n} pixels"><i style="width:${n+2}px;height:${n+2}px"></i></button>`).join('')}</div></aside><div class="pixel-workspace"><div class="pixel-stage" style="width:${canvas.width*zoom}px;height:${canvas.height*zoom}px"><canvas id="paintCanvas" width="${canvas.width}" height="${canvas.height}" style="width:${canvas.width*zoom}px;height:${canvas.height*zoom}px"></canvas>${state.showGrid?`<div class="pixel-grid-overlay" style="background-size:${zoom}px ${zoom}px"></div>`:''}</div></div><aside class="pixel-colors"><div class="color-labels"><span>left</span><span>right</span></div><div class="active-colors"><button class="color-active primary ${state.activeColorTarget==='primary'?'selected':''}" data-color-target="primary" style="background:${state.primary}" title="Select left color"></button><button class="color-active secondary ${state.activeColorTarget==='secondary'?'selected':''}" data-color-target="secondary" style="background:${state.secondary}" title="Select right color"></button></div><div class="swatch-grid">${swatches}</div><label class="custom-color">Custom color <input type="color" data-editor-field="customColor" value="${state[state.activeColorTarget]}"></label><button class="color-gradient" data-color-gradient title="Choose a color"></button></aside></div>`;
    shell(`Image Editor — image ${state.selected}`,menu,toolbar,content,`<span>${canvas.width} × ${canvas.height} pixels</span><span>${state.zoom}× zoom</span><span>${state.tool}</span>`,true);
    const visible=state.root.querySelector('#paintCanvas');visible.getContext('2d').drawImage(canvas,0,0);
    visible.addEventListener('pointerdown',beginPaint);visible.addEventListener('pointermove',movePaint);visible.addEventListener('pointerup',endPaint);visible.addEventListener('pointercancel',endPaint);
  }
  function syncCanvas() {
    const visible=state.root.querySelector('#paintCanvas');
    if(!visible)return;
    const ctx=visible.getContext('2d');
    ctx.clearRect(0,0,visible.width,visible.height);
    ctx.drawImage(state.canvas,0,0);
  }
  function pushHistory() {state.history.push(state.canvas.getContext('2d').getImageData(0,0,state.canvas.width,state.canvas.height));if(state.history.length>24)state.history.shift();state.future=[];}
  function undo() {if(!state.history.length)return;state.future.push(state.canvas.getContext('2d').getImageData(0,0,state.canvas.width,state.canvas.height));state.canvas.getContext('2d').putImageData(state.history.pop(),0,0);syncCanvas();}
  function redo() {if(!state.future.length)return;state.history.push(state.canvas.getContext('2d').getImageData(0,0,state.canvas.width,state.canvas.height));state.canvas.getContext('2d').putImageData(state.future.pop(),0,0);syncCanvas();}
  function position(event) {const rect=event.currentTarget.getBoundingClientRect();return {x:clamp(Math.floor((event.clientX-rect.left)*state.canvas.width/rect.width),0,state.canvas.width-1),y:clamp(Math.floor((event.clientY-rect.top)*state.canvas.height/rect.height),0,state.canvas.height-1)};}
  function colorFor(event) {return event.button===2?state.secondary:state.primary;}
  function beginPaint(event) {
    event.preventDefault();if(!state||state.mode!=='image')return;
    const point=position(event),tool=state.tool,color=colorFor(event),ctx=state.canvas.getContext('2d');
    if(tool==='zoom'){state.zoom=clamp(state.zoom+(event.button===2?-1:1),2,24);renderImage();return;}
    if(tool==='picker'){const data=ctx.getImageData(point.x,point.y,1,1).data;const hex='#'+[data[0],data[1],data[2]].map(n=>n.toString(16).padStart(2,'0')).join('');if(event.button===2)state.secondary=hex;else state.primary=hex;renderImage();return;}
    if(tool==='text'){const text=prompt('Text to draw:','Text');if(!text)return;pushHistory();ctx.fillStyle=color;ctx.font='10px monospace';ctx.fillText(text,point.x,point.y+9);syncCanvas();return;}
    pushHistory();state.drawing=true;state.start=point;state.last=point;state.color=color;state.frameSnapshot=ctx.getImageData(0,0,state.canvas.width,state.canvas.height);
    event.currentTarget.setPointerCapture(event.pointerId);
    if(tool==='bucket'){floodFill(point.x,point.y,color);state.drawing=false;syncCanvas();return;}
    if(tool==='pencil'||tool==='eraser')drawStroke(point,point);
    syncCanvas();
  }
  function movePaint(event) {
    if(!state?.drawing)return;
    const point=position(event),tool=state.tool,ctx=state.canvas.getContext('2d');
    if(tool==='pencil'||tool==='eraser'){drawStroke(state.last,point);state.last=point;}
    else {ctx.putImageData(state.frameSnapshot,0,0);drawShape(state.start,point);}
    syncCanvas();
  }
  function endPaint(event) {if(!state?.drawing)return;movePaint(event);state.drawing=false;state.frameSnapshot=null;}
  function drawStroke(from,to) {
    const ctx=state.canvas.getContext('2d');ctx.lineCap='square';ctx.lineJoin='miter';ctx.lineWidth=state.brush;
    if(state.tool==='eraser'){ctx.globalCompositeOperation='destination-out';ctx.strokeStyle='#000';}else{ctx.globalCompositeOperation='source-over';ctx.strokeStyle=state.color;}
    ctx.beginPath();ctx.moveTo(from.x+.5,from.y+.5);ctx.lineTo(to.x+.5,to.y+.5);ctx.stroke();ctx.globalCompositeOperation='source-over';
  }
  function drawShape(a,b) {
    const ctx=state.canvas.getContext('2d');ctx.strokeStyle=ctx.fillStyle=state.color;ctx.lineWidth=state.brush;
    const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),w=Math.abs(b.x-a.x)+1,h=Math.abs(b.y-a.y)+1;
    if(state.tool==='line'){ctx.beginPath();ctx.moveTo(a.x+.5,a.y+.5);ctx.lineTo(b.x+.5,b.y+.5);ctx.stroke();}
    if(state.tool==='rect'){
      if(w===1&&h===1)ctx.fillRect(x,y,1,1);
      else ctx.strokeRect(x+.5,y+.5,w-1,h-1);
    }
    if(state.tool==='filled_rect')ctx.fillRect(x,y,w,h);
    if(state.tool==='ellipse'||state.tool==='filled_ellipse'){ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,Math.max(.5,w/2),Math.max(.5,h/2),0,0,Math.PI*2);state.tool==='ellipse'?ctx.stroke():ctx.fill();}
  }
  function floodFill(x,y,hex) {
    const ctx=state.canvas.getContext('2d'),width=state.canvas.width,height=state.canvas.height,image=ctx.getImageData(0,0,width,height),data=image.data,start=(y*width+x)*4;
    const old=[data[start],data[start+1],data[start+2],data[start+3]];
    const color=[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16),255];
    if(old.every((value,i)=>value===color[i]))return;
    const matches=index=>old.every((value,i)=>data[index+i]===value);
    const stack=[y*width+x],visited=new Uint8Array(width*height);
    while(stack.length){const cell=stack.pop();if(visited[cell])continue;visited[cell]=1;const offset=cell*4;if(!matches(offset))continue;data.set(color,offset);const px=cell%width,py=Math.floor(cell/width);if(px>0)stack.push(cell-1);if(px<width-1)stack.push(cell+1);if(py>0)stack.push(cell-width);if(py<height-1)stack.push(cell+width);}
    ctx.putImageData(image,0,0);
  }
  function gradientColor(event,element) {
    const bounds=element.getBoundingClientRect();
    const hue=clamp((event.clientY-bounds.top)/bounds.height,0,1)*360;
    const saturation=clamp((event.clientX-bounds.left)/bounds.width,0,1);
    const channel=n=>{
      const k=(n+hue/30)%12;
      return Math.round(255*(.5-.5*saturation*Math.max(-1,Math.min(k-3,9-k,1))));
    };
    return '#'+[channel(0),channel(8),channel(4)].map(n=>n.toString(16).padStart(2,'0')).join('');
  }
  function saveImage() {
    const frame=selectedFrame();frame.image=state.canvas.toDataURL('image/png');frame.width=state.canvas.width;frame.height=state.canvas.height;
    syncSprite();renderSprite();
  }
  function imageTransform(kind) {
    const old=state.canvas,canvas=document.createElement('canvas');canvas.width=kind==='rotate'?old.height:old.width;canvas.height=kind==='rotate'?old.width:old.height;
    const ctx=canvas.getContext('2d');if(kind==='flipH'){ctx.translate(canvas.width,0);ctx.scale(-1,1);}if(kind==='flipV'){ctx.translate(0,canvas.height);ctx.scale(1,-1);}if(kind==='rotate'){ctx.translate(canvas.width,0);ctx.rotate(Math.PI/2);}
    ctx.drawImage(old,0,0);state.canvas=canvas;state.history=[];state.future=[];renderImage();
  }
  function resizeImage() {
    const width=Number(prompt('Image width (1–512 pixels):',state.canvas.width));if(!Number.isInteger(width)||width<1||width>512)return;
    const height=Number(prompt('Image height (1–512 pixels):',state.canvas.height));if(!Number.isInteger(height)||height<1||height>512)return;
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').imageSmoothingEnabled=false;canvas.getContext('2d').drawImage(state.canvas,0,0,width,height);state.canvas=canvas;state.history=[];state.future=[];state.zoom=clamp(Math.floor(320/Math.max(width,height)),2,16);renderImage();
  }
  function onClick(event) {
    const menuTrigger=event.target.closest('[data-editor-menu]');
    if(menuTrigger){const popup=menuTrigger.nextElementSibling,wasOpen=popup.classList.contains('open');state.root.querySelectorAll('.asset-menu-popup.open').forEach(item=>item.classList.remove('open'));if(!wasOpen)popup.classList.add('open');return;}
    const frame=event.target.closest('[data-frame-index]');if(frame&&state.mode==='sprite'){state.selected=Number(frame.dataset.frameIndex);state.root.querySelectorAll('.sprite-frame').forEach(item=>item.classList.toggle('selected',Number(item.dataset.frameIndex)===state.selected));return;}
    const tool=event.target.closest('[data-tool]');if(tool&&state.mode==='image'){state.tool=tool.dataset.tool;renderImage();return;}
    const brush=event.target.closest('[data-brush]');if(brush){state.brush=Number(brush.dataset.brush);renderImage();return;}
    const colorTarget=event.target.closest('[data-color-target]');if(colorTarget){state.activeColorTarget=colorTarget.dataset.colorTarget;renderImage();return;}
    const gradient=event.target.closest('[data-color-gradient]');if(gradient){state[state.activeColorTarget]=gradientColor(event,gradient);renderImage();return;}
    const swatch=event.target.closest('[data-color]');if(swatch){if(event.button===2)state.secondary=swatch.dataset.color;else state.primary=swatch.dataset.color;renderImage();return;}
    const action=event.target.closest('[data-editor]');if(!action)return;
    const name=action.dataset.editor;
    if(name==='close'){close();return;}
    if(name==='sprite-done'){close();return;}
    if(name==='sprite-new'){addBlank();return;}
    if(name==='sprite-load'){loadFrames();return;}
    if(name==='sprite-duplicate'){duplicateFrame();return;}
    if(name==='sprite-delete'){deleteFrame();return;}
    if(name==='sprite-left'){moveFrame(-1);return;}
    if(name==='sprite-right'){moveFrame(1);return;}
    if(name==='sprite-edit'){openImage();return;}
    if(name==='sprite-play'){togglePreview();return;}
    if(name==='sprite-flipH'||name==='sprite-flipV'||name==='sprite-rotate'){transformFrame(name.replace('sprite-',''));return;}
    if(name==='image-save'){saveImage();return;}
    if(name==='image-cancel'){renderSprite();return;}
    if(name==='image-undo'){undo();return;}
    if(name==='image-redo'){redo();return;}
    if(name==='image-flipH'||name==='image-flipV'||name==='image-rotate'){imageTransform(name.replace('image-',''));return;}
    if(name==='image-resize'){resizeImage();return;}
    if(name==='image-grid'){state.showGrid=!state.showGrid;renderImage();return;}
    if(name==='image-clear'){pushHistory();state.canvas.getContext('2d').clearRect(0,0,state.canvas.width,state.canvas.height);syncCanvas();return;}
    if(name==='image-text'){state.tool='text';renderImage();}
  }
  function onChangeEvent(event) {
    const field=event.target.dataset.editorField;if(!field)return;
    if(field==='preview'){togglePreview();return;}
    if(field==='frameSpeed'){state.sprite.frameSpeed=clamp(Number(event.target.value)||8,1,60);syncSprite();if(state.preview){clearInterval(state.previewTimer);state.previewTimer=setInterval(()=>{if(!state||!state.preview)return;state.previewFrame++;const box=state.root.querySelector('.preview-checker');if(box)box.innerHTML=frameImage(state.sprite.frames[state.previewFrame%state.sprite.frames.length]);},1000/state.sprite.frameSpeed);}return;}
    if(field==='customColor'){state[state.activeColorTarget]=event.target.value;renderImage();}
  }
  window.SpriteEditors={open,close,ensureFrames};
})();
