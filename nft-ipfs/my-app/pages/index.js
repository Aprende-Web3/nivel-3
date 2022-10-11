import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  // walletConnected realiza un seguimiento de si la billetera del usuario está conectada o no
  const [walletConnected, setWalletConnected] = useState(false);
  // loading se establece en verdadero cuando estamos esperando que se extraiga una transacción
  const [loading, setLoading] = useState(false);
  // tokenIdsMinted realiza un seguimiento de la cantidad de tokenIds que se han acuñado
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  // Cree una referencia al Web3 Modal (utilizado para conectarse a Metamask) que persiste mientras la página esté abierta
  const web3ModalRef = useRef();

/**
    * publicMint: Mint un NFT
    */
  const publicMint = async () => {
    try {
      console.log("Public mint");
    // Necesitamos un firmante aquí ya que esta es una transacción de 'escritura'.
      const signer = await getProviderOrSigner(true);
  // Crear una nueva instancia del Contrato con un Firmante, que permita
       // métodos de actualización
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // llamar a mint desde el contrato para acuñar los AW3Punks
      const tx = await nftContract.mint({
     // value significa el costo de un AW3Punks que es "0.01" eth.
         // Estamos analizando la cadena `0.01` en ether usando la biblioteca utils de ethers.js
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("Has minteado con éxito un AW3Punk!");
    } catch (err) {
      console.error(err);
    }
  };

/*
         connectWallet: conecta la billetera MetaMask
       */
  const connectWallet = async () => {
    try {
   // Obtener el proveedor de web3Modal, que en nuestro caso es MetaMask
       // Cuando se usa por primera vez, solicita al usuario que conecte su billetera
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };
/**
    * getTokenIdsMinted: obtiene el número de tokenIds que se han acuñado
    */
 
  const getTokenIdsMinted = async () => {
    try {
    // Obtener el proveedor de web3Modal, que en nuestro caso es MetaMask
       // No es necesario el firmante aquí, ya que solo estamos leyendo el estado de la cadena de bloques
      const provider = await getProviderOrSigner();
 // Nos conectamos al Contrato utilizando un Proveedor, por lo que solo necesitamos
       // tener acceso de lectura al contrato
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
    // llamar a los tokenIds del contrato
      const _tokenIds = await nftContract.tokenIds();
      console.log("tokenIds", _tokenIds);
      //_tokenIds es un `Big Number`. Necesitamos convertir el Big Number en una cadena
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };

 /**
    * Devuelve un objeto Proveedor o Firmante que representa el Ethereum RPC con o sin el
    * capacidades de firma de metamask adjunto
    *
    * Se necesita un 'Proveedor' para interactuar con la cadena de bloques: leer transacciones, leer saldos, leer estados, etc.
    *
    * Un 'Firmante' es un tipo especial de Proveedor que se utiliza en caso de que sea necesario realizar una transacción de 'escritura' en la cadena de bloques, lo que implica la cuenta conectada
    * necesidad de hacer una firma digital para autorizar la transacción que se envía. Metamask expone una API de firmante para permitir que su sitio web
    * solicitar firmas del usuario utilizando las funciones de firmante.
    *
    * @param {*} needSigner: verdadero si necesita el firmante, predeterminado falso de lo contrario
    */
  const getProviderOrSigner = async (needSigner = false) => {
    // Conectar a Metamask
     // Dado que almacenamos `web3Modal` como referencia, necesitamos acceder al valor `actual` para obtener acceso al objeto subyacente
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

// Si el usuario no está conectado a la red de Mumbai, infórmele y arroje un error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 80001) {
      window.alert("Cambiar la red a Mumbai");
      throw new Error("Cambiar la red a Mumbai");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // useEffects se utilizan para reaccionar a los cambios en el estado del sitio web
   // El array al final de la llamada a la función representa qué cambios de estado activarán este efecto
   // En este caso, siempre que cambie el valor de `walletConnected`, se llamará a este efecto
  useEffect(() => {
   // si la billetera no está conectada, crea una nueva instancia de Web3Modal y conecta la billetera MetaMask
    if (!walletConnected) {
     // Asigna la clase Web3Modal al objeto de referencia estableciendo su valor `actual`
       // El valor `actual` se conserva mientras esta página esté abierta
      web3ModalRef.current = new Web3Modal({
        network: "mumbai",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet();

      getTokenIdsMinted();

   // establecer un intervalo para obtener el número de identificadores de tokens minteados cada 5 segundos
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);

 /*
         renderButton: Devuelve un botón basado en el estado de la dapp
       */
  const renderButton = () => {
   // Si la billetera no está conectada, devuelve un botón que les permite conectar su billetera
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Conecta tu billetera
        </button>
      );
    }

// Si actualmente estamos esperando algo, devuelve un botón de carga

    if (loading) {
      return <button className={styles.button}>Cargando...</button>;
    }

    return (
      <button className={styles.button} onClick={publicMint}>
        Minteo público 🚀
      </button>
    );
  };

  return (
    <div>
      <Head>
        <title>AW3Punks</title>
        <meta name="description" content="AW3Punks-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Bienvenido a AW3Punks!</h1>
          <div className={styles.description}>
          Colección NFT para los estudiantes de Aprende Web3
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/10 han sido minteados
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./AW3punks/1.png" />
        </div>
      </div>

      <footer className={styles.footer}>Made with &#10084; by AW3Punks</footer>
    </div>
  );
}