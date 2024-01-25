import { memo, useState } from "react";
import { Handle, NodeProps, Position } from "reactflow";

const style = {
  // wordWrap: "break-word",
  whiteSpace: "pre-wrap" as "pre-wrap", // This is weird, TypoScripto...
  padding: 4,
  border: "2px solid",
  background: "#0c0c0c",
  color: "#fff",
  width: 150,
  fontSize: 11,
  fontFamily: "Fira Code",
};

const DTNode = ({
  data,
  isConnectable,
  targetPosition = Position.Top,
  sourcePosition = Position.Bottom
}: NodeProps) => {
  const [hovered, setHovered] = useState(false);

  const hoverOn = () => setHovered(true);
  const hoverOff = () => setHovered(false);

  const borderColor = hovered ? "#987987" : "#789789";
  const borderStyle = hovered ? "dotted" : "solid";
  return (
    <>
      <Handle
        type="target"
        position={targetPosition}
        isConnectable={isConnectable}
      />
        <div
          style={{...style, borderColor, borderStyle }}
          onMouseEnter={hoverOn}
          onMouseLeave={hoverOff}
        >
          {data?.label} - [-]
        </div>
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
