import React, { useMemo, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'
import * as THREE from 'three'
import { useData } from './hooks/useData'
import { InfoPanel } from './components/InfoPanel'
import './App.css'; 

// ConnectionLines component (No changes here)
function ConnectionLines({ processedData, selectedNodeId }) {
    if (!selectedNodeId) return null;
    const selectedNode = processedData.find(node => node.id === selectedNodeId);
    if (!selectedNode) return null;
    const neighborNodes = selectedNode.neighbors.map(neighborId =>
        processedData.find(node => node.id === neighborId)
    ).filter(Boolean);
    return (
        <group>
            {neighborNodes.map(neighbor => (
                <Line
                    key={neighbor.id}
                    points={[selectedNode.position, neighbor.position]}
                    color="#facc15"
                    lineWidth={1.5}
                />
            ))}
        </group>
    );
}

// PointGalaxy component mein changes hain
function PointGalaxy({ processedData, selected, setSelected }) {
    // Hover state ke liye
    const [hovered, setHovered] = useState(null);

    const { positions, colors } = useMemo(() => {
        const finalPositions = processedData.flatMap(p => p.position);

        const finalColors = processedData.map((node, i) => {
            if (node.id === selected) {
                return [1, 1, 0]; // Yellow for selected
            } else if (i === hovered) {
                return [0.8, 0.8, 1]; // Light purple/blue for hovered
            }
            return [0.38, 0.85, 0.98]; // Default light blue
        }).flat();

        return { positions: finalPositions, colors: finalColors };
    }, [processedData, selected, hovered]);

    const handleClick = useCallback((event) => {
        event.stopPropagation();
        const clickedNodeId = processedData[event.index].id;
        setSelected(prevSelected => prevSelected === clickedNodeId ? null : clickedNodeId);
    }, [processedData, setSelected]);

    return (
        <points
            onClick={handleClick}
            onPointerMove={(e) => { e.stopPropagation(); setHovered(e.index); }}
            onPointerOut={() => setHovered(null)}
        >
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={positions.length / 3} array={new Float32Array(positions)} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={colors.length / 3} array={new Float32Array(colors)} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.025} sizeAttenuation={true} vertexColors={true} />
        </points>
    )
}


function App() {
  const rawData = useData('/space_data.json');
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const processedData = useMemo(() => {
    if (!rawData) return null;

    const points = rawData.map(p => new THREE.Vector3(...p.position));
    const boundingBox = new THREE.Box3().setFromPoints(points);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = 10 / maxDim;

    // --- YEH HAI FIX ---
    // Humne neeche waali line se '(node, index)' ko badal kar sirf '(node)' kar diya hai
    // kyunki humein index ki zaroorat nahi hai.
    return rawData.map((node) => { 
      const originalPos = new THREE.Vector3(...node.position); // Hum position direct 'node' se le rahe hain
      const finalPos = originalPos.sub(center).multiplyScalar(scaleFactor);
      return {
        ...node,
        position: [finalPos.x, finalPos.y, finalPos.z]
      };
    });
  }, [rawData]);

  const selectedNodeData = useMemo(() => {
    if (!selectedNodeId || !processedData) return null;
    return processedData.find(node => node.id === selectedNodeId);
  }, [selectedNodeId, processedData]);

  if (!processedData) {
    return <div style={{ color: 'white', textAlign: 'center', paddingTop: '20px', fontSize: '2em' }}>Processing The Weaver's Data...</div>
  }

  return (
    <>
      <InfoPanel node={selectedNodeData} />
      <Canvas
        raycaster={{ params: { Points: { threshold: 0.1 } } }}
        camera={{ position: [0, 0, 12], fov: 60 }}
        onPointerMissed={() => setSelectedNodeId(null)}
      >
        <ambientLight intensity={0.5} />
        <PointGalaxy processedData={processedData} selected={selectedNodeId} setSelected={setSelectedNodeId} />
        <ConnectionLines processedData={processedData} selectedNodeId={selectedNodeId} />
        <OrbitControls
          enableZoom={true}
          autoRotate={!selectedNodeId}
          autoRotateSpeed={0.3}
          zoomSpeed={0.8}
        />
      </Canvas>
    </>
  )
}

export default App