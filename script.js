const canvas = new fabric.Canvas('editorCanvas',{preserveObjectStacking:true,selection:true});
let zoom=1, history=[], future=[], restoring=false;

function saveState(){
  if(restoring)return;
  const s=JSON.stringify(canvas.toJSON());
  if(history[history.length-1]!==s){history.push(s);if(history.length>30)history.shift();future=[];}
}
function restore(s){
  restoring=true;
  canvas.loadFromJSON(JSON.parse(s),()=>{canvas.renderAll();syncControls();restoring=false;});
}
canvas.on('object:modified',saveState);
canvas.on('object:added',()=>{if(!restoring)saveState();});
saveState();

const input=document.getElementById('imageInput');
input.onchange=e=>{
  const file=e.target.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>fabric.Image.fromURL(ev.target.result,img=>{
    const max=900, scale=Math.min(max/img.width,max/img.height,1);
    img.set({left:canvas.getWidth()/2,top:canvas.getHeight()/2,originX:'center',originY:'center',scaleX:scale,scaleY:scale});
    canvas.add(img);canvas.setActiveObject(img);canvas.renderAll();saveState();status('Image added');
  });
  reader.readAsDataURL(file);
  input.value='';
};

document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{
 const t=b.dataset.tool;
 if(t==='text'){const o=new fabric.IText('Double click to edit',{left:150,top:150,fill:'#111',fontSize:50,fontFamily:'Arial'});canvas.add(o);canvas.setActiveObject(o);}
 if(t==='rect'){const o=new fabric.Rect({left:150,top:150,width:220,height:140,fill:'#ff7a00'});canvas.add(o);canvas.setActiveObject(o);}
 if(t==='circle'){const o=new fabric.Circle({left:150,top:150,radius:80,fill:'#2563eb'});canvas.add(o);canvas.setActiveObject(o);}
 if(t==='line'){const o=new fabric.Line([100,100,350,100],{stroke:'#111',strokeWidth:8});canvas.add(o);canvas.setActiveObject(o);}
 canvas.renderAll();saveState();
});
document.getElementById('delete').onclick=()=>{const o=canvas.getActiveObject();if(o){canvas.remove(o);saveState();}};
document.getElementById('undo').onclick=()=>{if(history.length>1){future.push(history.pop());restore(history[history.length-1]);}};
document.getElementById('redo').onclick=()=>{if(future.length){const s=future.pop();history.push(s);restore(s);}};
document.getElementById('bringFront').onclick=()=>{const o=canvas.getActiveObject();if(o){canvas.bringToFront(o);saveState();}};
document.getElementById('sendBack').onclick=()=>{const o=canvas.getActiveObject();if(o){canvas.sendToBack(o);saveState();}};

function syncControls(){
 const o=canvas.getActiveObject(); if(!o)return;
 document.getElementById('opacity').value=o.opacity??1;
 document.getElementById('rotation').value=o.angle||0;
 if(o.fill && typeof o.fill==='string' && o.fill.startsWith('#'))document.getElementById('color').value=o.fill;
 if(o.fontSize)document.getElementById('fontSize').value=o.fontSize;
}
canvas.on('selection:created',syncControls);canvas.on('selection:updated',syncControls);canvas.on('selection:cleared',()=>{});
document.getElementById('opacity').oninput=e=>{const o=canvas.getActiveObject();if(o){o.set('opacity',+e.target.value);canvas.renderAll();}};
document.getElementById('rotation').oninput=e=>{const o=canvas.getActiveObject();if(o){o.rotate(+e.target.value);canvas.renderAll();}};
document.getElementById('color').oninput=e=>{const o=canvas.getActiveObject();if(o){if(o.type==='line')o.set('stroke',e.target.value);else o.set('fill',e.target.value);canvas.renderAll();}};
document.getElementById('fontSize').oninput=e=>{const o=canvas.getActiveObject();if(o&&o.type==='i-text'){o.set('fontSize',+e.target.value);canvas.renderAll();}};

document.getElementById('resizeCanvas').onclick=()=>{
 const w=Math.max(100,+document.getElementById('canvasW').value||1200),h=Math.max(100,+document.getElementById('canvasH').value||800);
 canvas.setDimensions({width:w,height:h});canvas.renderAll();saveState();status(`Canvas ${w} × ${h}`);
};
document.getElementById('clearCanvas').onclick=()=>{if(confirm('Clear all objects?')){canvas.clear();canvas.setBackgroundColor('#fff',canvas.renderAll.bind(canvas));saveState();}};
document.getElementById('download').onclick=()=>{
 const a=document.createElement('a');a.download='jk-editor-design.png';a.href=canvas.toDataURL({format:'png',multiplier:2});a.click();status('PNG exported');
};
function applyZoom(){canvas.setZoom(zoom);document.getElementById('zoomValue').textContent=Math.round(zoom*100)+'%';}
document.getElementById('zoomIn').onclick=()=>{zoom=Math.min(3,zoom+.1);applyZoom()};
document.getElementById('zoomOut').onclick=()=>{zoom=Math.max(.2,zoom-.1);applyZoom()};
document.getElementById('fit').onclick=()=>{
 const wrap=document.getElementById('canvasWrap'),z=Math.min((wrap.clientWidth-60)/canvas.getWidth(),(wrap.clientHeight-60)/canvas.getHeight(),1);
 zoom=Math.max(.2,z);applyZoom();
};
function status(t){document.getElementById('status').textContent=t}
canvas.backgroundColor='#fff';canvas.renderAll();
window.addEventListener('resize',()=>document.getElementById('fit').click());
setTimeout(()=>document.getElementById('fit').click(),100);
