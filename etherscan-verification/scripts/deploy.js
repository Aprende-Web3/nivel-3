const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });

async function main() {
/*
   Una ContractFactory en ethers.js es una abstracción utilizada para implementar nuevos contratos inteligentes,
   por lo tanto, verifyContract aquí es una fábrica para instancias de nuestro contrato Verify.
   */
  const verifyContract = await ethers.getContractFactory("Verify");

  // implementar el contrato
  const deployedVerifyContract = await verifyContract.deploy();

  await deployedVerifyContract.deployed();

// imprime la dirección del contrato desplegado
  console.log("Verify Contract Address:", deployedVerifyContract.address);

  console.log("Sleeping.....");
// Espere a que etherscan se dé cuenta de que el contrato se ha implementado
  await sleep(10000);

// Verificar el contrato después de la implementación
  await hre.run("verify:verify", {
    address: deployedVerifyContract.address,
    constructorArguments: [],
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