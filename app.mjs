import {parseDump,toJSON,pathFor} from './parser.mjs';
const $=id=>document.getElementById(id), el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
let roots=[],json='',timer,view='tree';
const example='object(Demo\\User)#7 (3) {\n  ["name"]=>\n  string(4) "Mira"\n  ["active":protected]=>\n  bool(true)\n  ["tags"]=>\n  array(2) {\n    [0]=>\n    string(3) "tea"\n    [1]=>\n    string(4) "code"\n  }\n}\nint(42)';
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(timer);timer=setTimeout(()=>$('toast').classList.remove('show'),3500);}
async function copy(text){try{await navigator.clipboard.writeText(text);toast('Copied.');}catch{toast('Clipboard blocked. Select the text to copy manually.');}}
function copyButton(path){const b=el('button','path-copy','path');b.title='Copy '+path;b.setAttribute('aria-label','Copy path '+path);b.onclick=e=>{e.preventDefault();e.stopPropagation();copy(path);};return b;}
const visible=n=>!$('hide').checked||!n.visibility||n.visibility==='public';
const label=n=>n.children?n.type+(n.className?' '+n.className+' #'+n.id:'')+' · '+n.children.length:n.type+(n.id?' #'+n.id:'');
function matches(n,q){return String(n.key??'').toLowerCase().includes(q)||String(n.value??'').toLowerCase().includes(q)||String(n.className??'').toLowerCase().includes(q)||n.children?.some(c=>visible(c)&&matches(c,q));}
function node(n,key,path,depth=0,force=false){
 const q=$('search').value.toLowerCase(),self=force||!q||String(key).toLowerCase().includes(q)||String(n.value??'').toLowerCase().includes(q)||String(n.className??'').toLowerCase().includes(q);
 if(!visible(n)||(!self&&!matches(n,q)))return null;
 let row,root;
 if(n.children){root=el('details','node');root.open=!!q||depth<2;row=el('summary');root.append(row);}
 else root=row=el('div','leaf');
 row.append(el('span','key',key));
 if(!n.children)row.append(el('span','val',JSON.stringify(n.value)));
 row.append(el('span','node-count',label(n)));
 if(n.visibility&&n.visibility!=='public')row.append(el('span','visibility',n.visibility+(n.owner?' · '+n.owner:'')));
 row.append(copyButton(path));
 if(n.children){const b=el('div','branch');for(const c of n.children){const child=node(c,typeof c.key==='number'?'['+c.key+']':c.key,pathFor(path,c,n.type==='object'),depth+1,self);if(child)b.append(child);}root.append(b);}
 return root;
}
function render(){
 $('tree').replaceChildren();$('flat').replaceChildren();
 const base=/^\$[a-zA-Z_]\w*$/.test($('root-name').value)?$('root-name').value:'$x';
 roots.forEach((n,i)=>{const path=roots.length===1?base:base+(i+1);const item=node(n,path,path);if(item)$('tree').append(item);});
 if(!roots.length)$('tree').append(el('div','empty-state','Paste a PHP dump to see its structure.'));
 else if(!$('tree').childElementCount)$('tree').append(el('div','empty-state','No matching values.'));
 const table=el('table'),tr=el('tr');tr.append(el('th','','Path'),el('th','','Value / type'));const head=el('thead');head.append(tr);table.append(head);const body=el('tbody'),q=$('search').value.toLowerCase();
 function flat(n,path){if(!visible(n))return;if(!q||path.toLowerCase().includes(q)||String(n.value??'').toLowerCase().includes(q)){const r=el('tr'),a=el('td','',path);a.append(copyButton(path));r.append(a,el('td','',(n.children?'':JSON.stringify(n.value)+' · ')+label(n)));body.append(r);}for(const c of n.children||[])flat(c,pathFor(path,c,n.type==='object'));}
 roots.forEach((n,i)=>flat(n,roots.length===1?base:base+(i+1)));table.append(body);$('flat').append(table);
 json=JSON.stringify(roots.length===1?toJSON(roots[0],$('hide').checked):roots.map(n=>toJSON(n,$('hide').checked)),null,2);$('json').textContent=json;
}
function parse(){
 $('characters').textContent=$('source').value.length.toLocaleString()+' characters';
 try{roots=parseDump($('source').value);$('error').hidden=true;$('count').textContent=roots.length+' '+(roots.length===1?'root':'roots');$('copy').disabled=$('export').disabled=false;render();}
 catch(e){roots=[];json='';$('error').textContent=e.message;$('error').hidden=false;$('count').textContent='Cannot parse';for(const id of ['tree','flat','json'])$(id).replaceChildren();$('copy').disabled=$('export').disabled=true;}
}
$('source').addEventListener('input',parse);for(const id of ['search','root-name'])$(id).addEventListener('input',render);$('hide').onchange=render;
$('example').onclick=()=>{$('source').value=example;parse();};
$('clear').onclick=()=>{$('source').value='';parse();history.replaceState(null,'',location.pathname);};
$('copy').onclick=()=>copy(json);
$('export').onclick=()=>{const blob=new Blob([json],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='dump.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('share').onclick=()=>{const hash='#d='+encodeURIComponent($('source').value);if(hash.length>64000)return toast('Too large for a share link. Export JSON instead.');history.replaceState(null,'',hash);copy(location.href);toast('Full dump is in this link, including hidden properties.');};
for(const v of ['tree','flat','json'])$('tab-'+v).onclick=()=>{view=v;for(const k of ['tree','flat','json']){$(k).hidden=k!==v;$('tab-'+k).setAttribute('aria-selected',String(k===v));$('tab-'+k).tabIndex=k===v?0:-1;}$('expand-tools').hidden=v!=='tree';};
$('expand').onclick=()=>document.querySelectorAll('#tree details').forEach(n=>n.open=true);
$('collapse').onclick=()=>document.querySelectorAll('#tree details').forEach(n=>n.open=false);
document.querySelector('[role=tablist]').addEventListener('keydown',e=>{const keys=['tree','flat','json'];if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();let i=e.key==='Home'?0:e.key==='End'?2:(keys.indexOf(view)+(e.key==='ArrowRight'?1:2))%3;$('tab-'+keys[i]).click();$('tab-'+keys[i]).focus();});
function theme(t){document.documentElement.dataset.theme=t;$('theme').textContent=t==='dark'?'Light mode':'Dark mode';}
try{theme(localStorage.getItem('paramtree-theme')||'dark');}catch{theme('dark');}
$('theme').onclick=()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';theme(t);try{localStorage.setItem('paramtree-theme',t);}catch{}};
function hash(){try{$('source').value=new URLSearchParams(location.hash.slice(1)).get('d')||'';parse();}catch{toast('Malformed share link.');}}
window.addEventListener('hashchange',hash);hash();
