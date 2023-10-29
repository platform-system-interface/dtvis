use device_tree::DeviceTree;
use gloo_utils::format::JsValueSerdeExt;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

mod utils;

type Bin = Vec<u8>;

#[derive(Serialize, Deserialize)]
struct Res {
    b: u32,
}

#[wasm_bindgen]
pub fn parse_dtb(data: JsValue) -> js_sys::Promise {
    utils::set_panic_hook();

    let bin: Bin = data.into_serde().unwrap();

    let res = DeviceTree::load(&bin.as_slice()).unwrap();
    let res_val = JsValue::from_serde(&res).unwrap();
    js_sys::Promise::resolve(&res_val)
}
