[package]
name = "zk-code-deployment"
version = "0.1.0"
description = "Zero Knowledge Proof Smart Contract for Code Deployment"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "zk_code_deployment"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.28.0"
anchor-spl = "0.28.0"