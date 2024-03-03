// components/animation/GlobeComponent.tsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

const GlobeComponent = ({disableHover = false}) => {
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const style = disableHover ? { pointerEvents: 'none' } : {};

  useEffect(() => {
    if (!globeContainerRef.current) return;

    // 初始化 Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    // const resizeRenderer = () => {
    //   const width = globeContainerRef.current.clientWidth;
    //   const height = globeContainerRef.current.clientHeight;
    //   renderer.setSize(width, height);
    //   camera.aspect = width / height;
    //   camera.updateProjectionMatrix();
    // };
    // resizeRenderer();
    // window.addEventListener('resize', resizeRenderer);

    renderer.setClearColor(0xffffff, 0);
    renderer.setSize(1100, 1100);
    renderer.setPixelRatio(window.devicePixelRatio);
    globeContainerRef.current.appendChild(renderer.domElement);

    const sphereGeom = new THREE.SphereGeometry(5, 50, 50);
    // https://i.postimg.cc/0Ndr7GpN/earth-world-map-3d-model-low-poly-max-obj-fbx-c4d-ma-blend.jpg'
    const globeTexture = new THREE.TextureLoader().load('/images/globe.jpg');
    const vertexShaderText = `varying vec2 vertexUV;
		varying vec3 vertexNormal;
		
		void main(){
			vertexUV = uv;
			vertexNormal = normalize(normalMatrix * normal);
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
		}`;
    const fragmentShader = `uniform sampler2D globeTexture;
		varying vec2 vertexUV;
		varying vec3 vertexNormal;
		
		void main(){
			float intensity = 1.05 - dot(vertexNormal, vec3(0,0,1));
			vec3 atmosphere = vec3(0.3, 0.6, 1.0) * pow(intensity, 1.5);
			gl_FragColor = vec4(atmosphere + texture2D(globeTexture, vertexUV).xyz, 1.0);
		}`;

    const sphereMat = new THREE.ShaderMaterial({
      vertexShader : vertexShaderText,
      fragmentShader : fragmentShader ,
      uniforms: {
        globeTexture: { value: globeTexture }
      }
    });

    const sphere = new THREE.Mesh(sphereGeom, sphereMat);
    scene.add(sphere);

    const atmosphereVertexShader=`varying vec3 vertexNormal;
		void main(){
			vertexNormal = normalize(normalMatrix * normal);
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 0.9);
		}`

    const atmosphereFragmentShader = `
    varying vec3 vertexNormal;
		
		void main(){
			float intensity = pow(0.6 - dot(vertexNormal, vec3(0,0,1.0)), 2.0);
			gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
		}
    `
    const outerGlowMat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      side: THREE.BackSide
    });

    const outerGlow = new THREE.Mesh(sphereGeom, outerGlowMat);
    outerGlow.scale.set(1.01, 1.01, 1.01);
    scene.add(outerGlow);

    camera.position.z = 10;

    // 🌈
    // const rainbowShader = {
    //   vertexShader: `
    //     varying vec3 vertexNormal;
    
    //     void main() {
    //       vertexNormal = normalize(normalMatrix * normal);
    //       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    //     }
    //   `,
    //   fragmentShader:  `
    //     varying vec3 vertexNormal;
    //     const float PI = 3.14159265359;
    
    //     vec3 hslToRgb(vec3 hsl) {
    //         float h = hsl.x;
    //         float s = hsl.y;
    //         float l = hsl.z;
    
    //         float r, g, b;
    
    //         if (s == 0.0) {
    //             r = g = b = l; 
    //         } else {
    //             float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
    //             float p = 2.0 * l - q;
    //             r = hueToRgb(p, q, h + 1.0/3.0);
    //             g = hueToRgb(p, q, h);
    //             b = hueToRgb(p, q, h - 1.0/3.0);
    //         }
    
    //         return vec3(r, g, b);
    //     }
    
    //     float hueToRgb(float p, float q, float t) {
    //         if(t < 0.0) t += 1.0;
    //         if(t > 1.0) t -= 1.0;
    //         if(t < 1.0/6.0) return p + (q - p) * 6.0 * t;
    //         if(t < 1.0/2.0) return q;
    //         if(t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
    //         return p;
    //     }
    
    //     void main() {
    //       float angle = atan(vertexNormal.y, vertexNormal.x);
    //       float hue = (angle + PI) / (2.0 * PI);
    //       vec3 color = hslToRgb(vec3(hue, 1.0, 0.5));
    //       gl_FragColor = vec4(color, 1.0);
    //     }
    //   `
    // };

    // const rainbowMaterial = new THREE.ShaderMaterial({
    //   vertexShader: rainbowShader.vertexShader,
    //   fragmentShader: rainbowShader.fragmentShader,
    //   side: THREE.BackSide,
    //   transparent: true
    // });

    // const rainbowGlow = new THREE.Mesh(sphereGeom, rainbowMaterial);
    // rainbowGlow.scale.set(1.05, 1.05, 1.05);
    // scene.add(rainbowGlow);

    // update
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);

      sphere.rotation.y -= 0.002;
      sphere.rotation.z -= 0.002;

      const scale = Math.random() * (1.013 - 1.01) + 1.015;
      outerGlow.scale.set(scale, scale, scale);

      // 🌈
      // rainbowGlow.rotation.y -= 0.002;
      // rainbowGlow.rotation.z -= 0.002;
    };
    animate();

    return () => {
      globeContainerRef.current?.removeChild(renderer.domElement);
      // window.removeEventListener('resize', resizeRenderer);
      sphereGeom.dispose();
      sphereMat.dispose();
    };
  }, []);

  return (
    //  bg-gradient-to-r  from-blue-500 to-cyan-400 w-16
    // css: container
    // @ts-ignore
    <div className="m-0" style={style}>
      {/* no flex */}
        <div className="container mx-auto justify-center flex items-center h-[700px]"> 
          {/* css : wrapper */}
          <div className="wrapper flex flex-col lg:flex-column items-center">    
            {/* <div className="text-red text-6xl mb-8 lg:mb-0"> */}
            {/* <h1>Hidden Gem Spots</h1> */}
            <div className="globe-total-container relative">
                <div ref={globeContainerRef} id="globe-container" className="flex-on-hover">
              {/* <div id="globe-shadow" className="w-48 h-2.5 bg-black/5 rounded-full mx-auto"></div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobeComponent;
