import { memo, useState, type FC } from "react";
import { Handle, type NodeProps, Position } from "reactflow";

import { type DTStatus, type DTNodeData } from "./lib";
import compatDb from "./compat-db.json";
import type { DocsCategory } from "./compat-db.json";

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
        }
      `}</style>
    </div>
  );
};

const docsBaseUrl = "https://docs.kernel.org";
const drvBaseUrl = "https://elixir.bootlin.com/linux/HEAD/source/drivers";
//const drvBaseUrl = "https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/drivers";
const dtBaseUrl =
  "https://www.kernel.org/doc/Documentation/devicetree/bindings";

const getBaseUrl = (category: DocsCategory): string => {
  switch (category) {
    case "binding":
      return dtBaseUrl;
    case "docs":
      return docsBaseUrl;
    case "driver":
    default:
      return drvBaseUrl;
  }
};

const getDocUrl = (compat: string) => {
  const res = compat.split(";").find((c) => !!compatDb[c]);
  if (!res) {
    return null;
  }
  const d = compatDb[res];
  const baseUrl = getBaseUrl(d.category);
  return `${baseUrl}/${d.path}`;
};

const Compat: FC<{ compat?: string }> = ({ compat }) => {
  if (!compat) {
    return null;
  }
  const docUrl = getDocUrl(compat);

  if (!docUrl) {
    return compat;
  }

  return (
    <a className="compat" href={docUrl} target="_blank" rel="noopener">
      {compat}
      <style>{`
        a.compat {
          color: #cdeeff;
          text-decoration: underline;
        }
      `}</style>
    </a>
  );
};

export const DataNode: FC<{ data: DTNodeData; status?: DTStatus }> = ({
  data,
  status,
}) => {
  if (!data) {
    return null;
  }

  return (
    <div className="node">
      <span>{data.label}</span>
      <span>{data.baseAddr}</span>
      <Compat compat={data.compat} />
      <Dot status={status} />
      <style>{`
        div.node {
          white-space: pre-wrap;
          padding: 4px;
          border: 2px solid #789789;
          background: #0c0c0c;
          color: #fff;
          width: 150px;
          font-size: 12px;
          font-family: "Fira Code";
          display: flex;
          flex-direction: column;
        }
        div.node:hover {
          border-color: #987987;
          border-style: dotted;
        }
      `}</style>
    </div>
  );
};

// TODO: migrate to v12
// type DTNode = Node<DTNodeData, "device-tree">;
// TODO: `nodeTypes` <https://reactflow.dev/learn/customization/custom-nodes>
// <https://reactflow.dev/examples/nodes/custom-node>
// <https://reactflow.dev/learn/advanced-use/typescript#custom-nodes>

// <https://v11.reactflow.dev/api-reference/types/node-props>
// NOTE: This declares the properties of the `data` prop.
const DTNode = ({
  data,
  isConnectable,
  targetPosition = Position.Top,
  sourcePosition = Position.Bottom,
}: NodeProps<DTNodeData>) => {
  const { status } = data;
  return (
    <>
      <Handle
        type="target"
        position={targetPosition}
        isConnectable={isConnectable}
      />
      <DataNode data={data} status={status} />
      <Handle
        type="source"
        position={sourcePosition}
        isConnectable={isConnectable}
      />
    </>
  );
};

DTNode.displayName = "DTNode";

export default memo(DTNode);
