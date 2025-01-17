module.exports = /* glsl */ `
    #define TAU 6.28318530718

    varying vec3 worldNormal;
    varying vec3 viewDirection;
    uniform float progress_faces;

    void main() {
      vec4 worldPosition = modelMatrix * vec4( position, 1.0);
      worldNormal = normalize( modelViewMatrix * vec4(normal, 0.)).xyz;
      viewDirection = normalize(worldPosition.xyz - cameraPosition);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

//
