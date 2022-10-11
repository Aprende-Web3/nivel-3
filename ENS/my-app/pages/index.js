import Head from "next/head";
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
import { ethers, providers } from "ethers";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  // walletConnected realiza un seguimiento de si la billetera del usuario está conectada o no
  const [walletConnected, setWalletConnected] = useState(false);
  // Cree una referencia a Web3 Modal (utilizado para conectarse a Metamask) que persiste mientras la página esté abierta
  const web3ModalRef = useRef();
  // ENS
  const [ens, setENS] = useState("");
// Guardar la dirección de la cuenta actualmente conectada
  const [address, setAddress] = useState("");
/**
    * Establece el ENS, si la dirección conectada actual tiene un ENS asociado o en su defecto establece
    * la dirección de la cuenta conectada
    */
  
  const setENSOrAddress = async (address, web3Provider) => {
 // Buscar el ENS relacionado con la dirección dada
    var _ens = await web3Provider.lookupAddress(address);
  // Si la dirección tiene un ENS, configure el ENS o simplemente configure la dirección
    if (_ens) {
      setENS(_ens);
    } else {
      setAddress(address);
    }
  };
/**
    * Se necesita un 'Proveedor' para interactuar con la cadena de bloques: leer transacciones, leer saldos, leer estados, etc.
    *
    * Un 'Firmante' es un tipo especial de Proveedor que se utiliza en caso de que sea necesario realizar una transacción de 'escritura' en la cadena de bloques, lo que implica la cuenta conectada
    * necesidad de hacer una firma digital para autorizar la transacción que se envía. Metamask expone una API de firmante para permitir que su sitio web
    * solicitar firmas del usuario utilizando las funciones de firmante.
    */
  
  const getProviderOrSigner = async () => {
  // Conectar a Metamask
     // Dado que almacenamos `web3Modal` como referencia, necesitamos acceder al valor `actual` para obtener acceso al objeto subyacente
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

 // Si el usuario no está conectado a la red Goerli, hágale saber y arroje un error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Cambiar la red a Goerli");
      throw new Error("Cambiar la red a Goerli");
    }
    const signer = web3Provider.getSigner();
// Obtenga la dirección asociada al firmante que está conectado a MetaMask
    const address = await signer.getAddress();
  // Llama a la función para establecer el ENS o Dirección
    await setENSOrAddress(address, web3Provider);
    return signer;
  };
/*
     connectWallet: conecta la billetera MetaMask
   */
  const connectWallet = async () => {
    try {
   // Obtener el proveedor de web3Modal, que en nuestro caso es MetaMask
       // Cuando se usa por primera vez, solicita al usuario que conecte su billetera
      await getProviderOrSigner(true);
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

/*
     renderButton: Devuelve un botón basado en el estado de la dapp
   */
  const renderButton = () => {
    if (walletConnected) {
      <div>Billetera conectada</div>;
    } else {
      return (
        <button onClick={connectWallet} className={styles.button}>
         Conecta tu billetera
        </button>
      );
    }
  };
// useEffects se utilizan para reaccionar a los cambios en el estado del sitio web
   // La matriz al final de la llamada a la función representa qué cambios de estado activarán este efecto
   // En este caso, siempre que cambie el valor de `walletConnected`, se llamará a este efecto
 
  useEffect(() => {
   // si la billetera no está conectada, crea una nueva instancia de Web3Modal y conecta la billetera MetaMask
    if (!walletConnected) {
    // Asigna la clase Web3Modal al objeto de referencia estableciendo su valor `actual`
       // El valor `actual` se conserva mientras esta página esté abierta
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [walletConnected]);

  return (
    <div>
      <Head>
        <title>ENS Dapp</title>
        <meta name="description" content="ENS-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>
          Bienvenido a AprendeWeb3 Punks {ens ? ens : address}!
          </h1>
          <div className={styles.description}>
           Es una colección NFT por AprendeWeb3 Punks.
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./aprendeweb3punks.png" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by AprendeWeb3 Punks
      </footer>
    </div>
  );
}