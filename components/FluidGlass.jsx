import * as THREE from 'three';
import React, { useRef, useState, useEffect, memo } from 'react';
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import { useFBO, Image, Scroll, ScrollControls, MeshTransmissionMaterial, Text } from '@react-three/drei';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import html2canvas from 'html2canvas';
import { easing } from 'maath';
import FluidShaderLayer from './FluidShaderLayer';

export default function FluidGlass({ mode = 'lens', lensProps = {}, barProps = {}, cubeProps = {}, children, showDemo = false }) {
  const supportsWebGL = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch {}
    return false;
  })();
  if (!supportsWebGL) return null;
  const W = mode === 'bar' ? Bar : mode === 'cube' ? Cube : Lens;
  const props = mode === 'bar' ? barProps : mode === 'cube' ? cubeProps : lensProps;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Canvas camera={{ position: [0, 0, 20], fov: 15 }} gl={{ alpha: true }} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {showDemo ? (
          <ScrollControls damping={0.2} pages={3} distance={0.4}>
            <W modeProps={props}>
              <Scroll>
                <Typography />
                <Images />
              </Scroll>
            </W>
          </ScrollControls>
        ) : (
          <W modeProps={props}>{children}</W>
        )}
      </Canvas>
    </div>
  );
}

const ModeWrapper = memo(function ModeWrapper({ children, glb, geometryKey, lockToBottom = false, followPointer = true, modeProps = {}, shaderOnly = false, ...props }) {
  const ref = useRef(null);
  const [nodes, setNodes] = useState(null);
  const buffer = useFBO();
  const { viewport: vp } = useThree();
  const [scene] = useState(() => new THREE.Scene());
  const geoWidthRef = useRef(1);
  const [bgTex, setBgTex] = useState(null);
  const materialRef = useRef(null);

  useEffect(() => {
    let geo = null;
    if (nodes && nodes[geometryKey]?.geometry) {
      geo = nodes[geometryKey].geometry;
    } else {
      if (geometryKey === 'Cylinder') geo = new THREE.CylinderGeometry(1, 1, 2, 64, 1, true);
      else geo = new THREE.BoxGeometry(2, 2, 2, 64, 64, 64);
    }
    if (!geo) return;
    geo.computeBoundingBox();
    geoWidthRef.current = (geo.boundingBox.max.x - geo.boundingBox.min.x) || 1;
  }, [nodes, geometryKey]);

  useEffect(() => {
    (async () => {
      try {
        const snapshot = await html2canvas(document.body, { useCORS: true, backgroundColor: null, logging: false, scale: 1 });
        const tex = new THREE.CanvasTexture(snapshot);
        tex.flipY = true;
        setBgTex(tex);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    let ticking = false;
    const recapture = async () => {
      if (ticking) return;
      ticking = true;
      try {
        const shot = await html2canvas(document.body, { useCORS: true, backgroundColor: null, logging: false, scale: 1 });
        if (!bgTex) {
          const nt = new THREE.CanvasTexture(shot);
          nt.flipY = true;
          setBgTex(nt);
        } else {
          bgTex.image = shot;
          bgTex.needsUpdate = true;
        }
      } catch {}
      ticking = false;
    };
    const onScroll = () => recapture();
    const onResize = () => recapture();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [bgTex]);

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    precision mediump float;
    uniform vec3 iResolution;
    uniform float iTime;
    uniform vec4 iMouse;
    uniform sampler2D iChannel0;
    varying vec2 vUv;
    void main() {
      vec2 fragCoord = vUv * iResolution.xy;
      vec2 uv = fragCoord / iResolution.xy;
      vec2 mouse = iMouse.xy;
      if (length(mouse) < 1.0) {
        mouse = iResolution.xy * 0.5;
      }
      vec2 m2 = (uv - mouse / iResolution.xy);
      float roundedBox = pow(abs(m2.x * iResolution.x / iResolution.y), 6.0) + pow(abs(m2.y), 6.0);
      float rb1 = clamp((1.0 - roundedBox * 10000.0) * 8.0, 0.0, 1.0);
      float rb2 = clamp((0.95 - roundedBox * 9500.0) * 16.0, 0.0, 1.0) - clamp(pow(0.9 - roundedBox * 9500.0, 1.0) * 16.0, 0.0, 1.0);
      float rb3 = clamp((1.5 - roundedBox * 11000.0) * 2.0, 0.0, 1.0) - clamp(pow(1.0 - roundedBox * 11000.0, 1.0) * 2.0, 0.0, 1.0);
      vec2 n = normalize(vec2(m2.x, m2.y + 0.0001));
      float wave = sin(iTime * 2.0 + (m2.x*50.0 + m2.y*50.0)) * 0.001;
      vec2 lens = n * (rb1 * 0.004 + wave);
      vec4 base = texture2D(iChannel0, uv);
      vec4 refr = texture2D(iChannel0, uv + lens);
      vec4 blur = vec4(0.0);
      vec2 offs[8];
      offs[0] = vec2( 0.0010,  0.0000);
      offs[1] = vec2(-0.0010,  0.0000);
      offs[2] = vec2( 0.0000,  0.0010);
      offs[3] = vec2( 0.0000, -0.0010);
      offs[4] = vec2( 0.0008,  0.0008);
      offs[5] = vec2(-0.0008,  0.0008);
      offs[6] = vec2( 0.0008, -0.0008);
      offs[7] = vec2(-0.0008, -0.0008);
      for (int i = 0; i < 8; i++) {
        blur += texture2D(iChannel0, uv + lens + offs[i]);
      }
      blur /= 8.0;
      float gradient = clamp((clamp(m2.y, 0.0, 0.2) + 0.1) * 0.5, 0.0, 1.0) + clamp((clamp(-m2.y, -1000.0, 0.2) * rb3 + 0.1) * 0.5, 0.0, 1.0);
      vec4 lighting = clamp(refr + vec4(rb1) * gradient + vec4(rb2) * 0.3, 0.0, 1.0);
      float transition = clamp(rb1 + rb2 + rb3, 0.0, 1.0);
      vec4 glassFill = mix(base, blur, 0.55);
      vec4 col = clamp(glassFill + lighting * 0.9, 0.0, 1.0);
      float baseAlpha = 0.35;
      col.a = baseAlpha + transition * 0.45 + rb2 * 0.20 + rb1 * 0.10;
      col.rgb *= vec3(0.88, 0.92, 1.0);
      gl_FragColor = col;
    }
  `;

  useFrame((state, delta) => {
    const { gl, viewport, pointer, camera } = state;
    const v = viewport.getCurrentViewport(camera, [0, 0, 15]);
    const destX = followPointer ? (pointer.x * v.width) / 2 : 0;
    const destY = lockToBottom ? -v.height / 2 + 0.2 : followPointer ? (pointer.y * v.height) / 2 : 0;
    if (ref.current) {
      easing.damp3(ref.current.position, [destX, destY, 15], 0.15, delta);
      if (modeProps.scale == null) {
        if (geometryKey === 'Cube') {
          const barW = v.width * 0.82;
          const barH = Math.min(0.6, v.height * 0.16);
          ref.current.scale.set(barW, barH, 0.2);
        } else {
          const maxWorld = v.width * 0.9;
          const desired = maxWorld / geoWidthRef.current;
          ref.current.scale.setScalar(Math.min(0.25, desired));
        }
      } else if (Array.isArray(modeProps.scale)) {
        const [sx, sy, sz] = modeProps.scale;
        ref.current.scale.set(sx, sy ?? sx, sz ?? 0.2);
      }
    }
    gl.setRenderTarget(buffer);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.setClearColor(0x000000, 0);

    if (materialRef.current) {
      const size = state.size;
      materialRef.current.uniforms.iResolution.value.set(size.width, size.height, 1);
      materialRef.current.uniforms.iTime.value += delta;
      const mx = followPointer ? ((pointer.x * 0.5 + 0.5) * size.width) : size.width * 0.5;
      const my = followPointer ? ((-pointer.y * 0.5 + 0.5) * size.height) : size.height * 0.5;
      materialRef.current.uniforms.iMouse.value.set(mx, my, 0, 0);
      if (bgTex) materialRef.current.uniforms.iChannel0.value = bgTex;
    }
  });

  const { scale, ior, thickness, anisotropy, chromaticAberration, ...extraMat } = modeProps;

  return (
    <>
      {createPortal(children, scene)}
      <mesh scale={[vp.width, vp.height, 1]}>
        <planeGeometry />
        <shaderMaterial ref={materialRef} transparent depthWrite={false} toneMapped={false} uniforms={{ iResolution: { value: new THREE.Vector3() }, iTime: { value: 0 }, iMouse: { value: new THREE.Vector4() }, iChannel0: { value: bgTex ?? buffer.texture } }} vertexShader={vertexShader} fragmentShader={fragmentShader} />
      </mesh>
      {!shaderOnly && (
        <mesh ref={ref} scale={scale ?? 0.15} rotation-x={Math.PI / 2} geometry={nodes?.[geometryKey]?.geometry ?? (geometryKey === 'Cylinder' ? new THREE.CylinderGeometry(1, 1, 2, 64, 1, true) : new THREE.BoxGeometry(2, 2, 2, 64, 64, 64))} {...props}>
          <MeshTransmissionMaterial background={bgTex ?? buffer.texture} transmission={extraMat?.transmission ?? 1} roughness={extraMat?.roughness ?? 0} ior={ior ?? 1.45} thickness={thickness ?? 12} anisotropy={anisotropy ?? 0.1} chromaticAberration={chromaticAberration ?? 0.08} distortion={extraMat?.distortion ?? 0.08} temporalDistortion={extraMat?.temporalDistortion ?? 0.15} samples={extraMat?.samples ?? 32} resolution={extraMat?.resolution ?? 1024} clearcoat={1} clearcoatRoughness={0} attenuationColor={extraMat?.attenuationColor ?? '#ffffff'} attenuationDistance={extraMat?.attenuationDistance ?? 0.25} {...extraMat} />
        </mesh>
      )}
    </>
  );
});

function Lens({ modeProps, ...p }) {
  return <ModeWrapper glb="" geometryKey="Cylinder" followPointer modeProps={modeProps} {...p} />;
}

function Cube({ modeProps, ...p }) {
  return <ModeWrapper glb="" geometryKey="Cube" followPointer modeProps={modeProps} {...p} />;
}

function Bar({ modeProps = {}, ...p }) {
  const baseMat = {
    transmission: 1,
    roughness: 0,
    thickness: 10,
    ior: 1.15,
    color: '#ffffff',
    attenuationColor: '#ffffff',
    attenuationDistance: 0.25,
  };
  return (
    <ModeWrapper glb="" geometryKey="Cube" followPointer={false} shaderOnly modeProps={{ ...baseMat, ...modeProps }} {...p} />
  );
}

function Images() {
  const group = useRef(null);
  const data = Scroll.useScroll ? Scroll.useScroll() : null;
  const { height } = useThree((s) => s.viewport);

  useFrame(() => {
    if (!group.current || !data) return;
    const c = group.current.children;
    if (c[0]?.material) c[0].material.zoom = 1 + data.range(0, 1 / 3) / 3;
    if (c[1]?.material) c[1].material.zoom = 1 + data.range(0, 1 / 3) / 3;
    const r = (data.range(1.15 / 3, 1 / 3) || 0) / 2;
    if (c[2]?.material) c[2].material.zoom = 1 + r;
    if (c[3]?.material) c[3].material.zoom = 1 + r;
    if (c[4]?.material) c[4].material.zoom = 1 + r;
  });

  return (
    <group ref={group}>
      <Image position={[-2, 0, 0]} scale={[3, height / 1.1, 1]} url="/assets/demo/cs1.webp" />
      <Image position={[2, 0, 3]} scale={3} url="/assets/demo/cs2.webp" />
      <Image position={[-2.05, -height, 6]} scale={[1, 3, 1]} url="/assets/demo/cs3.webp" />
      <Image position={[-0.6, -height, 9]} scale={[1, 2, 1]} url="/assets/demo/cs1.webp" />
      <Image position={[0.75, -height, 10.5]} scale={1.5} url="/assets/demo/cs2.webp" />
    </group>
  );
}

function Typography() {
  return (
    <Text position={[0, 0, 12]} fontSize={0.4} letterSpacing={-0.05} outlineWidth={0} outlineBlur="20%" outlineColor="#000" outlineOpacity={0.5} color="white" anchorX="center" anchorY="middle">
      React Bits
    </Text>
  );
}
