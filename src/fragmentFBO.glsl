
precision highp float;
uniform float uTime;
uniform sampler2D uDiffuse;
uniform sampler2D uPrev;
uniform vec4 uResolution;
varying vec3 vPosition;
varying vec2 vUv;
uniform vec4 uColor;


float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);
	
	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}

float fbm(vec2 x, int numOctaves) {
	float v = 0.0;
	float a = 0.5;
	vec2 shift = vec2(100);
	// Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
	for (int i = 0; i < numOctaves; ++i) {
		v += a * noise(x);
		x = rot * x * 2.0 + shift;
		a *= 0.5;
	}
	return v;
}



float blendDarken(float base, float blend){
  return min(blend, base);
}
vec3 blendDarken(vec3 base, vec3 blend){
  return vec3(blendDarken(base.r, blend.r),blendDarken(base.g, blend.g),blendDarken(base.b, blend.b) );
}
vec3 blendDarken(vec3 base, vec3 blend, float opacity){
  return (blendDarken(base, blend))* opacity + base*(1.-opacity);}



float hue2rgb(float f1, float f2, float hue){
  if(hue < 0.0){
    hue += 1.0;
  }else if(hue > 1.0){
    hue -= 1.0;
  }

  float res;

  if((6.0 * hue) < 1.0){
    res = f1 + (f2 - f1) * 6. * hue;
  }else if((2.0 * hue) < 1.0){
    res = f2;
  }else if((3.0 * hue) < 2.0){
    res = f1 + (f2 - f1) * ((2.0 / 3.0) - hue) * 6.0;
  }else{
    res = f1;
  }
  return res;

}
vec3 hsl2rgb(vec3 hsl){
  vec3 rgb;
  if(hsl.y == 0.0){
    rgb = vec3(hsl.z);
  }else{
    float f2;
    if(hsl.z < 0.5){
      f2 = hsl.z * (1.0 + hsl.y);
    }else{
      f2 = hsl.z + hsl.y - hsl.y * hsl.z;
    }
      float f1 = 2.0 * hsl.z - f2;
      rgb.r = hue2rgb(f1, f2, hsl.x + (1.0 / 3.0));
      rgb.g = hue2rgb(f1, f2, hsl.x);
      rgb.b = hue2rgb(f1, f2, hsl.x - (1.0/ 3.0));
  }
  return rgb;
}

vec3 hsl2rgb(float h, float s , float l ){
  return hsl2rgb(vec3(h,s,l));
}
// drawings..

vec3 bgColor= vec3(1.,1.,1);
void main(){
  vec4 color = texture2D(uDiffuse, vUv); // mouse movement
  vec4 prev = texture2D(uPrev, vUv); // previous frame


  vec2 aspect = vec2(1., uResolution.y / uResolution.x);
  //fbm noise
  vec2 disp = aspect * (fbm(vUv * 24.0, 4)) * 0.008; // speed of color spread

  vec4 texel = texture2D(uPrev, vUv);
  vec4 texel2 = texture2D(uPrev, vec2(vUv.x + disp.x , vUv.y));
  vec4 texel3 = texture2D(uPrev, vec2(vUv.x - disp.x , vUv.y));
  vec4 texel4 = texture2D(uPrev, vec2(vUv.x, vUv.y + disp.y));
  vec4 texel5 = texture2D(uPrev, vec2(vUv.x, vUv.y - disp.y));

  vec3 floodColor = texel.rgb;
  floodColor = blendDarken(floodColor, texel2.rgb);
  floodColor = blendDarken(floodColor, texel3.rgb);
  floodColor = blendDarken(floodColor, texel4.rgb);
  floodColor = blendDarken(floodColor, texel5.rgb);

  vec3 gradient = hsl2rgb(fract(uTime * 0.01), 0.5,0.5);
  // gradient = vec3(0.3,0.3,1.);
  vec3 mouseColor= mix(vec3(1.), gradient, color.r);

  vec3 waterColor = blendDarken(prev.rgb, floodColor * (1. + 0.005), 0.2);

  //  vec3 waterColor = blendDarken(prev.rgb, floodColor * (1.00004), 0.9);
  vec3 finalColor = blendDarken(waterColor, mouseColor, .5);


  gl_FragColor = vec4(waterColor, 1.);
  gl_FragColor = vec4(mouseColor.rgb, 1.);
  gl_FragColor = vec4(finalColor.rgb,1.0);

  // gl_FragColor = vec4(

// min(bgColor, finalColor * (1. + 0.00001)),1.0);
// min(bgColor * 1., finalColor * (1. + 0.005) + 0.0006869),1.0);
// min(bgColor * 1., finalColor * (1. + 0.01) + 0.001),1.0);
}
// now display this image, and preserve the result