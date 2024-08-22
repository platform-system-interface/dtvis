import { memo, useState } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import compatDb from "./compat-db.json";
import genericNames from "./generic-names.json";

type DTStatus = "okay" | "disabled";

const dotColors: Record<DTStatus, string> = {
  okay: "blue",
  disabled: "red"
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

const docsBaseUrl = "https://docs.kernel.org"
const drvBaseUrl = "https://elixir.bootlin.com/linux/HEAD/source/drivers";
//const drvBaseUrl = "https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/drivers";
const dtBaseUrl = "https://www.kernel.org/doc/Documentation/devicetree/bindings";

type DocsCategory = "binding" | "docs" | "driver";

type DocsEntry = {
  category: DocsCategory;
  path: string;
};

const getBaseUrl = (category: DocsCategory): string => {
  switch(category) {
    case "binding": return dtBaseUrl;
    case "docs": return docsBaseUrl;
    case "driver": return drvBaseUrl;
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
  const extraClass = genericNames.includes(data.label) ? "generic" : "";
  return (
    <div className="node">
      <header className={extraClass}>{data.label}</header>
      <main>
        <span>{data.model}</span>
        <span>{data.baseAddr}</span>
        <Compat compat={data.compat} />
        <Dot status={status} />
        <span>{data.extra}</span>
      </main>
      <style>{`
        div.node {
          white-space: pre-wrap;
          border: 4px solid #789789;
          border-radius: 6px;
          width: 250px;
          font-size: 14px;
          font-family: "Fira Code";
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
        }
        div.node header.generic {
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
