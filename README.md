A graphical device tree visualizer (early development).

Device trees are used to describe a lot of hardware, especially in the embedded world and are used in U-Boot, Linux and other boot loaders and kernels. A device tree enumerates addresses and other attributes for peripherals, hardware decoders, processing cores and external components attached to systems on chips (SoCs) on printed circuit boards (PCBs).

This application uses [device_tree-rs](200~https://github.com/platform-system-interface/device_tree-rs) to parse .dtb files. You can find more informations about the fileformat there. Further informations can be found on [elinux](https://elinux.org/Device_Tree_Mysteries#kernel_usage) and in this [slides](https://metaspora.org/hack-the-gadget-mrmcd2023.pdf#Outline0.5) from a MRMCD Talk.

## Local Development

Install wasm-pack

First, run the development server:

```bash
cargo install wasm-pack
npm install
```

## Run the app in development mode

```bash
npm start
```

Open [http://localhost:3000/dtvis](http://localhost:3000/dtvis) with your browser to see the result.

## Contribute

Feel free to contribute
