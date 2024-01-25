type DTProp = any; // TODO
// TODO
type DTNode = any & {
  name: string;
  props: DTProp[];
  children?: DTNode;
  addr?: string;
};

// TODO: Differentiate?
enum NodeType {
  custom = "custom",
  hidden = "hidden"
}

type TransformedNode = {
  id: string;
  type: NodeType;
  position: {
    x: number;
    y: number;
  };
  data: {
    label: string;
  };
};
type TransformedEdge = any; // TODO

const fourU8ToU32 = (f: number[]): number =>
  (f[0] << 24) | (f[1] << 16) | (f[2] << 8) | f[3];

const u8ArrToU32Arr = (u8a: number[]): number[] => {
    let res = [];
    for (let i = 0; i < u8a.length/4; i++) {
        const c = u8a.slice(i*4, (i+1)*4);
        res.push(fourU8ToU32(c));
    }
    return res;
};

const u8ArrToStr = (u8a: number[]): string => u8a.reduce((a,c,i) => {
  if (i === u8a.length -1) {
    return a;
  }
  const n = (c === 0) ? ";" : String.fromCharCode(c);
  return `${a}${n}`;
}, "");

// some props are simple strings
const getStringProp = (n: DTNode, pname: string): string | undefined => {
  const p = n.props.find((p: DTProp) => p[0] === pname);
  if (p) {
    return u8ArrToStr(p[1]);
  }
};

// many props are just numbers
const getProp = (n: DTNode, pname: string): number[] | null => {
  const p = n.props.find((p: DTProp) => p[0] === pname);
  return p ? u8ArrToU32Arr(p[1]) : null;
};

// strings representation of lists of numbers for pretty-printing
const getPropStr = (n: DTNode, pname: string): string | null => {
  const p = getProp(n, pname);
  return p ? p.join(", ") : null;
};

// transform a node's props into numbers and strings, omitting many
const transformNode = (n: DTNode): DTNode => {
  const name = n.name || "root";
  // phandle is an identifier to the node
  const phandle = getProp(n, "phandle");
  // phy-handle is a ref to another node
  // TODO: make list of props that are refs
  const phyHandle = getProp(n, "phy-handle");
  const phySupply = getProp(n, "phy-supply");
  const resets = getProp(n, "resets");
  const dmas = getProp(n, "dmas");
  const clks = getProp(n, "clocks");
  const cnames = getStringProp(n, "clock-names");
  const compat = getStringProp(n, "compatible");
  return {
    name,
    ...(phandle ? { phandle: phandle[0] } : null),
    ...(phySupply ? { phySupply: phySupply[0] } : null),
    ...(phyHandle ? { phyHandle: phyHandle[0] } : null),
    ...(resets ? { resets } : null),
    ...(dmas ? { dmas } : null),
    ...(clks ? { clks } : null),
    ...(cnames ? { cnames } : null),
    ...(compat ? { compat } : null),
  };
};

export const transform = (n: DTNode, id: string = "10000") => {
  return {
    ...transformNode(n),
    id,
    children: n.children.map((c: DTNode, i: number) => transform(c, `${id}_${i}`)),
  }
};

const NODE_WIDTH = 160;
const NODE_HEIGHT = 80;

const weightedNode = (node: DTNode): DTNode => {
  if (node.children && node.children.length > 0) {
    let size = 0;
    const cs = node.children.map((c: DTNode) => {
      const wc = weightedNode(c);
      size += wc.size;
      return wc;
    });
    return { ...node, children: cs, size };
  }
  return { ...node, size: 1 };
};

/**
 * Format to hex with leading 0x, padded with zeroes to groups of four digits.
 * At least print 8 digits, but omit the first 4 of 12 if they are all 0.
 */
const transformAddr = (addr: string): string => {
  if (addr === undefined) {
    return "";
  }
  const padded = addr.padStart(12, "0");
  const p1 = padded.substr(0, 4);
  const p2 = padded.substr(4, 4);
  const p3 = padded.substr(8, 4);
  if (p1 === "0000") {
    return `0x${p2}_${p3}`;
  }
  return `0x${p1}_${p2}_${p3}`;
};

// flatten tree to list of nodes, use IDs to define ReactFlow edges
export const getNodesEdges = (tree: DTNode) => {
  const nodes: TransformedNode[] = [];
  const edges: TransformedEdge[] = [];
  const rec = (n: DTNode, d: number = 1, baseX: number = 0, baseY: number = 0) => {
    const [name, addr] = n.name.split("@");
    const baseAddr = transformAddr(addr);

    nodes.push({
      id: n.id,
      type: NodeType.custom,
      position: {
        x: baseX + n.size * NODE_WIDTH / 2,
        y: baseY + d * NODE_HEIGHT,
      },
      data: {
        label: `${name}\n${baseAddr}\n${n.size}`,
      },
    });
    let offset = baseX;
    n.children.forEach((c: DTNode, i: number) => {
      edges.push({
        id: `${n.id}${c.id}`,
        source: n.id,
        target: c.id,
      });
      rec(c, d+1, offset, baseY + n.children.length * 10);
      offset += c.size * NODE_WIDTH;
    });
  };
  const t = weightedNode(tree);
  rec(t);
  return { nodes, edges };
};
