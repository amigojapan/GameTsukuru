(() => {
  'use strict';

  const keywords = new Set('async await break case catch class const continue debugger default delete do else export extends finally for from function get if import in instanceof let new of return set static super switch throw try typeof var void while with yield'.split(' '));
  const literals = new Set(['true','false','null','undefined','NaN','Infinity']);
  const gameNames = new Set(['self','other','game','api']);
  const builtins = new Set(['Array','Boolean','Date','Error','JSON','Map','Math','Number','Object','Promise','Set','String','console','parseFloat','parseInt']);
  const escape = text => text.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const span = (kind, text) => `<span class="js-${kind}">${escape(text)}</span>`;
  const numberPattern=/(?:0[xX][0-9a-fA-F]+|0[bB][01]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/y;
  const identifierPattern=/[A-Za-z_$][A-Za-z0-9_$]*/y;

  function highlight(source) {
    let result='',index=0;
    while(index<source.length) {
      if(source.startsWith('//',index)) {
        const end=source.indexOf('\n',index),stop=end<0?source.length:end;
        result+=span('comment',source.slice(index,stop));index=stop;continue;
      }
      if(source.startsWith('/*',index)) {
        const end=source.indexOf('*/',index+2),stop=end<0?source.length:end+2;
        result+=span('comment',source.slice(index,stop));index=stop;continue;
      }
      const quote=source[index];
      if(quote==='"'||quote==="'"||quote==='`') {
        let stop=index+1;
        while(stop<source.length) {
          if(source[stop]==='\\'){stop+=2;continue;}
          if(source[stop]===quote){stop++;break;}
          stop++;
        }
        result+=span('string',source.slice(index,stop));index=stop;continue;
      }
      numberPattern.lastIndex=index;
      const number=numberPattern.exec(source);
      if(number){result+=span('number',number[0]);index+=number[0].length;continue;}
      identifierPattern.lastIndex=index;
      const identifier=identifierPattern.exec(source);
      if(identifier){
        const word=identifier[0];let after=index+word.length;while(/\s/.test(source[after]||''))after++;
        const kind=keywords.has(word)?'keyword':literals.has(word)?'literal':gameNames.has(word)?'game':builtins.has(word)?'builtin':source[after]==='('?'function':null;
        result+=kind?span(kind,word):escape(word);index+=word.length;continue;
      }
      result+=escape(source[index]);index++;
    }
    return result+'\n';
  }

  function attach(root) {
    const input=root.querySelector('.js-editor-input'),mirror=root.querySelector('.js-highlight');
    if(!input||!mirror)return;
    const update=()=>{mirror.innerHTML=highlight(input.value);mirror.scrollTop=input.scrollTop;mirror.scrollLeft=input.scrollLeft;};
    input.addEventListener('input',update);
    input.addEventListener('scroll',()=>{mirror.scrollTop=input.scrollTop;mirror.scrollLeft=input.scrollLeft;});
    update();
  }
  window.JSSyntax={highlight,attach};
})();
