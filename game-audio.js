(() => {
  'use strict';

  // Kept self-contained so the HTML exporter can embed the same audio behavior.
  window.createGameAudio = function createGameAudio() {
    const loops = new Map();
    const oneShots = new Map();
    const pending = new Set();
    const inFlight = new Set();
    const level = value => Math.max(0,Math.min(100,Number.isFinite(Number(value))?Number(value):100))/100;
    const sourceFor = data => String(data).replace(/^data:audio\/(?:vnd\.wave|x-wav|wave)(?=[;,])/i,'data:audio/wav');

    function attempt(audio, loopId = null) {
      if(inFlight.has(audio))return;
      const stillLoop=()=>loopId!==null&&loops.get(loopId)===audio;
      try {
        const result=audio.play();
        if(result&&typeof result.then==='function'){
          inFlight.add(audio);
          result.then(
            ()=>{inFlight.delete(audio);pending.delete(audio);},
            ()=>{inFlight.delete(audio);if(stillLoop())pending.add(audio);else oneShots.delete(audio);}
          );
        }else pending.delete(audio);
      }catch{
        if(stillLoop())pending.add(audio);
        else oneShots.delete(audio);
      }
    }

    function retryPending() {
      for(const [id,audio] of loops){
        if(!pending.has(audio))continue;
        pending.delete(audio);
        attempt(audio,id);
      }
    }
    window.addEventListener('pointerdown',retryPending,true);
    window.addEventListener('touchstart',retryPending,true);
    window.addEventListener('keydown',retryPending,true);

    function rewind(audio) {
      audio.pause();
      try {audio.currentTime=0;} catch {}
    }

    function stop(id) {
      const loop=loops.get(id);
      if(loop){loops.delete(id);pending.delete(loop);inFlight.delete(loop);rewind(loop);}
      for(const [audio,soundId] of oneShots){
        if(soundId!==id)continue;
        oneShots.delete(audio);inFlight.delete(audio);rewind(audio);
      }
    }

    function stopAll() {
      for(const audio of [...loops.values(),...oneShots.keys()])rewind(audio);
      loops.clear();oneShots.clear();pending.clear();inFlight.clear();
    }

    return {
      play(id,data,volume=100,repeat=false) {
        if(!data)return null;
        if(repeat){
          let audio=loops.get(id);
          if(!audio){audio=new Audio(sourceFor(data));audio.loop=true;loops.set(id,audio);}
          audio.volume=level(volume);
          if(audio.paused&&!pending.has(audio))attempt(audio,id);
          return audio;
        }
        const audio=new Audio(sourceFor(data));
        audio.volume=level(volume);
        oneShots.set(audio,id);
        audio.addEventListener('ended',()=>oneShots.delete(audio),{once:true});
        attempt(audio);
        return audio;
      },
      stop,
      stopAll,
      dispose() {
        stopAll();
        window.removeEventListener('pointerdown',retryPending,true);
        window.removeEventListener('touchstart',retryPending,true);
        window.removeEventListener('keydown',retryPending,true);
      }
    };
  };
})();
