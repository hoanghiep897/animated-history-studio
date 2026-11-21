import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {EffectComposer} from '@react-three/postprocessing';
import {BloomEffect, ToneMappingEffect, ToneMappingMode, BlendFunction} from 'postprocessing';
import {bodyFront, Pen, type Outfit} from '../../../upstream/bridge/toon';
import {InkPass, NOINK} from '../../../upstream/bridge/ink';
import {GradeEffect, GRADES} from '../../../upstream/bridge/grade';
import {twoTone} from '../../../upstream/bridge/shade';

/**
 * BACH DANG 938 — entirely new original story and scene, built on the
 * actual mromidev/claude-animated-shorts actor / outline / grade engine.
 * 2D ink-drawn animated characters live on moving 3D warships.
 * Water genuinely recedes while fixed stakes emerge; enemy boats collide.
 *
 * Explicitly avoid the old Pompeii compositing problems:
 * - Characters are hard alpha-tested CUTOUTS with depthWrite, opacity 1.
 * - Saturated physically separate foreground/midground shapes.
 * - LensBlur omitted: it blacked out the prior scene under software WebGL.
 */
export const FPS = 25;
export const DURATION = 48;
const ss=(x:number)=>{const v=Math.max(0,Math.min(1,x));return v*v*(3-2*v)};
const lim=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const rand=(i:number)=>{const x=Math.sin(i*170.731+938.131)*43758.545;return x-Math.floor(x)};
const vec=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);

