const fourU8ToU32 = (f: number[]) => (f[0] << 24) | (f[1] << 16) | (f[2] << 8) | f[3];

const u8ArrToU32Arr = (u8a: number[]) => {
    let res = [];
    for (let i = 0; i < u8a.length/4; i++) {
        const c = u8a.slice(i*4, (i+1)*4);
        res.push(fourU8ToU32(c));
    }
    return res;
};

type DTNode = any; // TODO
type DTProp = any; // TODO

const u8ArrToStr = (u8a: number[]) => u8a.reduce((a,c,i) => {
  if (i === u8a.length -1) {
    return a;
  }
  const n = (c === 0) ? ";" : String.fromCharCode(c);
  return `${a}${n}`;
}, "");

// some props are simple strings
const getStringProp = (n: DTNode, pname: string) => {
  const p = n.props.find((p: DTProp) => p[0] === pname);
  if (p) {
    return u8ArrToStr(p[1]);
  }
};

// many props are just numbers
const getProp = (n: DTNode, pname: string) => {
  const p = n.props.find((p: DTProp) => p[0] === pname);
  return p ? u8ArrToU32Arr(p[1]) : null;
};

// strings representation of lists of numbers for pretty-printing
const getPropStr = (n: DTNode, pname: string) => {
  const p = getProp(n, pname);
  return p ? p.join(", ") : null;
};

// transform a node's props into numbers and strings, omitting many
const transformNode = (n: DTNode) => {
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

type TransformedNode = any; // TODO
type TransformedEdge = any; // TODO

// flatten tree to list of nodes, use IDs to define ReactFlow edges
export const getNodesEdges = (tree: DTNode) => {
  const nodes: TransformedNode = [];
  const edges: TransformedEdge = [];
  const rec = (n: DTNode, d: number = 1, b: number = 1) => {
    nodes.push({
      id: n.id,
      type: "custom",
      position: {
        x: d*180,
        y: b*(10-d)*12 + 50*n.children.length,
      },
      data: {
        label: n.name,
      },
    });
    n.children.forEach((c: DTNode, i: number) => {
      edges.push({
        id: `${n.id}${c.id}`,
        source: n.id,
        target: c.id,
      });
      rec(c, d+1, b+1+i);
    });
  };
  rec(tree);
  return { nodes, edges };
};
