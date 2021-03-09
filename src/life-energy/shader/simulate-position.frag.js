module.exports = /* glsl */ `
precision highp float;

varying vec2 vTexCoord0;
uniform sampler2D uTextureLast;
uniform sampler2D uTextureCurrent;

uniform float dT;
uniform float eT;

uniform vec3 mouseNow;
uniform vec3 mouseLast;
uniform vec2 resolution;

#define M_PI 3.1415926535897932384626433832795

float atan2(in float y, in float x) {
  bool xgty = (abs(x) > abs(y));
  return mix(M_PI / 2.0 - atan(x,y), atan(y,x), float(xgty));
}

vec3 fromBall(float r, float az, float el) {
  return vec3(
    r * cos(el) * cos(az),
    r * cos(el) * sin(az),
    r * sin(el)
  );
}
void toBall(vec3 pos, out float az, out float el) {
  az = atan2(pos.y, pos.x);
  el = atan2(pos.z, sqrt(pos.x * pos.x + pos.y * pos.y));
}

// float az = 0.0;
// float el = 0.0;
// vec3 noiser = vec3(lastVel);
// toBall(noiser, az, el);
// lastVel.xyz = fromBall(1.0, az, el);

vec3 ballify (vec3 pos, float r) {
  float az = atan2(pos.y, pos.x);
  float el = atan2(pos.z, sqrt(pos.x * pos.x + pos.y * pos.y));
  return vec3(
    r * cos(el) * cos(az),
    r * cos(el) * sin(az),
    r * sin(el)
  );
}

float rand(vec2 n) {
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  // uv = vTexCoord0.xy;
  vec4 pos = texture2D(uTextureCurrent, uv);
  vec4 oPos = texture2D(uTextureLast, uv);

  float life = pos.w;

  vec3 vel = pos.xyz - oPos.xyz;

  life -= .01 * ( rand( uv ) + 0.1 );

  if( life > 1. ){
    vel = vec3( 0. );
    pos.xyz = vec3(
      -0.5 + rand(uv + 0.1),
      -0.5 + rand(uv + 0.2),
      -0.5 + rand(uv + 0.3)
    );

    pos.xyz = ballify(pos.xyz, 1.5);
    pos.y += 5.0;
    life = .99;
  }

  float bottomLimit = -7.0 + rand(uv + 0.1);

  if( life < 0. || pos.y <= bottomLimit ){
    vel = vec3( 0. );
    pos.xyz = vec3(
      -0.5 + rand(uv + 0.1),
      -0.5 + rand(uv + 0.2),
      -0.5 + rand(uv + 0.3)
    );

    pos.xyz = ballify(pos.xyz, 1.5);
    pos.y += 5.0;
    life = 1.1;
  }

  // gravity
  vel += vec3( 0.0 , -.003 , 0. );

  // wind
  vel += vec3( 0.001 * life, 0.0, 0.0 );

  // handleCollision(pos, vel);

  vel *= .96; // dampening

  vec3 p = pos.xyz + vel;
  gl_FragColor = vec4(p , life);

  // gl_FragColor = vec4(uv.xy, .0, 1.0);
}
`;
