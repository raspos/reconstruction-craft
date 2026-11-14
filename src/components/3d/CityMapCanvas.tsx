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
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    // Isometric-like view
    camera.position.set(0, 36, 42);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    sunLight.position.set(24, 48, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 120;
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    fillLight.position.set(-20, 20, -20);
    scene.add(fillLight);

    // 3. Ground & Road Grid
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // Road Grid lines
    const gridHelper = new THREE.GridHelper(70, 14, 0x1e293b, 0x1e293b);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // 4. Complex Plots and Buildings
    const complexGroups: { [key: number]: THREE.Group } = {};
    const interactiveMeshes: THREE.Mesh[] = [];
    const cranes: THREE.Group[] = [];

    // Color resolution logic based on game state
    const getComplexColor = (complex: ComplexData, state: ComplexBiddingState) => {
      if (state.winnerId === gameState.playerCompanyId) return 0x3b82f6; // Blue (Won by player)
      if (state.winnerId) return 0xa855f7; // Purple (Won by rival)

      if (state.currentStage === 'interest') return 0x475569; // Gray (Prep)

      const myScore = state.supportScores[gameState.playerCompanyId]?.totalFavorability || 0;
      const otherScores = Object.entries(state.supportScores)
        .filter(([id, s]) => id !== gameState.playerCompanyId && !s.isWithdrawn)
        .map(([, s]) => s.totalFavorability);
      const topOther = otherScores.length > 0 ? Math.max(...otherScores) : 0;

      if (myScore >= 60 && myScore > topOther + 10) return 0x22c55e; // Green (Player lead)
      if (topOther >= 60 && topOther > myScore + 10) return 0xef4444; // Red (Rival lead)
      return 0xeab308; // Yellow (Contested)
    };

    complexes.forEach((complex) => {
      const bState = gameState.complexStates[complex.id];
      const complexColorHex = getComplexColor(complex, bState);
      const group = new THREE.Group();
      group.position.set(complex.mapPos.x * 2.6, 0, complex.mapPos.z * 2.6);

      // Base Plot
      const plotWidth = 5.2;
      const plotDepth = 5.2;
      const plotGeo = new THREE.BoxGeometry(plotWidth, 0.4, plotDepth);
      const isSelected = selectedComplexId === complex.id;
      const plotMat = new THREE.MeshLambertMaterial({
        color: isSelected ? 0xf59e0b : 0x1f2937,
      });
      const plotMesh = new THREE.Mesh(plotGeo, plotMat);
      plotMesh.position.y = 0.2;
      plotMesh.receiveShadow = true;
      (plotMesh as any).complexId = complex.id;
      group.add(plotMesh);
      interactiveMeshes.push(plotMesh);

      // Status Border Line / Beacon
      const borderGeo = new THREE.BoxGeometry(plotWidth + 0.1, 0.15, plotDepth + 0.1);
      const borderMat = new THREE.MeshBasicMaterial({ color: complexColorHex });
      const borderMesh = new THREE.Mesh(borderGeo, borderMat);
      borderMesh.position.y = 0.42;
      group.add(borderMesh);

      // Procedural Voxel Apartment Towers based on scale
      // 14단지는 최대 규모(5,123세대, 26동), 7단지 중심부(4,341세대, 22동)
      const buildingCount = Math.min(16, complex.mapPos.buildingCount);
      const rows = Math.ceil(Math.sqrt(buildingCount));
      const cols = Math.ceil(buildingCount / rows);
      const spacingX = (plotWidth - 1.2) / Math.max(1, cols - 1);
      const spacingZ = (plotDepth - 1.2) / Math.max(1, rows - 1);

      let placed = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (placed >= buildingCount) break;

          const height = 1.0 + (complex.mapPos.avgFloors / 15) * 1.8 + Math.random() * 0.4;
          const bGeo = new THREE.BoxGeometry(0.7, height, 0.7);
          const bMat = new THREE.MeshLambertMaterial({
            color: complexColorHex,
          });
          const bMesh = new THREE.Mesh(bGeo, bMat);
          const posX = -plotWidth / 2 + 0.6 + (cols > 1 ? c * spacingX : (plotWidth - 1.2) / 2);
          const posZ = -plotDepth / 2 + 0.6 + (rows > 1 ? r * spacingZ : (plotDepth - 1.2) / 2);

          bMesh.position.set(posX, 0.4 + height / 2, posZ);
          bMesh.castShadow = true;
          bMesh.receiveShadow = true;
          (bMesh as any).complexId = complex.id;
          group.add(bMesh);
          interactiveMeshes.push(bMesh);

          // Roof highlight
          const roofGeo = new THREE.BoxGeometry(0.74, 0.1, 0.74);
          const roofMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
          const roofMesh = new THREE.Mesh(roofGeo, roofMat);
          roofMesh.position.set(posX, 0.4 + height + 0.05, posZ);
          group.add(roofMesh);

          placed++;
        }
      }

      // If contracted or under active construction, add a low-poly crane
      if (bState.currentStage === 'bidding' || bState.currentStage === 'selection' || bState.winnerId) {
        const craneGroup = new THREE.Group();
        const mastGeo = new THREE.BoxGeometry(0.12, 4.2, 0.12);
        const mastMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.y = 2.1;
        craneGroup.add(mast);

        const boomGeo = new THREE.BoxGeometry(2.2, 0.1, 0.1);
        const boom = new THREE.Mesh(boomGeo, mastMat);
        boom.position.set(0.6, 4.2, 0);
        craneGroup.add(boom);

        craneGroup.position.set(plotWidth / 2 - 0.5, 0.4, plotDepth / 2 - 0.5);
        group.add(craneGroup);
        cranes.push(craneGroup);
      }

      scene.add(group);
      complexGroups[complex.id] = group;
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

      // Rotate camera around center
      const angle = deltaX * 0.005;
      camera.position.x = camera.position.x * Math.cos(angle) + camera.position.z * Math.sin(angle);
      camera.position.z = camera.position.z * Math.cos(angle) - camera.position.x * Math.sin(angle);

      // Height
      camera.position.y = Math.max(15, Math.min(60, camera.position.y - deltaY * 0.08));
      camera.lookAt(0, 0, 0);
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
      camera.position.multiplyScalar(zoomFactor);
      camera.position.clampLength(18, 85);
      camera.lookAt(0, 0, 0);
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMoveDrag);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    // 7. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Rotate cranes slowly
      cranes.forEach((crane) => {
        crane.rotation.y += delta * 0.4;
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
    <div className="relative w-full h-[480px] lg:h-[620px] rounded-lg overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-950">
      <div ref={mountRef} className="w-full h-full" />

      {/* Map Legend (Color Meaning) */}
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
          <span className="text-slate-200">수주전 준비 / 관심</span>
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
