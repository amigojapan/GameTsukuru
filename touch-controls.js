(() => {
  'use strict';

  // Self-contained so the HTML exporter can include the same controller.
  window.createTouchControls = function createTouchControls(container, project, canvas) {
    const layout = [
      ['a','A','Space','aSpriteId','A'],
      ['up','Up','ArrowUp','upSpriteId','↑'],
      ['b','B','KeyB','bSpriteId','B'],
      ['left','Left','ArrowLeft','leftSpriteId','←'],
      ['down','Down','ArrowDown','downSpriteId','↓'],
      ['right','Right','ArrowRight','rightSpriteId','→']
    ];
    const active = new Map();
    const images = new Map();
    let lastConfig = '';
    let onChoice = null;

    const choice=document.createElement('div');
    choice.className='control-choice';choice.hidden=true;
    choice.setAttribute('role','dialog');choice.setAttribute('aria-label','Choose controls');
    const choicePanel=document.createElement('div');choicePanel.className='control-choice-panel';
    const choiceTitle=document.createElement('div');choiceTitle.className='control-choice-title';choiceTitle.textContent='CHOOSE CONTROLS';
    choicePanel.appendChild(choiceTitle);
    let firstChoiceButton=null;
    for(const [mode,label] of [['arrows','ARROW KEYS'],['touch','TOUCH CONTROLS']]){
      const button=document.createElement('button');button.type='button';button.className='control-choice-button';
      button.dataset.choice=mode;button.textContent=label;
      if(!firstChoiceButton)firstChoiceButton=button;
      button.addEventListener('click',()=>{
        if(!onChoice)return;
        const callback=onChoice;onChoice=null;choice.hidden=true;callback(mode);
      });
      choicePanel.appendChild(button);
    }
    choice.appendChild(choicePanel);
    container.parentElement?.appendChild(choice);

    container.textContent='';
    const hasTouchEvents='ontouchstart' in window;
    layout.forEach(([role,label,key]) => {
      const button=document.createElement('button');
      button.type='button';button.id='btn'+label;button.className='touch-control';
      button.dataset.control=role;button.setAttribute('aria-label',label==='A'?'A / Space':label);
      const image=document.createElement('img');image.alt='';image.draggable=false;
      const fallback=document.createElement('span');fallback.className='touch-control-fallback';fallback.textContent=layout.find(item=>item[0]===role)[4];
      button.appendChild(image);button.appendChild(fallback);container.appendChild(button);images.set(role,{image,fallback});
      button.addEventListener('pointerdown',event=>{
        if(event.pointerType==='touch'&&hasTouchEvents)return;
        if(event.pointerType==='mouse'&&event.button!==0)return;
        event.preventDefault();
        active.set('pointer:'+event.pointerId,key);
        try {button.setPointerCapture?.(event.pointerId);} catch {}
      });
      const releasePointer=event=>active.delete('pointer:'+event.pointerId);
      button.addEventListener('pointerup',releasePointer);
      button.addEventListener('pointercancel',releasePointer);
      button.addEventListener('lostpointercapture',releasePointer);
      button.addEventListener('touchstart',event=>{
        event.preventDefault();
        for(let i=0;i<event.changedTouches.length;i++)active.set('touch:'+event.changedTouches[i].identifier,key);
      },{passive:false});
      const releaseTouch=event=>{
        event.preventDefault();
        for(let i=0;i<event.changedTouches.length;i++)active.delete('touch:'+event.changedTouches[i].identifier);
      };
      button.addEventListener('touchend',releaseTouch,{passive:false});
      button.addEventListener('touchcancel',releaseTouch,{passive:false});
      button.addEventListener('touchmove',event=>event.preventDefault(),{passive:false});
    });
    container.addEventListener('contextmenu',event=>event.preventDefault());

    return {
      pressed(key) {return [...active.values()].includes(key);},
      showChoice(callback) {onChoice=callback;if(choice.hidden){choice.hidden=false;firstChoiceButton.focus?.();}},
      hideChoice() {choice.hidden=true;onChoice=null;},
      update(config) {
        if(!config){container.hidden=true;active.clear();lastConfig='';return;}
        container.hidden=false;
        const scaleX=(canvas.clientWidth||canvas.width||1)/(canvas.width||1);
        const scaleY=(canvas.clientHeight||canvas.height||1)/(canvas.height||1);
        const x=Number(config.x),y=Number(config.y);
        container.style.left=`${(Number.isFinite(x)?x:0)*scaleX}px`;
        container.style.top=`${(Number.isFinite(y)?y:0)*scaleY}px`;
        container.style.transform=`scale(${scaleX}, ${scaleY})`;
        const signature=layout.map(([, , ,field])=>config[field]||'').join('|');
        if(signature===lastConfig)return;
        lastConfig=signature;
        layout.forEach(([role,, ,field])=>{
          const sprite=(project.sprites||[]).find(item=>item.id===config[field]);
          const source=sprite?.frames?.[0]?.image||sprite?.image||'';
          const {image,fallback}=images.get(role);
          image.hidden=!source;fallback.hidden=!!source;
          if(source)image.src=source;else image.removeAttribute('src');
        });
      },
      reset() {container.hidden=true;active.clear();lastConfig='';choice.hidden=true;onChoice=null;}
    };
  };
})();
