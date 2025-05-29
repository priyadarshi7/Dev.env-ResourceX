#!/bin/bash
set -e

cd circuits

echo "Compiling circuit..."
circom code_verification.circom --r1cs --wasm --sym

echo "Downloading powers of tau..."
if [ ! -f "powersOfTau28_hez_final_15.ptau" ]; then
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau
fi

echo "Generating zkey..."
snarkjs groth16 setup code_verification.r1cs powersOfTau28_hez_final_15.ptau code_verification_0000.zkey

echo "Exporting verification key..."
snarkjs zkey export verificationkey code_verification_0000.zkey verification_key.json

echo "Converting to Solana format..."
node ../scripts/convert_vk_to_solana.js verification_key.json > ../programs/zk-code-deployment/src/verification_key.rs

echo "Keys generated successfully!"