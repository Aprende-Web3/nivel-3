const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { FEE, VRF_COORDINATOR, LINK_TOKEN, KEY_HASH } = require("../constants");

async function main() {
/*
  Una ContractFactory en ethers.js es una abstracción utilizada para implementar nuevos contratos inteligentes,
  así que randomWinnerGame aquí es una fábrica de instancias de nuestro contrato RandomWinnerGame.
  */
  const randomWinnerGame = await ethers.getContractFactory("RandomWinnerGame");
// implementar el contrato
  const deployedRandomWinnerGameContract = await randomWinnerGame.deploy(
    VRF_COORDINATOR,
    LINK_TOKEN,
    KEY_HASH,
    FEE
  );

  await deployedRandomWinnerGameContract.deployed();
// imprime la dirección del contrato desplegado
  console.log(
    "Verify Contract Address:",
    deployedRandomWinnerGameContract.address
  );

  console.log("Sleeping.....");
// Espere a que etherscan se dé cuenta de que el contrato se ha implementado
  await sleep(30000);
// Verificar el contrato después de la implementación
  await hre.run("verify:verify", {
    address: deployedRandomWinnerGameContract.address,
    constructorArguments: [VRF_COORDINATOR, LINK_TOKEN, KEY_HASH, FEE],
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Llamar a la función principal y detectar si hay algún error
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });