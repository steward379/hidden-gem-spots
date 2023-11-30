// components/animation/GlobeComponent.tsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

const GlobeComponent = () => {
  const globeContainerRef = useRef<HTMLDivElement>(null);

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
    renderer.setSize(900, 900);
    renderer.setPixelRatio(window.devicePixelRatio);
    globeContainerRef.current.appendChild(renderer.domElement);

    const sphereGeom = new THREE.SphereGeometry(5, 50, 50);
    // https://i.postimg.cc/0Ndr7GpN/earth-world-map-3d-model-low-poly-max-obj-fbx-c4d-ma-blend.jpg'
    const globeTexture = new THREE.TextureLoader().load('/images/globe.jpg');
    const vertexShaderText = `		varying vec2 vertexUV;
		varying vec3 vertexNormal;
		
		void main(){
			vertexUV = uv;
			vertexNormal = normalize(normalMatrix * normal);
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
		}`;
    const fragmentShader = `		uniform sampler2D globeTexture;
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

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);

      sphere.rotation.y -= 0.002;
      sphere.rotation.z -= 0.002;

      const scale = Math.random() * (1.013 - 1.01) + 1.015;
      outerGlow.scale.set(scale, scale, scale);
    };
    animate();



    return () => {
      globeContainerRef.current?.removeChild(renderer.domElement);
      // window.removeEventListener('resize', resizeRenderer);
    };
  }, []);

  return (
    //  bg-gradient-to-r  from-blue-500 to-cyan-400 w-16
    // css: container
    <div className="container mx-auto flex justify-center items-center"
      style={{ height: '700px' }}
    > 
    {/* css : wrapper */}
      <div className="wrapper flex flex-col lg:flex-column items-center">    
        {/* <div className="text-red text-6xl mb-8 lg:mb-0"> */}<div>
          {/* <h1>Hidden Gem Spots</h1> */}
        </div>
        <div className="globe-total-container relative">
          <div ref={globeContainerRef} id="globe-container"></div>
          {/* <div id="globe-shadow" className="w-48 h-2.5 bg-black/5 rounded-full mx-auto"></div> */}
        </div>
      </div>
    </div>
  );
};

export default GlobeComponent;
