import { memo, useCallback, useState, type FC } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";

import { NODE_WIDTH } from "./lib";
import type { DTStatus, DTNodeData } from "./lib";
import compatDb from "./compat-db.json";
import standardNames from "./generic-names.json";

const dotColors: Record<DTStatus, string> = {
  okay: "blue",
  disabled: "red",
};

export const Dot: FC<{ status?: DTStatus }> = ({ status }) => {
  if (!status) {
    return null;
  }
  const color = dotColors[status];
  return (
    <div className="dot" style={{ background: color }}>
      <style>{`
        div.dot {
          width: 10px;
          height: 10px;
          border-radius: 100%;
          border: 1px solid #eee;
        }
      `}</style>
    </div>
  );
};

const docsBaseUrl = "https://docs.kernel.org";
//const drvBaseUrl = "https://elixir.bootlin.com/linux/HEAD/source/drivers";
//const drvBaseUrl = "https://github.com/torvalds/linux/blob/HEAD/drivers";
const drvBaseUrl =
  "https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/drivers";
const dtBaseUrl =
  "https://www.kernel.org/doc/Documentation/devicetree/bindings";

const getDocLinks = (compat?: string): ReactNode[] | null => {
  if (!compat) {
    return null;
  }
  const res = compat.split(";").find((c) => !!compatDb[c]);
  if (!res) {
    return null;
  }
  const d = compatDb[res];
  if (!d) {
    return null;
  }
  const links = [];
  if (d.binding) {
    const url = `${dtBaseUrl}/${d.binding}`;
    links.push(
      <a className="compat" href={url} target="_blank" rel="noopener" key="b">
        🪢
      </a>
    );
  }
  if (d.docs) {
    const url = `${docsBaseUrl}/${d.docs}`;
    links.push(
      <a className="compat" href={url} target="_blank" rel="noopener" key="d">
        📜
      </a>
    );
  }
  if (d.driver) {
    const url = `${drvBaseUrl}/${d.driver}`;
    links.push(
      <a className="compat" href={url} target="_blank" rel="noopener" key="r">
        🚗
      </a>
    );
  }
  return links;
};

const Compat: FC<{ compat?: string }> = ({ compat }) => {
  if (!compat) {
    return null;
  }

  return (
    <>
      {compat}
    </>
  );
};

export const Extra: FC<{ data: DTNodeData }> = ({ data }) => {
  const {
    // handles
    resets,
    clocks,
    mboxes,
    phandle,
    phySupply,
    phyHandle,
    pcsphyHandle,
    fmanMac,
    // generic
    type,
    description,
    // FIT
    arch,
    os,
    kernel,
    ramdisk,
    loadables,
    fdt,
    compression,
    algo,
    load,
    entry,
  } = data;
  let signer = data["signer-name"];
  let key = data["key-name-hint"];

  const extra = JSON.stringify(
    {
      resets,
      clocks,
      mboxes,
      phandle,
      phySupply,
      phyHandle,
      pcsphyHandle,
      fmanMac,
    },
    null,
    2,
  );
  const fit = JSON.stringify(
    {
      type,
      description,
      arch,
      os,
      kernel,
      ramdisk,
      loadables,
      fdt,
      compression,
      algo,
      signer,
      key,
      load,
      entry,
    },
    null,
    2,
  );

  return (
    <div>
      <h5>extra</h5>
      {extra}

      <h5>FIT</h5>
      {fit}
      <style>{`
        h5 {
          display: flex;
          justify-content: center;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

type RefEdge = {
  source: string;
  label: string;
};

const PanToRef: FC<{ edge: RefEdge }> = ({ edge }) => {
  const { fitView } = useReactFlow();
  const panToRef = useCallback(
    (id: string) => fitView({ nodes: [{ id }] }),
    [fitView],
  );

  return <button onClick={() => panToRef(edge.source)}>{edge.label}</button>;
};

export const DataNode: FC<{ data: DTNodeData }> = memo(({ data }) => {
  const [showExtra, setShowExtra] = useState<boolean>(false);

  const { label, model, baseAddr, compat, status, size, type, extra, refs, children: _, ...rest } = data;
  const extraClass = standardNames.includes(label) ? "highlight" : "";
  const toggle = () => setShowExtra((e) => !e);

  const docLinks = getDocLinks(compat);

  return (
    <div className="node">
      <header className={extraClass}>
        {label}
        <div className="docs">
          {docLinks}
          <Dot status={status} />
        </div>
        <style>{`
          a.compat {
            text-decoration: none;
            border: 1px solid #3434f4;
            display: block;
            width: 30px;
            height: 22px;
            padding: 1px;
            font-size: 15px;
            text-align: center;
            background: #ffc;
          }
          div.docs {
            margin: 2px;
            display: flex;
            align-items: center;
            gap: 5px;
          }
        `}</style>
      </header>
      <main>
        <span>{model}</span>
        <span>{baseAddr}</span>
        <Compat compat={compat} />
        {size === undefined ? null : <span>size: {size}</span>}
        {type === undefined ? null : <span>type: {type}</span>}
        <button onClick={toggle}>show {showExtra ? "less 🔼" : "more 🔽"}</button>
        {showExtra && (
          <>
            <span>{extra}</span>
            <Extra data={data} />
            <span>{JSON.stringify(rest, null, 2)}</span>
          </>
        )}
        {refs.map((e) => <PanToRef edge={e} key={e.id} />)}
      </main>
      <style>{`
        div.node {
          white-space: pre-wrap;
          border: 4px solid #789789;
          border-radius: 6px;
          width: ${NODE_WIDTH}px;
          font-size: 14px;
          font-family: "Fira Code";
          ${showExtra ? "z-index: 100;" : ""}
        }
        div.node:hover {
          border-color: #987987;
          border-style: dotted;
        }
        div.node header {
          color: #0c0c0c;
          background: #ccddcc;
          font-weight: bold;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        div.node header.highlight {
          color: #fff;
          background: #850150;
        }
        div.node main {
          color: #fff;
          background: #0c0c0c;
          padding: 4px;
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
});

// NOTE: This declares the properties of the `data` prop.
type DTNode = Node<DTNodeData, "device-tree">;

// <https://reactflow.dev/examples/nodes/custom-node>
// <https://reactflow.dev/learn/advanced-use/typescript#custom-nodes>
const DTNode = ({
  data,
  isConnectable,
  targetPosition = Position.Top,
  sourcePosition = Position.Bottom,
}: NodeProps<DTNode>) => (
  <>
    <Handle
      type="target"
      position={targetPosition}
      isConnectable={isConnectable}
    />
    <DataNode data={data} />
    <Handle
      type="source"
      position={sourcePosition}
      isConnectable={isConnectable}
    />
  </>
);

DTNode.displayName = "DTNode";

export default memo(DTNode);
