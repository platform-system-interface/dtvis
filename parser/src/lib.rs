mod utils;

use gloo_utils::format::JsValueSerdeExt;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// TODO: add actual parser :p

#[derive(Serialize, Deserialize)]
struct Res {
    b: u32,
}

#[wasm_bindgen]
pub fn parse_dtb() -> Result<JsValue, JsValue> {
    utils::set_panic_hook();

    let x = Res { b: 123 };
    Ok(JsValue::from_serde(&x).unwrap())
}
