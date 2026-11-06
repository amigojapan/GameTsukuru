(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const integer = (value,fallback=0) => Number.isFinite(Number(value)) ? Math.round(Number(value)) : fallback;

  function normalize(path) {
    path.points=Array.isArray(path.points)?path.points:[];
    path.points.forEach(point=>{point.x=integer(point.x);point.y=integer(point.y);point.speed=clamp(integer(point.speed,100),0,1000);});
    path.connection=['straight','smooth'].includes(path.connection)?path.connection:'straight';
    path.endAction=['stop','reverse','jump','continue','start'].includes(path.endAction)?path.endAction:'stop';
  }
  function render(path,state) {
    normalize(path);
    const points=path.points;
    state.pathSelected=clamp(Number(state.pathSelected)||0,0,Math.max(0,points.length-1));
    state.pathZoom=clamp(Number(state.pathZoom)||1,.2,4);
    const selected=points[state.pathSelected];
    const list=points.map((point,index)=>`<button class="path-point-row ${index===state.pathSelected?'selected':''}" data-path-index="${index}"><span>(${point.x}, ${point.y})</span><small>sp: ${point.speed}</small></button>`).join('');
    const radio=(name,value,label)=>`<label><input type="radio" name="${name}-${path.id}" data-path-setting="${name}" value="${value}" ${path[name]===value?'checked':''}> ${label}</label>`;
    return `<div class="path-editor-layout"><aside class="path-editor-controls"><div class="path-name">Name: <input class="text-input" data-field="name" value="${esc(path.name)}" maxlength="40"></div><div class="path-editor-top"><div class="path-point-list" aria-label="Path points">${list||'<span class="path-list-empty">Click the canvas to add a point.</span>'}</div><div class="path-point-fields"><label>X: <input type="number" data-path-coordinate="x" value="${selected?.x??0}"></label><label>Y: <input type="number" data-path-coordinate="y" value="${selected?.y??0}"></label><label>sp: <input type="number" min="0" max="1000" data-path-coordinate="speed" value="${selected?.speed??100}"></label><button data-path-action="add">Add</button><button data-path-action="insert" ${selected?'':'disabled'}>Insert</button><button data-path-action="delete" ${selected?'':'disabled'}>Delete</button><button data-path-action="clear" ${points.length?'':'disabled'}>Clear</button></div></div><fieldset class="path-option-group"><legend>connection kind</legend>${radio('connection','straight','Straight lines')}${radio('connection','smooth','Smooth curve')}</fieldset><fieldset class="path-option-group end-options"><legend>action at the end</legend>${radio('endAction','stop','Stop moving')}${radio('endAction','reverse','Reverse')}${radio('endAction','jump','Jump to start')}${radio('endAction','continue','Continue')}${radio('endAction','start','Move to start')}</fieldset><p class="path-editor-help">Click the preview to add a point. Drag points to move them.</p></aside><div class="path-preview"><canvas data-path-canvas aria-label="Path preview; click to add a point and drag points to move them"></canvas><div class="path-preview-toolbar"><span>${points.length} point${points.length===1?'':'s'} · ${path.connection==='smooth'?'smooth curve':'straight lines'}</span><div><button data-path-action="zoom-out" title="Zoom out">−</button><button data-path-action="zoom-reset" title="Actual size">${Math.round(state.pathZoom*100)}%</button><button data-path-action="zoom-in" title="Zoom in">＋</button><button data-path-action="zoom-fit" title="Fit path">Fit</button></div></div></div></div>`;
  }

  function detach(state) {state.pathObserver?.disconnect();state.pathObserver=null;}
  function attach(windowElement,path,state,{onChange,rerender}) {
    detach(state);
    const root=windowElement.querySelector('.path-editor-layout'),canvas=root?.querySelector('[data-path-canvas]');
    if(!root||!canvas)return;
    const context=canvas.getContext('2d');
    const coordinate=(x,y)=>({x:Math.round((x-canvas.clientWidth/2)/state.pathZoom),y:Math.round((y-canvas.clientHeight/2)/state.pathZoom)});
    const screen=point=>({x:canvas.clientWidth/2+point.x*state.pathZoom,y:canvas.clientHeight/2+point.y*state.pathZoom});
    const redraw=()=>{
      const width=canvas.clientWidth,height=canvas.clientHeight,dpr=window.devicePixelRatio||1;
      if(!width||!height)return;
      const pixelWidth=Math.round(width*dpr),pixelHeight=Math.round(height*dpr);
      if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;}
      context.setTransform(dpr,0,0,dpr,0,0);
      context.fillStyle='#fff';context.fillRect(0,0,width,height);
      const grid=Math.max(20,50*state.pathZoom),originX=width/2,originY=height/2;
      context.beginPath();context.strokeStyle='#eff1f2';context.lineWidth=1;
      for(let x=originX%grid;x<width;x+=grid){context.moveTo(x+.5,0);context.lineTo(x+.5,height);}
      for(let y=originY%grid;y<height;y+=grid){context.moveTo(0,y+.5);context.lineTo(width,y+.5);}
      context.stroke();
      context.beginPath();context.strokeStyle='#9ea8af';context.moveTo(originX+.5,0);context.lineTo(originX+.5,height);context.moveTo(0,originY+.5);context.lineTo(width,originY+.5);context.stroke();
      context.fillStyle='#89949c';context.font='10px Tahoma, sans-serif';context.fillText('0',originX+4,originY-5);
      const points=path.points;
      if(points.length){
        context.beginPath();const first=screen(points[0]);context.moveTo(first.x,first.y);
        if(path.connection==='smooth'&&points.length>2){
          for(let i=0;i<points.length-1;i++){
            const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
            const c1=screen({x:p1.x+(p2.x-p0.x)/6,y:p1.y+(p2.y-p0.y)/6});
            const c2=screen({x:p2.x-(p3.x-p1.x)/6,y:p2.y-(p3.y-p1.y)/6});
            const end=screen(p2);context.bezierCurveTo(c1.x,c1.y,c2.x,c2.y,end.x,end.y);
          }
        }else for(let i=1;i<points.length;i++){const point=screen(points[i]);context.lineTo(point.x,point.y);}
        context.strokeStyle='#252f35';context.lineWidth=1.5;context.stroke();
        points.forEach((point,index)=>{
          const location=screen(point);
          context.fillStyle=index===state.pathSelected?'#1688e1':index===0?'#179439':'#e44a42';
          context.fillRect(Math.round(location.x)-4,Math.round(location.y)-4,8,8);
          context.strokeStyle='#fff';context.lineWidth=1;context.strokeRect(Math.round(location.x)-4.5,Math.round(location.y)-4.5,9,9);
        });
      }
    };
    state.pathObserver=new ResizeObserver(redraw);
    state.pathObserver.observe(canvas);
    requestAnimationFrame(redraw);
    root.addEventListener('click',event=>{
      const row=event.target.closest('[data-path-index]');if(row){state.pathSelected=Number(row.dataset.pathIndex);rerender();return;}
      const button=event.target.closest('[data-path-action]');if(!button)return;
      const kind=button.dataset.pathAction;
      if(kind.startsWith('zoom-')){
        if(kind==='zoom-in')state.pathZoom=clamp(state.pathZoom*1.25,.2,4);
        if(kind==='zoom-out')state.pathZoom=clamp(state.pathZoom/1.25,.2,4);
        if(kind==='zoom-reset')state.pathZoom=1;
        if(kind==='zoom-fit'){
          const maxX=Math.max(1,...path.points.map(point=>Math.abs(point.x))),maxY=Math.max(1,...path.points.map(point=>Math.abs(point.y)));
          state.pathZoom=clamp(Math.min((canvas.clientWidth/2-24)/maxX,(canvas.clientHeight/2-24)/maxY),.2,4);
        }
        rerender();return;
      }
      const x=integer(root.querySelector('[data-path-coordinate="x"]').value),y=integer(root.querySelector('[data-path-coordinate="y"]').value),speed=clamp(integer(root.querySelector('[data-path-coordinate="speed"]').value,100),0,1000);
      if(kind==='add'){path.points.push({x,y,speed});state.pathSelected=path.points.length-1;}
      if(kind==='insert'){path.points.splice(state.pathSelected+1,0,{x,y,speed});state.pathSelected++;}
      if(kind==='delete'){path.points.splice(state.pathSelected,1);state.pathSelected=clamp(state.pathSelected,0,Math.max(0,path.points.length-1));}
      if(kind==='clear'){path.points=[];state.pathSelected=0;}
      onChange('Path points updated');rerender();
    });
    root.addEventListener('change',event=>{
      const setting=event.target.dataset.pathSetting,field=event.target.dataset.pathCoordinate;
      if(setting){path[setting]=event.target.value;onChange('Path settings updated');redraw();return;}
      if(field&&path.points[state.pathSelected]){
        path.points[state.pathSelected][field]=field==='speed'?clamp(integer(event.target.value,100),0,1000):integer(event.target.value);
        onChange('Path point updated');rerender();
      }
    });
    canvas.addEventListener('pointerdown',event=>{
      event.preventDefault();const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
      let index=path.points.findIndex(point=>{const p=screen(point);return Math.hypot(p.x-x,p.y-y)<11;});
      if(index<0){path.points.push({...coordinate(x,y),speed:100});index=path.points.length-1;}
      state.pathSelected=index;canvas.setPointerCapture(event.pointerId);redraw();
      const coordinates=root.querySelectorAll('[data-path-coordinate]');
      const move=movement=>{const here=coordinate(movement.clientX-rect.left,movement.clientY-rect.top),point=path.points[state.pathSelected];if(!point)return;point.x=here.x;point.y=here.y;coordinates[0].value=point.x;coordinates[1].value=point.y;const row=root.querySelector(`[data-path-index="${state.pathSelected}"]`);if(row){row.querySelector('span').textContent=`(${point.x}, ${point.y})`;}redraw();};
      const end=()=>{canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',end);canvas.removeEventListener('pointercancel',end);onChange('Path point moved');rerender();};
      canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',end,{once:true});canvas.addEventListener('pointercancel',end,{once:true});
    });
  }
  window.PathEditor={normalize,render,attach,detach};
})();
