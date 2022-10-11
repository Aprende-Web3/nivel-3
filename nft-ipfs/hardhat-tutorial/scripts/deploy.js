const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
 
async function main() {
  // URL desde donde podemos extraer los metadatos para un AW3Punks
  const metadataURL = "ipfs://QmSD3oMM1LBK9haVeeA89Dc2R85t65LS8KzdxNNjcRbqC3/";
 /*
   Una ContractFactory en ethers.js es una abstracción utilizada para implementar nuevos contratos inteligentes,
   entonces aw3PunksContract aquí es una fábrica de instancias de nuestro contrato AW3Punks.
   */
  const aw3PunksContract = await ethers.getContractFactory("AW3Punks");
 
// implementar el contrato
  const deployedAW3PunksContract = await aw3PunksContract.deploy(metadataURL);
 
  await deployedAW3PunksContract.deployed();
 
// imprime la dirección del contrato desplegado
  console.log("AW3Punks Contract Address:", deployedAW3PunksContract.address);
}
 
// Llamar a la función principal y detectar si hay algún error
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });