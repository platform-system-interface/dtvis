import { memo, useState } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import compatDb from "./compat-db.json";

type DTStatus = "okay" | "disabled";

type DotColor = "blue" | "red";

const getDotColor = (status?: DTStatus): DotColor | null => {
  switch(status) {
    case "okay": return "blue";
    case "disabled": return "red";
    default: return null;
  }
}

export const Dot: FC<{ status?: DTStatus }> = ({ status }) => {
  if (!status) {
    return null;
  }
  const color = getDotColor(status);
  return (
    <div className="dot">
      <style>{`
        div.dot {
          width: 10px;
          height: 10px;
          background: ${color};
          border-radius: 100%;
        }
      `}</style>
    </div>
  );
};

const docsbaseUrl = "https://docs.kernel.org"
const dtBaseUrl = "https://www.kernel.org/doc/Documentation/devicetree/bindings";

type DocsCategory = "binding" | "docs";

type DocsEntry = {
  category: DocsCategory;
  path: string;
};

const getBaseUrl = (category: DocsCategory): string => {
  switch(category) {
    case "binding": return dtBaseUrl;
    case "docs": return docsbaseUrl;
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
}

const Compat: FC<{ compat?: string; }> = ({ compat }) => {
  if (!compat) {
    return null;
  }
  const docUrl = getDocUrl(compat);

  if (!docUrl) {
    return compat;
  }

  return (
    <a className="compat" href={docUrl} target="_blank">
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

export const DataNode: FC<{ data: object; status?: DTStatus }> = ({
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

const DTNode = ({
  data,
  isConnectable,
  targetPosition = Position.Top,
  sourcePosition = Position.Bottom
}: NodeProps) => {
  const { status, ...nData } = data;
  return (
    <>
      <Handle
        type="target"
        position={targetPosition}
        isConnectable={isConnectable}
      />
      <DataNode data={nData} status={status} />
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
