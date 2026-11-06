(() => {
  'use strict';

  const STORAGE_KEY = 'gametsukuru-js-project-v1';
  const THEME_KEY = 'gametsukuru-js-theme';
  const TYPES = [
    ['sprites', 'Sprites', '▧'], ['sounds', 'Sounds', '♫'],
    ['backgrounds', 'Backgrounds', '▨'], ['paths', 'Paths', '⌁'],
    ['scripts', 'Scripts', '{}'], ['timelines', 'Time Lines', '◷'],
    ['objects', 'Objects', '◆'], ['rooms', 'Rooms', '▦'],
    ['dataFiles', 'Data Files', '▤']
  ];
  const EVENT_OPTIONS = [
    ['create', 'Create', '✦'], ['step', 'Step', '↻'], ['draw', 'Draw', '▧'],
    ['keyboard_left', 'Keyboard: Left', '←'], ['keyboard_right', 'Keyboard: Right', '→'],
    ['keyboard_up', 'Keyboard: Up', '↑'], ['keyboard_down', 'Keyboard: Down', '↓'],
    ['keyboard_space', 'Keyboard: Space', '␣'], ['keyboard_b', 'Keyboard: B', 'B'], ['mouse_left', 'Mouse: Left click', '◉'],
    ['touch_controls_selected', 'Touch controls selected', '◫'],
    ['keyboard_controls_selected', 'Keyboard controls selected', '⌨'],
    ['collision', 'Collision', '◆']
  ];
  const ACTION_DEFS = window.VisualActionDefs;
  const ACTION_GROUPS = ['Move','Jump','React','Main 1','Score','Draw','Script'];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const id = () => 'r_' + Math.random().toString(36).slice(2, 10);
  const deepCopy = value => JSON.parse(JSON.stringify(value));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const typeLabel = type => TYPES.find(row => row[0] === type)?.[1]?.replace(/s$/, '') || type;
  let project;
  let selected = null;
  let windows = new Map();
  let saveTimer;
  let assetTarget = null;
  let imageCache = new Map();
  let runtime = null;
  let actionEngine = null;
  let recording = null;
  let modalResolve = null;
  let modalVersion = 0;
  const expanded = new Set(TYPES.map(row => row[0]));

  function makePixelSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const c = canvas.getContext('2d');
    c.fillStyle = '#1c426d'; c.fillRect(8, 3, 16, 26);
    c.fillStyle = '#4fa8e8'; c.fillRect(10, 5, 12, 22);
    c.fillStyle = '#a9dfff'; c.fillRect(12, 7, 8, 9);
    c.fillStyle = '#143957'; c.fillRect(13, 11, 2, 2); c.fillRect(19, 11, 2, 2);
    c.fillStyle = '#e7f8ff'; c.fillRect(14, 18, 5, 2);
    c.fillStyle = '#1a5685'; c.fillRect(7, 23, 18, 5);
    return canvas.toDataURL('image/png');
  }

  function blankProject() {
    return {format:'gametsukuru-js',version:1,name:'Untitled game',sprites:[],sounds:[],backgrounds:[],paths:[],scripts:[],timelines:[],objects:[],rooms:[],dataFiles:[],options:{fps:60}};
  }

  function sampleProject() {
    const p = blankProject();
    p.name = 'My first game';
    const image=makePixelSprite();
    const sprite = {id:id(),name:'sprite0',image,frames:[{image,width:32,height:32}],frameSpeed:8,width:32,height:32,originX:0,originY:0,transparent:true,precise:true};
    const player = {id:id(),name:'object0',spriteId:sprite.id,visible:true,solid:false,alpha:1,depth:0,events:[
      {type:'keyboard_left',actions:[{...window.createVisualAction('move_fixed'),direction:'left',speed:3}]},
      {type:'keyboard_right',actions:[{...window.createVisualAction('move_fixed'),direction:'right',speed:3}]},
      {type:'keyboard_up',actions:[{...window.createVisualAction('move_fixed'),direction:'up',speed:3}]},
      {type:'keyboard_down',actions:[{...window.createVisualAction('move_fixed'),direction:'down',speed:3}]}
    ]};
    const block = {id:id(),name:'object1',spriteId:null,visible:true,solid:true,alpha:1,depth:0,events:[]};
    const star = {id:id(),name:'object2',spriteId:null,visible:true,solid:false,alpha:1,depth:0,events:[{type:'collision',actions:[window.createVisualAction('add_score'),window.createVisualAction('destroy_self')]}]};
    const room = {id:id(),name:'room0',width:640,height:480,grid:32,snap:true,showGrid:true,background:'#d0d0d0',backgroundId:null,view:{enabled:false,width:640,height:480,followObjectId:''},instances:[{id:id(),objectId:player.id,x:64,y:64},{id:id(),objectId:block.id,x:352,y:224},{id:id(),objectId:star.id,x:416,y:128}]};
    p.sprites.push(sprite); p.objects.push(player,block,star); p.rooms.push(room);
    return p;
  }

  function normalizeProject(value) {
    if (!value || value.format !== 'gametsukuru-js') throw new Error('This is not a GameTsukuru JS project.');
    const p = blankProject();
    p.name = String(value.name || 'Untitled game');
    TYPES.forEach(([type]) => {
      p[type] = Array.isArray(value[type]) ? value[type] : [];
      p[type].forEach(resource => {
        if (!resource || !/^[A-Za-z0-9_-]+$/.test(String(resource.id))) throw new Error('The project contains an invalid resource ID.');
        resource.name = String(resource.name || type).slice(0,80);
        if (type === 'sprites' && resource.image && !/^data:image\/[a-z0-9.+-]+;base64,/i.test(resource.image)) resource.image = null;
        if (type === 'sprites') {
          window.SpriteEditors.ensureFrames(resource);
          resource.frames=resource.frames.filter(frame=>!frame.image||/^data:image\/[a-z0-9.+-]+;base64,/i.test(frame.image));
          resource.image=resource.frames[0]?.image||null;
          resource.width=Number(resource.frames[0]?.width)||Number(resource.width)||32;
          resource.height=Number(resource.frames[0]?.height)||Number(resource.height)||32;
        }
        if (type === 'backgrounds' && resource.data && !/^data:image\/[a-z0-9.+-]+;base64,/i.test(resource.data)) resource.data = null;
        if (type === 'sounds' && resource.data && !/^data:audio\/[a-z0-9.+-]+;base64,/i.test(resource.data)) resource.data = null;
        if (type === 'paths') window.PathEditor.normalize(resource);
        if (type === 'scripts' && typeof resource.script === 'string') { resource.code=resource.script; delete resource.script; }
        if (type === 'rooms') {
          resource.background = /^#[0-9a-f]{6}$/i.test(resource.background) ? resource.background : '#d0d0d0';
          resource.instances = Array.isArray(resource.instances) ? resource.instances : [];
          resource.instances.forEach(instance => { if (!/^[A-Za-z0-9_-]+$/.test(String(instance.id))) throw new Error('The project contains an invalid instance ID.'); });
          const view = resource.view && typeof resource.view === 'object' ? resource.view : {};
          resource.view = {
            enabled: view.enabled === true,
            width: clamp(Math.round(Number(view.width) || Math.min(640, Number(resource.width) || 640)), 64, 4096),
            height: clamp(Math.round(Number(view.height) || Math.min(480, Number(resource.height) || 480)), 64, 4096),
            followObjectId: typeof view.followObjectId === 'string' ? view.followObjectId : ''
          };
        }
      });
    });
    p.objects.forEach(object => {
      object.collisionMode=object.collisionMode==='pixel'?'pixel':'bounding';
      object.alpha=clamp(Number.isFinite(Number(object.alpha))?Number(object.alpha):1,0,1);
      object.events=Array.isArray(object.events)?object.events:[];
      object.events.forEach(event => {
        if(!Array.isArray(event.actions))event.actions=[];
        if(typeof event.code==='string'&&event.code.trim()){
          const base=`script_${object.name}_${event.type}`.replace(/[^A-Za-z0-9_]/g,'_');
          let name=base,n=1;while(p.scripts.some(script=>script.name===name))name=base+'_'+n++;
          const script={id:id(),name,code:`function(self, api, game, other) {\n${event.code}\n}`};
          p.scripts.push(script);event.actions.push({...window.createVisualAction('run_script'),scriptId:script.id});
          delete event.code;
        }
      });
    });
    p.options = value.options && typeof value.options === 'object' ? value.options : {fps:60};
    return p;
  }

  function initialize() {
    $('#themeToggle').setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'dark'));
    try { project = normalizeProject(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
    catch { project = sampleProject(); saveNow(); }
    actionEngine=window.createVisualEngine(project);
    saveNow();
    document.title = `GameTsukuru JS — ${project.name}`;
    $('#projectName').textContent = project.name;
    renderTree();
    if (project.sprites.length && project.objects.length && project.rooms.length) {
      const w = $('#workspace').clientWidth;
      openResource('sprites', project.sprites[0].id, {x:24,y:26,w:430,h:355});
      openResource('objects', project.objects.at(-1).id, {x:Math.max(265,Math.min(445,w-740)),y:30,w:740,h:405});
      openResource('rooms', project.rooms[0].id, {x:Math.max(225,Math.min(350,w-740)),y:320,w:710,h:450});
    } else { $('#emptyHint').hidden = false; }
    bindGlobalEvents();
    setStatus('Ready · Click a resource to edit it');
  }

  function getResource(type, resourceId) { return project[type]?.find(r => r.id === resourceId); }
  function getSprite(object) { return object?.spriteId ? getResource('sprites', object.spriteId) : null; }
  function saveSoon() {
    $('#dirtyMark').textContent = ' *';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 350);
  }
  function saveNow() {
    clearTimeout(saveTimer);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(project)); $('#dirtyMark').textContent = ''; }
    catch { setStatus('Browser storage is full. Export your project as JSON.'); }
  }
  function setStatus(message) { $('#statusText').textContent = message; }
  function markChange(message = 'Project updated') { saveSoon(); setStatus(message); }

  function renderTree() {
    const query = $('#resourceSearch').value.trim().toLowerCase();
    $('#resourceTree').innerHTML = TYPES.map(([type,label,icon]) => {
      const items = project[type].filter(r => r.name.toLowerCase().includes(query));
      const isOpen = expanded.has(type) || query;
      return `<div class="tree-group"><div class="tree-group-head" data-toggle="${type}" role="button" tabindex="0"><span class="tree-twisty">${isOpen?'▾':'▸'}</span><span class="tree-icon">${icon}</span><span>${label}</span><span class="count">${project[type].length}</span></div>${isOpen ? `<div class="tree-children">${items.map(r => `<div class="tree-item ${selected?.type===type && selected.id===r.id?'selected':''}" data-type="${type}" data-id="${r.id}" role="button" tabindex="0"><span class="tree-icon">${icon}</span><span>${escapeHTML(r.name)}</span></div>`).join('')}${!items.length && !query ? '<div class="tree-empty">Empty</div>' : ''}</div>` : ''}</div>`;
    }).join('') + `<div class="tree-group"><div class="tree-group-head" data-special="information" role="button" tabindex="0"><span class="tree-twisty"></span><span class="tree-icon">ⓘ</span><span>Game Information</span></div><div class="tree-group-head" data-special="options" role="button" tabindex="0"><span class="tree-twisty"></span><span class="tree-icon">☑</span><span>Game Options</span></div></div>`;
  }

  function nextName(type) {
    const prefix = ({sprites:'sprite',sounds:'sound',backgrounds:'background',paths:'path',scripts:'script',timelines:'timeline',objects:'object',rooms:'room',dataFiles:'datafile'})[type];
    let n = 0;
    while (project[type].some(r => r.name === prefix+n)) n++;
    return prefix+n;
  }
  function addResource(type) {
    const name = nextName(type);
    let resource = {id:id(),name};
    if (type === 'sprites') Object.assign(resource,{image:null,frames:[],frameSpeed:8,width:32,height:32,originX:0,originY:0,transparent:true,precise:true});
    if (type === 'objects') Object.assign(resource,{spriteId:null,visible:true,solid:false,collisionMode:'bounding',alpha:1,depth:0,events:[]});
    if (type === 'rooms') Object.assign(resource,{width:640,height:480,grid:32,snap:true,showGrid:true,background:'#d0d0d0',backgroundId:null,instances:[],view:{enabled:false,width:640,height:480,followObjectId:''}});
    if (type === 'scripts') resource.code = 'function(self, api, game) {\n  // Reusable JavaScript.\n}\n';
    if (type === 'paths') Object.assign(resource,{points:[{x:0,y:0,speed:100},{x:100,y:100,speed:100}],connection:'straight',endAction:'stop'});
    if (type === 'backgrounds' || type === 'sounds') resource.data = null;
    if (type === 'timelines') resource.steps = [];
    if (type === 'dataFiles') resource.text = '';
    project[type].push(resource);
    expanded.add(type);
    selected = {type,id:resource.id};
    renderTree(); openResource(type,resource.id);
    $('#emptyHint').hidden = true;
    markChange(`Created ${name}`);
  }

  function windowKey(type, resourceId) { return `${type}:${resourceId}`; }
  function defaultGeometry(type) {
    const workspace = $('#workspace');
    const used = windows.size;
    const base = {sprites:[340,355],sounds:[370,260],backgrounds:[400,340],paths:[680,480],scripts:[540,420],timelines:[400,300],objects:[650,430],rooms:[760,500],dataFiles:[480,390]};
    const [w,h] = base[type] || [390,320];
    return {x:Math.max(12, Math.min(55+used*28,workspace.clientWidth-w-12)),y:Math.max(12,Math.min(45+used*28,workspace.clientHeight-h-12)),w,h};
  }
  function openResource(type, resourceId, geometry = null) {
    const resource = getResource(type,resourceId);
    if (!resource) return;
    selected = {type,id:resourceId}; renderTree();
    const key = windowKey(type,resourceId);
    if (windows.has(key)) { focusWindow(key); return; }
    const g = geometry || defaultGeometry(type);
    const element = document.createElement('section');
    element.className = 'editor-window'; element.dataset.key = key;
    Object.assign(element.style,{left:g.x+'px',top:g.y+'px',width:g.w+'px',height:g.h+'px'});
    $('#windowLayer').appendChild(element);
    windows.set(key,{type,id:resourceId,element,activeEvent:0,roomTab:'objects',roomMode:'place',selectedObjectId:project.objects[0]?.id||null,selectedInstanceId:null});
    renderWindow(key); focusWindow(key); $('#emptyHint').hidden = true;
  }
  function focusWindow(key) {
    const state = windows.get(key); if (!state) return;
    const ordered = [...windows.values()]
      .filter(item => item !== state)
      .sort((a,b) => (Number(a.element.style.zIndex)||0) - (Number(b.element.style.zIndex)||0));
    ordered.push(state);
    ordered.forEach((item,index) => {
      item.element.style.zIndex = String(index + 1);
      item.element.classList.toggle('inactive', item !== state);
    });
    selected = {type:state.type,id:state.id}; renderTree();
  }
  function closeWindow(key) {
    const state = windows.get(key); if (!state) return;
    if(state.type==='sounds'&&recording?.id===state.id)stopRecording();
    if(state.type==='paths')window.PathEditor.detach(state);
    state.element.remove(); windows.delete(key);
    if (!windows.size) $('#emptyHint').hidden = false;
  }
  function renderWindow(key) {
    const state = windows.get(key), resource = getResource(state?.type,state?.id);
    if (!state || !resource) return;
    const icon = TYPES.find(t=>t[0]===state.type)?.[2] || '▣';
    const body = ({sprites:renderSprite,sounds:renderSound,backgrounds:renderBackground,paths:renderPath,scripts:renderScript,timelines:renderTimeline,objects:renderObject,rooms:renderRoom,dataFiles:renderDataFile})[state.type](resource,state);
    state.element.innerHTML = `<div class="window-titlebar"><span class="window-icon">${icon}</span><span class="window-name">${escapeHTML(typeLabel(state.type))} Properties — ${escapeHTML(resource.name)}</span><div class="window-controls"><button data-win-action="minimize" title="Minimize">–</button><button data-win-action="maximize" title="Maximize">□</button><button data-win-action="close" title="Close">×</button></div></div><div class="window-body ${state.type==='rooms'?'room-body':''} ${state.type==='objects'?'object-body':''} ${state.type==='paths'?'path-body':''}">${body}</div><div class="window-resizer"></div>`;
    if(state.type==='scripts')window.JSSyntax.attach(state.element);
    if(state.type==='paths')window.PathEditor.attach(state.element,resource,state,{onChange:markChange,rerender:()=>renderWindow(key)});
    wireWindowDrag(state);
  }

  function nameField(resource) { return `<div class="form-row"><label>Name:</label><input class="text-input" data-field="name" value="${escapeHTML(resource.name)}" maxlength="40"></div>`; }
  function checkField(field,label,checked) { return `<label class="check-row"><input type="checkbox" data-field="${field}" ${checked?'checked':''}>${label}</label>`; }
  function numberField(field,label,value,min=0,max=4096,step=1) { return `<div class="form-row"><label>${label}:</label><input class="number-input" type="number" data-field="${field}" min="${min}" max="${max}" step="${step}" value="${Number(value)||0}"></div>`; }
  function renderSprite(r) {
    const count=r.frames?.length||0;
    return `<div class="sprite-layout"><div>${nameField(r)}<div class="sprite-preview">${r.image?`<img src="${escapeHTML(r.image)}" alt="${escapeHTML(r.name)}">`:'<span class="no-sprite">▧</span>'}</div><div class="sprite-metadata">Width: ${r.width} &nbsp; Height: ${r.height}<br>Number of subimages: ${count}</div><div class="button-row"><button class="classic-button" data-action="upload-sprite">📂 Load Sprite</button><button class="classic-button" data-action="edit-sprite">🎨 Edit Sprite</button><button class="classic-button" data-action="clear-sprite" ${count?'':'disabled'}>Clear</button></div></div><div><fieldset class="panel-box"><legend>Sprite options</legend>${checkField('precise','Precise collision checking',r.precise)}${checkField('transparent','Transparent',r.transparent)}</fieldset><fieldset class="panel-box" style="margin-top:12px"><legend>Origin</legend>${numberField('originX','X',r.originX,-9999,9999)}${numberField('originY','Y',r.originY,-9999,9999)}<button class="classic-button" data-action="center-origin">Center origin</button></fieldset><p class="hint">Edit Sprite opens the frame editor. Double-click a frame there to paint pixels in the Image Editor.</p></div></div>`;
  }
  function actionSummary(action) {
    const def=ACTION_DEFS.find(item=>item.type===action.type);if(!def)return 'Unknown action';
    return def.fields.filter(f=>f.kind!=='boolean'&&(!f.optional||action[f.key])).slice(0,2).map(f=>{
      const value=action[f.key];
      return f.allowAll&&!value?'(all sounds)':['objects','sprites','sounds','scripts','rooms','paths'].includes(f.kind) ? getResource(f.kind,value)?.name||'(none)' : String(value??'');
    }).join(' · ');
  }
  function renderObject(r,s) {
    const events = r.events || (r.events=[]);
    s.activeEvent = clamp(s.activeEvent,0,Math.max(0,events.length-1));
    const current = events[s.activeEvent];
    if(current&&!Array.isArray(current.actions))current.actions=[];
    s.activeAction=clamp(s.activeAction||0,0,Math.max(0,(current?.actions?.length||0)-1));
    s.paletteGroup ||= 'Move';
    const spriteOptions = `<option value="">(no sprite)</option>`+project.sprites.map(item=>`<option value="${item.id}" ${item.id===r.spriteId?'selected':''}>${escapeHTML(item.name)}</option>`).join('');
    const actions=current?.actions||[];
    const actionRows=actions.map((action,index)=>{const def=ACTION_DEFS.find(item=>item.type===action.type);return `<div class="visual-action-row ${index===s.activeAction?'selected':''}" data-action-index="${index}" draggable="true" title="Double-click to edit or drag to reorder"><span class="action-icon" style="--action-color:${def?.color||'#888'}">${def?.icon||'?'}</span><span class="action-copy"><b>${escapeHTML(def?.label||action.type)}</b><small>${escapeHTML(actionSummary(action))}</small></span></div>`;}).join('');
    const palette=ACTION_DEFS.filter(item=>item.group===s.paletteGroup).map(def=>`<button class="palette-action" data-visual-add="${def.type}" draggable="true" title="${escapeHTML(def.label)}"><span class="action-icon" style="--action-color:${def.color}">${def.icon}</span><small>${escapeHTML(def.label)}</small></button>`).join('');
    return `<div class="object-layout visual-object-layout"><div class="object-col">${nameField(r)}<div class="form-row"><label>Sprite:</label><select class="select-input" data-field="spriteId">${spriteOptions}</select></div>${checkField('solid','Solid',r.solid)}<fieldset class="collision-options" ${r.solid?'':'disabled'}><legend>Collision detection</legend><label><input type="radio" name="collision-${r.id}" data-field="collisionMode" value="bounding" ${r.collisionMode==='pixel'?'':'checked'}>Bounding box collision detection</label><label><input type="radio" name="collision-${r.id}" data-field="collisionMode" value="pixel" ${r.collisionMode==='pixel'?'checked':''}>Pixel perfect collision detection</label></fieldset>${checkField('visible','Visible',r.visible)}${numberField('alpha','Alpha',r.alpha??1,0,1,0.05)}${numberField('depth','Depth',r.depth,-99999,99999)}<div class="field-label">Preview</div><div class="sprite-preview" style="height:82px">${getSprite(r)?.image?`<img src="${escapeHTML(getSprite(r).image)}" alt="" style="opacity:${clamp(Number(r.alpha??1),0,1)}">`:'<span class="no-sprite">◆</span>'}</div><p class="hint">Choose an event, then add actions from the palette.</p></div><div class="object-col event-col"><div class="field-label" style="margin-top:0">Events</div><div class="event-list">${events.map((event,i)=>`<div class="event-row ${i===s.activeEvent?'selected':''}" data-event-index="${i}"><span class="event-icon">${EVENT_OPTIONS.find(o=>o[0]===event.type)?.[2]||'◆'}</span>${escapeHTML(EVENT_OPTIONS.find(o=>o[0]===event.type)?.[1]||event.type)}</div>`).join('')}${!events.length?'<div class="tree-empty">No events yet</div>':''}</div><div class="event-buttons"><button class="classic-button" data-action="add-event">Add</button><button class="classic-button" data-action="change-event" ${current?'':'disabled'}>Change</button><button class="classic-button" data-action="delete-event" ${current?'':'disabled'}>Delete</button></div></div><div class="object-col actions-col"><div class="actions-heading"><span class="field-label" style="margin:0">Actions · ${current?escapeHTML(EVENT_OPTIONS.find(o=>o[0]===current.type)?.[1]||current.type):'choose event'}</span></div><div class="visual-action-list">${actionRows||'<div class="tree-empty">Choose an icon to add an action.</div>'}</div><div class="action-list-buttons"><button class="classic-button" data-action="edit-visual" ${actions.length?'':'disabled'}>Edit</button><button class="classic-button" data-action="move-visual-up" ${actions.length?'':'disabled'}>↑</button><button class="classic-button" data-action="move-visual-down" ${actions.length?'':'disabled'}>↓</button><button class="classic-button" data-action="delete-visual" ${actions.length?'':'disabled'}>Delete</button></div></div><div class="object-col palette-col"><div class="field-label" style="margin-top:0">Action palette</div><div class="palette-tabs">${ACTION_GROUPS.map(group=>`<button class="${group===s.paletteGroup?'active':''}" data-palette-tab="${group}">${group}</button>`).join('')}</div><div class="palette-grid">${palette}</div><p class="hint">Click or drag an icon into the action list.</p></div></div>`;
  }
  function renderRoom(r,s) {
    const tabs = [['objects','Objects'],['settings','Settings'],['backgrounds','Backgrounds'],['views','Views']];
    const selected = s.selectedObjectId || project.objects[0]?.id || '';
    const roomWidth = clamp(Number(r.width)||640,64,4096), roomHeight = clamp(Number(r.height)||480,64,4096);
    const view = r.view || {enabled:false,width:Math.min(640,roomWidth),height:Math.min(480,roomHeight),followObjectId:''};
    const viewPanel = `<label class="check-row"><input type="checkbox" data-view-field="enabled" ${view.enabled?'checked':''}>Enable view</label><fieldset class="panel-box view-fields" ${view.enabled?'':'disabled'}><legend>Camera view</legend><div class="form-row"><label>Width:</label><input class="number-input" type="number" min="64" max="${roomWidth}" step="1" data-view-field="width" value="${clamp(Number(view.width)||640,64,roomWidth)}"></div><div class="form-row"><label>Height:</label><input class="number-input" type="number" min="64" max="${roomHeight}" step="1" data-view-field="height" value="${clamp(Number(view.height)||480,64,roomHeight)}"></div><div class="form-row"><label>Follow object:</label><select class="select-input" data-view-field="followObjectId"><option value="">(none)</option>${project.objects.map(o=>`<option value="${o.id}" ${view.followObjectId===o.id?'selected':''}>${escapeHTML(o.name)}</option>`).join('')}</select></div></fieldset><p class="hint">The view follows the first instance of the selected object and stops at the room edges. Make the room larger than the view to scroll. The outline shows the starting view.</p>`;
    const side = s.roomTab==='objects' ? `<div class="field-label" style="margin-top:0">Edit objects</div><div class="button-row" style="margin-bottom:10px"><button class="classic-button" data-room-mode="place" ${s.roomMode==='place'?'style="background:#d9ecff"':''}>＋ Place</button><button class="classic-button" data-room-mode="erase" ${s.roomMode==='erase'?'style="background:#d9ecff"':''}>⌫ Erase</button></div><div class="form-row"><label>Object to add:</label><select class="select-input" data-room-object><option value="">(select object)</option>${project.objects.map(o=>`<option value="${o.id}" ${selected===o.id?'selected':''}>${escapeHTML(o.name)}</option>`).join('')}</select></div><label class="check-row"><input type="checkbox" data-field="snap" ${r.snap?'checked':''}>Snap to grid</label><label class="check-row"><input type="checkbox" data-field="showGrid" ${r.showGrid?'checked':''}>Show grid</label><p class="hint">Click the room to place an object. Drag an instance to move it.</p><button class="classic-button" data-action="delete-instance" ${s.selectedInstanceId?'':'disabled'}>Delete selected instance</button>` : s.roomTab==='settings' ? `${nameField(r)}${numberField('width','Width',r.width,64,4096)}${numberField('height','Height',r.height,64,4096)}${numberField('grid','Grid',r.grid,4,128)}<p class="hint">The room size sets the playable area. Use Views to set the visible area.</p>` : s.roomTab==='backgrounds' ? `<div class="form-row"><label>Color:</label><input type="color" data-field="background" value="${escapeHTML(r.background||'#d0d0d0')}"></div><div class="form-row"><label>Image:</label><select class="select-input" data-field="backgroundId"><option value="">(none)</option>${project.backgrounds.map(b=>`<option value="${b.id}" ${b.id===r.backgroundId?'selected':''}>${escapeHTML(b.name)}</option>`).join('')}</select></div><p class="hint">The selected background fills the room when the game runs.</p>` : viewPanel;
    const grid = clamp(Number(r.grid)||32,4,128);
    const bg = escapeHTML(r.background||'#d0d0d0');
    const images = project.objects;
    const camera = window.roomCamera(r,r.instances,viewCenter);
    const outline = s.roomTab==='views' && view.enabled ? `<div class="room-view-outline" style="left:${camera.x}px;top:${camera.y}px;width:${camera.width}px;height:${camera.height}px"><span>View ${camera.width} × ${camera.height}</span></div>` : '';
    return `<div class="room-layout"><aside class="room-side"><div class="room-tabs">${tabs.map(([key,label])=>`<button data-room-tab="${key}" class="${s.roomTab===key?'active':''}">${label}</button>`).join('')}</div><div class="room-side-content">${side}</div><div class="room-side-foot"><button class="primary-button" data-command="run">▶ Run room</button></div></aside><div class="room-canvas-wrap"><div class="room-canvas ${s.roomMode==='erase'?'erase-mode':''}" data-room-canvas style="width:${clamp(Number(r.width)||640,64,4096)}px;height:${clamp(Number(r.height)||480,64,4096)}px;background-color:${bg};background-size:${grid}px ${grid}px;${r.showGrid?'':'background-image:none;'}">${r.instances.map(inst=>{const obj=images.find(o=>o.id===inst.objectId),spr=getSprite(obj),size=instanceSize(obj);return `<div class="room-instance ${spr?.image?'':'unsprited'} ${s.selectedInstanceId===inst.id?'selected':''}" data-instance-id="${inst.id}" title="${escapeHTML(obj?.name||'Missing object')}" style="left:${Number(inst.x)||0}px;top:${Number(inst.y)||0}px;width:${size.w}px;height:${size.h}px;opacity:${clamp(Number(obj?.alpha??1),0,1)};">${spr?.image?`<img src="${spr.image}" alt="">`:escapeHTML((obj?.name||'?').replace('object','O'))}</div>`}).join('')}${!r.instances.length?'<div class="room-empty-message">Choose an object on the left, then click here to place it.</div>':''}${outline}<span class="room-status">${r.width} × ${r.height} · ${r.instances.length} instances</span></div></div></div>`;
  }
  function renderScript(r) { return `<div class="code-page">${nameField(r)}<p class="hint">Write a JavaScript function here. Add a Run Script action to an object event to call it.</p><div class="js-editor-surface"><pre class="js-highlight" aria-hidden="true"></pre><textarea class="code-editor js-editor-input" data-code="code" spellcheck="false" wrap="off" aria-label="Script JavaScript source">${escapeHTML(r.code||'')}</textarea></div><div class="code-foot">Function parameters: self, api, game, other</div></div>`; }
  function renderSound(r) { const active=recording?.id===r.id;return `<div class="simple-resource sound-resource">${nameField(r)}<div class="field-label">Sound</div><p class="hint">${active?'Recording from microphone…':r.data?'Sound ready to play.':'Load an audio file or record one with your microphone.'}</p><div class="button-row"><button class="classic-button" data-action="upload-sound" ${active?'disabled':''}>📂 Load Sound</button><button class="classic-button" data-action="play-sound" ${r.data&&!active?'':'disabled'}>▶ Preview</button><button class="classic-button" data-action="clear-asset" ${r.data&&!active?'':'disabled'}>Clear</button></div><div class="record-panel"><span class="record-light ${active?'active':''}"></span><span>${active?'Recording… click Stop to save':'Microphone recorder'}</span><button class="${active?'danger-button':'classic-button'}" data-action="${active?'stop-recording':'start-recording'}">${active?'■ Stop recording':'● Record'}</button></div>${r.data?`<audio controls preload="metadata" src="${escapeHTML(r.data)}"></audio>`:''}<p class="hint">Use Play sound or Play on repeat in an object event to play this resource.</p></div>`; }
  function renderBackground(r) { return `<div class="simple-resource">${nameField(r)}<div class="sprite-preview" style="height:180px">${r.data?`<img src="${r.data}" alt="${escapeHTML(r.name)}">`:'<span class="no-sprite">▨</span>'}</div><div class="button-row" style="margin-top:12px"><button class="classic-button" data-action="upload-background">📂 Load Background</button><button class="classic-button" data-action="clear-asset" ${r.data?'':'disabled'}>Clear</button></div><p class="hint">Choose this image in a room's Backgrounds tab.</p></div>`; }
  function renderPath(r,s) { return window.PathEditor.render(r,s); }
  function renderTimeline(r) { return `<div class="simple-resource">${nameField(r)}<p class="hint">Timeline moments can be read from <code>game.timelines.${escapeHTML(r.name)}</code> in an event.</p><div class="path-point-list">${(r.steps||[]).map((step,i)=>`<div class="path-point">Moment ${step.moment}: ${escapeHTML(step.note||'')} <button data-action="remove-step" data-index="${i}">✕</button></div>`).join('')}</div><div class="form-row"><label>Moment:</label><input class="number-input" id="moment-${r.id}" type="number" min="0" value="0"></div><div class="form-row"><label>Note:</label><input class="text-input" id="note-${r.id}" placeholder="What happens here?"></div><button class="classic-button" data-action="add-step">＋ Add moment</button></div>`; }
  function renderDataFile(r) { return `<div class="code-page">${nameField(r)}<p class="hint">Store notes or text data with your project.</p><textarea class="code-editor" data-code="text" spellcheck="false">${escapeHTML(r.text||'')}</textarea></div>`; }

  function instanceSprite(inst) { return getResource('sprites',inst.spriteId)||getSprite(project.objects.find(o=>o.id===inst.objectId)); }
  function instanceSize(object) { const s=getSprite(object); return {w:clamp(Number(s?.width)||32,8,512),h:clamp(Number(s?.height)||32,8,512)}; }
  function runtimeInstanceSize(inst) { const s=instanceSprite(inst); return {w:clamp(Number(s?.width)||32,8,512),h:clamp(Number(s?.height)||32,8,512)}; }
  function viewCenter(inst) {
    const sprite=instanceSprite(inst),size=runtimeInstanceSize(inst);
    return {x:Number(inst.x)+size.w/2-(Number(sprite?.originX)||0),y:Number(inst.y)+size.h/2-(Number(sprite?.originY)||0)};
  }

  function wireWindowDrag(state) {
    const el = state.element;
    const title = $('.window-titlebar',el);
    title.addEventListener('pointerdown', event => {
      if (event.target.closest('button')) return;
      const startX=event.clientX,startY=event.clientY,left=parseInt(el.style.left),top=parseInt(el.style.top);
      title.setPointerCapture(event.pointerId);
      const move=e=>{el.style.left=Math.max(0,left+e.clientX-startX)+'px';el.style.top=Math.max(0,top+e.clientY-startY)+'px';};
      const end=()=>{title.removeEventListener('pointermove',move);title.removeEventListener('pointerup',end);};
      title.addEventListener('pointermove',move);title.addEventListener('pointerup',end,{once:true});
    });
    $('.window-resizer',el).addEventListener('pointerdown',event=>{
      event.preventDefault(); const handle=event.currentTarget,startX=event.clientX,startY=event.clientY,w=el.offsetWidth,h=el.offsetHeight;
      handle.setPointerCapture(event.pointerId);
      const move=e=>{el.style.width=Math.max(280,w+e.clientX-startX)+'px';el.style.height=Math.max(180,h+e.clientY-startY)+'px';};
      const end=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);};
      handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end,{once:true});
    });
    if (!state.focusBound) {
      el.addEventListener('pointerdown',()=>focusWindow(windowKey(state.type,state.id)));
      state.focusBound = true;
    }
  }

  function activeStateFrom(element) { const win=element.closest('.editor-window'); return win ? windows.get(win.dataset.key) : null; }
  function updateResourceField(state,input) {
    const r=getResource(state.type,state.id); if (!r) return;
    const field=input.dataset.field;
    if (!field) return;
    let value=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value;
    if (input.type==='number') value=clamp(value,Number(input.min||-99999),Number(input.max||99999));
    r[field]=value;
    if (field==='name') {
      input.value=value.replace(/[<>]/g,'').trimStart(); r.name=input.value||r.name;
      $('.window-name',state.element).textContent=`${typeLabel(state.type)} Properties — ${r.name}`;
      renderTree();
    }
    markChange(`${r.name} updated`);
    if (state.type==='rooms' && ['width','height','grid','background','snap','showGrid','backgroundId'].includes(field)) renderWindow(windowKey(state.type,state.id));
    if (state.type==='objects' && ['spriteId','solid','alpha'].includes(field)) renderWindow(windowKey(state.type,state.id));
    if (state.type==='objects' && field==='alpha') windows.forEach((item,key)=>{if(item.type==='rooms')renderWindow(key);});
  }

  function updateRoomViewField(state,input) {
    if (state.type!=='rooms') return;
    const room=getResource('rooms',state.id),field=input.dataset.viewField;
    if (!room?.view || !['enabled','width','height','followObjectId'].includes(field)) return;
    if (field==='enabled') room.view.enabled=input.checked;
    else if (field==='followObjectId') room.view.followObjectId=input.value;
    else {
      const maximum=clamp(Number(room[field])||640,64,4096);
      room.view[field]=clamp(Math.round(Number(input.value)||64),64,maximum);
    }
    renderWindow(windowKey('rooms',room.id));
    markChange('Room view updated');
  }

  function download(name,contents,mime='application/json') {
    const blob=new Blob([contents],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function exportProject() { saveNow();download(`${project.name.replace(/[^a-z0-9_-]+/gi,'_')||'game'}.gtjs.json`,JSON.stringify(project,null,2));setStatus('Project exported as JSON'); }
  function replaceProject(next) {
    stopGame();if(recording)stopRecording(true);window.SpriteEditors.close();windows.forEach((_,key)=>closeWindow(key));
    project=next;actionEngine=window.createVisualEngine(project);selected=null; imageCache.clear();
    $('#projectName').textContent=project.name; document.title=`GameTsukuru JS — ${project.name}`;
    renderTree(); saveNow();
    if (project.rooms[0]) openResource('rooms',project.rooms[0].id);
    else $('#emptyHint').hidden=false;
  }
  async function command(name) {
    closeMenus();
    if (name==='theme') {
      const dark=document.documentElement.dataset.theme!=='dark';
      if (dark) document.documentElement.dataset.theme='dark';
      else delete document.documentElement.dataset.theme;
      $('#themeToggle').setAttribute('aria-pressed',String(dark));
      try { localStorage.setItem(THEME_KEY,dark?'dark':'light'); } catch {}
      return;
    }
    if (name==='save') { saveNow();exportProject();return; }
    if (name==='export') { exportProject();return; }
    if (name==='export-game') { if(!project.rooms.length){showModal('No room to export','<p>Create a room first, then export your playable game.</p>',[{label:'OK',value:true,primary:true}]);return;}download(`${project.name.replace(/[^a-z0-9_-]+/gi,'_')||'game'}.html`,window.createGameHTML(project),'text/html');setStatus('Playable HTML game exported');return; }
    if (name==='open') { $('#projectFile').click();return; }
    if (name==='sample') { await showGamePicker(); return; }
    if (name==='new') {
      const yes=await confirmModal('Create new project?', 'Your current project stays in the browser until replaced. Export it first if you want a separate copy.');
      if (!yes) return;
      replaceProject(blankProject());
      setStatus('New project created');return;
    }
    if (name==='run') { runGame();return; }
    if (name==='stop') { stopGame();return; }
    if (name==='show-all') { project.sprites.concat(project.objects,project.rooms).forEach(r=>{const type=project.sprites.includes(r)?'sprites':project.objects.includes(r)?'objects':'rooms';openResource(type,r.id);});return; }
    if (name==='close-all') { [...windows.keys()].forEach(closeWindow);return; }
    if (name==='help') { showHelp();return; }
    if (!selected) {setStatus('Select a resource first');return;}
    const r=getResource(selected.type,selected.id); if (!r) return;
    if (name==='rename') {
      const value=await promptModal('Rename resource','Name',r.name);
      if (!value?.trim()) return;
      r.name=value.trim(); renderTree();renderWindow(windowKey(selected.type,selected.id));markChange(`Renamed to ${r.name}`);return;
    }
    if (name==='duplicate') {
      const copy=deepCopy(r);copy.id=id();copy.name=r.name+'_copy';
      if (selected.type==='rooms') copy.instances.forEach(inst=>inst.id=id());
      project[selected.type].push(copy);renderTree();openResource(selected.type,copy.id);markChange(`Duplicated ${r.name}`);return;
    }
    if (name==='delete') {
      const yes=await confirmModal(`Delete ${r.name}?`,'This resource will be removed from the project.');if(!yes)return;
      const type=selected.type;
      project[type]=project[type].filter(item=>item.id!==r.id);
      if(type==='sprites')project.objects.forEach(o=>{if(o.spriteId===r.id)o.spriteId=null;});
      if(type==='objects')project.rooms.forEach(room=>{room.instances=room.instances.filter(inst=>inst.objectId!==r.id);if(room.view?.followObjectId===r.id)room.view.followObjectId='';});
      if(type==='backgrounds')project.rooms.forEach(room=>{if(room.backgroundId===r.id)room.backgroundId=null;});
      closeWindow(windowKey(type,r.id)); selected=null;renderTree();windows.forEach((_,key)=>renderWindow(key));markChange(`${r.name} deleted`);
    }
  }

  async function showGamePicker() {
    showModal('Explore games', '<p>Loading games…</p>', [{label:'Close',value:false}]);
    const version = modalVersion;
    try {
      const response = await fetch('games/index.json', {cache:'no-store'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const files = await response.json();
      if (version !== modalVersion || $('#modalOverlay').hidden) return;
      if (!Array.isArray(files)) throw new Error('Invalid game list');
      const games = files.filter(game => game && typeof game.file === 'string' && /^[a-z0-9_-]+(?:\.gtjs)?\.json$/i.test(game.file));
      if (!games.length) { $('#modalBody').innerHTML = '<p>No games are available yet.</p>'; return; }
      $('#modalBody').innerHTML = `<p>Choose a game to open in the editor.</p><div class="game-picker">${games.map(game => `<button type="button" data-game-file="${escapeHTML(game.file)}">${escapeHTML(typeof game.title === 'string' && game.title.trim() ? game.title : game.file.replace(/(?:\.gtjs)?\.json$/i,'').replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase()))}</button>`).join('')}</div>`;
      $$('.game-picker button').forEach(button => button.addEventListener('click', () => openListedGame(button.dataset.gameFile)));
    } catch (error) {
      if (version !== modalVersion || $('#modalOverlay').hidden) return;
      $('#modalBody').innerHTML = `<p>Could not load the games list: ${escapeHTML(error.message)}</p>`;
    }
  }

  async function openListedGame(file) {
    if (!/^[a-z0-9_-]+(?:\.gtjs)?\.json$/i.test(file)) return;
    const version = modalVersion;
    const buttons = $$('.game-picker button'); buttons.forEach(button => button.disabled = true);
    try {
      const response = await fetch(`games/${encodeURIComponent(file)}`, {cache:'no-store'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const next = normalizeProject(await response.json());
      if (version !== modalVersion || $('#modalOverlay').hidden) return;
      hideModal(); modalResolve?.(true); modalResolve = null;
      replaceProject(next);
      setStatus(`${file.replace(/\.gtjs\.json$/i,'').replace(/[_-]+/g,' ')} loaded`);
    } catch (error) {
      if (version !== modalVersion || $('#modalOverlay').hidden) return;
      $('#modalBody').insertAdjacentHTML('beforeend', `<p class="game-picker-error">Could not open game: ${escapeHTML(error.message)}</p>`);
      buttons.forEach(button => button.disabled = false);
    }
  }

  function closeMenus() { $$('.menu-popover.open').forEach(el=>el.classList.remove('open')); $$('.menu-trigger.active').forEach(el=>el.classList.remove('active')); }
  function showModal(title,body,buttons) {
    modalVersion++;
    $('#modalTitle').textContent=title;$('#modalBody').innerHTML=body;$('#modalActions').innerHTML='';
    buttons.forEach(({label,value,primary})=>{const b=document.createElement('button');b.textContent=label;b.className=primary?'primary-button':'classic-button';b.onclick=()=>{hideModal();modalResolve?.(value);modalResolve=null;};$('#modalActions').appendChild(b);});
    $('#modalOverlay').hidden=false;$('#modalBody input, #modalBody select')?.focus();
    return new Promise(resolve=>modalResolve=resolve);
  }
  function hideModal() { $('#modalOverlay').hidden=true; }
  function confirmModal(title,message) { return showModal(title,`<p>${escapeHTML(message)}</p>`,[{label:'Cancel',value:false},{label:'Continue',value:true,primary:true}]); }
  async function promptModal(title,label,value='') {
    const promise=showModal(title,`<label>${escapeHTML(label)}<input id="promptInput" value="${escapeHTML(value)}"></label>`,[{label:'Cancel',value:false},{label:'OK',value:true,primary:true}]);
    const input=$('#promptInput');input.select();input.addEventListener('keydown',e=>{if(e.key==='Enter')$('#modalActions .primary-button').click();});
    const result=await promise;return result?input.value:null;
  }
  function showHelp() {
    showModal('GameTsukuru JS help',`<div class="modal-help"><p>Build a game with sprites, objects, and rooms. Load an image into a sprite, assign it to an object, then place the object in a room.</p><ul><li>In an object, choose an <b>event</b>, then click Move, Jump, React, or another action icon. Select an action to edit its settings.</li><li>To use JavaScript, add a resource in the <b>Scripts</b> folder and place a <b>Run script</b> action in an event. Scripts receive <code>self</code>, <code>api</code>, <code>game</code>, and <code>other</code>.</li><li><b>Edit Sprite</b> opens the frame editor. Double-click a frame to paint it in the Image Editor.</li><li>The Path editor lets you add and drag points, choose straight or smooth connections, and set the end action. Use Follow path in an object’s Create event.</li><li>For a scrolling room, enlarge it in <b>Settings</b>, then use <b>Views</b> to enable a smaller view and choose the object to follow.</li><li>The Sound window can load a file or record from your microphone.</li><li><b>F5</b> runs the selected room. File → Export JSON saves the editable project; File → Export playable HTML creates a standalone game.</li></ul></div>`,[{label:'Close',value:true,primary:true}]);
  }

  function actionFieldMarkup(field,value) {
    let control;
    if(field.kind==='boolean')control=`<input data-action-param="${field.key}" type="checkbox" ${value?'checked':''}>`;
    else if(field.kind==='number')control=`<input data-action-param="${field.key}" type="number" value="${Number(value)||0}">`;
    else if(field.kind==='volume'){
      const percent=clamp(Math.round(Number.isFinite(Number(value))?Number(value):100),0,100);
      control=`<span class="volume-control"><span class="volume-knob-wrap" style="--volume-rotation:${-135+percent*2.7}deg"><span class="volume-knob-face"></span><input class="volume-knob-input" data-action-param="${field.key}" type="range" min="0" max="100" step="1" value="${percent}" aria-label="${escapeHTML(field.label)}"></span><output class="volume-value">${percent}%</output></span>`;
    }
    else if(field.kind==='color')control=`<input data-action-param="${field.key}" type="color" value="${escapeHTML(value||'#ffffff')}">`;
    else if(field.kind==='direction')control=`<select data-action-param="${field.key}">${[['right','→ Right'],['down_right','↘ Down right'],['down','↓ Down'],['down_left','↙ Down left'],['left','← Left'],['up_left','↖ Up left'],['up','↑ Up'],['up_right','↗ Up right']].map(([key,label])=>`<option value="${key}" ${value===key?'selected':''}>${label}</option>`).join('')}</select>`;
    else if(field.kind==='choice')control=`<select data-action-param="${field.key}">${field.options.map(([key,label])=>`<option value="${key}" ${value===key?'selected':''}>${escapeHTML(label)}</option>`).join('')}</select>`;
    else if(['objects','sprites','rooms','scripts','sounds','paths'].includes(field.kind))control=`<select data-action-param="${field.key}"><option value="">${escapeHTML(field.emptyLabel|| (field.allowAll?'(all sounds)':`(choose ${field.label.toLowerCase()})`))}</option>${project[field.kind].map(resource=>`<option value="${resource.id}" ${value===resource.id?'selected':''}>${escapeHTML(resource.name)}</option>`).join('')}</select>`;
    else control=`<input data-action-param="${field.key}" type="text" value="${escapeHTML(value||'')}">`;
    return `<label class="action-field"><span>${escapeHTML(field.label)}</span>${control}</label>`;
  }
  async function editVisualAction(state,action) {
    const def=ACTION_DEFS.find(item=>item.type===action.type);if(!def||!def.fields.length)return;
    const promise=showModal(def.label,def.fields.map(field=>actionFieldMarkup(field,action[field.key])).join(''),[{label:'Cancel',value:false},{label:'OK',value:true,primary:true}]);
    const inputs=$$('[data-action-param]',$('#modalBody'));
    inputs.filter(input=>input.type==='range').forEach(input=>input.addEventListener('input',()=>{
      const value=clamp(Math.round(Number(input.value)||0),0,100),control=input.closest('.volume-control');
      control.querySelector('.volume-knob-wrap').style.setProperty('--volume-rotation',`${-135+value*2.7}deg`);
      control.querySelector('output').textContent=`${value}%`;
    }));
    const ok=await promise;if(!ok)return;
    inputs.forEach(input=>{const field=def.fields.find(item=>item.key===input.dataset.actionParam);action[field.key]=field.kind==='boolean'?input.checked:field.kind==='number'?Number(input.value):field.kind==='volume'?clamp(Number(input.value),0,100):input.value;});
    renderWindow(windowKey(state.type,state.id));markChange(`${def.label} updated`);
  }
  function createProjectAction(type) {
    const action=window.createVisualAction(type);
    if(type!=='display_touch_controls'||!action)return action;
    for(const source of window.ControllerSprites){
      let sprite=project.sprites.find(item=>item.controllerRole===source.role);
      if(!sprite){
        let name=source.name,suffix=1;
        while(project.sprites.some(item=>item.name===name))name=source.name+'_'+suffix++;
        sprite={id:id(),name,controllerRole:source.role,image:source.image,frames:[{image:source.image,width:source.width,height:source.height}],frameSpeed:8,width:source.width,height:source.height,originX:0,originY:0,transparent:true,precise:false};
        project.sprites.push(sprite);
      }
      action[source.role+'SpriteId']=sprite.id;
    }
    renderTree();
    return action;
  }
  function addVisualAction(state,type) {
    const resource=getResource(state.type,state.id),event=resource?.events?.[state.activeEvent];
    if(!event){setStatus('Add or select an event first');return;}
    const action=createProjectAction(type);if(!action)return;
    event.actions.push(action);state.activeAction=event.actions.length-1;
    renderWindow(windowKey(state.type,state.id));markChange(`${ACTION_DEFS.find(item=>item.type===type).label} added`);
    editVisualAction(state,action);
  }
  async function startRecording(resource) {
    if(recording){setStatus('Stop the current recording first');return;}
    if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){
      showModal('Recording unavailable','<p>This browser does not support microphone recording.</p>',[{label:'OK',value:true,primary:true}]);return;
    }
    try {
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      if(getResource('sounds',resource.id)!==resource){stream.getTracks().forEach(track=>track.stop());return;}
      const mime=typeof MediaRecorder.isTypeSupported==='function'&&MediaRecorder.isTypeSupported('audio/webm;codecs=opus')?'audio/webm;codecs=opus':'';
      const recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
      const current={id:resource.id,stream,recorder,chunks:[],discard:false};recording=current;
      recorder.ondataavailable=event=>{if(event.data?.size)current.chunks.push(event.data);};
      recorder.onstop=()=>{
        current.stream.getTracks().forEach(track=>track.stop());
        if(current.discard||!current.chunks.length)return;
        const blob=new Blob(current.chunks,{type:recorder.mimeType||'audio/webm'}),reader=new FileReader();
        reader.onload=()=>{const target=getResource('sounds',current.id);if(!target)return;target.data=String(reader.result);target.mimeType=blob.type;const key=windowKey('sounds',target.id);if(windows.has(key))renderWindow(key);markChange(`${target.name} recording saved`);};
        reader.readAsDataURL(blob);
      };
      recorder.start();const key=windowKey('sounds',resource.id);if(windows.has(key))renderWindow(key);setStatus(`Recording ${resource.name}`);
    } catch(error) {setStatus(`Microphone unavailable: ${error.message}`);showModal('Could not record',`<p>${escapeHTML(error.message)}</p>`,[{label:'OK',value:true,primary:true}]);}
  }
  function stopRecording(discard=false) {
    if(!recording)return;
    const current=recording;recording=null;current.discard=discard;
    if(current.recorder.state!=='inactive')current.recorder.stop();
    const key=windowKey('sounds',current.id);if(windows.has(key))renderWindow(key);
    setStatus(discard?'Recording discarded':'Finishing recording…');
  }

  function handleAction(state,action,target) {
    const r=getResource(state.type,state.id);if(!r)return;
    const key=windowKey(state.type,state.id);
    if(action.startsWith('upload-')) { assetTarget={type:state.type,id:state.id};$('#assetFile').accept=action==='upload-sound'?'audio/*':'image/*';$('#assetFile').click();return; }
    if(action==='edit-sprite'){window.SpriteEditors.open(r,()=>{renderWindow(key);windows.forEach((item,otherKey)=>{if(item.type==='objects'||item.type==='rooms')renderWindow(otherKey);});markChange(`${r.name} edited`);});return;}
    if(action==='clear-sprite'){r.image=null;r.frames=[];r.width=r.height=32;renderWindow(key);markChange('Sprite cleared');return;}
    if(action==='clear-asset'){r.data=null;renderWindow(key);markChange('Asset cleared');return;}
    if(action==='center-origin'){r.originX=Math.floor(r.width/2);r.originY=Math.floor(r.height/2);renderWindow(key);markChange('Origin centered');return;}
    if(action==='play-sound'){if(r.data)new Audio(r.data).play().catch(()=>setStatus('Could not play sound'));return;}
    if(action==='start-recording'){startRecording(r);return;}
    if(action==='stop-recording'){stopRecording();return;}
    if(action==='add-event' || action==='change-event'){
      const isChange=action==='change-event';
      const options=EVENT_OPTIONS.map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
      const promise=showModal(isChange?'Change event':'Add event',`<p>Choose when this action list runs.</p><select id="eventChoice">${options}</select>`,[{label:'Cancel',value:false},{label:isChange?'Change':'Add',value:true,primary:true}]);
      if(isChange)$('#eventChoice').value=r.events[state.activeEvent]?.type||'create';
      promise.then(ok=>{if(!ok)return;const type=$('#eventChoice').value;if(isChange){r.events[state.activeEvent].type=type;}else{r.events.push({type,actions:[]});state.activeEvent=r.events.length-1;}state.activeAction=0;renderWindow(key);markChange(`${r.name} event updated`);});return;
    }
    if(action==='delete-event'){r.events.splice(state.activeEvent,1);state.activeEvent=Math.max(0,state.activeEvent-1);state.activeAction=0;renderWindow(key);markChange('Event deleted');return;}
    if(['edit-visual','delete-visual','move-visual-up','move-visual-down'].includes(action)){
      const actions=r.events[state.activeEvent]?.actions;if(!actions?.length)return;
      const index=state.activeAction;
      if(action==='edit-visual'){editVisualAction(state,actions[index]);return;}
      if(action==='delete-visual'){actions.splice(index,1);state.activeAction=clamp(index,0,Math.max(0,actions.length-1));}
      if(action==='move-visual-up'&&index>0){[actions[index-1],actions[index]]=[actions[index],actions[index-1]];state.activeAction--;}
      if(action==='move-visual-down'&&index<actions.length-1){[actions[index+1],actions[index]]=[actions[index],actions[index+1]];state.activeAction++;}
      renderWindow(key);markChange('Action list updated');return;
    }
    if(action==='delete-instance'){r.instances=r.instances.filter(inst=>inst.id!==state.selectedInstanceId);state.selectedInstanceId=null;renderWindow(key);markChange('Instance deleted');return;}
    if(action==='add-step'){const moment=Number($(`#moment-${r.id}`,state.element)?.value)||0,note=$(`#note-${r.id}`,state.element)?.value||'';(r.steps||=[]).push({moment,note});r.steps.sort((a,b)=>a.moment-b.moment);renderWindow(key);markChange('Timeline moment added');return;}
    if(action==='remove-step'){r.steps.splice(Number(target.dataset.index),1);renderWindow(key);markChange('Timeline moment removed');}
  }

  function handleRoomPointer(event,state) {
    const room=getResource('rooms',state.id),canvas=event.target.closest('[data-room-canvas]');if(!room||!canvas)return;
    const instanceEl=event.target.closest('[data-instance-id]');
    if(instanceEl){
      const inst=room.instances.find(i=>i.id===instanceEl.dataset.instanceId);if(!inst)return;
      if(state.roomMode==='erase'){room.instances=room.instances.filter(i=>i!==inst);state.selectedInstanceId=null;renderWindow(windowKey('rooms',room.id));markChange('Instance erased');return;}
      state.selectedInstanceId=inst.id;instanceEl.classList.add('selected');
      const startX=event.clientX,startY=event.clientY,ox=inst.x,oy=inst.y,grid=Number(room.grid)||32;
      instanceEl.setPointerCapture(event.pointerId);
      const move=e=>{let x=ox+e.clientX-startX,y=oy+e.clientY-startY;if(room.snap){x=Math.round(x/grid)*grid;y=Math.round(y/grid)*grid;}inst.x=clamp(x,0,room.width-1);inst.y=clamp(y,0,room.height-1);instanceEl.style.left=inst.x+'px';instanceEl.style.top=inst.y+'px';const outline=$('.room-view-outline',state.element);if(outline){const camera=window.roomCamera(room,room.instances,viewCenter);outline.style.left=camera.x+'px';outline.style.top=camera.y+'px';}};
      const end=()=>{instanceEl.removeEventListener('pointermove',move);instanceEl.removeEventListener('pointerup',end);markChange('Instance moved');};
      instanceEl.addEventListener('pointermove',move);instanceEl.addEventListener('pointerup',end,{once:true});return;
    }
    if(state.roomMode==='erase')return;
    const objectId=state.selectedObjectId||project.objects[0]?.id;if(!objectId){setStatus('Add an object first');return;}
    const rect=canvas.getBoundingClientRect(),grid=Number(room.grid)||32;
    let x=event.clientX-rect.left,y=event.clientY-rect.top;
    if(room.snap){x=Math.floor(x/grid)*grid;y=Math.floor(y/grid)*grid;}
    const inst={id:id(),objectId,x:Math.round(x),y:Math.round(y)};room.instances.push(inst);state.selectedInstanceId=inst.id;renderWindow(windowKey('rooms',room.id));markChange('Instance placed');
  }

  function bindGlobalEvents() {
    document.addEventListener('click',event=>{
      const trigger=event.target.closest('.menu-trigger');
      if(trigger){const menu=$(`#menu-${trigger.dataset.menu}`),open=menu.classList.contains('open');closeMenus();if(!open){menu.classList.add('open');trigger.classList.add('active');}return;}
      const add=event.target.closest('[data-add]');if(add){closeMenus();addResource(add.dataset.add);return;}
      const cmd=event.target.closest('[data-command]');if(cmd){command(cmd.dataset.command);return;}
      if(event.target.closest('#addResourceButton')){const promise=showModal('Add resource',`<div class="resource-picker">${TYPES.map(([type,label,icon])=>`<button data-pick-type="${type}">${icon} ${label.replace(/s$/,'')}</button>`).join('')}</div>`,[{label:'Cancel',value:false}]);promise.catch(()=>{});return;}
      const pick=event.target.closest('[data-pick-type]');if(pick){hideModal();modalResolve?.(true);modalResolve=null;addResource(pick.dataset.pickType);return;}
      const group=event.target.closest('[data-toggle]');if(group){const t=group.dataset.toggle;expanded.has(t)?expanded.delete(t):expanded.add(t);renderTree();return;}
      const item=event.target.closest('.tree-item');if(item){openResource(item.dataset.type,item.dataset.id);return;}
      const special=event.target.closest('[data-special]');if(special){if(special.dataset.special==='information')showHelp();else showOptions();return;}
      const control=event.target.closest('[data-win-action]');if(control){const s=activeStateFrom(control);if(!s)return;const key=windowKey(s.type,s.id);if(['close','minimize'].includes(control.dataset.winAction))closeWindow(key);if(control.dataset.winAction==='maximize'){if(s.restore){Object.assign(s.element.style,s.restore);s.restore=null;}else{s.restore={left:s.element.style.left,top:s.element.style.top,width:s.element.style.width,height:s.element.style.height};Object.assign(s.element.style,{left:'0px',top:'0px',width:'100%',height:'100%'});}}return;}
      const tab=event.target.closest('[data-room-tab]');if(tab){const s=activeStateFrom(tab);s.roomTab=tab.dataset.roomTab;renderWindow(windowKey(s.type,s.id));return;}
      const mode=event.target.closest('[data-room-mode]');if(mode){const s=activeStateFrom(mode);s.roomMode=mode.dataset.roomMode;renderWindow(windowKey(s.type,s.id));return;}
      const row=event.target.closest('[data-event-index]');if(row){const s=activeStateFrom(row);s.activeEvent=Number(row.dataset.eventIndex);renderWindow(windowKey(s.type,s.id));return;}
      const paletteTab=event.target.closest('[data-palette-tab]');if(paletteTab){const s=activeStateFrom(paletteTab);s.paletteGroup=paletteTab.dataset.paletteTab;renderWindow(windowKey(s.type,s.id));return;}
      const visualAdd=event.target.closest('[data-visual-add]');if(visualAdd){const s=activeStateFrom(visualAdd);addVisualAction(s,visualAdd.dataset.visualAdd);return;}
      const visualRow=event.target.closest('[data-action-index]');if(visualRow){const s=activeStateFrom(visualRow);s.activeAction=Number(visualRow.dataset.actionIndex);$$('[data-action-index]',s.element).forEach(item=>item.classList.toggle('selected',Number(item.dataset.actionIndex)===s.activeAction));return;}
      const action=event.target.closest('[data-action]');if(action){const s=activeStateFrom(action);if(s)handleAction(s,action.dataset.action,action);return;}
      if(event.target.closest('[data-room-canvas]')){const s=activeStateFrom(event.target);if(s)handleRoomPointer(event,s);return;}
      if(!event.target.closest('.menu-popover'))closeMenus();
    });
    $('#resourceTree').addEventListener('dblclick',e=>{const item=e.target.closest('.tree-item');if(item)openResource(item.dataset.type,item.dataset.id);});
    $('#windowLayer').addEventListener('dblclick',e=>{const row=e.target.closest('[data-action-index]');if(!row)return;const s=activeStateFrom(row),r=getResource(s.type,s.id);s.activeAction=Number(row.dataset.actionIndex);editVisualAction(s,r.events[s.activeEvent].actions[s.activeAction]);});
    $('#resourceSearch').addEventListener('input',renderTree);
    $('#collapseTree').addEventListener('click',()=>$('#resourceTree').closest('.resource-pane').classList.toggle('collapsed'));
    $('#helpTop').addEventListener('click',showHelp);
    $('#windowLayer').addEventListener('input',event=>{
      const s=activeStateFrom(event.target);if(!s)return;
      if(event.target.dataset.code){const r=getResource(s.type,s.id);r[event.target.dataset.code]=event.target.value;markChange(s.type==='scripts'?'JavaScript updated':'Text updated');return;}
      if(event.target.dataset.field && event.target.type!=='checkbox' && event.target.tagName!=='SELECT' && event.target.type!=='number' && event.target.type!=='color')updateResourceField(s,event.target);
    });
    $('#windowLayer').addEventListener('change',event=>{
      const s=activeStateFrom(event.target);if(!s)return;
      if(event.target.dataset.viewField){updateRoomViewField(s,event.target);return;}
      if(event.target.dataset.field && event.target.type!=='text')updateResourceField(s,event.target);
      if(event.target.hasAttribute('data-room-object'))s.selectedObjectId=event.target.value;
    });
    $('#windowLayer').addEventListener('keydown',event=>{if(event.target.matches('.code-editor')&&event.key==='Tab'){event.preventDefault();const t=event.target,start=t.selectionStart;t.setRangeText('  ',start,t.selectionEnd,'end');t.dispatchEvent(new Event('input',{bubbles:true}));}});
    $('#windowLayer').addEventListener('dragstart',event=>{
      const palette=event.target.closest('[data-visual-add]'),row=event.target.closest('[data-action-index]'),source=palette||row;
      if(!source)return;
      const s=activeStateFrom(source);
      event.dataTransfer.setData('text/plain',JSON.stringify({key:windowKey(s.type,s.id),kind:palette?'palette':'row',value:palette?palette.dataset.visualAdd:Number(row.dataset.actionIndex)}));
      event.dataTransfer.effectAllowed=palette?'copy':'move';
    });
    $('#windowLayer').addEventListener('dragover',event=>{const list=event.target.closest('.visual-action-list');if(list){event.preventDefault();list.classList.add('drag-target');}});
    $('#windowLayer').addEventListener('dragleave',event=>{const list=event.target.closest('.visual-action-list');if(list&&!list.contains(event.relatedTarget))list.classList.remove('drag-target');});
    $('#windowLayer').addEventListener('dragend',()=>$$('.visual-action-list.drag-target').forEach(list=>list.classList.remove('drag-target')));
    $('#windowLayer').addEventListener('drop',event=>{
      const list=event.target.closest('.visual-action-list');if(!list)return;event.preventDefault();list.classList.remove('drag-target');
      let payload;try{payload=JSON.parse(event.dataTransfer.getData('text/plain'));}catch{return;}
      const s=activeStateFrom(list),key=windowKey(s.type,s.id);if(payload.key!==key)return;
      const actions=getResource(s.type,s.id)?.events?.[s.activeEvent]?.actions;if(!actions)return;
      const row=event.target.closest('[data-action-index]');let index=row?Number(row.dataset.actionIndex):actions.length;
      if(payload.kind==='palette'){
        const action=createProjectAction(payload.value);if(!action)return;
        actions.splice(index,0,action);s.activeAction=index;renderWindow(key);markChange('Action added');editVisualAction(s,action);
      }else if(payload.kind==='row'){
        const oldIndex=Number(payload.value);if(!Number.isInteger(oldIndex)||oldIndex<0||oldIndex>=actions.length)return;
        const [action]=actions.splice(oldIndex,1);if(index>oldIndex)index--;actions.splice(index,0,action);s.activeAction=index;renderWindow(key);markChange('Action reordered');
      }
    });
    $('#projectFile').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{const value=normalizeProject(JSON.parse(await file.text()));replaceProject(value);setStatus(`Opened ${file.name}`);}catch(error){showModal('Could not open project',`<p>${escapeHTML(error.message)}</p>`,[{label:'OK',value:true,primary:true}]);}event.target.value='';});
    $('#assetFile').addEventListener('change',async event=>{const file=event.target.files[0],target=assetTarget;event.target.value='';if(!file||!target)return;const r=getResource(target.type,target.id);if(!r)return;const reader=new FileReader();reader.onload=()=>{const data=String(reader.result);if(target.type==='sprites'){const img=new Image();img.onload=()=>{r.image=data;r.frames=[{image:data,width:img.naturalWidth,height:img.naturalHeight}];r.width=img.naturalWidth;r.height=img.naturalHeight;renderWindow(windowKey(target.type,target.id));markChange(`${r.name} image loaded`);};img.src=data;}else{r.data=data;renderWindow(windowKey(target.type,target.id));markChange(`${r.name} file loaded`);}};reader.readAsDataURL(file);});
    $('#closeGame').addEventListener('click',stopGame);$('#restartGame').addEventListener('click',()=>{stopGame();runGame();});
    wireGamePreviewDrag();
    $('#gameCanvas').addEventListener('pointerdown',event=>{
      if(!runtime)return;
      const rect=event.currentTarget.getBoundingClientRect(),x=(event.clientX-rect.left)*event.currentTarget.width/rect.width+(runtime.camera?.x||0),y=(event.clientY-rect.top)*event.currentTarget.height/rect.height+(runtime.camera?.y||0);
      runtime.game.mouseX=x;runtime.game.mouseY=y;
      runtime.instances.slice().forEach(inst=>{const size=runtimeInstanceSize(inst);if(x>=inst.x&&x<inst.x+size.w&&y>=inst.y&&y<inst.y+size.h)executeEvent(inst,'mouse_left',null,runtime.ctx,runtime.game);});
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'){if(document.querySelector('.asset-editor-overlay'))window.SpriteEditors.close();else if(runtime)stopGame();else if(!$('#modalOverlay').hidden){hideModal();modalResolve?.(false);modalResolve=null;}else closeMenus();return;}
      if(runtime)return;
      const typing=event.target.matches('input,textarea,select');
      if(event.key==='F5'){event.preventDefault();runGame();return;}
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();saveNow();setStatus('Saved in this browser');return;}
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='o'){event.preventDefault();$('#projectFile').click();return;}
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='n'){event.preventDefault();command('new');return;}
      if(event.key==='Delete'&&!typing){event.preventDefault();command('delete');}
    });
  }

  function wireGamePreviewDrag() {
    const overlay=$('#gameOverlay'),dialog=$('.game-dialog',overlay),bar=$('.game-dialog-bar',dialog);
    bar.addEventListener('pointerdown',event=>{
      if(event.target.closest('button') || (event.pointerType==='mouse' && event.button!==0))return;
      const overlayRect=overlay.getBoundingClientRect(),rect=dialog.getBoundingClientRect();
      const startX=event.clientX,startY=event.clientY,left=rect.left-overlayRect.left,top=rect.top-overlayRect.top;
      Object.assign(dialog.style,{position:'absolute',left:left+'px',top:top+'px'});
      bar.setPointerCapture(event.pointerId);
      const move=e=>{
        if(e.pointerId!==event.pointerId)return;
        dialog.style.left=Math.max(0,Math.min(overlay.clientWidth-dialog.offsetWidth,left+e.clientX-startX))+'px';
        dialog.style.top=Math.max(0,Math.min(overlay.clientHeight-dialog.offsetHeight,top+e.clientY-startY))+'px';
      };
      const end=e=>{
        if(e.pointerId!==event.pointerId)return;
        bar.removeEventListener('pointermove',move);
        bar.removeEventListener('pointerup',end);
        bar.removeEventListener('pointercancel',end);
      };
      bar.addEventListener('pointermove',move);
      bar.addEventListener('pointerup',end);
      bar.addEventListener('pointercancel',end);
    });
  }

  function showOptions() {
    const p=showModal('Game Options',`<label>Project name<input id="optionName" value="${escapeHTML(project.name)}"></label><label>Frames per second<input id="optionFps" type="number" min="1" max="120" value="${clamp(Number(project.options.fps)||60,1,120)}"></label>`,[{label:'Cancel',value:false},{label:'Save',value:true,primary:true}]);
    const name=$('#optionName'),fps=$('#optionFps');p.then(ok=>{if(!ok)return;project.name=name.value.trim()||'Untitled game';project.options.fps=clamp(Number(fps.value)||60,1,120);$('#projectName').textContent=project.name;document.title=`GameTsukuru JS — ${project.name}`;markChange('Game options saved');});
  }

  function imageFor(src) {if(!src)return null;if(!imageCache.has(src)){const img=new Image();img.src=src;imageCache.set(src,img);}return imageCache.get(src);}
  function keyIsDown(key) {
    if(!runtime)return false;
    const aliases={left:'ArrowLeft',right:'ArrowRight',up:'ArrowUp',down:'ArrowDown',space:'Space',a:'KeyA',b:'KeyB',d:'KeyD',w:'KeyW',s:'KeyS'};
    const code=aliases[String(key).toLowerCase()]||key;
    return runtime.keys.has(code)||runtime.controller.pressed(code);
  }
  function makeAPI(self,ctx,game) {
    return {
      keyboard_check:keyIsDown,
      instance_find(name){return runtime.instances.find(inst=>inst.objectName===name||inst.objectId===name)||null;},
      instance_create(x,y,name){const object=project.objects.find(o=>o.name===name||o.id===name);if(!object)return null;const inst={id:id(),objectId:object.id,objectName:object.name,x:Number(x)||0,y:Number(y)||0,image_angle:0,visible:true,startX:Number(x)||0,startY:Number(y)||0,hspeed:0,vspeed:0};runtime.instances.push(inst);executeEvent(inst,'create',null,ctx,game);return inst;},
      instance_destroy(target=self){runtime.instances=runtime.instances.filter(inst=>inst!==target);},
      place_meeting(x,y,name){return runtime.instances.some(inst=>{if(inst===self)return false;const o=project.objects.find(r=>r.id===inst.objectId);return (!name||o?.name===name)&&actionEngine.collides(self,inst,game,x,y);});},
      draw_self(){drawInstance(ctx,self);},
      draw_text(text,x,y,color='#ffffff'){ctx.fillStyle=color;ctx.font='16px Tahoma, sans-serif';ctx.fillText(String(text),Number(x)||0,Number(y)||0);},
      draw_rectangle(x,y,w,h,color='#ffffff'){ctx.fillStyle=color;ctx.fillRect(Number(x)||0,Number(y)||0,Number(w)||0,Number(h)||0);},
      play_sound(name,volume=100,repeat=false){if(game._audioStopped)return;const sound=project.sounds.find(s=>s.name===name||s.id===name);if(sound?.data)runtime.audio.play(sound.id,sound.data,volume,repeat);},
      stop_sound(name){if(!name){runtime.audio.stopAll();return;}const sound=project.sounds.find(s=>s.name===name||s.id===name);if(sound)runtime.audio.stop(sound.id);},
      room_goto(name){const room=project.rooms.find(r=>r.name===name);if(room)loadRoom(room,game,ctx);},
      path_start(name,speed=4,relative=true){actionEngine.startPath(self,{pathId:name,speed,relative});},
      path_stop(){self._pathState=null;}
    };
  }
  function executeEvent(inst,type,other,ctx,game) {
    const object=project.objects.find(o=>o.id===inst.objectId);
    for(const event of object?.events||[]){
      if(event.type!==type||!event.actions?.length||!runtime.instances.includes(inst))continue;
      const fromX=inst.x,fromY=inst.y;
      try { actionEngine(event,inst,other,makeAPI(inst,ctx,game),game); }
      catch(error){ $('#gameError').textContent=`${object.name} · ${type}: ${error.message}`; if(!runtime.errorShown){console.error(error);runtime.errorShown=true;} }
      finally { if(runtime.instances.includes(inst)&&actionEngine.resolveSolidMove(inst,fromX,fromY,runtime.instances,game))inst._pathState=null; }
    }
  }
  function drawInstance(ctx,inst) {
    const object=project.objects.find(o=>o.id===inst.objectId),sprite=instanceSprite(inst),frames=sprite?.frames||[],frame=frames.length?frames[Math.floor((runtime?.game.frame||0)/Math.max(1,60/(sprite.frameSpeed||8)))%frames.length]:null,img=imageFor(frame?.image||sprite?.image),size=runtimeInstanceSize(inst);
    ctx.save();ctx.globalAlpha=clamp(Number(object?.alpha??1),0,1);
    if(img?.complete&&img.naturalWidth){
      const x=inst.x-(sprite.originX||0),y=inst.y-(sprite.originY||0);
      if(Number(inst.image_xscale)<0){ctx.translate(x+size.w,0);ctx.scale(-1,1);ctx.drawImage(img,0,y,size.w,size.h);}
      else ctx.drawImage(img,x,y,size.w,size.h);
    }
    else {ctx.fillStyle=object?.solid?'#657482':object?.name==='object2'?'#edaa36':'#4c98d4';ctx.fillRect(inst.x,inst.y,size.w,size.h);ctx.strokeStyle='#274b68';ctx.strokeRect(inst.x+.5,inst.y+.5,size.w-1,size.h-1);}
    ctx.restore();
  }
  function loadRoom(room,game,ctx) {
    runtime.room=room;runtime.instances=room.instances.map(inst=>{const object=project.objects.find(o=>o.id===inst.objectId);return {...deepCopy(inst),objectName:object?.name||'',image_angle:0,visible:true,startX:inst.x,startY:inst.y,hspeed:0,vspeed:0};});
    runtime.activeCollisions=new WeakMap();
    game.width=room.width;game.height=room.height;game.room=room.name;
    runtime.camera=window.roomCamera(room,runtime.instances,viewCenter);
    game.viewX=runtime.camera.x;game.viewY=runtime.camera.y;game.viewWidth=runtime.camera.width;game.viewHeight=runtime.camera.height;
    const canvas=$('#gameCanvas');canvas.width=runtime.camera.width;canvas.height=runtime.camera.height;$('#gameRoomName').textContent=room.name;
    runtime.instances.slice().forEach(inst=>executeEvent(inst,'create',null,ctx,game));
  }
  function runGame() {
    if(runtime)return;
    const room=selected?.type==='rooms'?getResource('rooms',selected.id):project.rooms[0];
    if(!room){showModal('No room to run','<p>Create a room, add an object, and place it on the room canvas.</p>',[{label:'OK',value:true,primary:true}]);return;}
    const canvas=$('#gameCanvas'),ctx=canvas.getContext('2d');
    const game={score:0,width:room.width,height:room.height,room:room.name,frame:0,scripts:{},paths:{},timelines:{}};
    project.paths.forEach(path=>game.paths[path.name]=deepCopy(path.points||[]));
    project.timelines.forEach(t=>game.timelines[t.name]=deepCopy(t.steps||[]));
    project.scripts.forEach(script=>{try{const fn=new Function('return ('+script.code+')')();if(typeof fn==='function')game.scripts[script.name]=fn;}catch(error){console.warn(`Script ${script.name}:`,error.message);$('#gameError').textContent=`Script ${script.name}: ${error.message}`;}});
    runtime={room,ctx,game,instances:[],keys:new Set(),controller:window.createTouchControls($('#on_screen_controls'),project,canvas),audio:window.createGameAudio(),activeCollisions:new WeakMap(),raf:0,lastTime:0,accumulator:0,errorShown:false};
    runtime.keydown=e=>{runtime?.keys.add(e.code);if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();};
    runtime.keyup=e=>runtime?.keys.delete(e.code);
    window.addEventListener('keydown',runtime.keydown);window.addEventListener('keyup',runtime.keyup);
    $('#gameError').textContent='';$('#gameOverlay').hidden=false;
    loadRoom(room,game,ctx);canvas.focus();
    const frame=timestamp=>{
      if(!runtime)return;
      const rt=runtime;
      if(!rt.lastTime)rt.lastTime=timestamp;
      rt.accumulator+=Math.min(100,timestamp-rt.lastTime);rt.lastTime=timestamp;
      const stepMs=1000/clamp(Number(project.options.fps)||60,1,120);
      let steps=0;
      while(rt.accumulator>=stepMs&&steps<4){tick(rt);rt.accumulator-=stepMs;steps++;}
      paint(rt);rt.raf=requestAnimationFrame(frame);
    };
    runtime.raf=requestAnimationFrame(frame);setStatus(`Running ${room.name}`);
  }
  function tick(rt) {
    if(rt.game.paused)return;
    rt.game.frame++;
    const snapshot=rt.instances.slice();
    snapshot.forEach(inst=>{if(!rt.instances.includes(inst))return;const fromX=inst.x,fromY=inst.y;actionEngine.advancePath(inst);if(actionEngine.resolveSolidMove(inst,fromX,fromY,rt.instances,rt.game))inst._pathState=null;executeEvent(inst,'step',null,rt.ctx,rt.game);if(keyIsDown('left')||keyIsDown('a'))executeEvent(inst,'keyboard_left',null,rt.ctx,rt.game);if(keyIsDown('right')||keyIsDown('d'))executeEvent(inst,'keyboard_right',null,rt.ctx,rt.game);if(keyIsDown('up')||keyIsDown('w'))executeEvent(inst,'keyboard_up',null,rt.ctx,rt.game);if(keyIsDown('down')||keyIsDown('s'))executeEvent(inst,'keyboard_down',null,rt.ctx,rt.game);if(keyIsDown('space'))executeEvent(inst,'keyboard_space',null,rt.ctx,rt.game);if(keyIsDown('b'))executeEvent(inst,'keyboard_b',null,rt.ctx,rt.game);});
    const bodies=rt.instances.map(inst=>({inst,rect:actionEngine.bounds(inst,rt.game),hasEvent:project.objects.find(o=>o.id===inst.objectId)?.events?.some(e=>e.type==='collision')}));
    const activeCollisions=new WeakMap();
    for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
      const a=bodies[i],b=bodies[j],ar=a.rect,br=b.rect;
      if(!(a.hasEvent||b.hasEvent)||ar.x>=br.x+br.w||ar.x+ar.w<=br.x||ar.y>=br.y+br.h||ar.y+ar.h<=br.y)continue;
      if(!rt.instances.includes(a.inst)||!rt.instances.includes(b.inst)||!actionEngine.collides(a.inst,b.inst,rt.game))continue;
      if(!rt.activeCollisions.get(a.inst)?.has(b.inst)){
        executeEvent(a.inst,'collision',b.inst,rt.ctx,rt.game);
        if(rt.instances.includes(b.inst))executeEvent(b.inst,'collision',a.inst,rt.ctx,rt.game);
      }
      a.rect=actionEngine.bounds(a.inst,rt.game);b.rect=actionEngine.bounds(b.inst,rt.game);
      if(rt.instances.includes(a.inst)&&rt.instances.includes(b.inst)&&actionEngine.collides(a.inst,b.inst,rt.game)){
        if(!activeCollisions.has(a.inst))activeCollisions.set(a.inst,new WeakSet());
        activeCollisions.get(a.inst).add(b.inst);
      }
    }
    rt.activeCollisions=activeCollisions;
  }
  function paint(rt) {
    const {ctx,room,game}=rt,canvas=ctx.canvas;
    rt.camera=window.roomCamera(room,rt.instances,viewCenter,rt.camera);
    game.viewX=rt.camera.x;game.viewY=rt.camera.y;game.viewWidth=rt.camera.width;game.viewHeight=rt.camera.height;
    ctx.fillStyle=room.background||'#d0d0d0';ctx.fillRect(0,0,canvas.width,canvas.height);
    const bg=getResource('backgrounds',room.backgroundId),img=imageFor(bg?.data);
    if(img?.complete&&img.naturalWidth)ctx.drawImage(img,rt.camera.x/game.width*img.naturalWidth,rt.camera.y/game.height*img.naturalHeight,canvas.width/game.width*img.naturalWidth,canvas.height/game.height*img.naturalHeight,0,0,canvas.width,canvas.height);
    ctx.save();ctx.translate(-rt.camera.x,-rt.camera.y);
    const ordered=rt.instances.slice().sort((a,b)=>(project.objects.find(o=>o.id===b.objectId)?.depth||0)-(project.objects.find(o=>o.id===a.objectId)?.depth||0));
    ordered.forEach(inst=>{const object=project.objects.find(o=>o.id===inst.objectId);if(!object?.visible||inst.visible===false)return;if(object.events?.some(e=>e.type==='draw'))executeEvent(inst,'draw',null,ctx,game);else drawInstance(ctx,inst);});
    ctx.restore();
    ctx.fillStyle='#183348';ctx.font='14px Tahoma, sans-serif';ctx.fillText(`Score: ${game.score}`,12,20);
    if(game.message&&game.frame<(game.messageUntil||0)){ctx.fillStyle='#172333dd';ctx.fillRect(8,canvas.height-42,Math.min(canvas.width-16,420),32);ctx.fillStyle='#fff';ctx.fillText(game.message,16,canvas.height-20);}
    if((game.gameOver||game.win||game.terminated)&&!game._audioStopped){rt.audio.stopAll();game._audioStopped=true;}
    rt.controller.update(game.touchControls);
    if(game.controlChoice)rt.controller.showChoice(mode=>{
      const choice=game.controlChoice;if(!choice)return;
      game.controlChoice=null;
      game.paused=false;
      const owner=rt.instances.find(inst=>inst.id===choice.instanceId);
      if(owner)executeEvent(owner,mode==='touch'?'touch_controls_selected':'keyboard_controls_selected',null,ctx,game);
      rt.controller.hideChoice();rt.controller.update(game.touchControls);
    });
    else rt.controller.hideChoice();
  }
  function stopGame() {if(!runtime)return;cancelAnimationFrame(runtime.raf);window.removeEventListener('keydown',runtime.keydown);window.removeEventListener('keyup',runtime.keyup);runtime.controller.reset();runtime.audio.dispose();runtime=null;$('#gameOverlay').hidden=true;Object.assign($('.game-dialog').style,{position:'',left:'',top:''});setStatus('Game stopped');}

  initialize();
})();
