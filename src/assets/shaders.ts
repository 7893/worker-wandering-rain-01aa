export const vertexShader = `
attribute vec2 a_position;
varying vec2 v_uv;
void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}
`;
export const fragmentShader = `
precision highp float;
varying vec2 v_uv;
uniform vec2 u_size;
uniform float u_time;
uniform float u_hour;
uniform float u_warm;
float arch(vec2 p){
  float cap=length(vec2(p.x,min(p.y+.09,0.)))-.245;
  return max(cap,p.y-.29);
}
void main(){
  vec2 uv=vec2(v_uv.x,1.-v_uv.y);
  vec2 p=(uv-.5)*vec2(u_size.x/u_size.y,1.);
  p.y+=.025;
  float daylight=.5+.5*sin((u_hour-6.)*.261799);
  vec3 base=mix(vec3(.80,.83,.75),vec3(.87,.77,.67),u_warm);
  vec3 light=mix(vec3(.95,.97,.86),vec3(1.,.92,.78),u_warm);
  vec3 shade=mix(vec3(.44,.51,.38),vec3(.61,.41,.27),u_warm);
  float breathing=sin(u_time*.12+u_warm*2.)*.012;
  vec2 shifted=p-vec2(sin(u_time*.045)*.007,0.);
  float d=arch(shifted);
  float soft=max(1.25/u_size.y,.0015);
  float inside=1.-smoothstep(-soft,soft,d);
  float pool=exp(-dot(p*vec2(2.5,1.2),p*vec2(2.5,1.2))*2.);
  vec3 color=base+light*pool*.05;
  // A recessed arch, softly lit from above; all light is analytic.
  float recess=exp(-max(-d,0.)*24.)*.085;
  float topLight=exp(-length((p-vec2(-.035,-.23))*vec2(3.4,2.3))*1.5);
  vec3 interior=mix(base,light,.14+topLight*(.5+daylight*.12)+breathing);
  interior-=shade*recess;
  color=mix(color,interior,inside);
  float edge=exp(-abs(d)*230.)*.13;
  color+=light*edge*(.4+.6*(1.-smoothstep(-.3,.1,p.x+p.y)));
  float shadow=exp(-abs(arch(p-vec2(.012,.016)))*65.)*(1.-inside);
  color-=shade*shadow*.10;
  // A broad reflected glow at the foot of the opening.
  float reflected=exp(-pow(p.y-.30,2.)*2400.-p.x*p.x*25.);
  color+=light*reflected*.095;
  float grain=fract(sin(dot(mod(gl_FragCoord.xy,128.),vec2(12.9898,78.233)))*437.585);
  color+=(grain-.5)*.008;
  color-=vec3(.035)*smoothstep(.32,.85,length(p));
  gl_FragColor=vec4(color,1.);
}
`;
