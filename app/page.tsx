"use client";
import Image from "next/image"
import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  addEdge
} from "reactflow";
import { useFilePicker } from "use-file-picker";
import styles from "./page.module.css"
// TODO: wire up; this is a fixture
import { nodes as iNodes, edges as iEdges } from "./nodes-edges.json";
import { transform, getNodesEdges } from "./lib";

export default function Home() {
  const [fbuf, setFbuf] = useState<ArrayBuffer | null>(null);
  const [inProgress, setInProgress] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { openFilePicker, filesContent, loading, errors, plainFiles } =
    useFilePicker({
      multiple: false,
      readAs: "ArrayBuffer",
      maxFileSize: 1, // megabytes
    });
  
  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const parseDtb = async(data: Uint8Array) => {
    setInProgress(true);
    setTimeout(async () => {
      try {
        // TODO: only do this once
        const parser = await import("../parser/pkg");
        const res = await parser.parse_dtb([...data]);
        const tree = transform(res.root);
        const f = getNodesEdges(tree);
        setNodes(f.nodes);
        setEdges(f.edges);
      } catch (e) {
        console.error(e);
        // setError((errors || []).concat(e));
      } finally {
        console.info("DONE:", new Date());
        setInProgress(false);
      }
    }, 100);
  };

  /*
  */
  const reanalyze = useCallback(() => {
    if (fbuf) {
      parseDtb(new Uint8Array(fbuf));
    }
  }, [fbuf]);

  useEffect(() => {
      reanalyze();
  }, [reanalyze]);

  useEffect(() => {
    if (filesContent.length) {
      const f = filesContent[0].content;
      setFbuf(f);
    }
  }, [filesContent]);

  const fileName = plainFiles.length > 0 ? plainFiles[0].name : "";

  const pending = loading || inProgress;

  return (
    <main className={styles.main}>
      <h1>Device Tree Visualizer</h1>
      <div style={{ width: 300, display: "flex", justifyContent: "space-between" }}>
        File: {fileName}
        <button disabled={pending} onClick={openFilePicker}>
          {pending ? "..." : "load DTB"}
        </button>
      </div>
      <div>
        nodes: {nodes.length}
      </div>
      <div style={{ width: "100vw", height: "90%" }}>
        <ReactFlow
          {...{ nodes, edges, onNodesChange, onEdgesChange, onConnect }}>
          <Controls />
        </ReactFlow>
      </div>
    </main>
  )
}
