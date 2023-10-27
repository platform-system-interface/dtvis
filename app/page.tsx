"use client";
import Image from "next/image"
import { useCallback, useState } from "react";
import ReactFlow, {
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  addEdge
} from "reactflow";
import styles from "./page.module.css"
// TODO: wire up; this is a fixture
import { nodes as iNodes, edges as iEdges } from "./nodes-edges.json";

export default function Home() {
  const [parseRes, setParseRes] = useState("");
  const [nodes, , onNodesChange] = useNodesState(iNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(iEdges);
  
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // TODO: file picker, pass file to parser
  const parseDtb = async() => {
    const parser = await import("../parser/pkg");
    const res = await parser.parse_dtb();
    setParseRes(JSON.stringify(res));
  };

  return (
    <main className={styles.main}>
      <h1>Device Tree Visualizer</h1>
      <button onClick={parseDtb}>parse DTB</button>
      Result: <pre>{parseRes}</pre>
      <div style={{ width: "100vw", height: "90%" }}>
        <ReactFlow
          {...{ nodes, edges, onNodesChange, onEdgesChange, onConnect }}>
          <Controls />
        </ReactFlow>
      </div>
    </main>
  )
}
