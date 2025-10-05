import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'
import * as THREE from 'three'
import lunr from 'lunr'

// Apne saare components import karein
import { useData } from './hooks/useData'
import { InfoPanel } from './components/InfoPanel'
import { SearchBar } from './components/SearchBar'
import './App.css';

// Yeh helper component camera ki movement ko smooth banata hai
function ControlsUpdater({ controlsRef }) {
    useFrame(() => {
        // Damping ko kaam karne ke liye controls ko har frame update karna zaroori hai
        if (controlsRef.current) {
            controlsRef.current.update();
        }
    });
    return null;
}

// ConnectionLines aur PointGalaxy components mein koi change nahi hai
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

function PointGalaxy({ processedData, selected, setSelected }) {
    const [hovered, setHovered] = useState(null);

    const { positions, colors } = useMemo(() => {
        const finalPositions = processedData.flatMap(p => p.position);
        const finalColors = processedData.map((node, i) => {
            if (node.id === selected) return [1, 1, 0];
            if (i === hovered) return [0.8, 0.8, 1];
            return [0.38, 0.85, 0.98];
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
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const controlsRef = useRef();

    const { processedData, searchIndex } = useMemo(() => {
        if (!rawData) return { processedData: null, searchIndex: null };
        const points = rawData.map(p => new THREE.Vector3(...p.position));
        const boundingBox = new THREE.Box3().setFromPoints(points);
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleFactor = 10 / maxDim;
        const processed = rawData.map(node => {
            const originalPos = new THREE.Vector3(...node.position);
            const finalPos = originalPos.sub(center).multiplyScalar(scaleFactor);
            return { ...node, position: [finalPos.x, finalPos.y, finalPos.z] };
        });
        const index = lunr(function () {
            this.ref('id'); this.field('label'); this.field('summary');
            processed.forEach(doc => { this.add(doc); });
        });
        return { processedData: processed, searchIndex: index };
    }, [rawData]);

    useEffect(() => {
        if (searchQuery && searchIndex && processedData) {
            const results = searchIndex.search(`*${searchQuery}*`);
            const resultNodes = results.map(result => processedData.find(node => node.id === result.ref)).filter(Boolean);
            setSearchResults(resultNodes);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, searchIndex, processedData]);

    // --- YAHAN DEBUGGING LOGS ADD KIYE HAIN ---
    const handleFlyTo = (nodeId) => {
        console.log("1. handleFlyTo triggered with ID:", nodeId); // Check 1: Kya function call hua?

        const node = processedData.find(n => n.id === nodeId);
        console.log("2. Found node:", node); // Check 2: Kya node data mila?

        console.log("3. Controls ref current value:", controlsRef.current); // Check 3: Kya camera controls ready hain?

        if (node && controlsRef.current) {
            console.log("4. All conditions MET. Trying to move camera...");
            const [x, y, z] = node.position;
            controlsRef.current.target.set(x, y, z);
            controlsRef.current.object.position.set(x, y, z + 5);
            
            setSelectedNodeId(nodeId);
            setSearchQuery('');
        } else {
            console.error("5. Conditions NOT MET. Could not move camera.");
        }
    };

    const selectedNodeData = useMemo(() => {
        if (!selectedNodeId || !processedData) return null;
        return processedData.find(node => node.id === selectedNodeId);
    }, [selectedNodeId, processedData]);

    if (!processedData) {
        return <div style={{ color: 'white', textAlign: 'center', paddingTop: '20px', fontSize: '2em' }}>Processing The Weaver's Data...</div>
    }

    // Baaki ka return statement bilkul same hai
    return (
        <>
            <SearchBar query={searchQuery} setQuery={setSearchQuery} results={searchResults} onResultClick={handleFlyTo} />
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
                    ref={controlsRef}
                    enableDamping={true}
                    dampingFactor={0.05}
                    enableZoom={true}
                    autoRotate={!selectedNodeId}
                    autoRotateSpeed={0.3}
                    zoomSpeed={0.8}
                />
                <ControlsUpdater controlsRef={controlsRef} />
            </Canvas>
        </>
    )
}

export default App