const paint=(hex:string)=>twoTone(new THREE.MeshLambertMaterial({color:hex}));
const solid=(hex:string)=>new THREE.MeshLambertMaterial({color:hex,flatShading:true});
const MAT={
 earth:paint('#665642'), banks:paint('#536b3e'), grass:paint('#416542'),
 water:new THREE.MeshPhongMaterial({color:'#1b576a',shininess:68,specular:'#538b91',flatShading:true}),
 waterDeep:solid('#103847'),
 current:new THREE.MeshBasicMaterial({color:'#83c5c3',transparent:true,opacity:.34,depthWrite:false}),
 wood:paint('#70442d'),deck:paint('#b17d4f'), darkwood:paint('#402821'),
 edge:paint('#d69f61'), iron:paint('#39434b'), red:paint('#bf372c'),
 yellow:paint('#efbc58'), reeds:paint('#7e9860'), canopy:paint('#203a37'),
 fog:solid('#4e5960'), brown:paint('#654734')
};
const GEOM = {box:new THREE.BoxGeometry(1,1,1),ball:new THREE.SphereGeometry(1,9,7)};
function cube(parent:THREE.Group,mat:THREE.Material,position:[number,number,number],size:[number,number,number]){
  const mesh=new THREE.Mesh(GEOM.box,mat);mesh.position.set(...position);mesh.scale.set(...size);
  mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function ellipsoid(parent:THREE.Group,mat:THREE.Material,position:[number,number,number],size:[number,number,number]){
  const mesh=new THREE.Mesh(GEOM.ball,mat);mesh.position.set(...position);mesh.scale.set(...size);
  parent.add(mesh);return mesh;
}
function pole(parent:THREE.Group,mat:THREE.Material,r:number,h:number,x:number,y:number,z:number){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r*.82,r,h,8),mat);
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function wave(parent:THREE.Group,color:string,x:number,y:number,z:number,sz:number){
 const shape=new THREE.BufferGeometry();
 const vertices=new Float32Array(3*3*2);
 const arr=new Uint16Array([0,2,1,1,2,3,2,4,3,3,4,5]);
 shape.setIndex(Array.from(arr));shape.setAttribute('position',new THREE.BufferAttribute(vertices,3));
 const material=new THREE.MeshLambertMaterial({color,side:THREE.DoubleSide,emissive:'#1f0504',emissiveIntensity:.17});
 const mesh=new THREE.Mesh(shape,material);mesh.position.set(x,y,z);mesh.userData={wave:true,sz};
 parent.add(mesh);return mesh;
}
function updateFlag(f:THREE.Mesh,t:number){
 const verts=(f.geometry.getAttribute('position') as THREE.BufferAttribute),s=f.userData.sz as number;
 for(let i=0;i<3;i++)for(let j=0;j<2;j++){
   const n=i*2+j, u=i/2, a=Math.sin(t*7-u*5)*.16*u;
   verts.setXYZ(n,u*1.3*s,j===0?s*.75:0,a);
 }
 verts.needsUpdate=true;f.geometry.computeVertexNormals();
}
type Side='ours'|'han'|'commander';
// Artistic re-interpretation of 10th-century Southeast Asian/Han-era clothing.
// Avoid later dynastic court robes, Napoleonic shakos or European jackets.
// Bodyfront draws in 600x1000 design space with head ~x300 y309,
// shoulders y430, mid-torso y525, hem y660 and soles y975.
const outfits:Record<Side,Outfit>={
 ours:{jacket:'#634b33',pants:'#373d36',boots:'#2c2925',skin:'#dca77c',hat:'hair',hair:'#272323',belt:'#b99a6a'},
 commander:{jacket:'#8e382d',pants:'#353b36',boots:'#322824',skin:'#d4a073',hat:'hair',hair:'#262220',belt:'#d6b263',moustache:'#3b2d23'},
 han:{jacket:'#454f55',pants:'#303845',boots:'#282e32',skin:'#dcb18f',hat:'hair',hair:'#292b31',belt:'#9d8865'}
};
function drawVietClothing(p:Pen,leader:boolean){
 const cloth=leader?'#8f3e2b':'#61523b';
 const trim=leader?'#e6ba68':'#cab08b';
 const sleeve=leader?'#a24a30':'#785f43';
 // Long narrow cloth wrapped around the crown, tied at the back.
 p.poly([[206,235],[230,223],[275,229],[320,228],[373,229],[397,241],
  [399,268],[203,267]],leader?'#542c25':'#323d37',9);
 p.stroke([[211,251],[392,251]],7,trim);
 p.poly([[198,259],[176,292],[159,362],[186,350],[222,269]],cloth,9);
 p.stroke([[182,299],[172,339]],4,trim);
 // Plain practical cross-collar woven tunic with a solid shaped body.
 p.poly([[226,414],[255,426],[298,453],[346,420],[377,427],[390,620],
  [365,678],[234,678],[213,622]],cloth,12);
 // Sleeves intentionally cover the template's western-looking shoulder cut.
 p.poly([[224,426],[187,444],[175,518],[220,538],[241,475]],sleeve,8);
 p.poly([[375,430],[406,448],[424,520],[381,536],[359,467]],sleeve,8);
 p.stroke([[218,439],[201,515]],6,trim);
 p.stroke([[383,439],[406,510]],6,trim);
 // Diagonal crossover neckline; no modern jacket lapels/buttons.
 p.poly([[241,421],[301,466],[361,420],[374,449],[304,505],[226,455]],leader?'#993d30':'#564731',10);
 p.stroke([[245,430],[303,485],[365,435]],11,trim);
 p.stroke([[304,487],[304,548]],5,trim);
 // Cloth waist binding and loose woven split hem.
 p.band([[234,572],[369,575]],leader?'#e3b863':'#b89b6b',23,6,'round');
 for(const x of [255,286,320,350])p.stroke([[x,601],[x-3,657]],4,'#453c34');
 p.poly([[287,586],[318,589],[309,730],[293,731]],cloth,7);
 if(leader){
    p.poly([[248,464],[269,478],[370,622],[346,642]],'#c9a05d',7);
    p.ell(302,577,13,14,'#a77c36',5);
    p.stroke([[258,479],[354,616]],4,'#f6d58d');
 }else{
    p.stroke([[238,592],[366,592]],4,'#d0b081');
 }
}
function drawHanClothing(p:Pen){
 // Curved bronze-rimmed iron cap, small side guards, no European shako.
 p.poly([[200,257],[207,233],[234,208],[270,194],[334,195],
  [373,211],[393,240],[400,257]],'#3c4851',11);
 p.poly([[197,251],[403,251],[410,278],[193,278]],'#686d70',8);
 p.stroke([[210,263],[395,263]],7,'#bb9f70');
 p.poly([[192,277],[230,277],[217,363],[191,343]],'#444a53',8);
 p.poly([[371,277],[411,277],[405,343],[385,363]],'#444a53',8);
 p.ell(300,220,14,14,'#c6aa73',5);
 // Padded tunic and true layered lamellar from shoulder to waist.
 p.poly([[229,422],[370,422],[397,590],[379,656],[223,656],[207,590]],'#39434b',12);
 p.poly([[224,424],[193,441],[186,522],[228,534],[247,457]],'#55606b',9);
 p.poly([[377,421],[406,444],[417,515],[372,540],[352,453]],'#55606b',9);
 for(let r=0;r<6;r++){
   const y=440+r*29;
   p.poly([[222,y],[378,y],[376,y+25],[226,y+25]],r%2===0?'#67717a':'#515d68',6);
   for(let c=0;c<6;c++)p.dot(239+c*26,y+11,3.4,'#c2a677');
   p.stroke([[224,y+24],[377,y+24]],3,'#2b3034');
 }
 p.band([[221,609],[381,612]],'#a38b63',21,6,'round');
 for(let i=0;i<5;i++){
   const x=229+i*30;
   p.poly([[x,618],[x+24,618],[x+20,706],[x+5,706]],
      i%2?'#4b555e':'#606a71',6);
 }
}
class Soldier {
 canvas:HTMLCanvasElement;
 g:CanvasRenderingContext2D;
 tex:THREE.CanvasTexture;
 sprite:THREE.Sprite;
 shadow:THREE.Mesh;
 constructor(public faction:Side,public id:number){
   this.canvas=document.createElement('canvas');
   this.canvas.width=480;this.canvas.height=800;
   this.g=this.canvas.getContext('2d')!;
   this.tex=new THREE.CanvasTexture(this.canvas);
   this.tex.colorSpace=THREE.SRGBColorSpace;this.tex.anisotropy=4;
   // Hard alpha test discards transparent pixels: opaque torso, no ghosting.
   const spriteMat=new THREE.SpriteMaterial({
     map:this.tex,transparent:false,alphaTest:.42,opacity:1,
     depthWrite:true,depthTest:true,toneMapped:false
   });
   this.sprite=new THREE.Sprite(spriteMat);
   this.sprite.layers.set(NOINK);
   this.sprite.center.set(.5,0);
   this.sprite.scale.set(1.1,1.84,1);
   this.sprite.renderOrder=3;
   this.shadow=new THREE.Mesh(new THREE.CircleGeometry(.34,16),
     new THREE.MeshBasicMaterial({color:'#1e1f25',opacity:.32,transparent:true,depthWrite:false}));
   this.shadow.rotation.x=-Math.PI/2;
   this.shadow.layers.set(NOINK);
 }
 paint(t:number,alarm:boolean,command:boolean){
   const ctx=this.g;ctx.clearRect(0,0,480,800);
   ctx.save();ctx.scale(.8,.8);
   const p=new Pen(ctx);p.ol=16;
   const phase=(t*(alarm?1.25:.67)+this.id*.18)%1;
   bodyFront(p,outfits[this.faction],{
     seed:this.id+19,phase,mode:'stand',
     expr:alarm?'shock':command?'stern':'neutral',
     blink:(Math.floor(t*FPS)+this.id*11)%77<3,
     light:-.65,headTilt:alarm?Math.sin(t*2)*.025:0,
     look:command?.1:0,wave:command?Math.sin(t*2.5)*.55:undefined
   });
   if(this.faction==='han')drawHanClothing(p);
   else drawVietClothing(p,this.faction==='commander');
   ctx.restore();
   this.tex.needsUpdate=true;
   // Subtle breathing & ship motion, not soldiers marching in place on deck.
   this.sprite.scale.y=1.84*(1+.007*Math.sin(t*2.1+this.id));
 }
 dispose(){this.tex.dispose();(this.sprite.material as THREE.Material).dispose();
   (this.shadow.material as THREE.Material).dispose();this.shadow.geometry.dispose();}
}
// Cross-section boat shape: raised prow/stern, tapered waterline, deep V keel.
// Real 3D side planking with an OPEN deck rather than the old flat extrusion.
function createCurvedHull(beam:number,length:number,damaged:boolean){
 const positions:number[]=[];const indices:number[]=[];
 const stations=20;
 const row=(i:number)=>{
   const u=i/stations, z=(u-.5)*length;
   const width=(.24+.76*Math.pow(Math.max(0,Math.sin(Math.PI*u)),.72))*beam;
   const rise=.58*Math.pow(Math.abs(2*u-1),3.5);
   const sheer=.84+rise;
   return [
    [-width,sheer,z],
    [-width*.77,-.02+rise*.38,z],
    [0,-.96+rise*.35,z],
    [width*.77,-.02+rise*.38,z],
    [width,sheer,z]
   ] as [number,number,number][];
 };
 for(let i=0;i<=stations;i++)for(const [x,y,z] of row(i))positions.push(x,y,z);
 for(let i=0;i<stations;i++)for(let band=0;band<4;band++){
   // The breach is a genuine absent group of faces at the forward hull
   // rather than a dark mark painted on top of intact geometry.
   if(damaged&&i>=13&&i<=15&&(band===0||band===3))continue;
   const a=i*5+band,b=(i+1)*5+band;
   indices.push(a,b,a+1,b,b+1,a+1);
 }
 // Seal the ends, keeping the high open prow/stern silhouette.
 for(const end of [0,stations]){
   for(let b=0;b<2;b++)indices.push(end*5+b,end*5+b+1,end*5+4-b);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 return geometry;
}
function curvedRail(h:THREE.Group,beam:number,length:number,side:number,mat:THREE.Material){
 const points:THREE.Vector3[]=[];
 for(let i=0;i<=20;i++){
   const u=i/20,z=(u-.5)*length;
   const width=(.24+.76*Math.pow(Math.max(0,Math.sin(Math.PI*u)),.72))*beam;
   const rise=.58*Math.pow(Math.abs(2*u-1),3.5);
   points.push(vec(width*side,.84+rise+.08,z));
 }
 const rail=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),45,.095,6,false),mat);
 h.add(rail);
}
const FLEET_COUNT=11;
// The river is opaque and depth-tested. Boat footprints are clipped from its
// surface in the fragment shader; only the explicitly animated inside-flood
// plane can be seen within a damaged vessel.
function maskedRiverMaterial(masks:THREE.Vector4[]){
 const mat=new THREE.MeshPhongMaterial({color:'#175769',shininess:68,specular:'#538b91',transparent:false,depthWrite:true});
 mat.onBeforeCompile=(shader)=>{
   shader.uniforms.fleetMasks={value:masks};
   shader.vertexShader=shader.vertexShader.replace('#include <common>',
     '#include <common>\nvarying vec3 vFleetWorld;')
     .replace('#include <worldpos_vertex>',
     '#include <worldpos_vertex>\nvFleetWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
     '#include <common>\nuniform vec4 fleetMasks[11];\nvarying vec3 vFleetWorld;')
     .replace('#include <clipping_planes_fragment>',
     '#include <clipping_planes_fragment>\nfor(int k=0;k<11;k++){vec4 b=fleetMasks[k];vec2 d=(vFleetWorld.xz-b.xy)/max(b.zw,vec2(.001));if(dot(d,d)<1.0)discard;}');
 };
 mat.customProgramCacheKey=()=> 'water-mask-v4-11';
 return mat;
}
class Warship{
 root=new THREE.Group();hull=new THREE.Group();
 crew:Soldier[]=[];flags:THREE.Mesh[]=[];
 oars:{pivot:THREE.Group;side:number;index:number}[]=[];
 sails:{mesh:THREE.Mesh;initial:Float32Array}[]=[];
 large:boolean;escort:boolean;deckY:number;
 intact:THREE.Mesh;broken:THREE.Mesh;
 damagedInside:THREE.Mesh; flood:THREE.Mesh; debris:THREE.Mesh[]=[];
 wake:THREE.Mesh[]=[];
 beam:number;
 constructor(public side:Side,public id:number,public length:number){
   this.large=side==='han'&&id<3;
   this.escort=side==='han'&&id>=3;
   this.beam=this.large?(id===1?3.70:3.55):this.escort?2.24:1.55;
   this.deckY=this.large?1.06:this.escort?.58:.30;
   const beam=this.beam,h=this.hull,deckY=this.deckY;
   this.root.add(h);
   const brown=side==='han'?MAT.darkwood:MAT.wood;
   const hullMaterial=new THREE.MeshLambertMaterial({
       color:side==='han'?'#563523':'#7a5030',side:THREE.DoubleSide,flatShading:true
   });
   this.intact=new THREE.Mesh(createCurvedHull(beam,length,false),hullMaterial);
   this.broken=new THREE.Mesh(createCurvedHull(beam,length,true),hullMaterial);
   const heightScale=this.large?1.65:this.escort?1.33:1.04;
   this.intact.scale.y=heightScale;this.broken.scale.y=heightScale;
   this.broken.visible=false;
   h.add(this.intact,this.broken);
   // Dark inner ribbed hull exposed through the torn section after the strike.
   this.damagedInside=ellipsoid(h,MAT.darkwood,[0,.20,length*.24],[beam*.84,.54,length*.16]);
   this.damagedInside.visible=false;
   // Curved raised railings and thick wooden ribs.
   for(const edge of [-1,1]){
     const points:THREE.Vector3[]=[];
     for(let i=0;i<=20;i++){
       const u=i/20,z=(u-.5)*length;
       const width=(.24+.76*Math.pow(Math.max(0,Math.sin(Math.PI*u)),.72))*beam;
       const rise=.58*Math.pow(Math.abs(2*u-1),3.5);
       points.push(vec(edge*width,(.84+rise)*heightScale,z));
     }
     h.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),40,.105,6,false),MAT.edge));
   }
   for(let i=1;i<=12;i++){
     const u=i/13,z=(u-.5)*length;
     const width=(.24+.76*Math.pow(Math.max(0,Math.sin(Math.PI*u)),.72))*beam;
     const rise=.58*Math.pow(Math.abs(2*u-1),3.5);
     // Ribs extending from gunwale towards the chine.
     for(const s of [-1,1]){
       const points=[vec(s*width,(.83+rise)*heightScale,z),vec(s*width*.84,(.26+rise*.7)*heightScale,z),vec(s*width*.69,(-.11+rise*.4)*heightScale,z)];
       const rib=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),7,.052,5,false),MAT.edge);
       h.add(rib);
     }
     if(i%2===0){
       cube(h,MAT.deck,[0,deckY-.10+rise*.08,z],[width*1.48,.10,.11]);
     }
   }
   const deckShape=new THREE.Shape();
   deckShape.moveTo(-beam*.30,-length*.41);
   deckShape.lineTo(beam*.30,-length*.41);
   deckShape.lineTo(beam*.84,-length*.16);
   deckShape.lineTo(beam*.84,length*.16);
   deckShape.lineTo(0,length*.43);
   deckShape.lineTo(-beam*.84,length*.16);
   deckShape.lineTo(-beam*.84,-length*.16);
   deckShape.closePath();
   const deck=new THREE.Mesh(new THREE.ShapeGeometry(deckShape),MAT.deck);
   deck.rotation.x=-Math.PI/2;deck.position.y=deckY;h.add(deck);
   // Raised stems curve up at both ends, unmistakably boat-like.
   for(const dir of [-1,1]){
     const stemPts=[
       vec(0,-.55*heightScale,dir*length*.30),vec(0,deckY,dir*length*.46),
       vec(0,1.45*heightScale,dir*length*.53),vec(0,2.05*heightScale,dir*length*.52)];
     const stem=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stemPts),12,.17,7,false),MAT.edge);
     h.add(stem);
   }
   // Individual rotating oars along the port and starboard side.
   const oarCount=this.large?6:this.escort?4:3;
   for(let i=0;i<oarCount;i++)for(const s of [-1,1]){
     const z=(-.32+i*.64/(oarCount-1))*length;
     const pivot=new THREE.Group();
     pivot.position.set(s*(beam*.83),deckY-.18,z);
     const oarLen=this.large?4.0:this.escort?3.1:2.65;
     const arm=new THREE.Mesh(new THREE.CylinderGeometry(.065,.084,oarLen,7),MAT.edge);
     arm.rotation.z=Math.PI/2;
     arm.position.set(s*oarLen*.47,0,0);
     pivot.add(arm);
     const blade=cube(pivot,brown,[s*oarLen*.96,-.12,.04],[.70,.16,.33]);
     blade.rotation.z=-.08*s;
     h.add(pivot);this.oars.push({pivot,side:s,index:i});
   }
   // Full masts and battened cloth sails on all five Southern Han ships.
   const mastHeight=this.large?8.2:this.escort?5.5:2.3;
   const mastZ=-length*.12;
   pole(h,MAT.wood,this.large?.20:.12,mastHeight,0,deckY+mastHeight/2,mastZ);
   if(side==='han'){
     const sw=beam*(this.large?1.85:1.66),sh=mastHeight*.53;
     const geometry=new THREE.PlaneGeometry(sw,sh,10,8);
     const sail=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({
       color:this.large?'#c9b189':'#bca482',side:THREE.DoubleSide,transparent:false,
       depthWrite:true,flatShading:true
     }));
     sail.position.set(0,deckY+mastHeight*.64,mastZ);h.add(sail);
     this.sails.push({mesh:sail,initial:new Float32Array((geometry.getAttribute('position') as THREE.BufferAttribute).array)});
     // Horizontal wood battens — differentiated from European square-rig ships.
     for(let k=0;k<5;k++)
       cube(h,MAT.edge,[0,deckY+mastHeight*(.38+k*.118),mastZ+.04],[sw*.94,.05,.06]);
     cube(h,MAT.wood,[0,deckY+mastHeight*.94,mastZ],[sw*1.05,.1,.14]);
   }
   const flag=wave(h,side==='han'?'#493d56':'#a93125',.14,deckY+mastHeight+.28,mastZ,this.large?1.24:.82);
   this.flags.push(flag);
   // Flood water remains inside the broken boat while the hull goes down.
   this.flood=cube(h,new THREE.MeshLambertMaterial({color:'#2b7d89',flatShading:true}),
      [0,deckY-1.15,0],[beam*1.33,.07,length*.57]);
   this.flood.visible=false;
   for(let i=0;i<9;i++){
     const plank=cube(h,i%2?MAT.wood:MAT.edge,
       [(i%2?1:-1)*beam*.84,.27,length*.16],[.1,.09,.35+rand(i)*.28]);
     plank.visible=false;this.debris.push(plank);
   }
   const n=this.large?3:2;
   for(let i=0;i<n;i++){
      const kind=side==='han'?'han':(i===0&&side==='commander'?'commander':'ours');
      const actor=new Soldier(kind,id*10+i);
      actor.sprite.position.set((i%2?.55:-.55),deckY+.04,-length*.26+i*length*.21);
      actor.shadow.position.set((i%2?.55:-.55),deckY+.01,-length*.26+i*length*.21);
      h.add(actor.sprite,actor.shadow);this.crew.push(actor);
   }
 }
 update(t:number,waterY:number){
   // Eleven boats: three LARGE Southern Han sailships, two escorts,
   // six small Vietnamese rowing craft. Ambush boats enter after 37s.
   const firstVisible=this.id>=7?37+(this.id-7)*.32:0;
   this.root.visible=t>=firstVisible;
   if(!this.root.visible)return;
   const contacts=[26.6,30,33.5];
   const hit=this.id<3?contacts[this.id]:Infinity;
   const age=t-hit,torn=age>0;
   const sink=torn?ss((age-2.3)/11.5):0;
   if(this.id===0)this.root.position.set(-8.5,waterY-.42-sink*1.18,-40+Math.min(t*1.48,38));
   else if(this.id===1)this.root.position.set(0,waterY-.42-sink*1.04,-48+Math.min(Math.max(0,t-2)*1.65,46));
   else if(this.id===2)this.root.position.set(8.5,waterY-.42-sink*1.08,-62+Math.min(Math.max(0,t-3)*1.95,59));
   else if(this.id===3)this.root.position.set(-15.3,waterY-.26,-51+Math.min(t*1.12,29));
   else if(this.id===4)this.root.position.set(15.3,waterY-.26,-66+Math.min(t*1.3,39));
   else if(this.id===5){
     const z=t<19?-6+t*1.7:t<38?26.3+(t-19)*.16:29.34-Math.min((t-38)*2.1,19);
     this.root.position.set(-21.6,waterY-.12,z);
   }else if(this.id===6){
     const z=t<19?3+t*1.3:t<38?27.7+(t-19)*.12:29.98-Math.min((t-38)*2.0,18.8);
     this.root.position.set(21.6,waterY-.12,z);
   }else if(this.id===7)this.root.position.set(-26.1,waterY-.12,36-Math.min(Math.max(0,t-37)*2.4,25));
   else if(this.id===8)this.root.position.set(26.1,waterY-.12,38-Math.min(Math.max(0,t-37)*2.4,25));
   else if(this.id===9)this.root.position.set(-21.6,waterY-.12,48-Math.min(Math.max(0,t-39)*1.9,18));
   else this.root.position.set(21.6,waterY-.12,49-Math.min(Math.max(0,t-40)*1.8,17));
   const bob=Math.sin(t*1.65+this.id)*.027;
   this.hull.rotation.set(bob+sink*.16,0,(this.id===0?-1:1)*sink*.27+bob*.42);
   this.intact.visible=!torn;this.broken.visible=torn;
   this.damagedInside.visible=torn;this.flood.visible=torn;
   if(torn){
     const level=ss(age/10);
     this.flood.position.y=this.deckY-1.12+level*.97;
     this.flood.scale.y=.07+level*.08;
   }
   for(let i=0;i<this.debris.length;i++){
     const m=this.debris[i],dt=age-i*.13;
     m.visible=torn&&dt>0&&dt<3;
     if(m.visible){
       m.position.set((i%2?1:-1)*(this.beam*.73+dt*.5),
         this.deckY+dt*.68-dt*dt*.19,this.length*.2+dt*.4);
       m.rotation.set(dt*.8+i,dt*.7,dt*1.1);
     }
   }
   for(const o of this.oars){
     o.pivot.rotation.z=o.side*(.08+.17*Math.sin(t*4.8+o.index*1.4));
     o.pivot.rotation.y=o.side*.05*Math.cos(t*4.8+o.index);
   }
   for(const sail of this.sails){
     const attr=sail.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
     const init=sail.initial;
     for(let i=0;i<attr.count;i++){
       const x=init[i*3],y=init[i*3+1];
       attr.setXYZ(i,x,y,.31*Math.sin((x/this.beam+1)*1.4)+.15*Math.sin(t*1.75+x*.6+y*.36));
     }
     attr.needsUpdate=true;sail.mesh.geometry.computeVertexNormals();
   }
   for(const f of this.flags)updateFlag(f,t+this.id);
   for(const p of this.crew){
     p.paint(t,torn&&age<10,this.side==='commander');
     p.sprite.visible=this.id>=3||sink<.67;
     p.shadow.visible=p.sprite.visible;
   }
 }
 dispose(){this.crew.forEach(c=>c.dispose());}
}
class Battlefield{
 root=new THREE.Group();
 water:THREE.Mesh;
 ripples:THREE.Mesh[]=[];
 reeds:THREE.Mesh[]=[];
 stakes:THREE.Group[]=[];
 ships:Warship[]=[];
 splashes:THREE.Mesh[]=[];
 arrows:THREE.Mesh[]=[];
 sun:THREE.DirectionalLight;
 ambient:THREE.AmbientLight;
 constructor(){
   const g=this.root;
   cube(g,MAT.waterDeep,[0,-2.6,-7],[46,.4,155]);
   this.water=cube(g,MAT.water,[0,1.6,-7],[32,.10,140]);
   for(const side of [-1,1]){
     cube(g,MAT.earth,[side*25,-.45,-8],[19,3.1,155]);
     cube(g,MAT.banks,[side*18.4,.56,-8],[8.8,1.8,155]);
     for(let i=0;i<30;i++){
       const x=side*(16.2+rand(i*17+side)*6),z=-57+rand(i*19+side)*110;
       const reed=pole(g,MAT.reeds,.07,1.6+rand(i)*1.6,x,1.9,z);
       reed.rotation.z=side*(.07+rand(i+14)*.15);this.reeds.push(reed);
       if(i%5===0){
         pole(g,MAT.wood,.18,2.4,x,2.25,z);
         for(let j=0;j<4;j++)ellipsoid(g,MAT.canopy,[x+Math.sin(i+j)*.9,3.5+j*.15,z+Math.cos(i*2+j)*.8],[1.3,.68,1]);
       }
     }
   }
   // 35 IRON-TIPPED WOODEN STAKES, permanently fixed to the river bed.
   // No animated translation of a stake; only water level changes.
   for(let row=0;row<7;row++)for(let col=0;col<5;col++){
     const x=(col-2)*3.45+(row%2)*.20,z=-1+row*3.1;
     const group=new THREE.Group();group.position.set(x,-3.12,z);
     const root=pole(group,MAT.wood,.36,3.46,0,1.57,0);
     root.rotation.z=(rand(row*8+col)-.5)*.05;
     // Smaller iron-tipped sharpened timber: no square cap or traffic-cone silhouette.
     const tip=new THREE.Mesh(new THREE.ConeGeometry(.255,.82,7),MAT.iron);
     tip.position.y=3.66;group.add(tip);
     g.add(group);this.stakes.push(group);
   }
   for(let i=0;i<100;i++){
     const p=cube(g,MAT.current,[(rand(i*4)-.5)*30,1.66,-50+rand(i*9)*110],
         [.2+rand(i)*1.35,.012,.035+rand(i+6)*.13]);
     this.ripples.push(p);
   }
   this.ships.push(
     new Warship('han',0,12.5),
     new Warship('han',1,11.8),
     new Warship('commander',2,7.4),
     new Warship('ours',3,7.0)
   );
   for(const s of this.ships)g.add(s.root);
   // Actual moving splash droplets and splinter trails at impact.
   for(let i=0;i<55;i++){
     const mat=i%3===0?MAT.edge:new THREE.MeshBasicMaterial({color:i%2?'#c7ecdf':'#86c5c7'});
     const drop=ellipsoid(g,mat,[0,-100,0],i%3===0?[.10,.14,.10]:[.075,.10,.075]);
     this.splashes.push(drop);
   }
   for(let i=0;i<16;i++){
     const arrow=pole(g,MAT.iron,.025,1.55,0,-100,0);
     arrow.rotation.z=Math.PI/2;this.arrows.push(arrow);
   }
   this.sun=new THREE.DirectionalLight('#ffdab0',2.2);
   this.sun.position.set(-15,35,-20);
   this.ambient=new THREE.AmbientLight('#ebe0c7',.97);
   g.add(this.sun,this.ambient);
 }
 update(frame:number,camera:THREE.PerspectiveCamera,scene:THREE.Scene){
   const t=frame/FPS;
   // High tide to low tide over 18–29 seconds. Staked riverbed stays still.
   const tide=ss((t-18)/11.0),waterY=1.6-tide*2.25;
   this.water.position.y=waterY;
   for(let i=0;i<this.ripples.length;i++){
     const p=this.ripples[i];p.position.y=waterY+.065;
     p.position.z=-50+((rand(i*9)*110+t*(.5+rand(i)*.45))%110);
     p.position.x=(rand(i*4)-.5)*30+Math.sin(t+i)*.06;
   }
   for(const ship of this.ships)ship.update(t,waterY);
   // Pairwise AABB hull clearance in X and Z (different lane means safe).
   for(let i=0;i<this.ships.length;i++)for(let j=i+1;j<this.ships.length;j++){
     const a=this.ships[i],b=this.ships[j];
     const dx=Math.abs(a.root.position.x-b.root.position.x);
     const dz=Math.abs(a.root.position.z-b.root.position.z);
     if(dx<a.beam+b.beam+1.2 && dz<(a.length+b.length)*.52+1.0)
       throw new Error('Hull collision between '+a.id+' and '+b.id+' @ '+t.toFixed(2)+'s');
   }
   for(let i=0;i<this.splashes.length;i++){
     const hit=i%2===0?26.4:29.8,age=t-hit-(i%11)*.045;
     const d=this.splashes[i];
     d.visible=age>=0&&age<1.75;
     if(d.visible){
       const ship=this.ships[i%2],sign=(i%3-1);
       const drift=(rand(i*11)-.5)*2.5;
       const vx=(rand(i*2)-.5)*2.5;
       d.position.set(ship.root.position.x+vx*age,waterY+.4+age*(2.6+rand(i+10)*1.6)-3.2*age*age,
         ship.root.position.z+ship.length*.3+drift+age*.5);
       d.scale.setScalar(.08+rand(i)*.11);
     }
   }
   // Arrows crossing open water during the counterattack (no gore).
   for(let i=0;i<this.arrows.length;i++){
     const obj=this.arrows[i],launch=39.5+i*.27,age=t-launch;
     obj.visible=age>0&&age<1.65;
     if(obj.visible){
       const left=i%2===0;
       const x0=left?-12.6:12.6,x1=left?-4.4:4.4;
       const u=ss(age/1.65);
       obj.position.set(x0+(x1-x0)*u,3.4+2.6*Math.sin(u*Math.PI),
          6+(i%5)*.72);
       obj.rotation.z=Math.PI/2;
     }
   }
   const drama=ss((t-21)/25);
   scene.background=new THREE.Color('#6e9ab3').lerp(new THREE.Color('#eda46c'),drama*.7);
   scene.fog=new THREE.Fog(new THREE.Color('#8faeaa').lerp(new THREE.Color('#bda58f'),drama*.58),50,220);
   this.sun.color.set('#ffe0b0').lerp(new THREE.Color('#ffa86b'),drama*.70);
   // Nine camera setpieces: wide, hull closeup, lure, tide, stake,
   // breach, flooding, counterattack and victory.
   const shots=[
     {a:0,b:6,pos:vec(10,13,40),aim:vec(0,1,-17),fov:41},
     {a:6,b:12,pos:vec(-12,7,20),aim:vec(-4,2,-18),fov:47},
     {a:12,b:18,pos:vec(-17,7,34),aim:vec(-11,1.4,13),fov:47},
     {a:18,b:24,pos:vec(2,4.7,24),aim:vec(0,.2,4),fov:48},
     {a:24,b:31,pos:vec(-10,6.5,16),aim:vec(-3,0,0),fov:45},
     {a:31,b:39,pos:vec(-13,8,19),aim:vec(-3,-.4,-5),fov:44},
     {a:39,b:42,pos:vec(-7,9,35),aim:vec(-12,1,12),fov:45},
     {a:42,b:45,pos:vec(7,9,35),aim:vec(12,1,10),fov:45},
     {a:45,b:49,pos:vec(1,17,38),aim:vec(0,0,3),fov:42}
   ];
   const sh=shots.find(s=>t>=s.a&&t<s.b)||shots[shots.length-1];
   const k=ss((t-sh.a)/(sh.b-sh.a));
   camera.position.copy(sh.pos).add(vec(k*.35,Math.sin(k*Math.PI)*.17,-k*.6));
   if(t>=6&&t<12){
     const hanZ=this.ships[0].root.position.z;
     camera.position.set(-13,6.5,hanZ+14);
     camera.lookAt(-4.4,1.7,hanZ);
   }else{
     camera.lookAt(sh.aim);
   }
   camera.fov=sh.fov;
   camera.updateProjectionMatrix();
 }
 dispose(){this.ships.forEach(s=>s.dispose());}
}
const World:React.FC=()=>{
 const f=useCurrentFrame();
 const {scene,camera}=useThree();
 const field=useMemo(()=>new Battlefield(),[]);
 const fx=useMemo(()=>({
   ink:new InkPass(scene,camera as THREE.PerspectiveCamera),
   bloom:new BloomEffect({blendFunction:BlendFunction.ADD,intensity:.13,
     luminanceThreshold:1.25,luminanceSmoothing:.21,mipmapBlur:true,levels:4,radius:.55}),
   tone:new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}),
   grade:new GradeEffect(GRADES.day,.38)
 }),[scene,camera]);
 useEffect(()=>()=>{fx.ink.dispose();field.dispose()},[fx,field]);
 field.update(f,camera as THREE.PerspectiveCamera,scene);
 const post=useMemo(()=><EffectComposer multisampling={0}>
  <primitive object={fx.ink} dispose={null}/>
  <primitive object={fx.bloom} dispose={null}/>
  <primitive object={fx.tone} dispose={null}/>
  <primitive object={fx.grade} dispose={null}/>
 </EffectComposer>,[fx]);
 return <><primitive object={field.root} dispose={null}/>{post}</>;
};
function ScreenTitle({text,tag}:{text:string;tag?:string}){
 return <div style={{
   position:'absolute',bottom:160,left:34,right:34,textAlign:'center',
   color:'#fff5d6',fontWeight:900,fontFamily:'Arial, sans-serif',fontSize:46,
   textShadow:'0px 3px 2px #182d34, 0px 5px 10px #142426',
   letterSpacing:2
 }}>
   {tag&&<div style={{fontSize:19,fontWeight:700,letterSpacing:4,marginBottom:9}}>{tag}</div>}
   {text}
 </div>;
}
export const BachDangV4:React.FC=()=>{
 const f=useCurrentFrame();const t=f/FPS;
 return <AbsoluteFill style={{background:'#142a35'}}>
  <ThreeCanvas width={720} height={1280} style={{width:720,height:1280}}
    dpr={.75} gl={{antialias:false,stencil:false}}
    camera={{fov:41,near:.1,far:300}}>
    <World/>
  </ThreeCanvas>
  <AbsoluteFill style={{pointerEvents:'none',
    background:'linear-gradient(180deg, rgba(6,20,28,.16) 0%,transparent 26%,transparent 68%,rgba(6,18,24,.29) 100%)'}}/>
  {t<3.5&&<ScreenTitle text="BẠCH ĐẰNG" tag="NĂM 938 • NGÔ QUYỀN"/>}
  {t>19&&t<23.3&&<ScreenTitle text="TRIỀU RÚT" tag="BÃI CỌC NGẦM LỘ RA"/>}
  {t>45&&<ScreenTitle text="ĐẠI THẮNG BẠCH ĐẰNG" tag="NĂM 938"/>}
  <Audio src={staticFile('audio/bach-dang-extended.wav')}/>
 </AbsoluteFill>;
};
