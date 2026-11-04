// A bounded recursive-descent reader. Input is data, never executable code.
const enc=new TextEncoder();
export function parseDump(source){
 if(source.length>1000000)throw Error('Line 1: input exceeds 1,000,000 characters.');
 let p=0,count=0;
 const fail=m=>{throw Error('Line '+(source.slice(0,p).split('\n').length)+': '+m);};
 const ws=()=>{while(/\s/.test(source[p]||'')&&p<source.length)p++;};
 const match=re=>{ws();const m=re.exec(source.slice(p));if(m)p+=m[0].length;return m;};
 const take=t=>{ws();if(!source.startsWith(t,p))fail('Expected '+JSON.stringify(t));p+=t.length;};
 function value(depth=0){
  ws();if(depth>100)fail('Nesting exceeds 100 levels.');if(++count>20000)fail('Too many values (limit 20,000).');
  match(/^&/);
  let m;
  if(m=match(/^string\((\d+)\)\s*"/)){
   const n=Number(m[1]),start=p;let bytes=0;
   while(bytes<n&&p<source.length){const c=String.fromCodePoint(source.codePointAt(p));bytes+=enc.encode(c).length;p+=c.length;}
   if(bytes!==n||source[p]!=='"')fail('String byte length does not match string('+n+'). Paste the original plain-text dump.');
   const v=source.slice(start,p++);return {type:'string',value:v,length:n};
  }
  if(m=match(/^(array)\((\d+)\)\s*\{/))return children({type:'array',size:+m[2]},depth);
  if(m=match(/^object\(([^)]+)\)#(\d+)\s*\((\d+)\)\s*\{/))return children({type:'object',className:m[1],id:m[2],size:+m[3]},depth);
  if(m=match(/^int\((-?\d+)\)/)){const raw=m[1];return {type:'int',value:Number.isSafeInteger(Number(raw))?Number(raw):raw};}
  if(m=match(/^float\(([-+\d.eE]+|NAN|-?INF)\)/)){const n=Number(m[1]);if(!Number.isFinite(n)&&!['NAN','INF','-INF'].includes(m[1]))fail('Invalid float.');return {type:'float',value:Number.isFinite(n)?n:m[1]};}
  if(m=match(/^bool\((true|false)\)/))return {type:'bool',value:m[1]==='true'};
  if(match(/^NULL\b/))return {type:'null',value:null};
  if(match(/^\*RECURSION\*/))return {type:'recursion',value:'*RECURSION*'};
  if(m=match(/^enum\(([^)]+)\)/))return {type:'enum',value:m[1]};
  if(m=match(/^resource\((\d+)\) of type \(([^)]+)\)/))return {type:'resource',id:m[1],value:m[2]};
  if(m=match(/^uninitialized\(([^)]+)\)/))return {type:'uninitialized',value:m[1]};
  fail('Expected a var_dump value near '+JSON.stringify(source.slice(p,p+45)));
 }
 function children(node,depth){
  node.children=[];ws();
  while(source[p]!=='}'){
   if(p>=source.length)fail('Unclosed '+node.type+'.');
   take('[');ws();let key,visibility='public',owner;
   if(source[p]==='"'){
    p++;let end=source.indexOf('"',p);if(end<0)fail('Unclosed property name.');key=source.slice(p,end);p=end+1;ws();
    if(source[p]===':'){
     p++;ws();
     if(source[p]==='"'){p++;end=source.indexOf('"',p);if(end<0)fail('Unclosed class name.');owner=source.slice(p,end);p=end+1;take(':');}
     const v=match(/^(protected|private|public)/);if(!v)fail('Expected visibility.');visibility=v[1];
    }
   }else{const k=match(/^-?\d+/);if(!k)fail('Expected array key.');key=Number(k[0]);}
   take(']');take('=>');const child=value(depth+1);node.children.push({...child,key,visibility,...(owner?{owner}:{})});ws();
  }
  p++;if(node.children.length!==node.size)fail('Declared '+node.size+' entries but found '+node.children.length+'.');return node;
 }
 const roots=[];ws();while(p<source.length){roots.push(value());ws();}return roots;
}
export function toJSON(node,hide=false){
 if(node.children){
  const children=node.children.filter(n=>!hide||n.visibility==='public');
  if(node.type==='array'&&children.every((n,i)=>n.key===i))return children.map(n=>toJSON(n,hide));
  const out=Object.create(null);for(const n of children)out[n.key]=toJSON(n,hide);return out;
 }
 return node.value;
}
export function pathFor(parent,node,isObject){return isObject?parent+(/^[a-zA-Z_][\w]*$/.test(node.key)?'->'+node.key:'->{'+JSON.stringify(node.key)+'}'):parent+'['+(typeof node.key==='number'?node.key:"'"+node.key.replaceAll('\\','\\\\').replaceAll("'","\\'")+"'")+']';}
