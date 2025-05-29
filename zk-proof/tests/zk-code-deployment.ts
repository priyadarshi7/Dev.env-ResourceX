import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { ZkCodeDeployment } from "../target/types/zk_code_deployment";
import { ZKDeploymentClient } from "../client/src/zk-client";
import { expect } from "chai";

describe("zk-code-deployment", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    
    const program = anchor.workspace.ZkCodeDeployment as Program<ZkCodeDeployment>;
    const client = new ZKDeploymentClient(provider.connection, provider.wallet);
    
    it("Initialize deployment system", async () => {
        const tx = await client.initialize();
        console.log("Initialize transaction:", tx);
    });
    
    it("Submit valid deployment proof", async () => {
        const sampleCode = new Uint8Array([1, 2, 3, 4, 5]); // Sample bytecode
        
        const tx = await client.submitDeploymentProof(
            sampleCode,
            1000,    // max compute units
            1024,    // max memory usage  
            0,       // DeFi category
            1        // medium security
        );
        
        console.log("Deployment proof transaction:", tx);
    });
    
    it("Deploy verified code", async () => {
        // Implementation for deployment test
    });
});