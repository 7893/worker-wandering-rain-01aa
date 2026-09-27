export const vertexShader = `
attribute vec2 a_position;
varying vec2 v_uv;
void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}
`;
export const fragmentShader = `
precision highp float;
varying vec2 v_uv;
uniform vec2 u_size;
uniform vec2 u_paper;
uniform float u_feed;
void main(){
  vec2 p=vec2(v_uv.x,1.-v_uv.y)*u_size;
  float y=(p.y-u_paper.x)/u_paper.y;
  float grain=fract(sin(dot(mod(gl_FragCoord.xy,128.),vec2(12.9898,78.233)))*437.585)-.5;
  vec3 metal=vec3(.132,.157,.117);
  metal+=vec3(.04)*exp(-pow((v_uv.y-.5)*2.,2.));
  metal+=vec3(grain*.007);
  float edgeShadow=exp(-max(p.y-u_paper.x-u_paper.y,0.)/13.)*.045;
  if(y>1.)metal-=vec3(edgeShadow);
  vec3 color=metal;
  if(y>=0.&&y<=1.){
    vec3 paper=vec3(.85,.84,.73);
    // Cylindrical bends at the feed rollers and a shallow transverse curl.
    float roll=exp(-p.x/18.)+exp(-(u_size.x-p.x)/18.);
    float fold=exp(-y*42.)*.21+exp(-(1.-y)*25.)*.10;
    float sheen=exp(-pow((y-.045)*35.,2.))*.035;
    paper*=1.-roll*.22-fold;
    paper+=vec3(sheen);
    float fibers=sin(p.y*2.9+sin((p.x+u_feed)*.06))*.0015;
    paper+=vec3(grain*.012+fibers);
    float tooth=abs(mod(p.x+u_feed,22.)-11.);
    float hole=min(abs(p.y-u_paper.x-14.),abs(p.y-u_paper.x-u_paper.y+13.));
    float holeDistance=length(vec2(max(tooth-1.8,0.),max(hole-1.8,0.)))-1.3;
    float aperture=1.-smoothstep(-.6,.6,holeDistance);
    paper=mix(paper,metal*.65,aperture);
    paper+=vec3(.08)*exp(-abs(holeDistance-1.)*2.)*(1.-aperture);
    color=paper;
  }
  gl_FragColor=vec4(color,1.);
}
`;
