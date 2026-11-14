import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ComplexData, ComplexBiddingState, GameState } from '../../types/game';
import { sound } from '../../utils/sound';

interface Props {
  complexes: ComplexData[];
  gameState: GameState;
  selectedComplexId: number | null;
  onSelectComplex: (id: number) => void;
}

// -------------------------------------------------------------
// Procedural Apartment Facade Texture Generator
// -------------------------------------------------------------
const textureCache = new Map<string, THREE.CanvasTexture>();

function getApartmentTexture(
  colorHex: number,
  buildingNum: string,
  floors: number,
  bays: number,
  isSideWall = false
): THREE.CanvasTexture {
  const cacheKey = `${colorHex}_${buildingNum}_${floors}_${bays}_${isSideWall}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base building exterior color (warm modern concrete tone with slight brand accent tint)
  const hexStr = '#' + colorHex.toString(16).padStart(6, '0');
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, 512, 512);

  if (isSideWall) {
    // ----------------- 측벽 (Side Wall) -----------------
    // Modern accent vertical stripe
    ctx.fillStyle = hexStr;
    ctx.fillRect(40, 0, 80, 512);

    // Stone base at bottom
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 460, 512, 52);

    // Building number on top (e.g. 101, 102)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(buildingNum, 80, 70);

    // Small decorative brand emblem
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(80, 110, 14, 0, Math.PI * 2);
    ctx.fill();

    // Subtle panel lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    for (let y = 60; y < 460; y += 40) {
      ctx.beginPath();
      ctx.moveTo(130, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
  } else {
    // ----------------- 전면/후면 (Front/Back Facade) -----------------
    const floorHeight = (512 - 40) / floors;
    const bayWidth = (512 - 30) / bays;

    // Ground floor stone piloti base
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 512 - 40, 512, 40);

    // Entrance doors in center
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(216, 512 - 36, 80, 36);
    ctx.fillStyle = '#38bdf8';
    ctx.globalAlpha = 0.8;
    ctx.fillRect(226, 512 - 30, 60, 30);
    ctx.globalAlpha = 1.0;

    // Floor-by-floor windows & balconies
    for (let f = 0; f < floors; f++) {
      const y = (floors - 1 - f) * floorHeight;

      // Slab separator line
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, y + floorHeight - 2, 512, 2);

      // Accent color beam
      if (f % 4 === 0) {
        ctx.fillStyle = hexStr;
        ctx.globalAlpha = 0.45;
        ctx.fillRect(0, y, 512, 4);
        ctx.globalAlpha = 1.0;
      }

      for (let b = 0; b < bays; b++) {
        const x = 15 + b * bayWidth;
        const winW = bayWidth * 0.72;
        const winH = floorHeight * 0.65;
        const winY = y + floorHeight * 0.18;

        // Window frame
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, winY, winW, winH);

        // Window Glass: Lit vs reflective glass
        const isLit = (f * 7 + b * 11) % 5 === 0;
        ctx.fillStyle = isLit ? '#fef08a' : '#38bdf8';
        ctx.globalAlpha = isLit ? 0.95 : 0.4;
        ctx.fillRect(x + 2, winY + 2, winW - 4, winH - 4);
        ctx.globalAlpha = 1.0;

        // Balcony railing
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, winY + winH * 0.45, winW, winH * 0.55);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set(cacheKey, texture);
  return texture;
}

// -------------------------------------------------------------
// Floating 3D Complex Billboard Sprite
// -------------------------------------------------------------
function createComplexBillboard(
  complexName: string,
  statusText: string,
  unitsText: string,
  colorHex: number
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 120;
  const ctx = canvas.getContext('2d')!;

  const hexStr = '#' + colorHex.toString(16).padStart(6, '0');

  // Background rounded card
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.beginPath();
  ctx.roundRect(8, 8, 304, 104, 18);
  ctx.fill();

  // Border with status color
  ctx.strokeStyle = hexStr;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Complex Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(complexName, 160, 50);

  // Status & Units pill
  ctx.fillStyle = hexStr;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`${unitsText} · ${statusText}`, 160, 88);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
    transparent: true,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(5.2, 1.95, 1);
  return sprite;
}

// -------------------------------------------------------------
// Main CityMapCanvas Component
// -------------------------------------------------------------
export const CityMapCanvas: React.FC<Props> = ({
  complexes,
  gameState,
  selectedComplexId,
  onSelectComplex,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredComplex, setHoveredComplex] = useState<ComplexData | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.013);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 38, 44);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    sunLight.position.set(30, 55, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 140;
    sunLight.shadow.camera.left = -45;
    sunLight.shadow.camera.right = 45;
    sunLight.shadow.camera.top = 45;
    sunLight.shadow.camera.bottom = -45;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
    fillLight.position.set(-25, 25, -25);
    scene.add(fillLight);

    // 3. Ground & Road Grid
    const groundGeo = new THREE.PlaneGeometry(90, 90);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(80, 16, 0x1e293b, 0x1e293b);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // 4. Complex Plots and Realistic Apartment Blocks
    const interactiveMeshes: THREE.Mesh[] = [];
    const cranes: THREE.Group[] = [];

    const getComplexColor = (state: ComplexBiddingState) => {
      if (state.winnerId === gameState.playerCompanyId) return 0x3b82f6; // Blue (Won)
      if (state.winnerId) return 0xa855f7; // Purple (Rival won)
      if (state.currentStage === 'interest') return 0x64748b; // Gray

      const myScore = state.supportScores[gameState.playerCompanyId]?.totalFavorability || 0;
      const otherScores = Object.entries(state.supportScores)
        .filter(([id, s]) => id !== gameState.playerCompanyId && !s.isWithdrawn)
        .map(([, s]) => s.totalFavorability);
      const topOther = otherScores.length > 0 ? Math.max(...otherScores) : 0;

      if (myScore >= 60 && myScore > topOther + 10) return 0x22c55e; // Green (Lead)
      if (topOther >= 60 && topOther > myScore + 10) return 0xef4444; // Red (Rival lead)
      return 0xf59e0b; // Yellow (Contested)
    };

    const getStatusText = (state: ComplexBiddingState) => {
      if (state.winnerId === gameState.playerCompanyId) return '당사 수주';
      if (state.winnerId) return '경쟁사 수주';
      if (state.currentStage === 'interest') return '수주전 대기';
      const myScore = state.supportScores[gameState.playerCompanyId]?.totalFavorability || 0;
      return `지지율 ${myScore}%`;
    };

    complexes.forEach((complex) => {
      const bState = gameState.complexStates[complex.id];
      const complexColorHex = getComplexColor(bState);
      const isSelected = selectedComplexId === complex.id;
      const group = new THREE.Group();
      group.position.set(complex.mapPos.x * 2.7, 0, complex.mapPos.z * 2.7);

      const plotW = 5.8;
      const plotD = 5.8;

      // Base Ground Plot (Asphalt & Border)
      const plotGeo = new THREE.BoxGeometry(plotW, 0.3, plotD);
      const plotMat = new THREE.MeshLambertMaterial({
        color: isSelected ? 0xd97706 : 0x1e293b,
      });
      const plotMesh = new THREE.Mesh(plotGeo, plotMat);
      plotMesh.position.y = 0.15;
      plotMesh.receiveShadow = true;
      (plotMesh as any).complexId = complex.id;
      group.add(plotMesh);
      interactiveMeshes.push(plotMesh);

      // Plot Status Border Glow
      const borderGeo = new THREE.BoxGeometry(plotW + 0.12, 0.1, plotD + 0.12);
      const borderMat = new THREE.MeshBasicMaterial({ color: complexColorHex });
      const borderMesh = new THREE.Mesh(borderGeo, borderMat);
      borderMesh.position.y = 0.32;
      group.add(borderMesh);

      // Central Landscaped Park / Green Garden
      const parkGeo = new THREE.BoxGeometry(plotW * 0.72, 0.05, plotD * 0.72);
      const parkMat = new THREE.MeshLambertMaterial({ color: 0x14532d }); // Dark emerald grass
      const parkMesh = new THREE.Mesh(parkGeo, parkMat);
      parkMesh.position.set(0, 0.32, 0);
      parkMesh.receiveShadow = true;
      group.add(parkMesh);

      // Low-poly Landscaping Trees (Trunk + Foliage) in the park
      const treePositions = [
        { x: -0.8, z: -0.6 },
        { x: 0.9, z: -0.5 },
        { x: -0.7, z: 0.8 },
        { x: 0.8, z: 0.7 },
      ];
      treePositions.forEach((tp) => {
        const trunkGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.35, 5);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(tp.x, 0.5, tp.z);
        group.add(trunk);

        const foliageGeo = new THREE.DodecahedronGeometry(0.22);
        const foliageMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
        const foliage = new THREE.Mesh(foliageGeo, foliageMat);
        foliage.position.set(tp.x, 0.72, tp.z);
        foliage.castShadow = true;
        group.add(foliage);
      });

      // Complex Entrance Gate Arch (아파트 문주)
      const gatePillarGeo = new THREE.BoxGeometry(0.18, 0.7, 0.18);
      const gatePillarMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
      const p1 = new THREE.Mesh(gatePillarGeo, gatePillarMat);
      p1.position.set(-0.7, 0.65, plotD / 2 - 0.25);
      const p2 = new THREE.Mesh(gatePillarGeo, gatePillarMat);
      p2.position.set(0.7, 0.65, plotD / 2 - 0.25);
      const gateBeamGeo = new THREE.BoxGeometry(1.6, 0.15, 0.22);
      const gateBeamMat = new THREE.MeshLambertMaterial({ color: complexColorHex });
      const beam = new THREE.Mesh(gateBeamGeo, gateBeamMat);
      beam.position.set(0, 1.0, plotD / 2 - 0.25);
      group.add(p1);
      group.add(p2);
      group.add(beam);

      // ---------------------------------------------------------
      // Realistic Korean Apartment Buildings (판상형 + 타워형)
      // ---------------------------------------------------------
      // Layout 4 substantial apartment buildings in courtyard configuration
      const avgFl = complex.mapPos.avgFloors || 15;
      const bHeightBase = 1.8 + (avgFl / 15) * 1.5;

      const buildingConfigs = [
        // 101동 (Back Left - Wide Slab)
        {
          num: '101',
          width: 2.3,
          depth: 0.85,
          height: bHeightBase * 1.05,
          x: -1.3,
          z: -1.5,
          rotY: 0,
          floors: Math.min(25, Math.max(10, avgFl)),
          bays: 4,
        },
        // 102동 (Back Right - Wide Slab)
        {
          num: '102',
          width: 2.3,
          depth: 0.85,
          height: bHeightBase * 0.95,
          x: 1.3,
          z: -1.5,
          rotY: 0,
          floors: Math.min(25, Math.max(10, avgFl)),
          bays: 4,
        },
        // 103동 (Front Left - Tower/Stepped)
        {
          num: '103',
          width: 1.8,
          depth: 0.85,
          height: bHeightBase * 1.1,
          x: -1.4,
          z: 1.1,
          rotY: 0,
          floors: Math.min(28, Math.max(12, avgFl + 2)),
          bays: 3,
        },
        // 104동 (Front Right - Slab)
        {
          num: '104',
          width: 1.8,
          depth: 0.85,
          height: bHeightBase * 1.0,
          x: 1.4,
          z: 1.1,
          rotY: 0,
          floors: Math.min(24, Math.max(10, avgFl)),
          bays: 3,
        },
      ];

      let maxHeight = 0;

      buildingConfigs.forEach((cfg) => {
        maxHeight = Math.max(maxHeight, cfg.height);

        // Building Materials: Front/Back facade + Side wall + Roof + Base
        const frontTex = getApartmentTexture(complexColorHex, cfg.num, cfg.floors, cfg.bays, false);
        const sideTex = getApartmentTexture(complexColorHex, cfg.num, cfg.floors, cfg.bays, true);

        const materials = [
          new THREE.MeshLambertMaterial({ map: sideTex }), // Right side
          new THREE.MeshLambertMaterial({ map: sideTex }), // Left side
          new THREE.MeshLambertMaterial({ color: 0x475569 }), // Roof
          new THREE.MeshLambertMaterial({ color: 0x1e293b }), // Bottom
          new THREE.MeshLambertMaterial({ map: frontTex }), // Front
          new THREE.MeshLambertMaterial({ map: frontTex }), // Back
        ];

        const bGeo = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth);
        const bMesh = new THREE.Mesh(bGeo, materials);
        bMesh.position.set(cfg.x, 0.3 + cfg.height / 2, cfg.z);
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;
        (bMesh as any).complexId = complex.id;
        group.add(bMesh);
        interactiveMeshes.push(bMesh);

        // Rooftop Elevator Core / Machine Room (옥탑 기계실)
        const coreGeo = new THREE.BoxGeometry(cfg.width * 0.45, 0.35, cfg.depth * 0.6);
        const coreMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        coreMesh.position.set(cfg.x, 0.3 + cfg.height + 0.175, cfg.z);
        group.add(coreMesh);

        // Rooftop Helipad / Solar Panel Accent
        const solarGeo = new THREE.BoxGeometry(cfg.width * 0.3, 0.05, cfg.depth * 0.4);
        const solarMat = new THREE.MeshLambertMaterial({ color: complexColorHex });
        const solarMesh = new THREE.Mesh(solarGeo, solarMat);
        solarMesh.position.set(cfg.x + cfg.width * 0.2, 0.3 + cfg.height + 0.025, cfg.z);
        group.add(solarMesh);

        // Active Bidding Campaign Banner on Side Wall (시공사 홍보 현수막)
        if (bState.currentStage === 'bidding' || bState.currentStage === 'selection') {
          const bannerGeo = new THREE.PlaneGeometry(0.35, cfg.height * 0.65);
          const bannerMat = new THREE.MeshBasicMaterial({
            color: complexColorHex,
            side: THREE.DoubleSide,
          });
          const bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
          bannerMesh.position.set(cfg.x + cfg.width / 2 + 0.02, 0.3 + cfg.height * 0.6, cfg.z);
          bannerMesh.rotation.y = Math.PI / 2;
          group.add(bannerMesh);
        }
      });

      // Construction Tower Crane for Active / Contracted Complexes
      if (
        bState.currentStage === 'bidding' ||
        bState.currentStage === 'selection' ||
        bState.winnerId
      ) {
        const craneGroup = new THREE.Group();
        const mastHeight = maxHeight + 1.8;
        const mastGeo = new THREE.BoxGeometry(0.12, mastHeight, 0.12);
        const mastMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.y = mastHeight / 2;
        craneGroup.add(mast);

        const boomGeo = new THREE.BoxGeometry(2.4, 0.1, 0.1);
        const boom = new THREE.Mesh(boomGeo, mastMat);
        boom.position.set(0.8, mastHeight, 0);
        craneGroup.add(boom);

        // Red beacon on crane tip
        const beaconGeo = new THREE.SphereGeometry(0.08, 6, 6);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(2.0, mastHeight + 0.05, 0);
        craneGroup.add(beacon);

        craneGroup.position.set(plotW / 2 - 0.6, 0.3, -plotD / 2 + 0.6);
        group.add(craneGroup);
        cranes.push(craneGroup);
      }

      // Floating 3D Complex Billboard Sprite
      const billboard = createComplexBillboard(
        complex.name,
        getStatusText(bState),
        `${complex.plannedUnits.toLocaleString()}세대`,
        complexColorHex
      );
      billboard.position.set(0, maxHeight + 2.4, 0);
      group.add(billboard);

      scene.add(group);
    });

    // 5. Raycasting for Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as any;
        if (hit.complexId) {
          const comp = complexes.find((c) => c.id === hit.complexId);
          setHoveredComplex(comp || null);
          container.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredComplex(null);
      container.style.cursor = 'default';
    };

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as any;
        if (hit.complexId) {
          sound.playClick();
          onSelectComplex(hit.complexId);
        }
      }
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('click', handleClick);

    // 6. Camera Orbit / Pan Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const handleMouseMoveDrag = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      const angle = deltaX * 0.005;
      camera.position.x = camera.position.x * Math.cos(angle) + camera.position.z * Math.sin(angle);
      camera.position.z = camera.position.z * Math.cos(angle) - camera.position.x * Math.sin(angle);

      camera.position.y = Math.max(14, Math.min(65, camera.position.y - deltaY * 0.08));
      camera.lookAt(0, 0, 0);
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
      camera.position.multiplyScalar(zoomFactor);
      camera.position.clampLength(16, 90);
      camera.lookAt(0, 0, 0);
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMoveDrag);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    // 7. Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Rotate cranes slowly
      cranes.forEach((crane) => {
        crane.rotation.y += delta * 0.35;
      });

      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMoveDrag);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [complexes, gameState, selectedComplexId]);

  return (
    <div className="relative w-full h-[500px] lg:h-[640px] rounded-lg overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-950">
      <div ref={mountRef} className="w-full h-full" />

      {/* Map Legend */}
      <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-700/80 rounded-md p-2.5 backdrop-blur-md text-xs shadow-lg flex flex-col gap-1.5 pointer-events-none">
        <span className="font-pixel text-slate-300 font-bold text-[11px] mb-0.5">단지 수주전 상태</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 shadow-sm" />
          <span className="text-slate-200">당사 수주 완료</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
          <span className="text-slate-200">경쟁사 수주 완료</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
          <span className="text-slate-200">당사 우세</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
          <span className="text-slate-200">박빙 경합</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
          <span className="text-slate-200">경쟁사 우세</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-500" />
          <span className="text-slate-200">수주전 준비</span>
        </div>
      </div>

      {/* Controls Hint */}
      <div className="absolute bottom-3 left-3 bg-slate-900/80 border border-slate-700/60 rounded px-2.5 py-1 text-[11px] text-slate-400 font-mono pointer-events-none">
        마우스 드래그: 카메라 회전 / 휠: 줌 인·아웃 / 단지 클릭: 상세 정보
      </div>

      {/* Hover Info Card */}
      {hoveredComplex && (
        <div className="absolute top-3 right-3 bg-slate-900/95 border-2 border-amber-500 rounded-md p-3 backdrop-blur-md shadow-2xl pointer-events-none max-w-xs animate-in fade-in">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-1.5">
            <h4 className="font-pixel text-sm font-bold text-white">
              {hoveredComplex.name}
            </h4>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
              {hoveredComplex.plannedUnits.toLocaleString()}세대 계획
            </span>
          </div>
          <p className="text-xs text-slate-300 mb-2">{hoveredComplex.tagline}</p>
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>공사비 {(hoveredComplex.expectedCost / 10000).toFixed(1)}조원</span>
            <span className="text-emerald-400">예상 마진 {hoveredComplex.baseExpectedProfitMargin}%</span>
          </div>
        </div>
      )}
    </div>
  );
};