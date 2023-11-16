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
import { transform, getNodesEdges } from "./lib";
import DTNode from "./DTNode";
import "./page.module.css"

const nodeTypes = {
  custom: DTNode
};

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
    <div className="layout">
      <header>
        <Image
          alt="Device Tree logo"
          src="/dtvis/devicetree-logo.svg"
          width={50}
          height={50}
          style={{ background: "#b0b0b0" }}
        />
        <h1>dtvis</h1>
        <menu>
          <button disabled={pending} onClick={openFilePicker}>
            {pending ? "..." : "Load DTB"}
          </button>
        </menu>
        {fileName && <span>File: {fileName}</span>}
        {nodes.length > 0 && <span>Nodes: {nodes.length}</span>}
      </header>
      <main>
        <ReactFlow
          {...{ nodes, edges, nodeTypes, onNodesChange, onEdgesChange, onConnect }}>
          <Controls />
        </ReactFlow>
      </main>
      <style jsx>{`
        .layout {
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          min-height: 100vh;
        }
        header {
          width: 100%;
          height: 10vh;
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: 15px;
          padding: 0 20px;
        }
        button {
          background-color: #101212;
          border-radius: 7px;
          border-width: 3px;
          padding: 5px 25px;
          display: flex;
          align-items: center;
          gap: 20px;
          font-size: 22px;
        }
        main {
          width: 100vw;
          height: 90vh;
        }
      `}</style>
    </div>
  )
}
