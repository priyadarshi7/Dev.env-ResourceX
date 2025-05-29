import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair, Connection } from '@solana/web3.js';
import { ZkCodeDeployment } from '../target/types/zk_code_deployment';

export class ZKDeploymentClient {
    private program: Program<ZkCodeDeployment>;
    private provider: anchor.AnchorProvider;
    
    constructor(connection: Connection, wallet: anchor.Wallet) {
        this.provider = new anchor.AnchorProvider(connection, wallet, {});
        this.program = anchor.workspace.ZkCodeDeployment as Program<ZkCodeDeployment>;
    }
    
    async initialize() {
        const [deploymentStatePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("deployment_state")],
            this.program.programId
        );
        
        return await this.program.methods
            .initialize()
            .accounts({
                deploymentState: deploymentStatePda,
                authority: this.provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();
    }
    
    async submitDeploymentProof(
        code: Uint8Array,
        maxComputeUnits: number,
        maxMemoryUsage: number,
        codeCategory: number,
        securityLevel: number
    ) {
        // Generate ZK proof
        const proof = await this.generateProof(code, {
            maxComputeUnits,
            maxMemoryUsage, 
            codeCategory,
            securityLevel
        });
        
        const codeHash = await this.hashCode(code);
        
        const [deploymentStatePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("deployment_state")],
            this.program.programId
        );
        
        const deploymentState = await this.program.account.deploymentState.fetch(deploymentStatePda);
        
        const [proposalPda] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("deployment_proposal"),
                new anchor.BN(deploymentState.totalDeployments).toArrayLike(Buffer, 'le', 8)
            ],
            this.program.programId
        );
        
        return await this.program.methods
            .submitDeploymentProof(proof.zkProof, proof.publicInputs, Array.from(codeHash))
            .accounts({
                deploymentProposal: proposalPda,
                deploymentState: deploymentStatePda,
                proposer: this.provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();
    }
    
    private async generateProof(code: Uint8Array, constraints: any) {
        const snarkjs = require('snarkjs');
        const circomlib = require('circomlib');
        
        // Prepare circuit inputs
        const input = {
            code: Array.from(code).concat(Array(1024 - code.length).fill(0)),
            salt: Math.floor(Math.random() * 1000000),
            max_compute_units: constraints.maxComputeUnits,
            max_memory_usage: constraints.maxMemoryUsage,
            code_category: constraints.codeCategory,
            security_level: constraints.securityLevel
        };
        
        // Generate witness
        const { witness } = await snarkjs.groth16.fullProve(
            input,
            "circuits/code_verification.wasm",
            "circuits/code_verification_0000.zkey"
        );
        
        // Convert proof to Solana format
        return {
            zkProof: {
                a: Array.from(witness.proof.pi_a.slice(0, 32)),
                b: Array.from(witness.proof.pi_b.flat().slice(0, 64)),
                c: Array.from(witness.proof.pi_c.slice(0, 32))
            },
            publicInputs: {
                maxComputeUnits: constraints.maxComputeUnits,
                maxMemoryUsage: constraints.maxMemoryUsage,
                codeCategory: constraints.codeCategory,
                securityLevel: constraints.securityLevel
            }
        };
    }
    
    private async hashCode(code: Uint8Array): Promise<Uint8Array> {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(code).digest();
    }
}