const fs = require('fs');

function convertVkToSolana(vkPath) {
    const vk = JSON.parse(fs.readFileSync(vkPath, 'utf8'));
    
    console.log(`
pub const VERIFICATION_KEY: VerificationKey = VerificationKey {
    alpha_g1: [${vk.vk_alpha_1.map(x => `"${x}"`).join(', ')}],
    beta_g2: [${vk.vk_beta_2.map(x => `"${x}"`).join(', ')}],
    gamma_g2: [${vk.vk_gamma_2.map(x => `"${x}"`).join(', ')}],
    delta_g2: [${vk.vk_delta_2.map(x => `"${x}"`).join(', ')}],
    ic: &[${vk.IC.map(point => `[${point.map(x => `"${x}"`).join(', ')}]`).join(', ')}],
};

#[derive(Clone)]
pub struct VerificationKey {
    pub alpha_g1: [&'static str; 3],
    pub beta_g2: [&'static str; 3],
    pub gamma_g2: [&'static str; 3], 
    pub delta_g2: [&'static str; 3],
    pub ic: &'static [[&'static str; 3]],
}
    `);
}

convertVkToSolana(process.argv[2]);