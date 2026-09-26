export type DTStatus = "okay" | "disabled";

export type DTNodeData = {
  label: string;
  baseAddr?: string;
  compat?: string;
  model?: string;
  extra?: string;
  status?: DTStatus;
} & any;

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
}

type TransformedNode = {
  id: string;
  type: NodeType;
  position: {
    x: number;
    y: number;
  };
  data: DTNodeData;
};
type TransformedEdge = any; // TODO

const fourU8ToU32 = (f: number[]): number =>
  (f[0] << 24) | (f[1] << 16) | (f[2] << 8) | f[3];

const u8ArrToU32Arr = (u8a: number[]): number[] => {
  const res = [];
  for (let i = 0; i < u8a.length / 4; i++) {
    const c = u8a.slice(i * 4, (i + 1) * 4);
    res.push(fourU8ToU32(c));
  }
  return res;
};

const u8ArrToStr = (u8a: number[]): string =>
  u8a.reduce((a, c, i) => {
    if (i === u8a.length - 1) {
      return a;
    }
    const n = c === 0 ? ";" : String.fromCharCode(c);
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

const getExtra = (n: DTNode) => {
  if (n.name === "aliases" || n.name === "chosen") {
    const ps = n.props.map((p) => {
      const [k, v] = p;
      return `${k}=${u8ArrToStr(v)}`;
    });
    return ps.join("\n");
  }
  return null;
};

// transform a node's props into numbers and strings, omitting many
const transformNode = (n: DTNode): DTNode => {
  const name = n.name || "root";
  // phandle is an identifier to the node
  const phandle = getProp(n, "phandle");
  // phy-handle is a ref to another node
  // TODO: make list of props that are refs
  const phyHandle = getProp(n, "phy-handle");
  const pcsphyHandle = getProp(n, "pcsphy-handle");
  const phySupply = getProp(n, "phy-supply");
  const mboxes = getProp(n, "mboxes");
  const resets = getProp(n, "resets");
  const dmas = getProp(n, "dmas");
  const clocks = getProp(n, "clocks");
  const cnames = getStringProp(n, "clock-names");
  const compat = getStringProp(n, "compatible");
  const status = getStringProp(n, "status");
  const model = getStringProp(n, "model");

  // Freescale SDK, _NOT_ mainline
  const fmanMac = getProp(n, "fsl,fman-mac");

  const fitStrings = [
    "description",
    "type",
    "arch",
    "os",
    "kernel",
    "ramdisk",
    "loadables",
    "fdt",
    "compression",
    "algo",
    "signer-name",
    "key-name-hint",
  ];
  const fit = fitStrings.reduce((a, p) => {
    const s = getStringProp(n, p);
    if (s) {
      a[p] = s;
    }
    return a;
  }, {});
  const fitVals = ["load", "entry"];
  const fitV = fitVals.reduce((a, p) => {
    const s = getProp(n, p);
    if (s) {
      a[p] = padHexStr(s[0].toString(16));
    }
    return a;
  }, {});

  const extra = getExtra(n);

  return {
    name,
    ...(phandle ? { phandle: phandle[0] } : null),
    ...(phySupply ? { phySupply: phySupply[0] } : null),
    ...(phyHandle ? { phyHandle: phyHandle[0] } : null),
    ...(pcsphyHandle ? { pcsphyHandle: pcsphyHandle[0] } : null),
    ...(fmanMac ? { fmanMac: fmanMac[0] } : null),
    ...(resets ? { resets } : null),
    ...(dmas ? { dmas } : null),
    ...(clocks ? { clocks } : null),
    ...(cnames ? { cnames } : null),
    ...(compat ? { compat } : null),
    ...(status ? { status } : null),
    ...(model ? { model } : null),
    ...(mboxes ? { mboxes } : null),

    ...fit,
    ...fitV,
    extra,
  };
};

export const transform = (n: DTNode, id: string = "10000") => {
  return {
    ...transformNode(n),
    id,
    children: n.children.map((c: DTNode, i: number) =>
      transform(c, `${id}_${i}`),
    ),
  };
};

export const NODE_WIDTH = 250;
const NODE_WIDTH_PADDED = NODE_WIDTH + 50;
const NODE_HEIGHT = 200;

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
const padHexStr = (val: string): string => {
  if (val === undefined) {
    return "";
  }
  const padded = val.padStart(12, "0");
  const p1 = padded.substr(0, 4);
  const p2 = padded.substr(4, 4);
  const p3 = padded.substr(8, 4);
  if (p1 === "0000") {
    return `0x${p2}_${p3}`;
  }
  return `0x${p1}_${p2}_${p3}`;
};

// Get an edge from the given node by its ID to a referenced node if it exists
// in the list of phandles, otherwise null. Prefix the edge ID.
const getPhEdge = (phandles, ref, node, prefix): TransformedEdge | null => {
  const refId = phandles[ref];
  return refId === undefined
    ? null
    : {
        id: `${prefix}-${refId}_${node.id}`,
        source: refId,
        target: node.id,
        animated: true,
        label: prefix,
        targetName: `${node.data.label}@${node.data.baseAddr}`,
      };
};

// Get edges for phandles.
export const getPhEdges = (nodes: DTNode[], phandles): TransformedEdge[] => {
  const edges = [];
  nodes.forEach((n) => {
    if (n.data.clocks) {
      const ref = n.data.clocks[0];
      const e = getPhEdge(phandles, ref, n, "clock");
      if (e !== null) {
        edges.push(e);
      }
    }
    if (n.data.mboxes) {
      const ref = n.data.mboxes[0];
      const e = getPhEdge(phandles, ref, n, "mbox");
      if (e !== null) {
        edges.push(e);
      }
    }
    if (n.data.resets) {
      const ref = n.data.resets[0];
      const e = getPhEdge(phandles, ref, n, "reset");
      if (e !== null) {
        edges.push(e);
      }
    }
    if (n.data.phyHandle) {
      const ref = n.data.phyHandle;
      const e = getPhEdge(phandles, ref, n, "phy");
      if (e !== null) {
        edges.push(e);
      }
    }
    if (n.data.pcsphyHandle) {
      const ref = n.data.pcsphyHandle;
      const e = getPhEdge(phandles, ref, n, "pcsphy");
      if (e !== null) {
        edges.push(e);
      }
    }
    if (n.data.fmanMac) {
      const ref = n.data.fmanMac;
      const e = getPhEdge(phandles, ref, n, "fmanmac");
      if (e !== null) {
        edges.push(e);
      }
    }
  });
  return edges;
};

// flatten tree to list of nodes, use IDs to define ReactFlow edges
export const getNodesEdges = (tree: DTNode) => {
  const nodes: TransformedNode[] = [];
  const edges: TransformedEdge[] = [];
  // map phandle -> id
  const phandles = {};
  const rec = (
    n: DTNode,
    d: number = 1,
    baseX: number = 0,
    baseY: number = 0,
  ) => {
    const { id, name, ...data } = n;
    const [label, addr] = name.split("@");
    const baseAddr = padHexStr(addr);

    nodes.push({
      id,
      type: NodeType.custom,
      position: {
        x: baseX + (n.size * NODE_WIDTH_PADDED) / 2,
        y: baseY + d * NODE_HEIGHT,
      },
      data: {
        label,
        baseAddr,
        ...data,
      },
    });
    let offset = baseX;

    // TODO: store ID + #*-size
    const phandle = data.phandle;
    if (phandle != null) {
      phandles[phandle] = id;
    }
    n.children.forEach((c: DTNode, i: number) => {
      edges.push({
        id: `${n.id}${c.id}`,
        source: n.id,
        target: c.id,
      });
      rec(c, d + 1, offset, baseY + n.children.length * 10);
      offset += c.size * NODE_WIDTH_PADDED;
    });
  };
  const t = weightedNode(tree);
  rec(t);

  const phEdges = getPhEdges(nodes, phandles);

  const extNodes = nodes.map((n) => {
    const refs = phEdges.filter((e) => e.target === n.id);
    const backRefs = phEdges.filter((e) => e.source === n.id);
    return {
      ...n,
      data: {
        backRefs,
        refs,
        ...n.data,
      },
    };
  });

  return { nodes: extNodes, edges, phEdges };
};
