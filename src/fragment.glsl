

uniform float time;
varying vec3 vPosition;
varying vec2 vUv;

void main(){
  gl_FragColor = vec4(vUv, 0. ,1.);
}